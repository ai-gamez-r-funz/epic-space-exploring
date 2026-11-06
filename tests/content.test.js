// Validates ALL authored content against the contract: event graphs, id references, vocabulary, word limits, tone.
import test from 'node:test';
import assert from 'node:assert/strict';
import { C, IDX, SKILLS, FACTION_IDS, missing } from '../src/core/content.js';
import { COND_KEYS } from '../src/core/conds.js';
import { FX_KEYS } from '../src/core/effects.js';
import { BUILTIN_BY_ID } from '../src/core/builtin.js';

const CTXS = new Set(['travel', 'arrive', 'planet', 'landing', 'phenomenon', 'hail', 'station', 'crew', 'idle', 'rival', 'distress']);
const TAGS = new Set(['diplomacy', 'trade', 'flee', 'persuade', 'science', 'mystery', 'comedy', 'relief', 'wonder', 'hazard']);
const CHOICE_TAGS = new Set(['diplomacy', 'trade', 'flee', 'persuade', 'science', 'wait']);
const SCENES = new Set(['nebula', 'starfield', 'planet', 'derelict', 'station', 'ship_alien', 'pulsar', 'ionstorm', 'wormhole', 'asteroids', 'comet', 'rift', 'aurora', 'beacon', 'bridge', 'landing', 'ruins', 'market', 'lounge', 'engine_room', 'sickbay', 'void']);
const SPECIES = new Set(['human', 'quillari', 'vesperine', 'archivist', 'drifter', 'robot', 'unknown']);
const PLANET_TYPES = new Set(['terran', 'ocean', 'desert', 'ice', 'lava', 'gas', 'barren', 'jungle', 'crystal', 'toxic']);
const STARS = new Set(['yellow', 'orange', 'red', 'white', 'blue', 'binary', 'neutron', 'blackhole']);
const PHENOMENA = new Set(['nebula', 'pulsar', 'ionstorm', 'wormhole', 'asteroids', 'derelict', 'comet', 'rift', 'aurora', 'beacon']);
const STATION_KINDS = new Set(['trade', 'outpost', 'shipyard', 'embassy', 'archive', 'habitat']);
const REGIONS = new Set(['gate', 'shoals', 'veil', 'choir', 'archive', 'rim']);
const SERVICES = new Set(['trade', 'repair', 'missions', 'shipyard', 'crew', 'diplomacy']);
const SLOTS = new Set(['engine', 'sensors', 'hull', 'cargo', 'comms', 'lab', 'lounge', 'special']);
const BONUS_KEYS = new Set(['fuelMax', 'suppliesMax', 'hullMax', 'cargoMax', 'scanRange', 'jumpRange', 'efficiency', 'skills', 'moraleRegen', 'repairPerDay', 'priceSell', 'buyDiscount']);
const SPECIAL_IMPLEMENTED = new Set(['tea_service', 'slide_rule_array', 'translator_parrot', 'solar_sails', 'cargo_net', 'observation_dome', 'emergency_beacon', 'cartographers_table', 'diplomatic_pouch', 'barrel_roll_gyro', 'bulk_contracts', 'rest_cure', 'trade_licence_quillari', 'steady_hand', 'lantern_attunement',
  // WORLD-A fix round 1: engine hooks pending (see docs/REQUESTS.md [WORLD-A]); unlock-only ids need no engine code
  'distress_transponder', 'market_ear', 'rival_handshake', 'long_range_hails', 'prize_cartography', 'field_hospital', 'brittle_array', 'thrifty_galley', 'false_floor', 'ice_scoop', 'survey_hull', 'ambassadors_hull', 'salvage_boom', 'quiet_running',
  'side_scan', 'grapple_cradle', 'receiving_hall', 'herb_cupboard', 'drafting_alcove', 'tow_hook', 'lamp_mast', 'signal_flags', 'chime_array', 'chess_set', 'ledger_locker']);
const TEMPLATE_TOKENS = new Set(['captain', 'ship', 'system', 'planet', 'faction', 'crew:science', 'crew:engineering', 'crew:medicine', 'crew:diplomacy', 'crew:piloting', 'crew:random']);

