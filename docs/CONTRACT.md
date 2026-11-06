# HALCYON REACH — Architecture & Module Contract

A cozy, no-combat, Star-Trek-TOS-flavoured (optimistic, retrofuturist, gently anachronistic) space
exploration game. You captain the survey ship **ISV Halcyon** for the **Meridian Society for Open Skies**
(an interstellar NGO: cartographers, relief workers, translators). A new galactic segment — **the Lantern
Reach** — has just opened (a stable wormhole "Gate" was found). Map it, help whoever you meet, make a
living, and learn who lit the Lanterns.

Tone: warm, wry, hopeful. Brass-and-teal-and-cream palette, rounded panels, blinky console lights, 1960s
"future" optimism (slide rules next to warp coils; tea in the observation lounge; felt-tip star charts).
Nobody is a villain; trouble comes from misunderstanding, scarcity, weather, and pride. **No combat, ever.**
Tension is resolved with: diplomacy, trade, persuasion, bluff, science, clever flight, or running away.

Stack: **PixiJS v8** (all game rendering AND UI is drawn in Pixi — no DOM UI except the boot text),
plain ES modules (JS, no TypeScript), Vite. Logical canvas is **1280×720**, letterbox-scaled to fit the window.
`src/core` and `src/content` must be pure JS (no DOM, no Pixi) and runnable under plain `node`.

## Directory ownership (agents edit ONLY their own dirs)

| Dir | Owner | Notes |
|---|---|---|
| `src/core/**`, `tests/**`, `tools/sim.mjs` | ENGINE | rules, galaxy gen, event runner, saves |
| `src/content/events/**` | EVENTS | encounter/event data |
| `src/content/{factions,goods,upgrades,crew,missions,story,codex,names}.js` | WORLD | static data |
| `src/gfx/**` | GFX | procedural art (Pixi) |
| `src/audio/**` | AUDIO | WebAudio synth sfx + generative music |
| `src/ui/**`, `src/main.js`, `index.html` | UI | scenes, widgets, input |
| `docs/**`, `package.json`, `vite.config.js` | ORCHESTRATOR | |

If you need a change in someone else's area, write it in `docs/REQUESTS.md` (append, with your role name).

## 1. Shared vocabulary (closed lists — everyone uses exactly these ids)

- **Skills** (5): `science`, `engineering`, `medicine`, `diplomacy`, `piloting`.
- **Factions** (5 + none): `concord` (Terran-descended Concord of Lyra — earnest bureaucrats, optimists),
  `quillari` (feathered free-trader clans — haggling, hospitality, gossip), `vesperine` (crystalline choral
  beings — communicate in harmonics, hate loud noises), `archivists` (ancient machine librarians of the
  Hollow Archive — polite, literal, hoarding questions), `drifters` (nomad habitat-fleets — craftspeople,
  storytellers, wary of "chartered" people). Neutral = `none`.
- **Species/portrait keys**: `human`, `quillari`, `vesperine`, `archivist`, `drifter`, `robot` (ship's
  maintenance bot), `unknown` (silhouette / mysterious signal).
- **Planet types**: `terran`, `ocean`, `desert`, `ice`, `lava`, `gas`, `barren`, `jungle`, `crystal`, `toxic`.
  Optional flag `ringed` (boolean) and `moons` (0-3).
- **Star types**: `yellow`, `orange`, `red`, `white`, `blue`, `binary`, `neutron`, `blackhole`.
- **Phenomena**: `nebula`, `pulsar`, `ionstorm`, `wormhole`, `asteroids`, `derelict`, `comet`, `rift`
  (a "singing" spacetime fold), `aurora` (spacefaring aurora-life), `beacon` (a Lantern — the mystery).
- **Station kinds**: `trade` (market + missions), `outpost` (repairs/fuel, small), `shipyard`
  (upgrades), `embassy` (faction diplomacy/missions), `archive`, `habitat` (drifter fleet).
