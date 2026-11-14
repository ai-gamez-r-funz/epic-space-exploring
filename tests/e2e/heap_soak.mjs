// Heap soak: jump through N systems (scanning, resolving events) and show the JS heap + live canvas count stay flat after forced GC.
// Run against a production build:  npm run build && npx vite preview --port 4173 &  node tests/e2e/heap_soak.mjs [baseUrl] [jumps=120]
// Exit code 1 if heap growth between the 25% mark and the end exceeds LIMIT_MB (default 12) or live canvases keep growing.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const BASE = process.argv[2] || 'http://localhost:4173/';
const JUMPS = +(process.argv[3] || 120);
const LIMIT_MB = +(process.env.LIMIT_MB || 12);

const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--js-flags=--expose-gc', '--enable-precise-memory-info'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  const live = []; const orig = document.createElement.bind(document);
  document.createElement = (t, o) => { const e = orig(t, o); if (String(t).toLowerCase() === 'canvas') live.push(new WeakRef(e)); return e; };
  window.__liveCanvases = () => live.filter((w) => w.deref()).length;
});
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
const cdp = await ctx.newCDPSession(page);
await page.goto(BASE + '?debug=1&scene=Bridge&quick=1');
await page.waitForFunction(() => window.__halcyon?.scene === 'Bridge' && !window.__halcyon.busy, null, { timeout: 90000 });
await page.waitForTimeout(1500);

const sample = async () => {
  for (let i = 0; i < 3; i++) { await cdp.send('HeapProfiler.collectGarbage'); await page.waitForTimeout(150); }
  const { usedSize } = await cdp.send('Runtime.getHeapUsage');
  const canv = await page.evaluate(() => window.__liveCanvases());
  return { mb: +(usedSize / 1048576).toFixed(1), canv };
};
const step = () => page.evaluate(() => {
  const H = window.__halcyon, g = H.game, s = g.state; let n = 0;
  while (s.pending && n++ < 12) { const v = g.pendingView(); const c = (v.choices || []).find((x) => x.enabled) || { index: 0 }; g.resolveChoice(c.index ?? 0); }
  s.ship.fuel = s.ship.fuelMax; s.ship.supplies = s.ship.suppliesMax; s.ship.hull = s.ship.hullMax; s.ship.morale = 80; s.credits = Math.max(s.credits, 500);
  const sys = g.here(); for (const p of sys.planets.slice(0, 2)) { if (!p.scanned && !s.pending) { try { g.enterOrbit(p.id); g.scanPlanet(p.id); } catch (e) { /* */ } } }
  while (s.pending && n++ < 24) { const v = g.pendingView(); const c = (v.choices || []).find((x) => x.enabled) || { index: 0 }; g.resolveChoice(c.index ?? 0); }
  try { g.leaveOrbit(); } catch (e) { /* */ }
  const nb = g.neighbors(s.pos).filter((x) => g.canJump(x.id).ok);
  if (!nb.length) return 'stuck';
  const pick = nb[(s.day * 7 + n) % nb.length]; g.jump(pick.id);
  return 'ok';
});
const open = () => page.evaluate(() => { const H = window.__halcyon; H.openOverlay && 0; });
const rows = []; const base = await sample(); rows.push({ jump: 0, ...base, day: 1 }); console.log('jump 0', base);
let jumps = 0;
while (jumps < JUMPS) {
  const r = await step(); if (r === 'stuck') { console.log('stuck; stopping'); break; }
  jumps++; await page.waitForTimeout(350);
  // occasionally exercise Codex + Ship overlays (they build planet art)
  if (jumps % 15 === 0) { await page.evaluate(() => { try { window.__halcyon.openOverlay('Codex'); } catch (e) { /* */ } }); await page.waitForTimeout(600); await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
  if (jumps % 20 === 0) { const s = await sample(); const day = await page.evaluate(() => window.__halcyon.state.day); rows.push({ jump: jumps, ...s, day }); console.log(`jump ${jumps} day ${day}`, s); }
}
const end = await sample(); const day = await page.evaluate(() => window.__halcyon.state.day); rows.push({ jump: jumps, ...end, day });
const ref = rows[Math.max(1, Math.floor(rows.length / 4))] || rows[0];
const grow = +(end.mb - ref.mb).toFixed(1), growC = end.canv - ref.canv;
console.log(`\nheap MB by sample: ${rows.map((r) => r.mb).join(' -> ')}`);
console.log(`canvases:          ${rows.map((r) => r.canv).join(' -> ')}`);
console.log(`growth after warm-up (${ref.jump} -> ${jumps} jumps): ${grow} MB, ${growC} canvases; errors: ${errs.length}`);
await browser.close();
const fail = grow > LIMIT_MB || growC > 40 || errs.length;
console.log(fail ? 'FAIL' : 'PASS'); process.exit(fail ? 1 : 0);
