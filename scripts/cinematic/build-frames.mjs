// Turns the walkthrough clips into the scroll-scrubbed frame sequence on the home page.
//
// Per shot: "from"/"to" trim (seconds), "reverse": true (generated backwards, played end to
// start), "dissolve": seconds (fade in over the previous shot), "scenes": [{ label, at }] (the
// captioned views, `at` 0–1 through the shot). Top level: "crop" { left, top, width, height } as
// fractions, applied to every frame.
// Reads cinematic/shots.json (or the config given as the first argument), samples each clip at
// `sampleFps` in headless Edge/Chrome (no ffmpeg needed), and writes:
//   public/cinematic/d/NNNNN.webp   1600 px wide (desktop)
//   public/cinematic/m/NNNNN.webp   600×1000 portrait crop around the shot's focusX (phones held upright)
//   src/data/cinematic.json         frame count, size and where each shot starts and ends
//
// Usage: node scripts/cinematic/build-frames.mjs [config.json]
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const configPath = resolve(process.argv[2] ?? join(root, 'cinematic', 'shots.json'));
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const clipsDir = join(root, 'cinematic', 'clips');
const outDir = join(root, 'public', 'cinematic');
const manifestPath = join(root, 'src', 'data', 'cinematic.json');
const SIZES = { d: { width: 1600, quality: 74 }, m: { width: 600, height: 1000, quality: 72 } };

/** Landscape frame for wide screens; portrait crop (3:5, centred on focusX) for upright phones. */
function encode(jpeg, key, info, focusX) {
  const { width, height, quality } = SIZES[key];
  let image = sharp(jpeg);
  if (key === 'm') {
    const cropW = Math.min(info.width, Math.round((info.height * width) / height));
    const left = Math.round(Math.min(Math.max(0, info.width * focusX - cropW / 2), info.width - cropW));
    image = image.extract({ left, top: 0, width: cropW, height: info.height }).resize({ width, height, fit: 'cover', withoutEnlargement: true });
  } else {
    image = image.resize({ width, withoutEnlargement: true });
  }
  return image.webp({ quality, effort: 5 });
}
const sampleFps = config.sampleFps ?? 8;

const clipPath = (clip) => (isAbsolute(clip) ? clip : join(clipsDir, clip));
const missing = config.shots.map((s) => clipPath(s.clip)).filter((p) => !existsSync(p));
if (missing.length) {
  console.error(`Missing clips:\n  ${[...new Set(missing)].join('\n  ')}`);
  process.exit(1);
}

const browserPath =
  process.env.CHROME_PATH ??
  [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].find((p) => existsSync(p));
if (!browserPath) throw new Error('No Chrome/Edge found. Set CHROME_PATH.');