- **Resources on ship**: `fuel`, `supplies`, `hull`, `morale` (0-100), `credits` (int, "scrip"), cargo, items.
- **Scene art kinds** (for event illustration, `art.scene`): `nebula`, `starfield`, `planet`, `derelict`,
  `station`, `ship_alien`, `pulsar`, `ionstorm`, `wormhole`, `asteroids`, `comet`, `rift`, `aurora`, `beacon`,
  `bridge`, `landing`, `ruins`, `market`, `lounge`, `engine_room`, `sickbay`, `void`.
- **Day/clock**: integer `state.day` (day 1 start). "Stardate" shown as `2461.{day}`-ish by UI.

## 2. State (plain JSON, fully serializable — `JSON.stringify(game.state)` is the save file)

```js
state = {
  v: 1, seed: 12345, day: 1, phase: 'play' | 'ended',
  captain: { name }, difficulty: 'cozy'|'standard'|'rigorous',
  ship: { name, hull, hullMax, fuel, fuelMax, supplies, suppliesMax, morale, cargoMax }, // *Max are DERIVED each change from upgrades; stored for convenience
  credits: 300,
  cargo: { [goodId]: qty }, items: { [itemId]: qty },     // items = key items/artifacts/gifts
  upgrades: [upgradeId, ...],                              // installed
  crew: [ { id, name, role: skillId /*specialty*/, species, skills:{science:0..5,...}, trait, mood:0..100, level, xp, bio, portrait:{species,seed} } ],
  rep: { concord:0, quillari:0, vesperine:0, archivists:0, drifters:0 },   // -100..100
  flags: { [name]: true|number|string }, counters: {},
  galaxy: { systems: [System], lanes: [[idA,idB],...], w: 2400, h: 1500, gate: systemId },
  pos: systemId, orbit: null | planetId,                   // where the ship is
  missions: { active: [MissionInstance], done: [ids], failed: [ids] },
  codex: [codexId], log: [ { day, kind: 'nav'|'event'|'trade'|'mission'|'crew'|'discovery'|'ship', text } ],
  markets: { [systemId]: { prices: {goodId: n}, stock: {goodId: n}, updatedDay } },  // lazily created
  pending: null | EventCursor,                              // active event; UI must resolve before continuing
  stats: { jumps, planetsScanned, systemsCharted, creditsEarned, eventsSeen, missionsDone, ... },
  ending: null | { id, title, text, score }
}
System = {
  id, name, x, y,                       // map coords within galaxy.w/h
  star: starType, region: 'gate'|'shoals'|'veil'|'choir'|'archive'|'rim' ..., faction: factionId|'none',
  status: 'unknown' | 'detected' | 'visited' | 'charted',  // fog of war; 'detected' = shown on map w/o detail
  planets: [ { id, name, type, size: 0.5..2, ringed, moons, life: 'none'|'microbial'|'flora'|'fauna'|'civilized',
               features: [ 'ruins','ore','hot_springs','aurora_fields','ancient_signal', ... ],
               scanned: false, landed: false } ],
  phenomena: [ phenomenonId ],
  station: null | { name, kind, faction, services: ['trade','repair','missions','shipyard','crew','diplomacy'] },
  story: null | string,                 // story hook id (content/story.js)
  danger: 0..3,                         // weather/hazard level — drives event weights and travel damage; NEVER combat
  visits: 0
}
```

## 3. ENGINE API (`src/core/game.js`) — the ONLY thing UI talks to for game logic

```js
import { Game } from './core/game.js';
const g = Game.create({ seed, captainName, shipName, difficulty });   // new game
const g = Game.load(jsonString);   g.save() -> jsonString
Game.hasSave() / Game.writeSave(g) / Game.readSave() / Game.deleteSave()   // localStorage, try/catch safe, 3 slots: 'auto','1','2' via optional arg

g.state                    // see above (treat as read-only from UI)
g.on(type, fn) -> off()    // types below
```

**Notifications** (`g.on`): `'changed'` (any state change; UI re-renders HUD), `'log'` (log entry),
`'toast' {text, tone:'good'|'bad'|'info'}`, `'sfx' {name}` (AUDIO sfx name request: see §6),
`'event'` (a pending event started/advanced — UI opens/updates event dialog),
`'arrive' {systemId}`, `'ended' {ending}`, `'discovery' {kind,text,id}` (codex/new-planet fanfare).

