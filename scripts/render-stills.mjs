// Renders still images of the 3D scenes for loading posters, fallbacks and small screens.
// Starts a Vite dev server, opens render.html in headless Edge/Chrome (GPU, or software WebGL
// with RENDER_GL=software),
// screenshots each view into .render-cache/, then `npm run images` converts them.
//
// Usage: node scripts/render-stills.mjs [name ...]   (no names = all)
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, '.render-cache');
mkdirSync(outDir, { recursive: true });

const VIEWS = [
  { name: 'hero-wide', query: 'view=hero', width: 2400, height: 1500 },
  { name: 'hero-medium', query: 'view=hero', width: 1600, height: 1200 },
  { name: 'hero-tall', query: 'view=hero', width: 1080, height: 1920 },
  ...[0.75, 1.75, 2.9, 3.9, 4.9, 6].map((stage, i) => ({
    name: `stage-${i + 1}`,
    query: `view=stage&stage=${stage}&bg=%23181716`,
    width: 1200,
    height: 1500,
  })),
  // House walkthrough shots (storyboard scene numbers)
  ...Array.from({ length: 12 }, (_, i) => i + 1).flatMap((shot) => [
    { name: `house-${shot}`, query: `view=house&shot=${shot}`, width: 1600, height: 900 },
    { name: `house-${shot}-tall`, query: `view=house&shot=${shot}`, width: 900, height: 1600 },
  ]),
];

// Arguments are view names, or ad-hoc views for development as name:query (1600×900),
// e.g. `debug:view=house&pos=0,2,20&target=0,2,0`
const only = process.argv.slice(2);
const adhoc = only.filter((a) => a.includes(':')).map((a) => {
  const [name, query] = a.split(/:(.*)/s);
  return { name, query, width: 1600, height: 900 };
});
const named = only.filter((a) => !a.includes(':'));
const views = only.length ? [...VIEWS.filter((v) => named.includes(v.name)), ...adhoc] : VIEWS;

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

// No hot reload or file watching: edits made while a long render runs must not reload it
const server = await createServer({ root, logLevel: 'error', server: { port: 5199, strictPort: false, hmr: false, watch: null } });
await server.listen();
const base = server.resolvedUrls.local[0];

const profile = mkdtempSync(join(tmpdir(), 'san-render-'));
const browser = spawn(
  browserPath,
  [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    // The GPU by default (minutes faster per still); RENDER_GL=software forces SwiftShader
    ...(process.env.RENDER_GL === 'software'
      ? ['--enable-unsafe-swiftshader', '--use-angle=swiftshader']
      : ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']),
    '--hide-scrollbars',
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] },
);
const wsUrl = await new Promise((resolve, reject) => {
  let buf = '';
  const timer = setTimeout(() => reject(new Error('browser did not start')), 20000);
  browser.stderr.on('data', (d) => {
    buf += d;
    const match = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (match) {
      clearTimeout(timer);
      resolve(match[1]);
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
  new Promise((resolve) => {
    const i = ++id;
    pending.set(i, resolve);
    ws.send(JSON.stringify({ id: i, method, params, sessionId }));
  });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  await s('Page.enable');

  for (const view of views) {
    await s('Emulation.setDeviceMetricsOverride', { width: view.width, height: view.height, deviceScaleFactor: 1, mobile: false });
    await s('Page.navigate', { url: `${base}render.html?${view.query}` });
    const started = Date.now();
    for (;;) {
      const res = await s('Runtime.evaluate', { expression: 'window.__renderReady === true', returnByValue: true });
      if (res.result?.result?.value) break;
      if (Date.now() - started > 300000) throw new Error(`timed out rendering ${view.name}`);
      await sleep(250);
    }
    const shot = await s('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(outDir, `${view.name}.png`), Buffer.from(shot.result.data, 'base64'));
    console.log(`✓ ${view.name} ${view.width}×${view.height} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
  }
} finally {
  ws.close();
  browser.kill();
  await server.close();
  await sleep(500);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
}