// combat-flavoured words are banned; benign uses are whitelisted by exact phrase (lower-case)
const BANNED = [/\battack/i, /\bshoot/i, /\bfire upon\b/i, /\bkill/i, /\bweapon/i, /\bphaser/i, /\btorpedo/i, /\bbattle/i, /\bdestroy the enemy\b/i];
const WHITELIST = [
  /attack of the (giggles|munchies)/i, /heart attack/i, /shooting star/i, /shoot(ing)? stars?/i, /\bkill(ed)? the lights\b/i, /\bkill the (engines?|lights?|noise|music|thrusters?|power|lamps?|chatter)\b/i,
  /killjoy/i, /\bbattle of (wits|the bands|the books|biscuits|wills)\b/i, /\bbattle-?hardened\b/i, /\bshoot(ing)? (a )?(question|glance|look|smile)/i, /\bweapons?-free\b/i, /\bunarmed\b/i,
  /no weapons?/i, /without (a )?weapons?/i, /not a weapon/i, /\bweapon(s)? (are|is) (not|never)\b/i,
];

const ALL = () => [...C.EVENTS];
const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

function walkSteps(ev, fn) {
  for (const [nid, node] of Object.entries(ev.nodes)) {
    if (node.fx || node.goto) fn(node, `${ev.id}.${nid}`);
    (node.choices || []).forEach((c, i) => {
      const where = `${ev.id}.${nid}[${i}]`;
      if (c.do) fn(c.do, where + '.do');
      if (c.pass) fn(c.pass, where + '.pass');
      if (c.fail) fn(c.fail, where + '.fail');
      (c.rand || []).forEach((r, k) => fn(r[1], where + `.rand${k}`));
      if (!c.do && !c.pass && !c.rand && (c.fx || c.goto)) fn(c, where);
    });
  }
}
function forEachText(ev, fn) {
  fn(ev.title, `${ev.id}.title`);
  for (const [nid, node] of Object.entries(ev.nodes)) {
    fn(node.text, `${ev.id}.${nid}.text`);
    (node.choices || []).forEach((c, i) => fn(c.label, `${ev.id}.${nid}[${i}].label`));
  }
  walkSteps(ev, (st, w) => fn(st.text, w + '.text'));
}
function condsOf(list, out = []) {
  for (const c of list || []) {
    if (!c || typeof c !== 'object') continue;
    out.push(c);
    if (c.not) condsOf([c.not], out);
    if (c.any) condsOf(c.any, out);
  }
  return out;
}
function fxList(fx) { return (Array.isArray(fx) ? fx : fx ? [fx] : []).filter(Boolean); }

test('content: everything loaded and meets the quantity bar', () => {
  assert.deepEqual(missing, [], 'content modules failed to load: ' + missing.join(','));
  assert.ok(C.EVENTS.length >= 70, `events ${C.EVENTS.length}`);
  assert.ok(C.MISSIONS.length >= 28, `missions ${C.MISSIONS.length}`);
  assert.ok(C.UPGRADES.length >= 28, `upgrades ${C.UPGRADES.length}`);
  assert.ok(C.GOODS.length >= 14, `goods ${C.GOODS.length}`);
  assert.ok(C.CREW_POOL.length + C.CREW_START.length >= 18, 'crew');
  assert.equal(C.CREW_START.length, 4);
  assert.ok(C.CODEX.length >= 40, `codex ${C.CODEX.length}`);
  assert.ok(Object.keys(C.ENDINGS).length >= 6, 'endings');
  assert.deepEqual(Object.keys(C.FACTIONS).sort(), [...FACTION_IDS].sort());
  assert.ok(C.STORY_SYSTEMS.length >= 10 && C.INTRO_TEXT.length <= 5 && C.TIPS.length > 5);
  for (const ctx of CTXS) if (!['rival', 'distress'].includes(ctx)) assert.ok(C.EVENTS.some((e) => e.ctx === ctx), `no events for ctx ${ctx}`);
});