**Queries** (pure):
- `g.system(id)`, `g.here()` (current System), `g.planet(sysId, planetId)`
- `g.neighbors(id)` -> `[{id, dist, fuelCost, days, known:boolean}]` (lanes; unknown systems listed only if status != 'unknown')
- `g.canJump(toId)` -> `{ok, reason?, fuelCost, days}`
- `g.surveyProgress()` -> `{ charted, total, pct, planetsScanned, planetsTotal, score }`  (win when pct ≥ 100 of `charted`; "Cartographer's Medal" ending can fire earlier at ≥75%)
- `g.skillTotal(skill)` -> number (crew best + upgrade bonuses); `g.checkOdds(skill, diff)` -> 0..1 (UI displays %)
- `g.evalConds(conds)` -> `{ok, reason?}` (conds format §5)
- `g.shipStats()` -> derived: `{ fuelMax, suppliesMax, hullMax, cargoMax, scanRange, jumpRange, efficiency, slots:{used,total}, bonuses:{skill:n} }`
- `g.market(sysId)` -> `{ goods: [{id, name, buy, sell, stock, trend:-1|0|1, held}], station }`  (null if no trade service)
- `g.shipyard(sysId)` -> `[{ id, name, cost, available:boolean, reason?, owned:boolean }]`
- `g.missionBoard(sysId)` -> list of offers `[{ id, title, giver, faction, blurb, reward, ... }]`
- `g.activeMissions()` -> instances with `{ id, title, objectives:[{text, done}], reward, deadlineDay? }`
- `g.cargoUsed()`, `g.crewList()`, `g.codexEntries()` -> content entries with `known` flag

**Actions** (each returns `{ok:boolean, reason?:string, ...}` and emits notifications; all refuse while `state.pending`
is set, except `resolveChoice`):
- `g.jump(toId)` — spends fuel/supplies/days, may trigger a *travel event* (sets `pending`) then arrival; arrival
  marks system `visited`, reveals neighbours as `detected` (radius from sensors), may trigger *arrival event*.
- `g.enterOrbit(planetId)` / `g.leaveOrbit()`
- `g.scanPlanet(planetId)` — costs 1 day + small supplies; reveals life/features; may fire a *planet event*;
  charting a system = all planets scanned (or system has none) AND visited. `g.scanSystem()` convenience.
- `g.landingParty(planetId)` — risky/rewarding contextual event from planet features (needs scanned).
- `g.investigate(phenomenon)` — contextual science event for a phenomenon here.
- `g.hail()` — contextual diplomacy event for faction/station here (may be none → polite nothing).
- `g.dock()`, `g.undock()` — only if station. Docked state: `state.docked=true`.
- `g.buy(goodId, qty)`, `g.sell(goodId, qty)`; `g.buyUpgrade(id)`; `g.sellUpgrade(id)` (50 %)
- `g.repair(amount|'max')`, `g.refuel(amount|'max')`, `g.restock(amount|'max')` (docked, priced, rep-discounted)
- `g.acceptMission(offerId)`, `g.abandonMission(id)`
- `g.hireCrew(templateId)` (docked at station with 'crew'), `g.dismissCrew(id)`, `g.crewTalk(id)` (small mood/flavor event)
- `g.rest(days)` — wait; heals morale a bit, uses supplies
- `g.resolveChoice(index)` — advance the pending event (§4). After final node, `pending` becomes null and `'changed'` fires.
- `g.pendingView()` -> render-ready current event node: `{ title, text /*templated*/, art, speaker:{name,species}|null, choices:[{index,label,enabled,reason?,odds?:number,tag?:'diplomacy'|'trade'|'flee'|'persuade'|'science'|'wait'}], resultText?, isResult:boolean, continueOnly:boolean }`
- `g.emergency()` — stranded rescue (tow by Meridian tender): auto-offered by engine as a *pending event* when
  fuel < cheapest jump and credits can't fix it; costs credits/rep/days but NEVER soft-locks.

