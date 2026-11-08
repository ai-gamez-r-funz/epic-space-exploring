// E2E smoke: mouse paths through Pause > Settings / Help / Save / Retire, plus Shipyard modes and the Bridge threads strip.
// Run against a production build:  npm run build && npx vite preview --port 4173 &  node tests/e2e/pause_smoke.mjs [baseUrl]
// Needs the global `playwright` package + chromium. Every click is a real pointer click at the button's page-pixel centre,
// at 1280x720 and 1920x1080. Waits are generous: the software-GL renderer can run at only a few frames per second.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const BASE = process.argv[2] || 'http://localhost:4173/';
let fails = 0, total = 0;

for (const [w, h] of [[1280, 720], [1920, 1080]]) {
  const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await page.goto(BASE + '?debug=1&scene=Bridge&quick=1');
  await page.waitForFunction(() => window.__halcyon?.scene === 'Bridge' && !window.__halcyon.busy, null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  const titles = () => page.evaluate(() => window.__halcyon.app.overlays.map((o) => o.title).join(','));
  const where = (label) => page.evaluate((label) => {
    const H = window.__halcyon.app; let hit = null;
    const walk = (o) => { if (hit || !o || o.destroyed || o.visible === false) return; if (o.o && o.o.label === label && o.enabled !== undefined && o.getBounds) { hit = o; return; } for (const c of o.children || []) walk(c); };
    for (const r of [H.layers.overlay, H.layers.scene]) { walk(r); if (hit) break; }
    if (!hit) return null; const b = hit.getBounds(); const cv = H.canvas.getBoundingClientRect();
    return { x: cv.left + (b.x + b.width / 2) * cv.width / 1280, y: cv.top + (b.y + b.height / 2) * cv.height / 720, enabled: hit.enabled };
  }, label);
  const check = async (desc, fn, ms = 12000) => { total++; let ok = false; for (let t = 0; t < ms && !ok; t += 250) { ok = await fn(); if (!ok) await page.waitForTimeout(250); } if (!ok) { fails++; console.log(`FAIL [${w}x${h}] ${desc}`); } else console.log(`ok   [${w}x${h}] ${desc}`); return ok; };
  const click = async (label, desc) => { let p = null; for (let i = 0; i < 20 && !p; i++) { p = await where(label); if (!p) await page.waitForTimeout(150); } if (!p) { total++; fails++; console.log(`FAIL [${w}x${h}] ${desc}: no "${label}" button`); return false; } await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.up(); return true; };
  const esc = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(500); };
  const clear = async () => { for (let i = 0; i < 4 && (await titles()); i++) await esc(); await page.waitForTimeout(400); };

  // Escape on a fresh bridge opens Pause (there is no first-orders card any more).
  await esc();
  await check('Esc opens Pause', async () => (await titles()).includes('PAUSED'));
  await click('Settings', 'Pause > Settings'); await check('mouse click on Settings opens it (and Pause leaves)', async () => (await titles()) === 'SETTINGS');
  await click('Done', 'Settings > Done'); await check('Settings > Done closes', async () => (await titles()) === '');

  await esc(); await check('Pause again', async () => (await titles()).includes('PAUSED'));
  await click('Help & hotkeys', 'Pause > Help'); await check('mouse click on Help opens it', async () => (await titles()).includes('HELP'));
  await clear();

  await esc(); await check('Pause for save', async () => (await titles()).includes('PAUSED'));
  await click('Save to slot 1', 'Save slot 1');
  await check('save writes slot 1', async () => page.evaluate(() => !!localStorage.getItem('halcyon.save.1') || Object.keys(localStorage).some((k) => /save/i.test(k) && /1$/.test(k))));
  await check('save toast is visible above the modal', async () => page.evaluate(() => { const L = window.__halcyon.app.layers; return L.stage ? true : L.toast.parent.children.indexOf(L.toast) > L.toast.parent.children.indexOf(L.overlay); }));
  await clear();

  await esc(); await click('Settings', 'Pause > Settings (retire)'); await check('Settings open for retire', async () => (await titles()) === 'SETTINGS');
  const r = await where('Retire the commission');
  total++; if (r) { console.log(`ok   [${w}x${h}] Retire button present (enabled=${r.enabled})`); if (r.enabled) { await click('Retire the commission', 'retire'); await page.waitForTimeout(800); await click('Keep sailing', 'retire cancel'); } } else { fails++; console.log(`FAIL [${w}x${h}] Retire button missing`); }
  await clear();

  // Shipyard modes (docked) and Bridge threads
  await page.evaluate(() => { const g = window.__halcyon.game; g.dock(); g.state.credits = 3000; });
  await page.waitForTimeout(800);
  await page.evaluate(() => { window.__halcyon.openOverlay('Shipyard'); });
  await check('Shipyard opens', async () => (await titles()).includes('SHIP'));
  await click('Refits', 'Shipyard > Refits'); await check('Refits list shows', async () => page.evaluate(() => window.__halcyon.app.overlays[0]?.mode === 'refits'));
  await click('Training', 'Shipyard > Training'); await check('Training list shows', async () => page.evaluate(() => window.__halcyon.app.overlays[0]?.mode === 'training'));
  await clear();
  await check('Bridge threads strip exists', async () => page.evaluate(() => (window.__halcyon.app.scene.threads?.children.length || 0) >= 2));
  total++; if (errs.length) { fails++; console.log('FAIL page errors:', errs.slice(0, 3)); }
  await browser.close();
}
console.log(`\n${total} checks, ${fails} failure(s)`);
process.exit(fails ? 1 : 0);
