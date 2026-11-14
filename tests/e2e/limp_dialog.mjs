// E2E: low-hull departure guard. Forces hull < 25% (via ?debug=1 hooks), plans a jump on the chart and checks the
// "Limping out of port?" dialog: Stay and mend (no jump), Free patch-up (once; hull -> 60%), Depart anyway (jump happens).
// Usage: npm run build && npx vite preview --port 4173 &  node tests/e2e/limp_dialog.mjs [baseUrl]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const BASE = process.argv[2] || 'http://localhost:4173/';
let fails = 0, total = 0;
const ok = (c, d) => { total++; if (c) console.log('ok   ' + d); else { fails++; console.log('FAIL ' + d); } };

const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.addInitScript("localStorage.setItem('halcyon.tutorial', JSON.stringify({ step: 9, enabled: false }))");
await page.goto(BASE + '?debug=1&scene=Bridge&quick=1');
await page.waitForFunction(() => window.__halcyon?.scene === 'Bridge' && !window.__halcyon.busy, null, { timeout: 60000 });
await page.waitForTimeout(1200);
const wait = async (fn, ms = 12000) => { for (let t = 0; t < ms; t += 250) { if (await page.evaluate(fn)) return true; await page.waitForTimeout(250); } return false; };
const where = (label) => page.evaluate((label) => { const H = window.__halcyon.app; let hit = null; const walk = (o) => { if (hit || !o || o.destroyed || o.visible === false) return; if (o.o && o.o.label === label && o.enabled !== undefined && o.getBounds) { hit = o; return; } for (const c of o.children || []) walk(c); }; walk(H.layers.overlay); if (!hit) return null; const b = hit.getBounds(); const cv = H.canvas.getBoundingClientRect(); return { x: cv.left + (b.x + b.width / 2) * cv.width / 1280, y: cv.top + (b.y + b.height / 2) * cv.height / 720 }; }, label);
const clickBtn = async (label) => { let p = null; for (let i = 0; i < 20 && !p; i++) { p = await where(label); if (!p) await page.waitForTimeout(200); } if (!p) return false; await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.up(); return true; };
const openDialog = async () => { await page.evaluate(() => { const g = window.__halcyon.game; const m = window.__halcyon.app.scene; m.select(g.neighbors(g.state.pos)[0].id); m.planJump(); }); return wait(() => window.__halcyon.app.layers.overlay.children.some((c) => c.o?.title === 'LIMPING OUT OF PORT?')); };
const closeDialog = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(600); };

// docked at the Gate (a repair station), hull 12/100
await page.evaluate(async () => { const g = window.__halcyon.game; g.dock(); g.state.ship.hull = 12; await window.__halcyon.goto('GalaxyMap'); });
await page.waitForFunction(() => window.__halcyon.scene === 'GalaxyMap' && !window.__halcyon.busy);
await page.waitForTimeout(800);

ok(await openDialog(), 'limp dialog opens at hull 12%');
ok(!!(await where('Free patch-up (once)')) && !!(await where('Depart anyway')) && !!(await where('Stay and mend')), 'dialog offers free patch, depart, stay');

// Stay and mend: no jump
const pos0 = await page.evaluate(() => window.__halcyon.game.state.pos);
await clickBtn('Stay and mend'); await page.waitForTimeout(1500);
ok((await page.evaluate(() => window.__halcyon.game.state.pos)) === pos0 && (await page.evaluate(() => window.__halcyon.game.state.ship.hull)) === 12, 'Stay and mend: no jump, hull unchanged');

// Free patch: hull -> 60, flag set, no jump
ok(await openDialog(), 'dialog opens again');
await clickBtn('Free patch-up (once)'); await page.waitForTimeout(1500);
const after = await page.evaluate(() => ({ hull: window.__halcyon.game.state.ship.hull, used: !!window.__halcyon.game.state.flags.free_repair_used, pos: window.__halcyon.game.state.pos }));
ok(after.hull === 60 && after.used && after.pos === pos0, `free patch restores hull to 60 (got ${after.hull}) and does not jump`);

// Hull low again: the free patch is one-time, so the button must be gone; Depart anyway jumps
await page.evaluate(() => { window.__halcyon.game.state.ship.hull = 10; });
ok(await openDialog(), 'dialog opens once more');
ok(!(await where('Free patch-up (once)')), 'free patch is not offered a second time');
await clickBtn('Depart anyway');
ok(await wait(() => window.__halcyon.game.state.pos !== window.__halcyon.game.state.__p0 && window.__halcyon.game.state.stats.jumps > 0, 25000), 'Depart anyway starts the jump');
ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''));
await browser.close();
console.log(`\n${total} checks, ${fails} failure(s)`);
process.exit(fails ? 1 : 0);