**Loss conditions are gentle**: hull ≤ 0 → ship "disabled", towed home: `ending 'recalled'` with score. Morale ≤ 0 → crew
petition for leave: `ending 'resignation'`. Supplies 0 → emergency ration event first, then morale collapse. Win:
survey 100% → `'cartographer'`, or main-story endings (`'lantern_*'`), see `content/story.js`. All endings show a score
and unlock "legacy bonus" (+credits start, saved in `localStorage` under `halcyon.legacy`).

## 4. Events (data format — `src/content/events/*.js`, each file `export default [ ...events ]`)

`src/content/events/index.js` (EVENTS owns) re-exports `export const EVENTS = [...]` merged, id-unique.

```js
{
  id: 'quillari_toll_buoy',              // unique, snake_case
  title: 'The Toll Buoy',
  tags: ['trade','diplomacy'],           // any of: diplomacy, trade, flee, persuade, science, mystery, comedy, relief, wonder, hazard
  ctx: 'travel' | 'arrive' | 'planet' | 'landing' | 'phenomenon' | 'hail' | 'station' | 'crew' | 'idle',
  weight: 10,                            // relative frequency within ctx
  when: [ cond, ... ],                   // eligibility (see §5). Also: {system:{...}}, {planetType:'ice'}, {phenomenon:'pulsar'}, {feature:'ruins'}
  once: true,                            // fire at most once per game (default false)
  cooldown: 12,                          // days before it can repeat
  art: { scene:'derelict', species:'quillari', palette:'warm' },  // scene = one of Scene art kinds, species = portrait key; both optional
  start: 'a',
  nodes: {
    a: {
      speaker: { name: 'Toll-Keeper Wrenna', species:'quillari' },   // optional
      text: 'A buoy hums "{captain}, welcome to {system}..."',       // templates: {captain} {ship} {system} {planet} {faction} {crew:science} (name of best crew in skill) {crew:random}
      choices: [
        { label: 'Pay the toll (20 scrip)', tag:'trade', if:[{credits:20}], do:{ text:'...', fx:[{credits:-20},{rep:{quillari:2}}] } },
        { label: 'Haggle in the old style', tag:'persuade', check:{ skill:'diplomacy', diff:3 },
          pass:{ text:'...', fx:[{credits:-5},{rep:{quillari:3}}] },
          fail:{ text:'...', fx:[{credits:-30}], goto:'b' } },                 // goto continues in another node after showing text
        { label: 'Slip past on a low-power arc', tag:'flee', check:{ skill:'piloting', diff:4 },
          pass:{ text:'...', fx:[{fuel:-1}] }, fail:{ text:'...', fx:[{hull:-6},{fuel:-2}] } },
        { label: 'Offer star-charts instead', if:[{item:'sector_charts'}], do:{ ..., fx:[{item:{sector_charts:-1}},{rep:{quillari:5}}] } },
        { label: 'Roll the dice', rand:[ [3,{text:'..',fx:[..]}], [1,{text:'..',fx:[..]}] ] },
      ]
    },
    b: { text:'...', choices:[ ... ] }
  }
}
```
Step = `{ text?, fx?:[Effect], goto?: nodeId }`. If a step has no `goto`, the event ends after the player presses
Continue on its result text. Every choice must resolve to some step. A node's `choices` may be omitted only if `auto`
(`{text, fx, goto?}` auto-advance with Continue button).
`check.diff` is on a 0-8 scale: odds = clamp(0.1, 0.95, 0.5 + 0.11*(skillTotal - diff)); failure should be *interesting*
(costs a little, opens a new node, or gives a consolation), almost never catastrophic.
Choices requiring `if` that fail are shown disabled with a reason (so players see what they could unlock).
Every event must offer at least one always-available choice. Aim for variety of *resolution style* across events.

