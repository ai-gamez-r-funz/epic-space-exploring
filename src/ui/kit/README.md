# Halcyon Reach UI kit

Import everything from `src/ui/kit/index.js`. Live gallery of every widget: `/?scene=KitDemo` (source: `src/ui/dev/KitDemo.js`).
All sizes are logical px on the 1280x720 stage. Art/audio come from `S.gfx` / `S.audio` (`import { S, sfx } from '../services.js'`), which
fall back to mocks per-call, so widgets never crash on missing art. **Never** name a field `name`, `label`(as property), `_position`, `_height`
on a Container subclass (Pixi owns them).

## Core concepts
- **Theme** (`theme.js`): `C` colours (ink, indigo, panel, teal, cream, coral, mustard, brass, ...), `F` fonts (body Josefin Sans, head Syncopate, mono Space Mono),
  `TEXT` presets (`body bodyB small tiny label button head headSm title display num numSm mono`), `textStyle(preset, overrides)`, `grad(stops,'v'|'h')`, `lighten/darken/mix`, `W,H`.
  Fonts load in `loadFonts()` before first render (app.js does it).
- **Anim** (`anim.js`): `Anim.to(obj, {x:10}, ms, {ease, delay, onDone, onUpdate}) -> {promise,cancel}`, `Anim.watch(container, (dt,time)=>{})` (auto-stops when destroyed), `Anim.wait(ms)`.
  Eases: linear inQuad outQuad inOutQuad outCubic inCubic inOutCubic outBack outElastic.
- **Input** (`input.js`): `Input.bind(owner, 'c'|['Enter','Space'], fn)` scoped hotkeys — only fire when `owner` is inside the top layer (scene or modal) and visible.
  `Input.drag(pointerEvent.nativeEvent, onMove(dx,dy,totalDx,totalDy), onEnd)` for drags; `Input.clickAllowed()` (taps right after a drag are suppressed). Tab/Shift+Tab focus cycling; Enter/Space activate.
- **Pixi gotcha**: `Graphics.arc()` draws a line from the previous point; use `arcSeg(g,cx,cy,r,a0,a1)` (draw.js).

## Widgets
```js
new Label({ text, preset:'body', size, color, w, h, fit:true, maxLines, align:'left|center|right', upper, bold, mono, shadow, lineHeight })
   .setText(s) .setColor(c) .setOpts({}) .textWidth .textHeight        // w = wrap width; w+h+fit = shrink to fit
new Button({ label, w=140, h=44, variant:'brass|primary|teal|coral|cream|dark|ghost', icon:'jump', hotkey:'c', onClick(btn), disabled, disabledReason,
             tooltip, vertical:false, fontSize, sfx:'click', toggle, selected, upper })
   .setLabel() .setIcon() .setEnabled(bool, reasonShownInTooltip) .setSelected() .setVariant() .setTooltip() .activate()
new IconButton({ icon, size:44, variant, onClick, tooltip, hotkey })
new Panel({ w, h, title:'CREW', tone:'indigo|deep|teal|coral|mustard|cream|plum', lights, rivets, well, pad:14 })   // add children to panel.content; panel.innerW/innerH; panel.resize(w,h)
new Lights({ count, r, gap, colors, pattern:'random|chase|steady', speed })
new Bar({ w, h, value, max, color, icon:'fuel', danger:.25, tooltip, showMax })  .set(value, max?)   // animated; pulses coral below danger
Tooltip.attach(displayObj, content) -> detach;  content = 'Title\nBody' | { title, body, rows:[[label,value,'good|bad|warn']], footer, tone } | () => content ; Tooltip.set(obj, content)
new ScrollPane({ w, h }) -> .content, .refresh() (after content changes), .scrollTo(y, animate), .scrollToChild(c)    // wheel + drag + inertia
new ScrollList({ w, h, itemH, items:[{id,label,sub,right,icon(Container),color,disabled,tooltip}], selected, onSelect(item,i), render(item,i,w,h) }) .setItems() .select(id)
new Tabs({ w, tabs:[{id,label,icon}], selected, onChange(id), cycleKeys }) -> .panes[id] (Container each), .select(id)
new Slider({ w, min, max, step, value, label, format, onChange(v) }) .setValue(v)
Toasts.push(text, { tone:'good|bad|info|warn', icon, ms })     // top-centre stack; ui.toast(text, tone) wraps it
new Modal({ w, h, title, tone, closable:true, dismissOnBackdrop, onClose }) -> .body (content origin), .bodyW/.bodyH, .addButtons([{label,variant,onClick,hotkey,w}], {align}), .open(), .close(result), .closed (Promise)
   Modal.alert(text) / Modal.confirm(text,{yes,no}) -> Promise.   Esc closes; hotkeys of widgets outside the modal are blocked (focus trap).
new ChoiceList({ w, choices:[{label, enabled, reason, odds:0..1, tag:'diplomacy|trade|flee|persuade|science|wait'}], onChoose(index) })   // keys 1-9, arrows+Enter; .setChoices() .setEnabled() .listHeight
new Typewriter({ w, text, preset, size, color, cps:55, tick, onDone }) .skip() .done .finished(Promise) .textHeight   // click to skip
new TextInput({ w, h, value, placeholder, maxLength, numeric, onChange, onSubmit }) .value .setValue()           // hidden DOM <input> backs it
new Card({ w, h, title, body, icon, tone, selected, onClick, hotkey }) .setSelected()
Fader: ui.fader.out({kind:'fade|wipe|iris', dir, ms}) / .in() / .through(fn)
layout: hstack(items,{gap,align,justify,w}) vstack(items,{gap,align,w,h,justify}) grid(items,{cols,cellW,cellH,gapX,gapY}) anchor(obj,{w,h},'tl|tc|tr|ml|c|mr|bl|bc|br',{dx,dy}) centerOn(obj,cx,cy)
```
Items in stacks use `.w/.h` if present, else Pixi width/height.

## Scenes & overlays (how to extend)
- Scene: `class X extends Scene { async enter(params){ this.view.addChild(...) } update(dt){} exit(){ super.exit() } onEscape(){} }`, register in `app.js` SCENES. Use `this.onChanged(fn)` for game updates, `this.ui.goto(name, params, {kind:'fade|wipe|iris'})`.
- Overlay: `class X extends Overlay { title='..'; size={w,h}; build(modal, params){ modal.body.addChild(...); modal.addButtons([...]) } }`, register in `overlays/index.js`; open with `ui.openOverlay('X', params)`. `this.watch(fn)` subscribes to game 'changed' until closed.
  Stubs to flesh out: Trade, Shipyard, CrewScreen, MissionLog, Codex, EndScreen, Help (basic) in `overlays/Stubs.js`; `EventDialog.js` is a functional placeholder.
- The App (`ui`): `ui.game, ui.goto, ui.openOverlay/closeOverlay, ui.openEvent(), ui.toast, ui.sfx, ui.music, ui.saveTo(slot), ui.loadSlot(slot), ui.autosave(), ui.fader, ui.S`.
