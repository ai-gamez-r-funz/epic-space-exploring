// Pre-jump hot-lane briefing: shows expected cost and odds so the risk is legible. Uses ENGINE g.jumpBriefing(toId) when present.
import { Container, Graphics } from 'pixi.js';
import { Modal } from '../../kit/Modal.js';
import { C } from '../../kit/theme.js';
import { Label } from '../../kit/Label.js';
import { S } from '../../services.js';
import { ico, pill, well, bestOfficer, cap, num } from './common.js';

export function hotBriefing(g, toId) {
  try { const b = g.jumpBriefing?.(toId); if (b) return b; } catch (e) { /* derive */ }
  const nb = g.neighbors(g.state.pos).find((n) => n.id === toId); if (!nb || !nb.hot) return null;
  const dest = g.system(toId); const here = g.here(); const danger = Math.max(dest.danger || 0, here.danger || 0);
  const pil = g.skillTotal('piloting'); const off = bestOfficer(g.state, 'piloting');
  const odds = (d) => Math.round(g.checkOdds('piloting', d) * 100);
  const boldOdds = odds(3 + danger), safeOdds = odds(1 + danger);
  const hull = Math.round(12 + danger * 9); // typical hull wear of a run; hazards scale with danger
  const levers = [];
  try { const tr = (g.trainingOptions?.(off?.c.id) || []).find((t) => t.skill === 'piloting'); if (tr) levers.push({ icon: 'piloting', text: `${tr.name}: Piloting +1 (${num(tr.price)} scrip, ${tr.days}d)${tr.available ? '' : ' — ' + (tr.reason || 'not here')}` }); } catch (e) { /* */ }
  for (const u of S.content.UPGRADES || []) if ((u.bonus?.skills?.piloting || 0) > 0 && !g.state.upgrades.includes(u.id) && u.tier === 1) { levers.push({ icon: 'ship', text: `${u.name}: Piloting +${u.bonus.skills.piloting} (${num(u.cost)} scrip, shipyard)` }); break; }
  try { const rf = (g.refits?.() || []).find((r) => /hull|plating|keel/i.test(r.name + r.desc)); if (rf) levers.push({ icon: 'hull', text: `${rf.name}: ${rf.desc}` }); } catch (e) { /* */ }
  if (g.state.ship.hull < 60) levers.unshift({ icon: 'repair', text: `Hull is ${Math.round(g.state.ship.hull)}/${g.state.ship.hullMax}: repair before running a hot lane.` });
  return { derived: true, bonus: nb.hotBonus, danger, fuel: nb.fuelCost, days: nb.days, piloting: pil, officer: off?.c.name || null, hullEstimate: hull, tiers: [{ name: 'Bold run', odds: boldOdds, note: 'less time, bigger payout' }, { name: 'Careful run', odds: safeOdds, note: 'costs fuel and days' }], levers };
}

/** Resolves true if the player wants to run it. */
export async function showBriefing(g, toId) {
  const b = hotBriefing(g, toId); if (!b) return true;
  const dest = g.system(toId); const m = new Modal({ w: 640, h: 520, title: 'HOT LANE BRIEFING', tone: 'plum' }); const W = m.bodyW;
  const t = new Label({ text: `${g.here().name} → ${dest.name}`, preset: 'head', size: 17, color: C.brassLight, w: W, h: 26, fit: true, upper: true }); m.body.addChild(t);
  const s = new Label({ text: `Danger ${b.danger}/3 · ${b.fuel} fuel · ${b.days} day${b.days === 1 ? '' : 's'} · a multi-stage run that pays a hazard bounty of ${num(b.bonus)} scrip for a clean finish.`, preset: 'small', size: 14, color: C.cream, w: W }); s.y = 32; m.body.addChild(s);
  let y = 78;
  const box = well(W, 80); box.y = y; m.body.addChild(box);
  const pl = new Label({ text: `PILOTING ${b.piloting}`, preset: 'headSm', size: 11, color: 0xb58be0 }); pl.x = 16; pl.y = y + 10; m.body.addChild(pl);
  const ol = new Label({ text: b.officer ? `${b.officer} at the helm` : 'No pilot aboard', preset: 'small', size: 13, color: C.textDim }); ol.x = 16; ol.y = y + 30; m.body.addChild(ol);
  const hl = new Label({ text: `Expect about ${b.hullEstimate} hull and ${Math.max(1, Math.round(b.fuel / 2))} extra fuel if things go sideways.`, preset: 'small', size: 13, color: C.mustard, w: W - 32 }); hl.x = 16; hl.y = y + 52; m.body.addChild(hl);
  y += 92;
  (b.tiers || []).forEach((tr, i) => {
    const col = tr.odds >= 70 ? C.good : tr.odds >= 40 ? C.mustard : C.coral; const r = new Container(); r.y = y + i * 40; m.body.addChild(r);
    const nm = new Label({ text: tr.name, preset: 'bodyB', size: 16, color: C.cream }); nm.y = 4; r.addChild(nm);
    const nt = new Label({ text: tr.note, preset: 'tiny', size: 12, color: C.textDim }); nt.x = 130; nt.y = 8; r.addChild(nt);
    const bar = new Graphics(); bar.roundRect(W - 230, 8, 170, 14, 7).fill({ color: 0x05060f }); bar.roundRect(W - 229, 9, 168 * Math.min(1, tr.odds / 100), 12, 6).fill({ color: col }); r.addChild(bar);
    const pc = new Label({ text: tr.odds + '%', preset: 'num', size: 15, color: col, w: 48, align: 'right' }); pc.x = W - 52; pc.y = 3; r.addChild(pc);
  });
  y += (b.tiers || []).length * 40 + 8;
  const lh = new Label({ text: 'HOW TO IMPROVE YOUR ODDS', preset: 'headSm', size: 10, color: C.brassLight }); lh.y = y; m.body.addChild(lh); y += 20;
  for (const lv of (b.levers || []).slice(0, 3)) { const ic = ico(lv.icon, 18, C.tealLight); ic.y = y; m.body.addChild(ic); const l = new Label({ text: lv.text, preset: 'small', size: 13, color: C.cream, w: W - 30, h: 34, fit: true }); l.x = 26; l.y = y; m.body.addChild(l); y += 34; }
  m.addButtons([{ label: 'Not today', w: 150, onClick: () => m.close(false), hotkey: 'n' }, { label: 'Run the lane', variant: 'primary', icon: 'jump', w: 240, onClick: () => m.close(true), hotkey: 'Enter' }]);
  m.open(); return !!(await m.closed);
}
