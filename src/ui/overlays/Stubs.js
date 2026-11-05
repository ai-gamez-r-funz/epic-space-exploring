import { Container, Graphics } from 'pixi.js';
import { Overlay } from './Overlay.js';
import { C } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { ScrollList } from '../kit/Scroll.js';
import { Slider } from '../kit/Slider.js';
import { Button } from '../kit/Button.js';
import { vstack, hstack } from '../kit/layout.js';
import { Modal } from '../kit/Modal.js';
import { S } from '../services.js';

// Shared helper for not-yet-built overlays.
function stubNote(o, modal, text) {
  const l = new Label({ text, preset: 'body', w: modal.bodyW, color: C.cream }); modal.body.addChild(l); return l;
}

/** Trade — STUB. Next engineer: market table via game.market(sysId) + buy/sell/repair/refuel/restock; opened with T when docked or via {shop:true}. */
export class Trade extends Overlay {
  title = 'TRADE & SERVICES'; size = { w: 900, h: 560 };
  build(modal) {
    stubNote(this, modal, 'The cargo-master is still polishing the ledgers. (STUB: market, repairs, refuel, restock go here.)');
    const m = this.game.market?.(this.game.state.pos);
    if (m) {
      const list = new ScrollList({ w: 420, h: 340, itemH: 34, items: m.goods.map((g) => ({ id: g.id, label: g.name, right: `${g.buy}/${g.sell}` })) }); list.y = 60; modal.body.addChild(list);
    }
    modal.addButtons([{ label: 'Close', onClick: () => modal.close(), hotkey: 'Enter', variant: 'primary' }]);
  }
}

/** Shipyard — STUB. Next: upgrades via game.shipyard(sysId) / buyUpgrade; also show installed upgrades + shipStats(). */
export class Shipyard extends Overlay {
  title = 'SHIP & UPGRADES'; size = { w: 900, h: 560 };
  build(modal) {
    stubNote(this, modal, 'The yard foreman is on a tea break. (STUB: installed systems, upgrades and ship stats go here.)');
    const st = this.game.shipStats?.();
    if (st) { const l = new Label({ text: Object.entries(st).filter(([, v]) => typeof v === 'number').map(([k, v]) => `${k}: ${v}`).join('   '), preset: 'mono', w: modal.bodyW, color: C.tealLight }); l.y = 70; modal.body.addChild(l); }
    modal.addButtons([{ label: 'Close', onClick: () => modal.close(), hotkey: 'Enter', variant: 'primary' }]);
  }
}

/** CrewScreen — STUB with a plain crew roster. Next: portraits, skills, traits, mood, talk (g.crewTalk), hire/dismiss. */
export class CrewScreen extends Overlay {
  title = 'CREW'; size = { w: 760, h: 520 };
  build(modal) {
    const crew = this.game.crewList?.() || this.game.state.crew;
    const list = new ScrollList({ w: modal.bodyW, h: 340, itemH: 62, items: crew.map((c) => ({ id: c.id, name: c.name, c })), render: (it, i, w, h) => {
      const c = new Container(); const p = S.gfx.portrait({ species: it.c.portrait?.species || it.c.species, seed: it.c.portrait?.seed || i, size: 48, mood: it.c.mood }); p.x = 8; p.y = 7; c.addChild(p);
      const n = new Label({ text: it.c.name, preset: 'bodyB', size: 17, color: C.cream, w: w - 200, fit: true, h: 22 }); n.x = 68; n.y = 8; c.addChild(n);
      const s = new Label({ text: `${it.c.role} · ${it.c.species} · mood ${Math.round(it.c.mood)}`, preset: 'tiny', size: 13, color: C.textDim }); s.x = 68; s.y = 34; c.addChild(s); return c; } });
    modal.body.addChild(list);
    const note = new Label({ text: '(STUB: skills, traits, talk and hire/dismiss to come.)', preset: 'tiny', color: C.textDim }); note.y = 350; modal.body.addChild(note);
    modal.addButtons([{ label: 'Close', onClick: () => modal.close(), hotkey: 'Enter', variant: 'primary' }]);
  }
}