**Effects** (`fx` array items; combine keys freely in one object or separate objects):
`{fuel:n}` `{supplies:n}` `{hull:n}` `{morale:n}` `{credits:n}` `{days:n}` `{rep:{faction:n}}` `{cargo:{goodId:n}}`
`{item:{itemId:n}}` `{flag:'name'}` / `{flag:{name:value}}` `{clearFlag:'name'}` `{counter:{name:n}}`
`{xp:{skillId:n}}` (best crew in that skill) `{mood:{crewId|'all'|'random':n}}` `{recruit:'crewTemplateId'}`
`{mission:'missionId'}` (start) `{missionProgress:{id:'missionId', obj:'objId'}}` `{codex:'codexId'}`
`{reveal:{radius:n}|'nearest'|systemId}` `{chart:true}` (mark current system charted)
`{upgrade:'upgradeId'}` (free install) `{teleport:systemId|'random'}` `{shop:true}` (opens market UI after event; only if station)
`{toast:'text', tone}` `{log:'text'}` `{sfx:'name'}` `{ending:'endingId'}` `{startEvent:'eventId'}` (chain into another event)
`{fuelPct:n}` etc. are NOT supported; use absolute numbers. Effects clamp resources to [0,max].

## 5. Conditions (`when`, `if`)

Array = AND. Each object has one key (or several = AND): `{credits:n}` min; `{fuel:n}`, `{supplies:n}`, `{hull:n}`,
`{morale:n}` min; `{item:'id'}` or `{item:{id:n}}`; `{cargo:{goodId:n}}`; `{flag:'name'}` / `{notFlag:'name'}` /
`{flagEq:{name:value}}`; `{rep:{faction:min}}` (negative allowed = max); `{upgrade:'id'}`; `{skill:{science:3}}` (total ≥);
`{crewRole:'medicine'}` (any crew with specialty); `{crew:'templateId'}`; `{day:[min,max]}`; `{mission:'id'}` active,
`{missionDone:'id'}`; `{codex:'id'}`; `{survey:pct}` min; `{system:{faction:'quillari', star:'red', region:'veil', hasStation:true, danger:2 /*min*/}}`;
`{planetType:'ice'}`, `{feature:'ruins'}`, `{phenomenon:'pulsar'}` (current location context); `{random:0.3}` (probability gate); `{not:cond}`; `{any:[cond,...]}`.

## 6. Content modules (WORLD)

All export plain data; documented in each file header. Required exports:

- `content/factions.js`: `FACTIONS = { id: { id, name, adjective, species, colour:0xRRGGBB, blurb, greeting, homeRegion, likes:[...goodIds], dislikes:[...] } }`
- `content/goods.js`: `GOODS = [ { id, name, category:'food'|'tech'|'luxury'|'medical'|'material'|'curio'|'fuel', base:price, volatility:0..1, desc, bulk:1 } ]` (≥14 goods, faction-themed: Quillari glass-fruit brandy, Vesperine tuning crystals, Archive vellum-sheets, Drifter hand-looms, Concord ration-bars, etc.), and `ECONOMY_BIAS = { stationKind|faction: { goodId: multiplier } }`.
- `content/upgrades.js`: `UPGRADES = [ { id, name, slot:'engine'|'sensors'|'hull'|'cargo'|'comms'|'lab'|'lounge'|'special', tier:1..3, cost, requires:[upgradeId], repGate?:{faction,min}, desc, flavor, bonus:{ fuelMax, suppliesMax, hullMax, cargoMax, scanRange, jumpRange, efficiency /*fuel cost mult, <1 better*/, skills:{science:1,...}, moraleRegen, repairPerDay, priceSell /*sell bonus*/, buyDiscount, slots? }, special?:'id' } ]`, ≥28 upgrades, plus `SLOT_COUNT` ship has 8 slots total (one per slot kind; higher tier replaces lower—upgrading in-place). Some are rep-gated or mission-reward-only (`cost: 0, reward:true`).
- `content/crew.js`: `CREW_START` (4 starting officers templates incl. chief engineer, science officer, medic, comms/diplomat; captain is player) and `CREW_POOL` (≥14 hireable templates, various species & traits, each w/ `id,name,species,role,skills,trait,bio,hireCost,minRep?:{faction,n}`), `TRAITS = { id:{name,desc,effect} }`.
- `content/missions.js`: `MISSIONS = [ { id, title, giver:{name,species,faction}, kind:'delivery'|'survey'|'investigate'|'ferry'|'relief'|'diplomacy'|'fetch'|'story', blurb, accept:'text', offerWhen:[conds], stationKinds?:[...], objectives:[ { id, text, type:'goto'|'have'|'scan'|'chart'|'flag'|'event', target... } ], reward:{credits,rep:{},item:{},upgrade?,codex?}, deadlineDays?, onComplete:[fx], failFx:[fx], repeatable? } ]`; ≥28 missions incl. procedural-friendly templates `TEMPLATES` for generated deliveries/surveys (engine fills systems/goods), plus story missions chained.
- `content/story.js`: main arc "Who Lit the Lanterns" in 5 chapters with beacon systems placed by generator (`STORY_SYSTEMS`: id, region, name, preferred star/phenomena, hook text), chapter gating flags, `ENDINGS = { id: { id, title, text, scoreBonus, conditions } }` (≥6 endings: cartographer, lantern_keeper (diplomatic), lantern_friend, lantern_silent, recalled, resignation, plus 1-2 special), `INTRO_TEXT[]` (crawl, ≤5 short paras), `TIPS[]`.
- `content/codex.js`: `CODEX = [ { id, title, category:'species'|'place'|'phenomenon'|'history'|'tech', text, unlockedBy? } ]` (≥40 entries; text 1-3 sentences).
- `content/names.js`: name generators data: `SYSTEM_NAME_PARTS`, `PLANET_SUFFIXES`, `STATION_NAMES`, `CREW_NAME_POOLS` per species, `SHIP_NAME_SUGGESTIONS`.
- Regions: `gate` (start, safe), `shoals` (Concord-ish/trade), `veil` (nebula, Vesperine), `choir` (pulsars/rifts), `archive` (Hollow Archive), `rim` (drifters, deep mystery). Defined in `content/story.js` as `REGIONS`.