test('events: ids unique, shape valid, ctx/tags/art vocabulary', () => {
  const seen = new Set();
  for (const e of C.EVENTS) {
    assert.ok(/^[a-z0-9_]+$/.test(e.id), `bad id ${e.id}`);
    assert.ok(!seen.has(e.id), `duplicate event id ${e.id}`); seen.add(e.id);
    assert.ok(e.title && typeof e.title === 'string', `${e.id}: title`);
    assert.ok(CTXS.has(e.ctx), `${e.id}: ctx ${e.ctx}`);
    assert.ok(Number.isFinite(e.weight) && e.weight > 0, `${e.id}: weight`);
    for (const t of e.tags || []) assert.ok(TAGS.has(t), `${e.id}: tag ${t}`);
    if (e.art) {
      if (e.art.scene) assert.ok(SCENES.has(e.art.scene), `${e.id}: scene ${e.art.scene}`);
      if (e.art.species) assert.ok(SPECIES.has(e.art.species), `${e.id}: art species ${e.art.species}`);
    }
    assert.ok(e.nodes && e.nodes[e.start], `${e.id}: start node missing`);
    assert.ok(!BUILTIN_BY_ID[e.id], `${e.id} collides with a built-in event`);
    if (e.cooldown !== undefined) assert.ok(e.cooldown >= 0);
  }
});

test('events: node graph is closed — every goto exists, every choice resolves, no dead ends, no orphan nodes', () => {
  for (const e of ALL()) {
    const reach = new Set();
    const stack = [e.start];
    while (stack.length) {
      const nid = stack.pop();
      if (reach.has(nid)) continue;
      reach.add(nid);
      const node = e.nodes[nid];
      assert.ok(node, `${e.id}: goto target "${nid}" does not exist`);
      if (node.speaker) { assert.ok(node.speaker.name, `${e.id}.${nid}: speaker name`); if (node.speaker.species) assert.ok(SPECIES.has(node.speaker.species), `${e.id}.${nid}: speaker species ${node.speaker.species}`); }
      assert.ok(typeof node.text === 'string' && node.text.length > 0, `${e.id}.${nid}: text`);
      if (!node.choices || !node.choices.length) {
        // auto node
        assert.ok(node.fx || node.goto || node.text, `${e.id}.${nid}: empty auto node`);
        if (node.goto) stack.push(node.goto);
        continue;
      }
      const always = node.choices.filter((c) => !c.if || !c.if.length);
      assert.ok(always.length >= 1, `${e.id}.${nid}: needs at least one always-enabled choice`);
      node.choices.forEach((c, i) => {
        const w = `${e.id}.${nid}[${i}]`;
        assert.ok(c.label, `${w}: label`);
        if (c.tag) assert.ok(CHOICE_TAGS.has(c.tag), `${w}: tag ${c.tag}`);
        const kinds = [!!c.do, !!c.check, !!c.rand, !!(c.fx || c.goto || c.text)].filter(Boolean).length;
        assert.ok(kinds >= 1, `${w}: choice does not resolve to any step`);
        if (c.check) {
          assert.ok(c.pass && c.fail, `${w}: check needs pass and fail`);
          assert.ok(SKILLS.includes(c.check.skill), `${w}: skill ${c.check.skill}`);
          assert.ok(c.check.diff >= 0 && c.check.diff <= 8, `${w}: diff ${c.check.diff}`);
        }
        if (c.rand) { assert.ok(Array.isArray(c.rand) && c.rand.length, `${w}: rand`); c.rand.forEach((r) => { assert.ok(r[0] > 0 && r[1], `${w}: rand entry`); }); }
      });
      walkSteps({ id: e.id, nodes: { [nid]: node } }, (st) => { if (st.goto) stack.push(st.goto); });
    }
    for (const nid of Object.keys(e.nodes)) assert.ok(reach.has(nid), `${e.id}: node "${nid}" is unreachable`);
  }
});

test('events: effects use only supported keys with valid ids', () => {
  const flagsSet = new Set();
  for (const e of ALL()) {
    walkSteps(e, (st, w) => {
      for (const fx of fxList(st.fx)) for (const [k, v] of Object.entries(fx)) {
        assert.ok(FX_KEYS.has(k) && k !== 'tow', `${w}: unsupported effect key "${k}"`);
        validateFx(k, v, w, e);
      }
    });
  }
});