/** MissionLog — STUB: active missions + ship's log. Next: objectives, rewards, abandon, deadline chips. */
export class MissionLog extends Overlay {
  title = "SHIP'S LOG & MISSIONS"; size = { w: 820, h: 560 };
  build(modal) {
    const half = (modal.bodyW - 16) / 2;
    const act = this.game.activeMissions?.() || [];
    const a = new Label({ text: 'ACTIVE MISSIONS', preset: 'headSm', color: C.brassLight }); modal.body.addChild(a);
    const ml = new ScrollList({ w: half, h: 380, itemH: 54, items: act.length ? act.map((m) => ({ id: m.id, label: m.title, sub: (m.objectives || []).map((o) => (o.done ? '✓ ' : '• ') + o.text).join('  ') })) : [{ id: 'none', label: 'No active missions.', disabled: true }] });
    ml.y = 26; modal.body.addChild(ml);
    const b = new Label({ text: 'CAPTAIN\'S LOG', preset: 'headSm', color: C.brassLight }); b.x = half + 16; modal.body.addChild(b);
    const logs = [...(this.game.state.log || [])].reverse().slice(0, 60);
    const ll = new ScrollList({ w: half, h: 380, itemH: 46, items: logs.map((e, i) => ({ id: i, label: e.text, sub: `Day ${e.day} · ${e.kind}` })) }); ll.x = half + 16; ll.y = 26; modal.body.addChild(ll);
    modal.addButtons([{ label: 'Close', onClick: () => modal.close(), hotkey: 'Enter', variant: 'primary' }]);
  }
}

/** Codex — STUB: list of entries. Next: category tabs, detail pane, unknown entries as "???". */
export class Codex extends Overlay {
  title = 'CODEX'; size = { w: 820, h: 560 };
  build(modal) {
    const entries = (this.game.codexEntries?.() || []);
    const known = entries.filter((e) => e.known);
    const list = new ScrollList({ w: 300, h: 400, itemH: 36, items: entries.map((e) => ({ id: e.id, label: e.known ? e.title : '???', disabled: !e.known, right: e.category?.slice(0, 4) })) });
    modal.body.addChild(list);
    const txt = new Label({ text: `${known.length}/${entries.length} entries discovered. (STUB: detail view to come.)`, preset: 'body', w: modal.bodyW - 330, color: C.cream }); txt.x = 330; modal.body.addChild(txt);
    modal.addButtons([{ label: 'Close', onClick: () => modal.close(), hotkey: 'Enter', variant: 'primary' }]);
  }
}

/** Help — controls cheat-sheet. Next engineer may add tutorial hints. */
export class Help extends Overlay {
  title = 'HELP & HOTKEYS'; size = { w: 760, h: 560 };
  build(modal) {
    const rows = [['C', 'Chart (galaxy map)'], ['O', 'Enter / leave orbit'], ['S', 'Scan planet or system'], ['L', 'Landing party'], ['I', 'Investigate phenomenon'], ['H', 'Hail'], ['D', 'Dock / undock'], ['T', 'Trade & services (docked)'],
      ['U', 'Ship & upgrades'], ['R', 'Crew'], ['J', 'Journal: log & missions'], ['K', 'Codex'], ['Z', 'Rest one day'], ['1-9', 'Choose in dialogs'], ['Tab / Enter', 'Keyboard focus / activate'], ['Esc', 'Pause menu / back'], ['F1 or ?', 'This help']];
    const col = (list, x) => list.forEach(([k, d], i) => {
      const kl = new Label({ text: k, preset: 'num', size: 14, color: C.mustard }); kl.x = x; kl.y = i * 34; const dl = new Label({ text: d, preset: 'small', size: 16, color: C.cream }); dl.x = x + 100; dl.y = i * 34 + 1; modal.body.addChild(kl, dl);
    });
    col(rows.slice(0, 9), 0); col(rows.slice(9), 360);
    const tip = new Label({ text: 'Goal: chart the Lantern Reach, help whoever you meet, and learn who lit the Lanterns. There is no combat, ever. Hover anything for a tooltip.', preset: 'small', w: modal.bodyW, color: C.textDim }); tip.y = 330; modal.body.addChild(tip);
    modal.addButtons([{ label: 'Got it', onClick: () => modal.close(), hotkey: 'Enter', variant: 'primary' }]);
  }
}

