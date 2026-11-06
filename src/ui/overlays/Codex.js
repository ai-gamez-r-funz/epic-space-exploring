import { Container, Graphics } from 'pixi.js';
import { Overlay } from './Overlay.js';
import { C } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Button } from '../kit/Button.js';
import { ScrollList, ScrollPane } from '../kit/Scroll.js';
import { TextInput } from '../kit/TextInput.js';
import { Anim } from '../kit/anim.js';
import { S } from '../services.js';
import { cap, pretty, factionName, heading, chip, slimBar } from './parts2/common.js';

const CATS = [['all', 'All'], ['species', 'Peoples'], ['place', 'Places'], ['phenomenon', 'Phenom.'], ['history', 'History'], ['tech', 'Tech']];
const CAT_ICON = { species: 'crew', place: 'planet', phenomenon: 'science', history: 'log', tech: 'engineering', all: 'codex' };
const FACTION_SPECIES = { concord: 'human', quillari: 'quillari', vesperine: 'vesperine', archivists: 'archivist', drifters: 'drifter' };
const PHENS = ['nebula', 'pulsar', 'ionstorm', 'wormhole', 'asteroids', 'derelict', 'comet', 'rift', 'aurora', 'beacon'];
const PTYPES = ['terran', 'ocean', 'desert', 'ice', 'lava', 'gas', 'barren', 'jungle', 'crystal', 'toxic'];
const hashStr = (s) => { let h = 11; for (const ch of String(s)) h = (h * 33 + ch.charCodeAt(0)) | 0; return Math.abs(h) % 9973; };

/** Human-readable hint for how an entry unlocks (without spoiling its text). */
export function unlockHint(e) {
  const u = e.unlockedBy;
  if (u === null || u === undefined) return 'Known to the Society from the start.';
  if (u === 'event') return 'Learned through encounters and events out in the Reach.';
  if (u.scan) { const [k, v] = String(u.scan).split(':'); return k === 'planetType' ? `Scan ${/^[aeiou]/.test(v) ? 'an' : 'a'} ${v} world.` : `Scan a world with ${pretty(v).toLowerCase()}.`; }
  if (u.phenomenon) return `Study ${/^[aeiou]/.test(u.phenomenon) ? 'an' : 'a'} ${pretty(u.phenomenon).toLowerCase()}.`;
  if (u.star) return `Visit a ${u.star === 'blackhole' ? 'black hole' : u.star + ' star'} system.`;
  if (u.faction) return `Make first contact with the ${factionName(u.faction)}.`;
  if (u.visit) return 'Visit a certain landmark somewhere in the Reach.';
  if (u.flag) return 'Follow the thread of the main story.';
  if (u.mission) return 'Complete a particular mission.';
  return 'Keep exploring.';
}

function illustrate(e, w, h) {
  const box = new Container(); const g = new Graphics().roundRect(0, 0, w, h, 12).fill(0x05060f); box.addChild(g);
  const m = new Graphics().roundRect(0, 0, w, h, 12).fill(0xffffff); const inner = new Container(); box.addChild(inner, m); inner.mask = m;
  try { const sf = S.gfx.starfield({ w, h, seed: hashStr(e.id), density: 0.6, parallax: 0 }); inner.addChild(sf); if (sf.update) Anim.watch(sf, (dt) => sf.update(dt)); } catch (err) { /* optional */ }
  const u = e.unlockedBy && typeof e.unlockedBy === 'object' ? e.unlockedBy : {}; const cat = e.category; let art = null;
  try {
    if (u.phenomenon || (cat === 'phenomenon' && PHENS.find((p) => e.id.includes(p)))) art = S.gfx.phenomenon(u.phenomenon || PHENS.find((p) => e.id.includes(p)), { size: Math.min(w, h) * 0.8 });
    else if (u.scan && String(u.scan).startsWith('planetType:')) art = S.gfx.planet({ type: String(u.scan).split(':')[1], seed: hashStr(e.id), radius: h * 0.34 });
    else if (cat === 'place' && PTYPES.find((p) => e.id.includes(p))) art = S.gfx.planet({ type: PTYPES.find((p) => e.id.includes(p)), seed: hashStr(e.id), radius: h * 0.34 });
    else if (u.star) art = S.gfx.star({ type: u.star, radius: h * 0.22 });
    else if (cat === 'species') {
      const sp = u.faction ? FACTION_SPECIES[u.faction] : /robot|bot|keeper|mendel/i.test(e.id) ? 'robot' : /archiv/i.test(e.id) ? 'archivist' : /quill/i.test(e.id) ? 'quillari' : /vesper/i.test(e.id) ? 'vesperine' : /drift/i.test(e.id) ? 'drifter' : /concord|human/i.test(e.id) ? 'human' : null;
      if (sp) art = S.gfx.portrait({ species: sp, seed: hashStr(e.id), size: h * 0.78 }); else art = S.gfx.phenomenon('aurora', { size: h * 0.8 });
    } else if (u.faction) art = S.gfx.factionEmblem(u.faction, h * 0.6);
    else if (u.visit || cat === 'place') art = S.gfx.planet({ type: PTYPES[hashStr(e.id) % PTYPES.length], seed: hashStr(e.id), radius: h * 0.3 });
  } catch (err) { art = null; }
  if (!art) { art = S.gfx.icon(CAT_ICON[cat] || 'codex', { size: h * 0.5, color: C.brassLight }); }
  const b = art.getLocalBounds(); art.x = (w - b.width) / 2 - b.x; art.y = (h - b.height) / 2 - b.y;
  inner.addChild(art); if (art.update) Anim.watch(art, (dt) => art.update(dt));
  box.addChild(new Graphics().roundRect(0, 0, w, h, 12).stroke({ width: 2, color: C.brassDark }));
  return box;
}