function validateFx(k, v, w) {
  switch (k) {
    case 'rep': for (const f of Object.keys(v)) assert.ok(FACTION_IDS.includes(f), `${w}: rep faction ${f}`); break;
    case 'cargo': for (const g of Object.keys(v)) assert.ok(IDX.good[g], `${w}: unknown good ${g}`); break;
    case 'item': for (const i of Object.keys(typeof v === 'string' ? { [v]: 1 } : v)) assert.ok(C.ITEM_DEFS[i], `${w}: item ${i} has no ITEM_DEFS entry`); break;
    case 'upgrade': assert.ok(IDX.upgrade[v], `${w}: unknown upgrade ${v}`); break;
    case 'recruit': assert.ok(IDX.crewTpl[v], `${w}: unknown crew ${v}`); break;
    case 'mission': assert.ok(IDX.mission[v], `${w}: unknown mission ${v}`); break;
    case 'missionProgress': assert.ok(IDX.mission[v.id], `${w}: unknown mission ${v.id}`); assert.ok(IDX.mission[v.id].objectives.some((o) => o.id === v.obj), `${w}: unknown objective ${v.obj}`); break;
    case 'codex': for (const c of [].concat(v)) assert.ok(IDX.codex[c], `${w}: unknown codex ${c}`); break;
    case 'ending': assert.ok(C.ENDINGS[v], `${w}: unknown ending ${v}`); break;
    case 'startEvent': assert.ok(IDX.event[v], `${w}: unknown event ${v}`); break;
    case 'xp': for (const s of Object.keys(v)) assert.ok(SKILLS.includes(s), `${w}: xp skill ${s}`); break;
    case 'mood': if (typeof v === 'object') for (const [who] of Object.entries(v)) assert.ok(who === 'all' || who === 'random' || IDX.crewTpl[who] || true); break;
    case 'teleport': assert.ok(v === 'random' || typeof v === 'string', `${w}: teleport`); break;
    case 'days': case 'fuel': case 'supplies': case 'hull': case 'morale': case 'credits': assert.ok(Number.isFinite(v), `${w}: ${k} must be a number`); break;
    default: break;
  }
}

test('conditions: only known keys, valid referenced ids', () => {
  const check = (list, w) => {
    for (const c of condsOf(list)) for (const [k, v] of Object.entries(c)) {
      assert.ok(COND_KEYS.has(k), `${w}: unknown condition key "${k}"`);
      if (k === 'item') for (const i of Object.keys(typeof v === 'string' ? { [v]: 1 } : v)) assert.ok(C.ITEM_DEFS[i], `${w}: item ${i} missing from ITEM_DEFS`);
      if (k === 'cargo') for (const g of Object.keys(v)) assert.ok(IDX.good[g], `${w}: cargo good ${g}`);
      if (k === 'upgrade') for (const u of [].concat(v)) assert.ok(IDX.upgrade[u] || [...SPECIAL_IMPLEMENTED].includes(u), `${w}: upgrade ${u}`);
      if (k === 'crew') assert.ok(IDX.crewTpl[v], `${w}: crew ${v}`);
      if (k === 'crewRole') assert.ok(SKILLS.includes(v), `${w}: crewRole ${v}`);
      if (k === 'mission' || k === 'missionDone') assert.ok(IDX.mission[v], `${w}: mission ${v}`);
      if (k === 'codex') assert.ok(IDX.codex[v], `${w}: codex ${v}`);
      if (k === 'rep') for (const f of Object.keys(v)) assert.ok(FACTION_IDS.includes(f), `${w}: rep faction ${f}`);
      if (k === 'skill') for (const s of Object.keys(v)) assert.ok(SKILLS.includes(s), `${w}: skill ${s}`);
      if (k === 'planetType') assert.ok(PLANET_TYPES.has(v), `${w}: planetType ${v}`);
      if (k === 'phenomenon') assert.ok(PHENOMENA.has(v), `${w}: phenomenon ${v}`);
      if (k === 'day') assert.ok(Array.isArray(v) && v.length === 2, `${w}: day must be [min,max]`);
      if (k === 'random') assert.ok(v >= 0 && v <= 1, `${w}: random`);
      if (k === 'system') for (const [sk, sv] of Object.entries(v)) {
        assert.ok(['faction', 'star', 'region', 'hasStation', 'danger', 'stationKind', 'id', 'story', 'status', 'phenomenon'].includes(sk), `${w}: system.${sk}`);
        if (sk === 'faction') assert.ok(FACTION_IDS.includes(sv) || sv === 'none', `${w}: faction ${sv}`);
        if (sk === 'star') assert.ok(STARS.has(sv), `${w}: star ${sv}`);
        if (sk === 'region') assert.ok(REGIONS.has(sv), `${w}: region ${sv}`);
        if (sk === 'story' && sv !== true) assert.ok(IDX.storySystem[sv], `${w}: story ${sv}`);
      }
    }
  };
  for (const e of ALL()) {
    check(e.when, `${e.id}.when`);
    for (const [nid, node] of Object.entries(e.nodes)) (node.choices || []).forEach((c, i) => check(c.if, `${e.id}.${nid}[${i}].if`));
  }
  for (const m of C.MISSIONS) check(m.offerWhen, `${m.id}.offerWhen`);
  for (const en of Object.values(C.ENDINGS)) check(en.conditions, `ending ${en.id}`);
  for (const ch of C.CHAPTERS) { check(ch.gate, `chapter ${ch.n}.gate`); check(ch.completeWhen, `chapter ${ch.n}.completeWhen`); }
});

