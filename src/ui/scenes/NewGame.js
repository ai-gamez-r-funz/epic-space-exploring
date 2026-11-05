import { Container, Graphics } from 'pixi.js';
import { Scene } from '../Scene.js';
import { W, H, C } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Button, IconButton } from '../kit/Button.js';
import { Panel } from '../kit/Panel.js';
import { Card } from '../kit/Card.js';
import { TextInput } from '../kit/TextInput.js';
import { Input } from '../kit/input.js';
import { Anim } from '../kit/anim.js';
import { S } from '../services.js';
import { makeBackdrop } from '../widgets/Backdrop.js';

const DIFFS = [
  { id: 'cozy', title: 'Cozy', icon: 'morale', color: C.good, body: 'Generous fuel and supplies, forgiving weather. For tea, scenery and storytelling.' },
  { id: 'standard', title: 'Standard', icon: 'ship', color: C.mustard, body: 'A balanced survey. Plan your fuel, keep your crew happy, mind the weather.' },
  { id: 'rigorous', title: 'Rigorous', icon: 'science', color: C.coral, body: 'Lean tanks and stern rationing. Still no combat, but mistakes are felt.' },
];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export class NewGame extends Scene {
  static scene = 'NewGame';
  async enter() {
    const v = this.view; this.bg = makeBackdrop({ seed: 21, hue: 200 }); v.addChild(this.bg);
    const P = new Panel({ w: 1040, h: 600, title: 'COMMISSION A NEW VOYAGE', tone: 'indigo', rivets: true, lights: true, pad: 28 }); P.x = (W - 1040) / 2; P.y = 60; v.addChild(P);
    const c = P.content; this.diff = 'standard';
    const names = S.content.SHIP_NAME_SUGGESTIONS || ['ISV Halcyon']; const caps = S.content.CAPTAIN_NAME_SUGGESTIONS || ['Rhea Okonkwo', 'Ilya Marsh', 'Tove Aldermere', 'Jun Park'];
    // row 1: captain + ship
    const lab = (t, x, y) => { const l = new Label({ text: t, preset: 'label', size: 13, color: C.tealLight, upper: true }); l.x = x; l.y = y; c.addChild(l); };
    lab('Captain', 0, 0); lab('Ship', 520, 0);
    this.capIn = new TextInput({ w: 440, value: pick(caps), placeholder: 'Captain name', maxLength: 24 }); this.capIn.y = 24; c.addChild(this.capIn);
    const dice = new IconButton({ icon: 'star', size: 44, tooltip: 'Suggest a captain name', onClick: () => this.capIn.setValue(pick(caps)) }); dice.x = 452; dice.y = 24; c.addChild(dice);
    this.shipIn = new TextInput({ w: 396, value: names[0], placeholder: 'Ship name', maxLength: 28 }); this.shipIn.x = 520; this.shipIn.y = 24; c.addChild(this.shipIn);
    const sug = new IconButton({ icon: 'ship', size: 44, tooltip: 'Suggest a ship name', hotkey: 'g', onClick: () => this.shipIn.setValue(pick(names)) }); sug.x = 924 - 4; sug.y = 24; c.addChild(sug);
    // difficulty
    lab('Difficulty', 0, 92);
    this.cards = DIFFS.map((d, i) => { const k = new Card({ w: 308, h: 210, title: d.title, body: d.body, icon: d.icon, tone: 'indigo', iconColor: d.color, selected: d.id === this.diff, hotkey: String(i + 1), onClick: () => this.pickDiff(d.id) }); k.x = i * 338; k.y = 118; c.addChild(k); return k; });
    // seed
    lab('Seed (optional)', 0, 350);
    this.seedIn = new TextInput({ w: 260, placeholder: 'random', numeric: true, maxLength: 9 }); this.seedIn.y = 374; c.addChild(this.seedIn);
    const hint = new Label({ text: 'Same seed, same galaxy. Share one with a friend and compare charts.', preset: 'small', size: 14, color: C.textDim, w: 560 }); hint.x = 290; hint.y = 380; c.addChild(hint);
    // legacy note
    let bonus = 0; try { bonus = JSON.parse(localStorage.getItem('halcyon.legacy') || '{}').bonus | 0; } catch (e) { /* */ }
    if (bonus) { const l = new Label({ text: `Legacy bonus from earlier voyages: +${bonus} starting scrip`, preset: 'small', size: 15, color: C.mustard }); l.y = 440; c.addChild(l); }
    // buttons
    const back = new Button({ label: 'Back', w: 160, h: 50, variant: 'brass', onClick: () => this.ui.goto('Title', {}, { kind: 'wipe', dir: 'right' }) }); back.y = 478; c.addChild(back);
    this.go = new Button({ label: 'Launch', icon: 'jump', w: 260, h: 50, variant: 'primary', hotkey: 'Enter', onClick: () => this.start() }); this.go.x = P.innerW - 260; this.go.y = 478; c.addChild(this.go);
    P.alpha = 0; P.y += 20; Anim.to(P, { alpha: 1, y: 60 }, 500);
    this.t = 0;
  }
  pickDiff(id) { this.diff = id; this.cards.forEach((k, i) => k.setSelected(DIFFS[i].id === id)); }
  start() {
    const seed = parseInt(this.seedIn.value, 10) || Math.floor(Math.random() * 1e9);
    this.ui.newGame({ seed, captainName: this.capIn.value.trim() || 'Captain', shipName: this.shipIn.value.trim() || 'ISV Halcyon', difficulty: this.diff });
    this.ui.goto('Intro', {}, { kind: 'iris', ms: 500 });
  }
  onEscape() { this.ui.goto('Title', {}, { kind: 'wipe', dir: 'right' }); }
  update(dt) { this.t += dt; this.bg.update(dt, this.t * 6, 0); }
}