/** Codex — category tabs, discovered entries with illustration, undiscovered as ??? with unlock hints, completion %, search by typing. */
export class Codex extends Overlay {
  title = 'CODEX'; size = { w: 1100, h: 640 };
  build(modal, params = {}) {
    this.cat = params.category || 'all'; this.query = ''; this.sel = params.id || null; this.bw = modal.bodyW; this.paneH = modal.bodyH - 42 - 100;
    this.head = new Container(); modal.body.addChild(this.head);
    this.search = new TextInput({ w: 300, h: 40, placeholder: 'Type to search…', maxLength: 30, onChange: (v) => { this.query = v.trim().toLowerCase(); this._list(); } }); this.search.x = this.bw - 300; this.search.y = 0; modal.body.addChild(this.search);
    this.catBar = new Container(); this.catBar.y = 50; modal.body.addChild(this.catBar);
    const lw = 360;
    this.listW = lw;
    this.list = new ScrollList({ w: lw, h: this.paneH, itemH: 52, gap: 5, items: [], onSelect: (it) => { this.sel = it.id; this._detail(); }, render: (it, i, w, h) => this._row(it, w, h) }); this.list.y = 100; modal.body.addChild(this.list);
    this.dpane = new ScrollPane({ w: this.bw - lw - 16, h: this.paneH }); this.dpane.x = lw + 16; this.dpane.y = 100; modal.body.addChild(this.dpane);
    modal.addButtons([{ label: 'Close', onClick: () => modal.close(), hotkey: 'Enter', variant: 'primary', w: 140 }]);
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || !this.modal || this.modal.destroyed) return;
      const a = document.activeElement; if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return;
      if (e.key.length === 1 && /[\p{L}\p{N}]/u.test(e.key) && !(this.ui.overlays.some((o) => o !== this))) { e.preventDefault(); e.stopPropagation(); this.search.focus(); this.search.setValue(this.query + e.key); this.query = this.search.value.toLowerCase(); this._list(); }
    };
    window.addEventListener('keydown', onKey, true); this._offs.push(() => window.removeEventListener('keydown', onKey, true));
    this.watch(() => this.refresh()); this.refresh();
  }
  _all() { return (this.game.codexEntries?.() || []).map((e) => ({ ...e })); }
  refresh() { if (!this.modal || this.modal.destroyed) return; this._head(); this._cats(); this._list(); }
  _head() {
    const h = this.head; h.removeChildren().forEach((c) => c.destroy({ children: true }));
    const all = this._all(); const known = all.filter((e) => e.known).length; const pct = all.length ? Math.round(100 * known / all.length) : 0;
    const t = new Label({ text: `${known} of ${all.length} entries discovered`, preset: 'bodyB', size: 18, color: C.cream }); t.y = 2; h.addChild(t);
    const pl = new Label({ text: `${pct}% complete`, preset: 'num', size: 15, color: pct >= 100 ? C.good : C.mustard }); pl.y = 26; h.addChild(pl);
    const b = slimBar(220, all.length ? known / all.length : 0, C.tealLight, 10); b.x = pl.textWidth + 16; b.y = 29; h.addChild(b);
  }
  _cats() {
    const bar = this.catBar; bar.removeChildren().forEach((c) => c.destroy({ children: true })); const all = this._all(); let x = 0;
    for (const [id, label] of CATS) {
      const list = id === 'all' ? all : all.filter((e) => e.category === id); const k = list.filter((e) => e.known).length;
      const b = new Button({ label: `${label}  ${k}/${list.length}`, icon: CAT_ICON[id], w: 168, h: 40, fontSize: 12, upper: false, variant: this.cat === id ? 'brass' : 'ghost', selected: this.cat === id, onClick: () => { this.cat = id; this.sel = null; this._cats(); this._list(); } });
      b.x = x; bar.addChild(b); x += 174;
    }
  }
  _filtered() {
    const q = this.query;
    let list = this._all().filter((e) => this.cat === 'all' || e.category === this.cat);
    if (q) list = list.filter((e) => (e.known ? (e.title + ' ' + e.text + ' ' + e.category).toLowerCase().includes(q) : ('???' + e.category).includes(q) || unlockHint(e).toLowerCase().includes(q)));
    return [...list.filter((e) => e.known), ...list.filter((e) => !e.known)];
  }
  _list() {
    const items = this._filtered().map((e) => ({ id: e.id, e }));
    this.list.setItems(items);
    if (!items.some((i) => i.id === this.sel)) this.sel = items[0]?.id || null;
    this.list.select(this.sel); this._detail();
  }
  _row(it, w, h) {
    const e = it.e, k = new Container();
    const ic = S.gfx.icon(e.known ? (CAT_ICON[e.category] || 'codex') : 'lock', { size: 22, color: e.known ? C.tealLight : C.textDim }); ic.x = 12; ic.y = 15; k.addChild(ic);
    const t = new Label({ text: e.known ? e.title : '???', preset: 'bodyB', size: 16, color: e.known ? C.cream : C.textDim, w: w - 130, fit: true, h: 20 }); t.x = 46; t.y = 7; k.addChild(t);
    const s = new Label({ text: e.known ? cap(e.category) : unlockHint(e), preset: 'tiny', size: 12, color: C.textDim, w: w - 62, fit: true, h: 15 }); s.x = 46; s.y = 29; k.addChild(s);
    if (e.known) { const c = new Label({ text: cap(e.category).slice(0, 5), preset: 'numSm', size: 10, color: C.brassLight }); c.x = w - c.textWidth - 10; c.y = 9; k.addChild(c); }
    return k;
  }
  _detail() {
    const root = this.dpane.content; root.removeChildren().forEach((c) => c.destroy({ children: true }));
    const e = this._all().find((x) => x.id === this.sel); const W = this.dpane.w - 14;
    if (!e) { const l = new Label({ text: this.query ? `Nothing in the Codex matches "${this.query}".` : 'Nothing here yet.', preset: 'body', size: 17, color: C.textDim, w: W }); l.y = 16; root.addChild(l); this.dpane.refresh(); return; }
    const art = illustrate(e, 250, 190); root.addChild(art);
    if (e.known) {
      const tt = new Label({ text: e.title, preset: 'head', size: 20, color: C.cream, w: W - 276, upper: true, lineHeight: 26 }); tt.x = 270; root.addChild(tt);
      const c = chip(cap(e.category), { color: C.tealLight }); c.x = 270; c.y = tt.textHeight + 8; root.addChild(c);
      const tx = new Label({ text: e.text, preset: 'body', size: 18, color: C.cream, w: W - 276, lineHeight: 26 }); tx.x = 270; tx.y = c.y + 36; root.addChild(tx);
      const y = Math.max(tx.y + tx.textHeight, 190) + 18;
      const hl = heading('How it was found'); hl.y = y; root.addChild(hl);
      const ht = new Label({ text: unlockHint(e).replace(/^(Scan|Study|Visit|Make|Complete|Follow)/, (m) => ({ Scan: 'By scanning', Study: 'By studying', Visit: 'By visiting', Make: 'By making', Complete: 'By completing', Follow: 'By following' }[m])).replace(/\.$/, '.') , preset: 'small', size: 15, color: C.textDim, w: W }); ht.y = y + 22; root.addChild(ht);
    } else {
      const tt = new Label({ text: '???', preset: 'display', size: 40, color: C.textDim }); tt.x = 270; root.addChild(tt);
      const c = chip(cap(e.category), { color: C.textDim }); c.x = 270; c.y = 60; root.addChild(c);
      const lk = S.gfx.icon('lock', { size: 20, color: C.warn }); lk.x = 270; lk.y = 104; root.addChild(lk);
      const hint = new Label({ text: unlockHint(e), preset: 'body', size: 17, color: C.warn, w: W - 310, lineHeight: 24 }); hint.x = 300; hint.y = 102; root.addChild(hint);
      const nt = new Label({ text: 'Undiscovered. The Society\'s archivists have left this page blank for you to fill.', preset: 'small', size: 14, color: C.textDim, w: W - 276, lineHeight: 19 }); nt.x = 270; nt.y = 150; root.addChild(nt);
      const sil = new Graphics().roundRect(0, 0, 250, 190, 12).fill({ color: 0x05060f, alpha: 0.78 }); art.addChild(sil);
      const q = new Label({ text: '?', preset: 'display', size: 90, color: C.indigo }); q.x = 125 - q.textWidth / 2; q.y = 95 - q.textHeight / 2; art.addChild(q);
    }
    this.dpane.refresh();
  }
}