## 7. GFX API (`src/gfx/index.js`) — procedural Pixi art, no external image files

All factories return `PIXI.Container`s (or Textures) and animate via an `update(dt)` method attached to the returned
container (`dt` = seconds). The GFX module initialises with `gfx.init(app)` (needs the renderer for RenderTexture bakes).

```js
gfx.init(app)
gfx.palette  // shared colour tokens: { ink, deepSpace, teal, brass, cream, coral, mustard, sage, plum, panel, panelLight, text, textDim, good, bad, warn }
gfx.starfield({ w, h, seed, density, parallax }) -> Container (update(dt, camX?, camY?))
gfx.nebula({ w, h, seed, hue }) -> Container
gfx.planet({ type, seed, radius, ringed, moons, life }) -> Container  // sphere-shaded, slow rotation + atmosphere + city lights if 'civilized'; origin at centre
gfx.star({ type, radius }) -> Container                  // pulsing glow; binary draws two
gfx.phenomenon(kind, { size }) -> Container             // animated icon/sprite for system view & map markers
gfx.ship({ kind:'halcyon'|'quillari'|'vesperine'|'archivist'|'drifter'|'concord'|'probe'|'tender', scale, thrust? }) -> Container (nose points RIGHT)
gfx.portrait({ species, seed, size, mood? }) -> Container // framed bust; procedural features per species; subtle idle animation
gfx.sceneArt(spec /* event.art */, w, h) -> Container    // viewscreen illustration for event dialogs
gfx.icon(name, { size, color }) -> Container             // ui icons: fuel, supplies, hull, morale, credits, cargo, science, engineering, medicine, diplomacy, piloting, star, planet, station, mission, log, codex, crew, ship, jump, scan, hail, land, dock, warning, check, lock, arrow, close, settings, sound, mute
gfx.goodIcon(goodId, category, size) -> Container
gfx.factionEmblem(factionId, size) -> Container
gfx.sparkle(container, n) / gfx.burst(x,y,color) -> particle helpers (optional)
gfx.vignette(w,h), gfx.scanlines(w,h,alpha), gfx.panelBg(w,h,{tone}) -> decorative
```

## 8. AUDIO API (`src/audio/index.js`) — WebAudio only, no files