/** Settings — volume sliders, mute, manual save/load slots. */
export class Settings extends Overlay {
  title = 'SETTINGS'; size = { w: 640, h: 560 };
  build(modal) {
    const au = S.audio; const v = au.getVolume?.() || { master: 0.8, music: 0.6, sfx: 0.85 };
    const mk = (label, key) => new Slider({ w: 520, label, value: v[key], min: 0, max: 1, step: 0.05, onChange: (x) => au.setVolume({ [key]: x }) });
    const sl = [mk('Master', 'master'), mk('Music', 'music'), mk('Effects', 'sfx')];
    vstack(sl, { gap: 14 }); modal.body.addChild(...sl);
    const mute = new Button({ label: au.isMuted?.() ? 'Unmute' : 'Mute all', icon: au.isMuted?.() ? 'mute' : 'sound', w: 200, h: 42, onClick: (b) => { au.mute(!au.isMuted()); b.setLabel(au.isMuted() ? 'Unmute' : 'Mute all'); b.setIcon(au.isMuted() ? 'mute' : 'sound'); } });
    mute.y = 160; modal.body.addChild(mute);
    const h = new Label({ text: 'SAVE SLOTS', preset: 'headSm', color: C.brassLight }); h.y = 230; modal.body.addChild(h);
    const info = (slot) => { try { const raw = S.Game.readSave(slot); if (!raw) return 'empty'; const st = (typeof raw === 'string' ? JSON.parse(raw) : raw.state || raw); return `${st.ship?.name || '?'} · day ${st.day}`; } catch (e) { return 'unreadable'; } };
    const slots = this.game ? ['auto', '1', '2'] : [];
    slots.forEach((slot, i) => {
      const y = 260 + i * 54; const lab = new Label({ text: (slot === 'auto' ? 'Autosave' : 'Slot ' + slot) + ' — ' + info(slot), preset: 'small', size: 15, color: C.cream, w: 280, fit: true, h: 20 }); lab.y = y + 12; modal.body.addChild(lab);
      const bs = new Button({ label: 'Save', w: 100, h: 40, variant: 'teal', disabled: slot === 'auto', onClick: () => { const ok = this.ui.saveTo(slot); this.ui.toast(ok ? 'Game saved.' : 'Could not save.', ok ? 'good' : 'bad'); lab.setText((slot === 'auto' ? 'Autosave' : 'Slot ' + slot) + ' — ' + info(slot)); } });
      const bl = new Button({ label: 'Load', w: 100, h: 40, variant: 'brass', disabled: info(slot) === 'empty', onClick: async () => { const g = this.ui.loadSlot(slot); if (g) { modal.close(); this.ui.goto('Bridge'); } } });
      bs.x = 310; bs.y = y; bl.x = 420; bl.y = y; modal.body.addChild(bs, bl);
    });
    if (!this.game) { const n = new Label({ text: 'Start or continue a voyage to use save slots.', preset: 'small', color: C.textDim }); n.y = 262; modal.body.addChild(n); }
    modal.addButtons([{ label: 'Done', onClick: () => modal.close(), hotkey: 'Enter', variant: 'primary' }]);
  }
}

/** Pause — Esc menu. */
export class Pause extends Overlay {
  title = 'PAUSED'; size = { w: 420, h: 440 };
  build(modal) {
    const items = [
      ['Resume', 'primary', () => modal.close(), 'Enter'],
      ['Settings', 'brass', () => { modal.close(); this.ui.openOverlay('Settings'); }, 's'],
      ['Help', 'brass', () => { modal.close(); this.ui.openOverlay('Help'); }, 'h'],
      ['Save game', 'teal', () => { this.ui.saveTo('1'); this.ui.toast('Saved to slot 1.', 'good'); }, null],
      ['Quit to title', 'coral', async () => { const ok = await Modal.confirm('Leave this voyage and return to the title screen? Your last autosave is kept.', { yes: 'Leave', no: 'Stay' }); if (ok) { modal.close(); this.ui.autosave(); this.ui.goto('Title'); } }, null],
    ];
    const bs = items.map(([label, variant, fn, hk]) => new Button({ label, variant, w: modal.bodyW, h: 50, onClick: fn, hotkey: hk || undefined }));
    vstack(bs, { gap: 14 }); modal.body.addChild(...bs);
  }
}

/** EndScreen — STUB: ending title/text/score. Next: score breakdown, legacy bonus, fanfare, share. */
export class EndScreen extends Overlay {
  title = 'VOYAGE COMPLETE'; size = { w: 760, h: 520 }; closable = false;
  build(modal, params) {
    const e = params.ending || this.game.state.ending || { title: 'The End', text: '', score: 0 };
    const t = new Label({ text: e.title, preset: 'title', size: 26, color: C.mustard, w: modal.bodyW, align: 'center' }); modal.body.addChild(t);
    const x = new Label({ text: e.text || '', preset: 'body', w: modal.bodyW, color: C.cream }); x.y = 60; modal.body.addChild(x);
    const s = new Label({ text: `Score ${e.score ?? 0}`, preset: 'num', size: 22, color: C.tealLight, w: modal.bodyW, align: 'center' }); s.y = 330; modal.body.addChild(s);
    modal.addButtons([{ label: 'Return to title', variant: 'primary', w: 220, onClick: () => { modal.close(); this.ui.goto('Title'); } }], { align: 'center' });
  }
}