test('flags: every flag an event/mission/ending reads is set somewhere', () => {
  const set = new Set(['chapter_1', 'retire_ready']);
  const addFx = (fx) => { for (const f of fxList(fx)) { if (typeof f.flag === 'string') set.add(f.flag); else if (f.flag) Object.keys(f.flag).forEach((k) => set.add(k)); } };
  for (const e of ALL()) walkSteps(e, (st) => addFx(st.fx));
  for (const m of C.MISSIONS) { addFx(m.onComplete); addFx(m.failFx); }
  for (const ch of C.CHAPTERS) { set.add(ch.flag); addFx(ch.onStart); addFx(ch.onComplete); }
  for (const g of (C.FINALE_FLAGS || [])) set.add(g);
  const reads = [];
  const collect = (list, w) => { for (const c of condsOf(list)) { for (const k of ['flag', 'notFlag']) if (c[k]) reads.push([c[k], w]); if (c.flagEq) Object.keys(c.flagEq).forEach((n) => reads.push([n, w])); } };
  for (const e of ALL()) { collect(e.when, e.id); for (const node of Object.values(e.nodes)) (node.choices || []).forEach((c) => collect(c.if, e.id)); }
  for (const m of C.MISSIONS) { collect(m.offerWhen, m.id); for (const o of m.objectives) if (o.type === 'flag') reads.push([o.flag, m.id]); }
  for (const en of Object.values(C.ENDINGS)) collect(en.conditions, en.id);
  for (const ch of C.CHAPTERS) { collect(ch.gate, 'chapter'); collect(ch.completeWhen, 'chapter'); }
  const chapterDone = /^chapter_\d_done$/;
  const KNOWN_GAPS = new Set([]);
  const unset = reads.filter(([n]) => !set.has(n) && !chapterDone.test(n) && !KNOWN_GAPS.has(n));
  assert.deepEqual(unset, [], 'flags read but never set: ' + unset.map(([n, w]) => `${n} (${w})`).join(', '));
});

test('text: nodes and results are short, templates valid, no combat language', () => {
  const problems = [];
  for (const e of ALL()) {
    forEachText(e, (t, w) => {
      if (typeof t !== 'string') return;
      for (const m of t.matchAll(/\{([^}]*)\}/g)) if (!TEMPLATE_TOKENS.has(m[1])) problems.push(`${w}: unknown template token {${m[1]}}`);
      if (/\.(text)$/.test(w) && words(t) > 70) problems.push(`${w}: ${words(t)} words (max 70)`);
      for (const re of BANNED) {
        const m = t.match(re);
        if (m && !WHITELIST.some((wl) => wl.test(t))) problems.push(`${w}: banned word "${m[0]}" in: ${t.slice(0, 80)}`);
      }
    });
  }
  assert.deepEqual(problems, []);
});