// A page that loads a clip fully into memory (streaming it from disk stalls seeks in headless
// browsers) and hands back individual frames as JPEG. Served over local HTTP.
const work = mkdtempSync(join(tmpdir(), 'san-frames-'));
const clipFiles = [...new Set(config.shots.map((s) => clipPath(s.clip)))];
const page = `<!doctype html><video id="v" muted preload="auto" playsinline></video><canvas id="c"></canvas><script>
  const v = document.getElementById('v'), c = document.getElementById('c');
  let open = null;
  const info = () => ({ duration: v.duration, width: v.videoWidth, height: v.videoHeight });
  window.openClip = async (url) => {
    if (open === url) return info();
    const blob = await (await fetch(url)).blob();
    await new Promise((ok, fail) => {
      v.onloadeddata = ok;
      v.onerror = () => fail(new Error('cannot decode ' + url));
      if (v.src) URL.revokeObjectURL(v.src);
      v.src = URL.createObjectURL(blob);
    });
    open = url;
    return info();
  };
  const grab = () => {
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    return c.toDataURL('image/jpeg', 0.95);
  };
  // Waits for the seek to land, with a fallback: a seek to the current time fires no event,
  // and headless browsers occasionally drop one
  window.frameAt = (t) => new Promise((ok) => {
    if (Math.abs(v.currentTime - t) < 0.0005 && v.readyState >= 2) return ok(grab());
    let done = false;
    const finish = () => { if (!done) { done = true; ok(grab()); } };
    v.addEventListener('seeked', finish, { once: true });
    const retry = setInterval(() => { if (done) clearInterval(retry); else if (v.readyState >= 2) finish(); else v.currentTime = t + 0.0001; }, 3000);
    v.currentTime = t;
  });
</script>`;
const server = createServer((req, res) => {
  const clip = req.url?.match(/^\/clip\/(\d+)/);
  if (clip && clipFiles[Number(clip[1])]) {
    res.writeHead(200, { 'Content-Type': 'video/mp4' });
    createReadStream(clipFiles[Number(clip[1])]).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(page);
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = spawn(
  browserPath,
  [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${join(work, 'profile')}`,
    // Headless pages count as hidden: keep video decoding and timers at full speed
    '--disable-background-media-suspend',
    '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] },
);
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
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
const send = (method, params = {}, sessionId) =>
  new Promise((ok) => {
    const i = ++id;
    pending.set(i, ok);
    ws.send(JSON.stringify({ id: i, method, params, sessionId }));
  });

try {
  const { result: { targetId } } = await send('Target.createTarget', { url: `${origin}/grab.html` });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (res.result?.exceptionDetails) throw new Error(res.result.exceptionDetails.exception?.description ?? 'page error');
    return res.result.result.value;
  };
  await new Promise((r) => setTimeout(r, 500));

  rmSync(outDir, { recursive: true, force: true });
  for (const key of Object.keys(SIZES)) mkdirSync(join(outDir, key), { recursive: true });

  let frame = 0;
  let previousLast = null;
  const shots = [];
  const scenes = [];
  for (const [index, shot] of config.shots.entries()) {
    const info = await evaluate(`openClip('${origin}/clip/${clipFiles.indexOf(clipPath(shot.clip))}')`);
    const from = shot.from ?? 0;
    const to = Math.min(shot.to ?? info.duration, info.duration);
    // Frame times, ending exactly on the clip's last frame (which matches the next clip's first)
    const count = Math.max(2, Math.round((to - from) * sampleFps) + 1);
    const start = frame;
    // Optional crop (fractions of the frame), e.g. to trim a watermark off one edge. The same
    // crop applies to every shot so all frames share one size.
    const crop = config.crop
      ? {
          left: Math.round(config.crop.left * info.width),
          top: Math.round(config.crop.top * info.height),
          width: Math.round(config.crop.width * info.width),
          height: Math.round(config.crop.height * info.height),
        }
      : null;
    const size = crop ? { width: crop.width, height: crop.height } : info;
    // Dissolve: the first frames of this shot fade in over the previous shot's last frame
    const blend = previousLast ? Math.round((shot.dissolve ?? 0) * sampleFps) : 0;
    for (let k = 0; k < count; k++) {
      // Clips generated backwards (`"reverse": true`) are played end to start
      const step = shot.reverse ? count - 1 - k : k;
      const t = Math.min(from + ((to - from) * step) / (count - 1), to - 0.001);
      const data = await evaluate(`frameAt(${t})`);
      let jpeg = Buffer.from(data.split(',')[1], 'base64');
      if (crop) jpeg = await sharp(jpeg).extract(crop).jpeg({ quality: 95 }).toBuffer();
      const own = jpeg;
      if (k < blend) {
        const over = await sharp(jpeg).ensureAlpha((k + 1) / (blend + 1)).png().toBuffer();
        jpeg = await sharp(previousLast).composite([{ input: over }]).jpeg({ quality: 95 }).toBuffer();
      }
      if (k === count - 1) previousLast = own;
      frame++;
      const name = `${String(frame).padStart(5, '0')}.webp`;
      for (const key of Object.keys(SIZES)) await encode(jpeg, key, size, shot.focusX ?? 0.5).toFile(join(outDir, key, name));
    }
    shots.push({ start, end: frame - 1 });
    // Captioned scenes: `at` is how far through this shot (0–1) the scene's view is
    for (const scene of shot.scenes ?? []) scenes.push({ label: scene.label, frame: start + Math.round(scene.at * (count - 1)) });
    console.log(`✓ shot ${index + 1}  ${shot.clip}  ${count} frames  (${(to - from).toFixed(1)} s)`);
  }

  const metaD = await sharp(join(outDir, 'd', '00001.webp')).metadata();
  const metaM = await sharp(join(outDir, 'm', '00001.webp')).metadata();
  const manifest = {
    version: Date.now().toString(36),
    frames: frame,
    sets: { d: { width: metaD.width, height: metaD.height }, m: { width: metaM.width, height: metaM.height } },
    shots,
    scenes,
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const kb = (dir) => {
    let total = 0;
    for (let f = 1; f <= frame; f++) total += readFileSync(join(outDir, dir, `${String(f).padStart(5, '0')}.webp`)).length;
    return Math.round(total / 1024);
  };
  console.log(`\n${frame} frames → public/cinematic  (desktop ${(kb('d') / 1024).toFixed(1)} MB, phone ${(kb('m') / 1024).toFixed(1)} MB)`);
} finally {
  ws.close();
  browser.kill();
  server.close();
  await new Promise((r) => setTimeout(r, 500));
  try {
    rmSync(work, { recursive: true, force: true });
  } catch {}
}
