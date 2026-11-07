// Pre-jump hot-lane briefing from ENGINE g.hotLaneBriefing(toId): three stages with live odds/costs per option, expected and
// worst-case cost under best play, clean-run chance, modifiers (crew, training, refits, armour) and advice.
import { Container, Graphics } from 'pixi.js';
import { Modal } from '../../kit/Modal.js';
import { C } from '../../kit/theme.js';
import { Label } from '../../kit/Label.js';
import { Tooltip } from '../../kit/Tooltip.js';
import { well, pill, cap, num } from './common.js';

const oc = (p) => (p >= 0.7 ? C.good : p >= 0.4 ? C.mustard : C.coral);
const costTxt = (c = {}) => [c.hull ? `-${c.hull} hull` : '', c.fuel ? `-${c.fuel} fuel` : '', c.days ? `${c.days}d` : ''].filter(Boolean).join(' ') || 'free';

/** Resolves true if the player wants to run the lane (always true for ordinary lanes / missing API). */
export async function showBriefing(g, toId) {
  let b = null; try { b = g.hotLaneBriefing?.(toId); } catch (e) { /* */ }
  if (!b || !b.hot) return true;
  const dest = g.system(toId); const m = new Modal({ w: 800, h: 600, title: 'HOT LANE BRIEFING', tone: 'plum' }); const W = m.bodyW;
  const t = new Label({ text: `${g.here().name} → ${dest.name}`, preset: 'head', size: 17, color: C.brassLight, w: W, h: 26, fit: true, upper: true }); m.body.addChild(t);
  const s = new Label({ text: `Danger ${b.danger}/3 · ${b.fuel} fuel · ${b.days} day${b.days === 1 ? '' : 's'} · three beats, then a ${num(b.bonus)} scrip hazard bounty plus a curio for a finished run.`, preset: 'small', size: 14, color: C.cream, w: W }); s.y = 30; m.body.addChild(s);
  // summary strip
  let y = 74; const box = well(W, 74); box.y = y; m.body.addChild(box);
  const cell = (i, head, val, col, sub) => { const x = 16 + i * 190; const h = new Label({ text: head, preset: 'headSm', size: 9, color: C.textDim }); h.x = x; h.y = y + 8; const v = new Label({ text: val, preset: 'num', size: 19, color: col }); v.x = x; v.y = y + 24; const u = new Label({ text: sub, preset: 'tiny', size: 11, color: C.textDim, w: 180 }); u.x = x; u.y = y + 52; m.body.addChild(h, v, u); };
  cell(0, 'CLEAN RUN', Math.round(b.cleanChance * 100) + '%', oc(b.cleanChance), 'no hull lost, best play');
  cell(1, 'EXPECTED', (b.expected.hull > 0 ? `-${b.expected.hull}` : '0') + ' hull', C.cream, `${b.expected.fuel} fuel · ${b.expected.days} days`);
  cell(2, 'WORST CASE', (b.worst.hull > 0 ? `-${b.worst.hull}` : '0') + ' hull', b.worst.hull >= b.hullNow ? C.coral : C.mustard, `you have ${b.hullNow} hull now`);
  cell(3, 'ARMOUR', b.armorPct ? `-${b.armorPct}%` : 'none', b.armorPct ? C.good : C.textDim, 'hull damage reduction');
  y += 86;
  // stages
  (b.stages || []).forEach((st, i) => {
    const row = new Container(); row.y = y + i * 80; m.body.addChild(row);
    const hd = new Label({ text: `BEAT ${st.stage}`, preset: 'headSm', size: 10, color: C.brassLight }); hd.y = 2; row.addChild(hd);
    const cw = (W - 70) / 3;
    st.options.forEach((o, k) => {
      const x = 70 + k * cw; const best = o.key === st.best;
      const g2 = new Graphics(); g2.roundRect(x, 0, cw - 8, 72, 9).fill({ color: best ? 0x2f3a82 : 0x161940 }); if (best) g2.roundRect(x, 0, cw - 8, 72, 9).stroke({ width: 2, color: C.brassLight }); row.addChild(g2);
      const nm = new Label({ text: o.label, preset: 'bodyB', size: 13, color: C.cream, w: cw - 70, h: 18, fit: true }); nm.x = x + 8; nm.y = 6; row.addChild(nm);
      const pc = new Label({ text: Math.round(o.odds * 100) + '%', preset: 'num', size: 15, color: oc(o.odds), w: 52, align: 'right' }); pc.x = x + cw - 8 - 58; pc.y = 5; row.addChild(pc);
      const sk = new Label({ text: o.skill ? cap(o.skill) : 'No check', preset: 'tiny', size: 11, color: C.textDim }); sk.x = x + 8; sk.y = 26; row.addChild(sk);
      const ok = new Label({ text: 'pass: ' + costTxt(o.passCost), preset: 'tiny', size: 11, color: C.good, w: cw - 20, h: 14, fit: true }); ok.x = x + 8; ok.y = 41; row.addChild(ok);
      const bad = new Label({ text: 'fail: ' + (o.key === 'creep' ? '—' : costTxt(o.failCost)), preset: 'tiny', size: 11, color: C.coral, w: cw - 20, h: 14, fit: true }); bad.x = x + 8; bad.y = 55; row.addChild(bad);
      if (best) { const bp = pill({ text: 'BEST', color: C.brassLight, h: 14, size: 8, preset: 'headSm', padX: 6 }); bp.x = x + cw - 8 - bp.w - 4; bp.y = 28; row.addChild(bp); }
    });
  });
  y += (b.stages || []).length * 80 + 4;
  const mods = (b.modifiers || []).map((x) => x.label + (x.value ? ` (${x.value})` : '')).join('  ·  ');
  const ml = new Label({ text: mods, preset: 'tiny', size: 12, color: C.tealLight, w: W }); ml.y = y; m.body.addChild(ml); y += ml.textHeight + 8;
  const risky = b.worst.hull >= b.hullNow;
  const al = new Label({ text: b.advice || '', preset: 'bodyB', size: 15, color: risky ? C.coral : C.cream, w: W }); al.y = y; m.body.addChild(al);
  m.addButtons([{ label: 'Not today', w: 150, onClick: () => m.close(false), hotkey: 'n' }, { label: 'Run the lane', variant: 'primary', icon: 'jump', w: 240, onClick: () => m.close(true), hotkey: 'Enter' }]);
  m.open(); return !!(await m.closed);
}
