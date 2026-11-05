import '@fontsource/josefin-sans/400.css';
import '@fontsource/josefin-sans/600.css';
import { Application, Container, Text, Graphics } from 'pixi.js';
import gfx from './index.js';

const params = new URLSearchParams(location.search);
const only = params.get('s') || 'all';
const W = 1280;
const app = new Application();
await app.init({ width: W, height: 720, background: 0x0b0d1e, preference: 'webgl', antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true });
document.body.appendChild(app.canvas);
gfx.init(app);

const stage = app.stage;
const updaters = [];
const label = (str, x, y, size = 13, col = 0x9aa3c7) => { const t = new Text({ text: str, style: { fontFamily: 'Josefin Sans', fontSize: size, fill: col, letterSpacing: 1 } }); t.position.set(x, y); stage.addChild(t); return t; };
const place = (o, x, y) => { o.position.set(x, y); stage.addChild(o); if (o.update) updaters.push(o); return o; };
let Y = 0;
const sections = {};

sections.planets = () => {
  const types = ['terran', 'ocean', 'desert', 'ice', 'lava', 'gas', 'barren', 'jungle', 'crystal', 'toxic'];
  place(gfx.starfield({ w: W, h: 720, seed: 4 }), 0, Y);
  types.forEach((t, i) => {
    const x = 130 + (i % 5) * 255, y = Y + 140 + Math.floor(i / 5) * 290;
    place(gfx.planet({ type: t, seed: i * 7 + 3, radius: 78, ringed: t === 'gas' || t === 'ice' && false, moons: i % 3, life: i === 0 || i === 7 || i === 2 ? 'civilized' : 'none' }), x, y);
    label(t + (i === 0 || i === 7 || i === 2 ? ' · civilized' : ''), x - 40, y + 112);
  });
  Y += 720;
};
sections.stars = () => {
  place(gfx.starfield({ w: W, h: 420, seed: 9 }), 0, Y);
  const types = ['yellow', 'orange', 'red', 'white', 'blue', 'binary', 'neutron', 'blackhole'];
  types.forEach((t, i) => { const x = 110 + (i % 4) * 315, y = Y + 110 + Math.floor(i / 4) * 210; place(gfx.star({ type: t, radius: t === 'blackhole' ? 34 : t === 'neutron' ? 40 : 34 }), x, y); label(t, x - 24, y + 78); });
  Y += 440;
};
sections.phen = () => {
  place(gfx.starfield({ w: W, h: 520, seed: 12 }), 0, Y);
  const k = ['nebula', 'pulsar', 'ionstorm', 'wormhole', 'asteroids', 'derelict', 'comet', 'rift', 'aurora', 'beacon'];
  k.forEach((n, i) => { const x = 130 + (i % 5) * 255, y = Y + 120 + Math.floor(i / 5) * 250; place(gfx.phenomenon(n, { size: 150 }), x, y); label(n, x - 30, y + 90); });
  Y += 540;
};
sections.ships = () => {
  place(gfx.starfield({ w: W, h: 560, seed: 21 }), 0, Y);
  const k = ['halcyon', 'quillari', 'vesperine', 'archivist', 'drifter', 'concord', 'probe', 'tender'];
  k.forEach((n, i) => { const x = 160 + (i % 4) * 320, y = Y + 130 + Math.floor(i / 4) * 230; place(gfx.ship({ kind: n, scale: n === 'halcyon' ? 1.45 : 1.3, thrust: 0.7 }), x + (n === 'halcyon' ? 30 : 0), y + (n === 'halcyon' ? 20 : 0)); label(n, x - 30, y + 80); });
  Y += 560;
};
sections.portraits = () => {
  const bg = new Graphics().rect(0, Y, W, 600).fill(0x1b2140); stage.addChild(bg);
  const sp = ['human', 'quillari', 'vesperine', 'archivist', 'drifter', 'robot', 'unknown'];
  sp.forEach((s, i) => { place(gfx.portrait({ species: s, seed: 3, size: 160 }), 40 + i * 175, Y + 30); label(s, 40 + i * 175, Y + 196); });
  const moods = ['happy', 'worried', 'angry', 'sad', 'calm', 'excited', 'curious'];
  moods.forEach((m, i) => { place(gfx.portrait({ species: i % 2 ? 'quillari' : 'human', seed: 10 + i, size: 160, mood: m }), 40 + i * 175, Y + 230); label(m, 40 + i * 175, Y + 396); });
  for (let i = 0; i < 7; i++) place(gfx.portrait({ species: 'human', seed: 40 + i * 5, size: 110 }), 40 + i * 175, Y + 430);
  Y += 560;
};
sections.scenes = () => {
  const kinds = ['nebula', 'starfield', 'planet', 'derelict', 'station', 'ship_alien', 'pulsar', 'ionstorm', 'wormhole', 'asteroids', 'comet', 'rift', 'aurora', 'beacon', 'bridge', 'landing', 'ruins', 'market', 'lounge', 'engine_room', 'sickbay', 'void'];
  const sp = ['quillari', undefined, 'human', undefined, 'drifter', 'vesperine', undefined, undefined, undefined, undefined, 'archivist'];
  const cw = 410, ch = 220;
  kinds.forEach((k, i) => { const x = 14 + (i % 3) * (cw + 14), y = Y + 14 + Math.floor(i / 3) * (ch + 28); place(gfx.sceneArt({ scene: k, species: sp[i % sp.length] && (['bridge', 'lounge', 'ship_alien', 'market', 'comet', 'station'].includes(k)) ? sp[i % sp.length] || 'human' : undefined, seed: i + 1 }, cw, ch), x, y); label(k, x + 4, y + ch + 2, 11); });
  Y += Math.ceil(kinds.length / 3) * (ch + 28) + 20;
};
sections.icons = () => {
  const bg = new Graphics().rect(0, Y, W, 560).fill(0x1b2140); stage.addChild(bg);
  const names = gfx.iconNames;
  names.forEach((n, i) => { const x = 40 + (i % 12) * 100, y = Y + 30 + Math.floor(i / 12) * 90; place(gfx.icon(n, { size: 40, color: i % 3 === 0 ? gfx.palette.cream : i % 3 === 1 ? gfx.palette.teal : gfx.palette.brass }), x, y); label(n, x - 4, y + 48, 10); });
  const cats = ['food', 'tech', 'luxury', 'medical', 'material', 'curio', 'fuel'];
  let yy = Y + 280;
  cats.forEach((c, i) => { for (let j = 0; j < 3; j++) place(gfx.goodIcon('g' + i + j, c, 48), 40 + i * 70 + (j === 0 ? 0 : 0), yy + j * 56); });
  ['concord', 'quillari', 'vesperine', 'archivists', 'drifters', 'none'].forEach((f, i) => { place(gfx.factionEmblem(f, 72), 640 + i * 90, yy); label(f, 640 + i * 90, yy + 76, 10); });
  const pb = gfx.panelBg(300, 140, { tone: 'panel' }); place(pb, 640, yy + 110); place(gfx.panelBg(180, 90, { tone: 'brass' }), 960, yy + 110); place(gfx.panelBg(120, 90, { tone: 'teal' }), 1160 - 20, yy + 110);
  Y += 560;
};

const order = only === 'all' ? ['planets', 'stars', 'phen', 'ships', 'portraits', 'scenes', 'icons'] : [only];
for (const k of order) sections[k]?.();
app.renderer.resize(W, Math.max(720, Y));
app.ticker.add((tk) => { const dt = Math.min(0.05, tk.deltaMS / 1000); for (const u of updaters) u.update(dt); });
window.READY = true;
window.addEventListener('error', (e) => console.log('ERR', e.message));
