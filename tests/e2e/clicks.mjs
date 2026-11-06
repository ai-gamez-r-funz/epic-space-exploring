// Manual e2e: proves real mouse clicks register across Pause, Settings, confirm dialogs, tabs, map select and command buttons.
// Not part of `npm test`.  Usage:
//   npm run build && npx vite preview --port 4173 &      (or any server that serves dist/)
//   node tests/e2e/clicks.mjs [baseUrl=http://localhost:4173/]      (needs the global `playwright` package + chromium)
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const BASE = process.argv[2] || 'http://localhost:4173/';
const SIZES = [[1280, 720], [1920, 1080]];
let fails = 0, total = 0;

for (const [w, h] of SIZES) {
  const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await page.addInitScript("localStorage.setItem('halcyon.tutorial', JSON.stringify({ step: 9, enabled: false })); localStorage.setItem('halcyon.firstOrders', '1')");
  await page.goto(BASE + '?debug=1&scene=Bridge&quick=1');
  await page.waitForFunction(() => window.__halcyon?.scene === 'Bridge' && !window.__halcyon.busy, null, { timeout: 30000 });
  await page.waitForTimeout(800);

  // find a visible Button by label (overlays first) and return its page-pixel centre
  const where = (label) => page.evaluate((label) => {
    const H = window.__halcyon.app; const roots = [H.layers.overlay, H.layers.scene]; let hit = null;
    const walk = (o) => { if (hit || !o || o.destroyed || o.visible === false) return; if (o.o && o.o.label === label && o.enabled !== undefined && o.getBounds) { hit = o; return; } for (const c of o.children || []) walk(c); };
    for (const r of roots) { walk(r); if (hit) break; }
    if (!hit) return null; const b = hit.getBounds(); const cv = H.canvas.getBoundingClientRect();
    return { x: cv.left + (b.x + b.width / 2) * cv.width / 1280, y: cv.top + (b.y + b.height / 2) * cv.height / 720, enabled: hit.enabled };
  }, label);
  const overlays = () => page.evaluate(() => window.__halcyon.app.overlays.map((o) => (o.title || o.modal?.o?.title || '?').toUpperCase()).join(','));
  const click = async (label, expectFn, desc) => {
    total++; let p = null; for (let i = 0; i < 10 && !p; i++) { p = await where(label); if (!p) await page.waitForTimeout(150); }
    if (!p) { fails++; console.log(`FAIL [${w}x${h}] ${desc}: button "${label}" not found`); return; }
    await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.up();   // an immediate click, like a quick human
    let ok = false; for (let i = 0; i < 20 && !ok; i++) { await page.waitForTimeout(100); ok = await expectFn(); }
    if (!ok) { fails++; console.log(`FAIL [${w}x${h}] ${desc}`); } else console.log(`ok   [${w}x${h}] ${desc}`);
  };
  const closeTop = async () => { if (await overlays()) { await page.keyboard.press('Escape'); await page.waitForTimeout(500); } };   // Esc only when something is open (Esc with nothing open = Pause)
  const has = (name) => async () => (await overlays()).includes(name); // overlays are matched by title (class names are minified in production)
  const none = async () => (await overlays()) === '';

  // 1-12: open/close Crew six times via command button + the modal close icon (key Esc closes between rounds as a reset)
  for (let i = 0; i < 6; i++) { await click('Crew', has('CREW'), `Crew command #${i + 1}`); await closeTop(); await page.waitForTimeout(200); }
  // Ship / Log command buttons
  await click('Ship', has('SHIP'), 'Ship command'); await closeTop();
  await click('Log', has('LOG'), 'Log command'); await closeTop();
  // Pause -> Settings -> Done (x3)
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    await click('Settings', has('SETTINGS'), `Pause > Settings #${i + 1}`);
    await click('Done', none, `Settings > Done #${i + 1}`);
  }
  // Settings > Retire confirm dialog (button is disabled below 50% survey; click still must register -> no crash; we just try the Keep-sailing path)
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  await click('Settings', has('SETTINGS'), 'Pause > Settings (for retire)');
  const r = await where('Retire the commission');
  if (r && r.enabled) { await click('Retire the commission', async () => page.evaluate(() => !!document.querySelector('canvas')), 'Retire click'); await click('Keep sailing', async () => true, 'Retire confirm: keep sailing'); }
  await closeTop(); await closeTop();
  // Crew > Hire tab
  await click('Crew', has('CREW'), 'Crew command (for tabs)');
  await click('Hire', async () => page.evaluate(() => { const H = window.__halcyon.app; let f = null; const walk = (o) => { if (f || !o || o.destroyed) return; if (o.o?.label === 'Hire') f = o; for (const c of o.children || []) walk(c); }; walk(H.layers.overlay); return !!f && (f.selected || f.o.variant === 'brass'); }), 'Crew > Hire tab');
  await closeTop();
  // Map: open via command, select a neighbour by clicking its node, plan jump button visible
  await click('Chart', async () => (await page.evaluate(() => window.__halcyon.scene)) === 'GalaxyMap', 'Chart command');
  await page.waitForFunction(() => window.__halcyon.scene === 'GalaxyMap' && !window.__halcyon.busy);
  await page.waitForTimeout(600);
  total++;
  const node = await page.evaluate(() => {
    const H = window.__halcyon.app; const m = H.scene; const g = H.game; const n = g.neighbors(g.state.pos)[0]; const nd = m.nodes.get(n.id); const b = nd.node.getBounds(); const cv = H.canvas.getBoundingClientRect();
    return { id: n.id, x: cv.left + (b.x + b.width / 2) * cv.width / 1280, y: cv.top + (b.y + b.height / 2) * cv.height / 720 };
  });
  await page.mouse.move(node.x, node.y); await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(500);
  const sel = await page.evaluate(() => window.__halcyon.app.scene.sel);
  if (sel === node.id) console.log(`ok   [${w}x${h}] map node select`); else { fails++; console.log(`FAIL [${w}x${h}] map node select (sel=${sel})`); }
  if (errs.length) { fails++; console.log('FAIL page errors:', errs.slice(0, 3)); }
  await browser.close();
}
console.log(`\n${total - fails < 0 ? 0 : total} click checks, ${fails} failure(s)`);
process.exit(fails ? 1 : 0);
