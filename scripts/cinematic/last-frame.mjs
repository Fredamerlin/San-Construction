// After generating a clip: saves its last frame as the next clip's start frame, so the two
// clips join without a visible cut.
//
//   node scripts/cinematic/last-frame.mjs c01
//
// reads   cinematic/clips/c01.mp4
// writes  cinematic/production/c02-*/start.png   (the storyboard version stays as start-storyboard.png)
//         cinematic/production/c01-*/last-frame.png (a copy, to check the clip ended where it should)
// Options (for clips generated backwards and reversed on the site):
//   --first        take the clip's first frame instead of its last
//   --to c03       write into that clip's folder instead of the next one
//   --as name.png  file name to write (default start.png)
//   --video path   read a different video file
import { spawn } from 'node:child_process';
import { copyFileSync, createReadStream, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const prod = join(root, 'cinematic', 'production');
const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const id = args[0];
const useFirst = args.includes('--first');
const outName = option('--as') ?? 'start.png';
const plan = JSON.parse(readFileSync(join(prod, 'clips.json'), 'utf8'));
const index = plan.clips.findIndex((c) => c.id === id);
if (index < 0) throw new Error(`Unknown clip "${id}". Use c01 … c${String(plan.clips.length).padStart(2, '0')}.`);
const next = option('--to') ? plan.clips.find((c) => c.id === option('--to')) : plan.clips[index + 1];
if (!next) throw new Error(option('--to') ? `Unknown clip "${option('--to')}".` : `${id} is the last clip: nothing comes after it.`);
const video = resolve(option('--video') ?? join(root, 'cinematic', 'clips', `${id}.mp4`));
if (!existsSync(video)) throw new Error(`Not found: ${video}\nSave the clip there first.`);
const folderOf = (clip) => join(prod, readdirSync(prod).find((f) => f.startsWith(`${clip.id}-`)));

const browserPath =
  process.env.CHROME_PATH ??
  [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ].find((p) => existsSync(p));
if (!browserPath) throw new Error('No Edge/Chrome found. Set CHROME_PATH.');

const page = `<!doctype html><video id="v" muted preload="auto"></video><canvas id="c"></canvas><script>
  window.lastFrame = async (first) => {
    const v = document.getElementById('v'), c = document.getElementById('c');
    v.src = URL.createObjectURL(await (await fetch('/clip')).blob());
    await new Promise((ok, fail) => { v.onloadeddata = ok; v.onerror = () => fail(new Error('cannot decode the video')); });
    await new Promise((ok) => { v.addEventListener('seeked', ok, { once: true }); v.currentTime = first ? 0.001 : Math.max(0, v.duration - 0.01); });
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    return { data: c.toDataURL('image/png'), width: v.videoWidth, height: v.videoHeight, duration: v.duration };
  };
</script>`;
const server = createServer((req, res) => {
  if (req.url === '/clip') {
    res.writeHead(200, { 'Content-Type': 'video/mp4' });
    createReadStream(video).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(page);
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const work = mkdtempSync(join(tmpdir(), 'san-lastframe-'));
const browser = spawn(browserPath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${work}`, '--disable-background-media-suspend', '--disable-renderer-backgrounding', 'about:blank'], {
  stdio: ['ignore', 'ignore', 'pipe'],
});

try {
  const wsUrl = await new Promise((ok, fail) => {
    let buf = '';
    const timer = setTimeout(() => fail(new Error('browser did not start')), 20000);
    browser.stderr.on('data', (d) => {
      buf += d;
      const match = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) {
        clearTimeout(timer);
        ok(match[1]);
      }
    });
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let n = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg);
  });
  const send = (method, params = {}, sessionId) =>
    new Promise((ok) => {
      const i = ++n;
      pending.set(i, ok);
      ws.send(JSON.stringify({ id: i, method, params, sessionId }));
    });
  const { address, port } = server.address();
  const { result: { targetId } } = await send('Target.createTarget', { url: `http://${address}:${port}/` });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  await new Promise((r) => setTimeout(r, 500));
  const res = await send('Runtime.evaluate', { expression: `lastFrame(${useFirst})`, awaitPromise: true, returnByValue: true }, sessionId);
  if (res.result?.exceptionDetails) throw new Error(res.result.exceptionDetails.exception?.description ?? 'could not read the video');
  const { data, width, height, duration } = res.result.result.value;
  ws.close();

  const png = Buffer.from(data.split(',')[1], 'base64');
  const own = folderOf(plan.clips[index]);
  const target = folderOf(next);
  const which = useFirst ? 'first' : 'last';
  writeFileSync(join(own, `${which}-frame.png`), png);
  copyFileSync(join(own, `${which}-frame.png`), join(target, outName));
  if (outName === 'start.png') writeFileSync(join(target, 'start-source.txt'), `${which} frame of ${id}.mp4\n`);
  console.log(`✓ ${id}.mp4: ${width}×${height}, ${duration.toFixed(1)} s`);
  console.log(`✓ ${which} frame saved for ${next.id}: ${target.replace(root + '\\', '')}\\${outName}`);
  if (width < 1280) console.log(`! The clip is only ${width} px wide. Choose 1080p in the video tool if you can.`);
  if (outName === 'start.png') console.log(`\nNext: generate ${next.id} (instructions in ${target.replace(root + '\\', '')}\\prompt.txt)`);
} finally {
  browser.kill();
  server.close();
  await new Promise((r) => setTimeout(r, 500));
  try {
    rmSync(work, { recursive: true, force: true });
  } catch {}
}