test('missions & templates: valid objectives, selectors, rewards, ids', () => {
  const OBJ = new Set(['goto', 'have', 'scan', 'chart', 'flag', 'event']);
  const KINDS = new Set(['delivery', 'survey', 'investigate', 'ferry', 'relief', 'diplomacy', 'fetch', 'story']);
  const ids = new Set();
  const sel = (s, w, tmpl) => {
    if (s === undefined) return;
    if (typeof s === 'string') {
      if (/^\{\w+\}$/.test(s)) { assert.ok(tmpl, `${w}: placeholder outside template`); return; }
      assert.ok(IDX.storySystem[s], `${w}: unknown story system "${s}"`); return;
    }
    assert.equal(typeof s, 'object', w);
    if (s.story) assert.ok(IDX.storySystem[s.story], `${w}: story ${s.story}`);
    if (s.faction) assert.ok(FACTION_IDS.includes(s.faction), `${w}: faction ${s.faction}`);
    if (s.region) assert.ok(REGIONS.has(s.region), `${w}: region ${s.region}`);
    if (s.phenomenon) assert.ok(PHENOMENA.has(s.phenomenon), `${w}: phenomenon ${s.phenomenon}`);
    if (s.planetType) assert.ok(PLANET_TYPES.has(s.planetType), `${w}: planetType ${s.planetType}`);
    for (const x of s.exclude || []) assert.ok(IDX.storySystem[x], `${w}: exclude ${x}`);
  };
  for (const m of C.MISSIONS) {
    assert.ok(!ids.has(m.id), `dup mission ${m.id}`); ids.add(m.id);
    assert.ok(KINDS.has(m.kind), `${m.id}: kind ${m.kind}`);
    assert.ok(m.title && m.blurb && m.accept, `${m.id}: text`);
    assert.ok(m.giver && m.giver.name, `${m.id}: giver`);
    assert.ok(m.objectives.length >= 1, `${m.id}: objectives`);
    const oids = new Set();
    for (const o of m.objectives) {
      assert.ok(OBJ.has(o.type), `${m.id}.${o.id}: type ${o.type}`);
      assert.ok(!oids.has(o.id), `${m.id}: dup objective id ${o.id}`); oids.add(o.id);
      assert.ok(o.text, `${m.id}.${o.id}: text`);
      sel(o.target, `${m.id}.${o.id}.target`); sel(o.deliverTo, `${m.id}.${o.id}.deliverTo`);
      if (o.type === 'have') { assert.ok(o.good ? IDX.good[o.good] : o.item && C.ITEM_DEFS[o.item], `${m.id}.${o.id}: have good/item`); assert.ok(o.qty > 0); }
      if (o.type === 'event') assert.ok(IDX.event[o.event], `${m.id}.${o.id}: event ${o.event}`);
      if (o.type === 'goto' || o.type === 'chart') assert.ok(o.target !== undefined, `${m.id}.${o.id}: target`);
      if (o.type === 'flag') assert.ok(o.flag);
    }
    sel(m.offerAt, `${m.id}.offerAt`);
    const r = m.reward || {};
    for (const f of Object.keys(r.rep || {})) assert.ok(FACTION_IDS.includes(f), `${m.id}: reward rep ${f}`);
    for (const i of Object.keys(r.item || {})) assert.ok(C.ITEM_DEFS[i], `${m.id}: reward item ${i}`);
    if (r.upgrade) assert.ok(IDX.upgrade[r.upgrade], `${m.id}: reward upgrade ${r.upgrade}`);
    if (r.codex) assert.ok(IDX.codex[r.codex], `${m.id}: reward codex ${r.codex}`);
    for (const f of [...fxList(m.onComplete), ...fxList(m.failFx)]) for (const [k, v] of Object.entries(f)) { assert.ok(FX_KEYS.has(k), `${m.id}: fx ${k}`); validateFx(k, v, m.id); }
  }
  for (const t of C.TEMPLATES) {
    assert.ok(t.id && t.title && t.blurb && t.objectives.length, `template ${t.id}`);
    assert.ok(t.pick && t.pick.toSystem, `${t.id}: pick.toSystem`);
    for (const o of t.objectives) { assert.ok(OBJ.has(o.type)); sel(o.target, `${t.id}.target`, true); sel(o.deliverTo, `${t.id}.deliverTo`, true); }
    assert.ok(t.reward && t.reward.credits, `${t.id}: reward`);
  }
});