```js
audio.init()            // call on first user gesture (creates AudioContext; safe to call repeatedly)
audio.sfx(name, {pitch?, vol?})   // names: click, hover, confirm, deny, jump, arrive, scan, ping, coin, powerup, alert,
                                   // hail, dock, undock, repair, discovery, fanfare, success, fail, door, page, thud, hum
audio.music(mood)       // 'title'|'bridge'|'map'|'system'|'event'|'wonder'|'tense'|'station'|'ending'  -- generative, calm, mellow, TOS-ish: warm pads, vibraphone/marimba plinks, little bass walk; crossfades
audio.setVolume({master,music,sfx}), audio.getVolume(), audio.mute(bool), audio.isMuted()
```
Persist volume in `localStorage('halcyon.audio')` (try/catch).

## 9. UI (`src/ui/**`)

Scene manager (`src/ui/app.js`): one Pixi `Application`, root `stage` scaled to fit 1280×720; scenes are classes with
`enter(params)`, `exit()`, `update(dt)`, `resize()`, container `view`. Overlays (event dialog, trade, shipyard, crew, log, codex,
missions, settings, pause) are modal layers over the main flow. Scenes: `Title`, `NewGame`, `Bridge` (the hub: viewscreen
of current system + HUD + command buttons: Chart, Orbit/Scan, Land, Hail, Dock, Ship, Crew, Log), `GalaxyMap` (pan/zoom, click to
plan jump, shows fuel cost/days, fog-of-war, lanes, faction tints, mission markers), `SystemView` (orbit diagram with
planets/phenomena/station, click to select), `EventDialog`, `Trade`, `Shipyard`, `CrewScreen`, `MissionLog`, `Codex`, `EndScreen`,
`Settings`. Keyboard shortcuts for everything; mouse+touch friendly; hover tooltips; tutorial hints for first-time play.
Persistent HUD: fuel/supplies/hull/morale bars, credits, day/stardate, survey %.
Autosave on arrival/dock/event end (slot 'auto'); manual save/load in Settings/pause.

## 10. Quality bar (the CRITIC checks all of these)

- `npm run build` clean; no console errors in a 15-minute scripted playthrough (Playwright, chromium, pre-installed at /opt/pw-browsers).
- Headless sim (`node tools/sim.mjs --runs 200 --policy random|greedy|cautious`) shows: no crashes, no soft-locks,
  win/lose/strand rates sane (cautious ≥ 60% reach a non-loss ending; random ≤ 40%), economy not exploitable (no loop yields >X scrip/day).
- Every event in content validated by `tests/content.test.js` (referenced ids exist, every choice resolves, no dead ends, no combat words).
- Variety: ≥70 events, ≥28 missions, ≥28 upgrades, ≥14 goods, ≥18 crew, ≥40 codex entries, 6 endings; no event type repeats within 8 events of play.
- Feel: cozy, readable, juicy (sfx on everything, gentle motion, toasts), clear affordances, no walls of text (≤ 70 words per node text, usually ≤ 45).

## 11. ENGINE additions (rounds 1-3; authoritative details in docs/REQUESTS.md [ENGINE])

Queries: `nextObjective()` (+`jumps`,`fuel`,`days`,`rangeNote`), `routeInfo(id)`, `frontier()`, `arcProgress()`, `dockBulletin()`, `rivalInfo()`/`rivalStatus()`, `distressSignals()`, `hotLanes()`, `mapMarkers()` (`{markers, legend}`), `marketNews(sys)`, `newsFeed()`, `market(sys).bestSell`, `yardRotation(sys)`, `refits(sys)`, `trainingOptions(crewId)`, `retirePreview()`, `canRetire()`.
Actions: `buyRefit(id)`, `trainCrew(crewId, programId)`, `retire({anywhere})`, `spawnDistress(days)`; `buyUpgrade` takes `commission.days` days for bespoke items.
State extras: `rng`, `docked`, `evt`, `boards`, `rival`, `distress`, `refits`, `savedAt`; markets carry `impact`, `depth`.
Event contexts added: `rival`, `distress` (authored events may use them); cond keys `rival`, `distress`, `ringed`, `counter`; fx `distress`.
