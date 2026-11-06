// Credits roll: a modal with gently auto-scrolling text. Click/drag to take over, Esc closes.
import { Container, Graphics } from 'pixi.js';
import { C } from '../../kit/theme.js';
import { Label } from '../../kit/Label.js';
import { Modal } from '../../kit/Modal.js';
import { ScrollPane } from '../../kit/Scroll.js';
import { Anim } from '../../kit/anim.js';
import { Prefs } from './prefs.js';
import { S } from '../../services.js';

const ROLL = [
  ['h', 'HALCYON REACH'], ['t', 'A cozy, no-combat voyage of open skies'], ['gap'],
  ['h', 'On the bridge'], ['t', 'Captain'], ['gap'],
  ['h', 'The Meridian Society for Open Skies'], ['t', 'Cartographers, relief workers and translators.\nMotto: "Say please, and bring tea."'], ['gap'],
  ['h', 'The peoples of the Reach'], ['t', 'The Concord of Lyra  ·  The Quillari Clans\nThe Vesperine Choirs  ·  The Archivists  ·  The Drifter Fleets'], ['gap'],
  ['h', 'Built with'], ['t', 'PixiJS 8  ·  Vite  ·  WebAudio\nFonts: Josefin Sans, Syncopate, Space Mono (SIL OFL)'], ['gap'],
  ['h', 'Everything you see and hear'], ['t', 'All art, music and sound effects are generated\nprocedurally in your browser. There are no image files.'], ['gap'],
  ['h', 'Special thanks'], ['t', 'To everyone who has ever offered a stranger a cup of tea\nand asked nothing in return.'], ['gap'],
  ['t2', 'No combat was harmed in the making of this game.'],
];

export function openCredits(ui) {
  const m = new Modal({ w: 720, h: 560, title: 'CREDITS' }); const bw = m.bodyW, bh = m.bodyH - 54;
  const pane = new ScrollPane({ w: bw, h: bh, bar: false }); m.body.addChild(pane);
  const root = pane.content; let y = bh * 0.55;
  const cap = ui?.game?.state?.captain?.name; const legacy = (() => { try { return JSON.parse(localStorage.getItem('halcyon.legacy') || 'null'); } catch (e) { return null; } })();
  for (const [k, txt] of ROLL) {
    if (k === 'gap') { y += 34; continue; }
    let text = txt; if (txt === 'Captain') text = cap ? `Capt. ${cap} and the crew of the ${ui.game.state.ship.name}` : 'You, and a crew who believe in you';
    const l = new Label({ text, preset: k === 'h' ? 'head' : 'body', size: k === 'h' ? 17 : k === 't2' ? 18 : 19, color: k === 'h' ? C.mustard : k === 't2' ? C.tealLight : C.cream, w: bw - 40, align: 'center', lineHeight: 28, upper: k === 'h' }); l.x = 20; l.y = y; root.addChild(l); y += l.textHeight + (k === 'h' ? 10 : 6);
  }
  if (legacy?.runs) { y += 20; const l = new Label({ text: `Legacy of the Society: ${legacy.runs} voyage${legacy.runs === 1 ? '' : 's'} completed, best score ${legacy.best}`, preset: 'small', size: 15, color: C.brassLight, w: bw - 40, align: 'center' }); l.x = 20; l.y = y; root.addChild(l); y += 40; }
  y += bh * 0.5; root.addChild(new Graphics().rect(0, y, 1, 1).fill({ color: 0, alpha: 0 })); pane.refresh();
  const g = new Graphics().rect(0, 0, bw, 50).fill({ color: 0x1c2152, alpha: 0.9 }); g.y = 0; const g2 = new Graphics().rect(0, bh - 50, bw, 50).fill({ color: 0x1c2152, alpha: 0.9 });
  void g; void g2;
  let auto = !!Prefs.anim; let idle = 0;
  Anim.watch(m, (dt) => { if (auto && !pane._dragging) { pane.scrollY = Math.min(pane.maxScroll, pane.scrollY + dt * 38); pane._apply(); } else if (!pane._dragging) { idle += dt; } });
  pane.on('pointerdown', () => { auto = false; });
  m.addButtons([{ label: 'Lovely', variant: 'primary', onClick: () => m.close(), hotkey: 'Enter' }]); m.open();
  void S; return m;
}
