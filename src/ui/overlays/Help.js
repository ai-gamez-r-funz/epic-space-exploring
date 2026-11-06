import { Container, Graphics } from 'pixi.js';
import { Overlay } from './Overlay.js';
import { C } from '../kit/theme.js';
import { Label } from '../kit/Label.js';
import { Button } from '../kit/Button.js';
import { Tabs } from '../kit/Tabs.js';
import { ScrollPane } from '../kit/Scroll.js';
import { S } from '../services.js';
import { heading, switchW, addText } from './parts2/common.js';
import { Tutorial } from './parts2/prefs.js';

const HOW = [
  ['star', 'Chart the Reach', 'Open the Chart (C). Systems you have visited and fully scanned become charted; that is your survey progress. Lanes in teal are within jump range.'],
  ['fuel', 'Mind your fuel', 'Every jump spends fuel and a day. Refuel at stations. If you ever run dry the Society will tow you home, but it costs scrip and pride.'],
  ['scan', 'Orbit, scan, land', 'Click a planet on the viewscreen, enter Orbit (O), then Scan (S). Scanned planets can host a Landing party (L): risky, rewarding.'],
  ['hail', 'Talk to people', 'Hail (H) the locals, or dock at a station. Every faction has its own manners; reputation opens doors, missions and prices.'],
  ['credits', 'Trade and repair', 'Docked at a market (D then T) you can trade goods, repair the hull, refuel and restock. Buy low where it is plentiful, sell where it is wanted.'],
  ['crew', 'Look after the crew', 'Skills decide your odds in events, and a cheerful crew is a capable one. Chat with them (R), rest a day (Z), and hire specialists where you find them.'],
  ['mission', 'Take on missions', 'Mission boards hang in stations. Objectives tick off as you travel, scan and deliver. The Journal (J) tracks them, the Codex (K) fills as you discover things.'],
  ['morale', 'No combat, ever', 'Trouble is solved with diplomacy, trade, science, clever flying or running away. Gentle failures cost a little; nothing is the end of the voyage but your own decision.'],
];
const KEYS = [['C', 'Chart (galaxy map)'], ['O', 'Enter / leave orbit'], ['S', 'Scan planet or system'], ['L', 'Landing party'], ['I', 'Investigate phenomenon'], ['H', 'Hail'], ['D', 'Dock / undock'], ['T', 'Trade & services (docked)'], ['U', 'Ship & upgrades'],
  ['R', 'Crew'], ['J', 'Journal: missions & log'], ['K', 'Codex'], ['Z', 'Rest one day'], ['1-9', 'Choose in dialogs'], ['Tab', 'Move keyboard focus'], ['Enter', 'Activate / confirm'], ['Q / E', 'Previous / next tab'], ['Esc', 'Back / pause menu'], ['F1 or ?', 'This help'],
  ['Map: arrows, + -', 'Pan and zoom the Chart'], ['Map: F / Home', 'Centre on your ship']];

/** Help — how to play, hotkey sheet, tips, and the tutorial-hints switch. */
export class Help extends Overlay {
  title = 'HELP & HOTKEYS'; size = { w: 1000, h: 640 };
  build(modal) {
    const bw = modal.bodyW; const ph = modal.bodyH - 42 - 56;
    this.tabs = new Tabs({ w: bw, cycleKeys: true, tabW: 190, tabs: [{ id: 'how', label: 'How to play', icon: 'star' }, { id: 'keys', label: 'Hotkeys', icon: 'settings' }, { id: 'tips', label: 'Tips', icon: 'log' }], onChange: () => this.ui.sfx('page') });
    modal.body.addChild(this.tabs);
    // how
    const hp = new ScrollPane({ w: bw, h: ph }); this.tabs.panes.how.addChild(hp); let y = 0;
    const goal = new Label({ text: 'Goal: chart the Lantern Reach, help whoever you meet, and learn who lit the Lanterns.', preset: 'bodyB', size: 18, color: C.mustard, w: bw - 20 }); hp.content.addChild(goal); y += goal.textHeight + 14;
    HOW.forEach(([ic, t, d]) => {
      const row = new Container(); row.y = y; hp.content.addChild(row);
      const l = new Label({ text: d, preset: 'small', size: 15, color: C.cream, w: bw - 110, lineHeight: 20 });
      const h = Math.max(58, l.textHeight + 34);
      row.addChild(new Graphics().roundRect(0, 0, bw - 16, h, 10).fill({ color: 0x0b0d1e, alpha: 0.4 }));
      const i = S.gfx.icon(ic, { size: 30, color: C.tealLight }); i.x = 16; i.y = 14; row.addChild(i);
      const tl = new Label({ text: t, preset: 'bodyB', size: 17, color: C.brassLight }); tl.x = 66; tl.y = 8; row.addChild(tl);
      l.x = 66; l.y = 30; row.addChild(l); y += h + 8;
    });
    hp.refresh();
    // keys
    const kp = new ScrollPane({ w: bw, h: ph }); this.tabs.panes.keys.addChild(kp);
    KEYS.forEach(([k, d], i) => {
      const col = i % 2, row = Math.floor(i / 2); const x = col * (bw / 2), yy = row * 40;
      const kb = new Container(); const kl = new Label({ text: k, preset: 'num', size: 14, color: C.mustard }); const kw = Math.max(54, kl.textWidth + 20);
      kb.addChild(new Graphics().roundRect(0, 0, kw, 30, 7).fill({ color: 0x0b0d1e }).roundRect(0, 0, kw, 30, 7).stroke({ width: 1.5, color: C.brassDark })); kl.x = (kw - kl.textWidth) / 2; kl.y = 5; kb.addChild(kl); kb.x = x; kb.y = yy; kp.content.addChild(kb);
      const dl = new Label({ text: d, preset: 'small', size: 16, color: C.cream, w: bw / 2 - kw - 40, fit: true, h: 22 }); dl.x = x + 150; dl.y = yy + 4; kp.content.addChild(dl);
    });
    kp.refresh();
    // tips
    const tp = new ScrollPane({ w: bw, h: ph }); this.tabs.panes.tips.addChild(tp); let ty = 0;
    for (const t of (S.content.TIPS || ['Hover anything for a tooltip.'])) { ty = addText(tp.content, ty, '•  ' + t, { w: bw - 30, size: 16, color: C.cream, gap: 10, lineHeight: 22 }); }
    tp.refresh();
    // footer: tutorial hints switch
    const lab = new Label({ text: 'Tutorial hints', preset: 'label', size: 14, color: C.cream, upper: true }); lab.x = 0; lab.y = modal.bodyH - 34; modal.body.addChild(lab);
    this.sw = switchW(Tutorial.state.enabled && !Tutorial.state.done, (on) => { if (on) Tutorial.reset(); else Tutorial.setEnabled(false); this.ui.toast(on ? 'Tutorial hints on: look for the pulsing ring.' : 'Tutorial hints off.', 'info'); });
    this.sw.x = 150; this.sw.y = modal.bodyH - 38; modal.body.addChild(this.sw);
    modal.addButtons([{ label: 'Got it', onClick: () => modal.close(), hotkey: 'Enter', variant: 'primary', w: 140 }]);
    void heading;
  }
}