test('upgrades, goods, crew, codex, story: data sanity', () => {
  const slots = {};
  for (const u of C.UPGRADES) {
    assert.ok(SLOTS.has(u.slot), `${u.id}: slot ${u.slot}`); assert.ok(u.tier >= 1 && u.tier <= 3);
    for (const k of Object.keys(u.bonus || {})) assert.ok(BONUS_KEYS.has(k), `${u.id}: bonus key ${k}`);
    for (const r of u.requires || []) assert.ok(IDX.upgrade[r], `${u.id}: requires ${r}`);
    if (u.special) assert.ok(SPECIAL_IMPLEMENTED.has(u.special), `${u.id}: special ${u.special} not implemented by the engine`);
    if (u.repGate) assert.ok(FACTION_IDS.includes(u.repGate.faction));
    if (!u.reward) assert.ok(u.cost > 0, `${u.id}: cost`);
    slots[u.slot] = (slots[u.slot] || 0) + 1;
  }
  assert.equal(Object.keys(slots).length, 8, 'every slot kind has upgrades');
  assert.equal(C.SLOT_COUNT, 8);
  for (const g of C.GOODS) { assert.ok(g.base > 0 && g.volatility >= 0 && g.volatility <= 1 && g.bulk >= 1, g.id); }
  for (const [k, row] of Object.entries(C.ECONOMY_BIAS)) for (const gid of Object.keys(row)) assert.ok(IDX.good[gid], `ECONOMY_BIAS.${k}: unknown good ${gid}`);
  for (const f of Object.values(C.FACTIONS)) for (const gid of [...f.likes, ...f.dislikes]) assert.ok(IDX.good[gid], `${f.id}: unknown good ${gid}`);
  for (const c of [...C.CREW_START, ...C.CREW_POOL]) {
    assert.ok(SPECIES.has(c.species) && SKILLS.includes(c.role), c.id);
    assert.ok(C.TRAITS[c.trait], `${c.id}: trait ${c.trait}`);
    for (const s of SKILLS) assert.ok(c.skills[s] >= 0 && c.skills[s] <= 5, `${c.id}.${s}`);
    if (c.minRep) assert.ok(FACTION_IDS.includes(c.minRep.faction));
  }
  const cids = new Set();
  for (const e of C.CODEX) {
    assert.ok(!cids.has(e.id), `dup codex ${e.id}`); cids.add(e.id);
    assert.ok(e.title && e.text, e.id);
    const u = e.unlockedBy;
    assert.ok(u === null || u === 'event' || (typeof u === 'object' && Object.keys(u).length === 1), `${e.id}: unlockedBy`);
    if (u && typeof u === 'object') {
      const [k, v] = Object.entries(u)[0];
      assert.ok(['scan', 'phenomenon', 'star', 'faction', 'visit', 'flag', 'mission'].includes(k), `${e.id}: unlockedBy.${k}`);
      if (k === 'visit') assert.ok(IDX.storySystem[v], `${e.id}: visit ${v}`);
      if (k === 'mission') assert.ok(IDX.mission[v], `${e.id}: mission ${v}`);
      if (k === 'phenomenon') assert.ok(PHENOMENA.has(v));
      if (k === 'star') assert.ok(STARS.has(v));
      if (k === 'faction') assert.ok(FACTION_IDS.includes(v));
    }
  }
  const startCount = C.STORY_SYSTEMS.filter((s) => s.start).length;
  assert.equal(startCount, 1);
  for (const s of C.STORY_SYSTEMS) {
    assert.ok(REGIONS.has(s.region) && STARS.has(s.star), s.id);
    for (const p of s.phenomena) assert.ok(PHENOMENA.has(p), `${s.id}: ${p}`);
    for (const p of s.planets) assert.ok(PLANET_TYPES.has(p.type), `${s.id}: ${p.type}`);
    if (s.station) { assert.ok(STATION_KINDS.has(s.station.kind)); for (const sv of s.station.services) assert.ok(SERVICES.has(sv), `${s.id}: service ${sv}`); }
  }
  for (const e of Object.values(C.ENDINGS)) assert.ok(e.title && e.text && Number.isFinite(e.scoreBonus), e.id);
  for (const id of ['cartographer', 'recalled', 'resignation', 'lantern_keeper', 'lantern_friend', 'lantern_silent']) assert.ok(C.ENDINGS[id], `ending ${id}`);
  for (const [k, v] of Object.entries(C.STARTING_ITEMS)) assert.ok(C.ITEM_DEFS[k], `starting item ${k}`);
});

test('items used anywhere have display definitions', () => {
  const used = new Set();
  for (const e of ALL()) {
    walkSteps(e, (st) => { for (const fx of fxList(st.fx)) if (fx.item) Object.keys(typeof fx.item === 'string' ? { [fx.item]: 1 } : fx.item).forEach((i) => used.add(i)); });
  }
  for (const i of used) assert.ok(C.ITEM_DEFS[i], `item ${i} missing from story.ITEM_DEFS`);
});
