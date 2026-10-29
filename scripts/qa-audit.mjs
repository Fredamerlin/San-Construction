// QA audit of the production build in a real (headless) browser.
// Usage: npm run build && npm run qa
//
// For every page at desktop (1440×900) and phone (390×844) sizes it checks:
//   - accessibility with axe-core (WCAG 2.0/2.1/2.2 A and AA rules + best practices)
//   - exactly one <h1>, one <title>, one meta description
//   - no horizontal overflow
//   - no console errors or warnings
// 3D is turned off (?3d=off) so results don't depend on GPU speed; the 3D canvas is
// decorative and hidden from assistive technology anyway.
// Exits with code 1 if anything fails.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, preview } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
if (!existsSync(join(root, 'dist/index.html'))) throw new Error('Run `npm run build` first.');

// Page list from the same source as the sitemap
const loader = await createServer({ root, mode: 'production', logLevel: 'error', appType: 'custom', server: { middlewareMode: true } });
const { allPages } = await loader.ssrLoadModule('/src/data/pageMeta.ts');
await loader.close();
// "/404" is served dist/404.html, which is what hosts serve for unknown URLs (see vercel.json
// and public/_redirects); the app then renders its not-found page.
const paths = [...allPages().map((page) => page.path), '/404'];

const server = await preview({ root, logLevel: 'error', preview: { port: 4174, strictPort: false } });
const base = server.resolvedUrls.local[0].replace(/\/$/, '');

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

const profile = mkdtempSync(join(tmpdir(), 'san-qa-'));
const browser = spawn(browserPath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], {
  stdio: ['ignore', 'ignore', 'pipe'],
});
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
const consoleMessages = [];
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else if (msg.method === 'Runtime.exceptionThrown') {
    consoleMessages.push(`exception: ${msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text}`);
  } else if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
    consoleMessages.push(`${msg.params.type}: ${msg.params.args.map((a) => a.value ?? a.description).join(' ')}`);
  } else if (msg.method === 'Log.entryAdded' && ['error', 'warning'].includes(msg.params.entry.level)) {
    consoleMessages.push(`${msg.params.entry.level}: ${msg.params.entry.text} ${msg.params.entry.url ?? ''}`);
  }
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve) => {
    const i = ++id;
    pending.set(i, resolve);
    ws.send(JSON.stringify({ id: i, method, params, sessionId }));
  });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const axeSource = readFileSync(join(root, 'node_modules/axe-core/axe.min.js'), 'utf8');
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'phone', width: 390, height: 844, mobile: true },
];

let failures = 0;
try {
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  const evaluate = async (expression) =>
    (await s('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  await s('Page.enable');
  await s('Runtime.enable');
  await s('Log.enable');

  await s('Network.enable');
  for (const viewport of VIEWPORTS) {
    // Start each viewport cold, as a real visitor would. Otherwise the phone pass can reuse
    // larger images cached by the desktop pass, which makes Chrome flag preloads as unused.
    await s('Network.clearBrowserCache');
    await s('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
    for (const path of paths) {
      consoleMessages.length = 0;
      await s('Page.navigate', { url: `${base}${path}${path.includes('?') ? '&' : '?'}3d=off` });
      await sleep(1200);
      // Scroll through so every lazy image and reveal has rendered before auditing
      await evaluate(`(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 160)); }
        window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 1500));
      })()`);

      const page = await evaluate(`(() => ({
        h1: document.querySelectorAll('h1').length,
        titles: document.querySelectorAll('title').length,
        descriptions: document.querySelectorAll('meta[name="description"]').length,
        title: document.title,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      }))()`);
      await evaluate(axeSource);
      const violations = await evaluate(`axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }
      }).then(r => r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map(n => n.target.join(' ')) })))`);

      const problems = [];
      if (page.h1 !== 1) problems.push(`${page.h1} <h1> elements`);
      if (page.titles !== 1) problems.push(`${page.titles} <title> elements`);
      if (page.descriptions !== 1) problems.push(`${page.descriptions} meta descriptions`);
      if (page.overflow > 0) problems.push(`horizontal overflow ${page.overflow}px`);
      for (const message of consoleMessages) problems.push(`console ${message}`);
      for (const v of violations ?? []) problems.push(`axe ${v.impact} ${v.id}: ${v.help} → ${v.nodes.join(' | ')}`);

      failures += problems.length;
      const status = problems.length ? '✗' : '✓';
      console.log(`${status} ${viewport.name.padEnd(7)} ${path.padEnd(44)} ${page.title}`);
      for (const problem of problems) console.log(`    - ${problem}`);
    }
  }

  // --- Keyboard pass -------------------------------------------------------------------
  // Tab through key pages like a keyboard user. Each focus stop must be visible (an outline
  // or similar indicator), on screen, and not hidden behind the fixed header (WCAG 2.4.11).
  console.log('\nKeyboard');
  await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  for (const path of ['/', '/contact', '/services/interior-fit-out', '/projects/sample-office-tower']) {
    if (!paths.includes(path)) continue;
    await s('Page.navigate', { url: `${base}${path}?3d=off` });
    await sleep(1500);
    const problems = [];
    const stops = [];
    for (let i = 0; i < 80; i++) {
      await s('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      await s('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      await sleep(60);
      const stop = await evaluate(`(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        // Obscured = whatever is painted at the element's centre is something else (e.g. the header)
        const cx = Math.min(Math.max(rect.left + rect.width / 2, 0), window.innerWidth - 1);
        const cy = Math.min(Math.max(rect.top + Math.min(rect.height / 2, 20), 0), window.innerHeight - 1);
        const top = document.elementFromPoint(cx, cy);
        const obscured = Boolean(top) && top !== el && !el.contains(top) && !top.contains(el);
        const indicator = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 1) || cs.boxShadow !== 'none';
        return {
          label: (el.tagName + ' ' + (el.getAttribute('aria-label') || el.textContent || el.getAttribute('name') || '').trim().replace(/\\s+/g, ' ')).slice(0, 60),
          indicator,
          visible: rect.width > 0 && rect.height > 0 && cs.visibility !== 'hidden',
          onScreen: rect.bottom > 0 && rect.top < window.innerHeight,
          obscured,
        };
      })()`);
      if (!stop) break;
      if (stops.length && stop.label === stops[0]) break; // wrapped around
      stops.push(stop.label);
      if (i === 0 && !/skip to main content/i.test(stop.label)) problems.push(`first stop is "${stop.label}", expected the skip link`);
      if (!stop.indicator) problems.push(`no visible focus indicator: ${stop.label}`);
      if (!stop.visible || !stop.onScreen) problems.push(`focus on an invisible or off-screen element: ${stop.label}`);
      if (stop.obscured) problems.push(`focused element hidden behind the fixed header: ${stop.label}`);
    }
    failures += problems.length;
    console.log(`${problems.length ? '✗' : '✓'} ${path.padEnd(52)} ${stops.length} focus stops`);
    for (const problem of problems) console.log(`    - ${problem}`);
  }
} finally {
  ws.close();
  browser.kill();
  await new Promise((resolve) => server.httpServer.close(resolve));
  await sleep(400);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
}

console.log(failures ? `\n${failures} problem(s) found.` : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
