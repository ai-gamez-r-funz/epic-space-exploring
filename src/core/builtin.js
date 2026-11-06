// Built-in fallback events: used when content has nothing eligible, and for engine-driven moments
// (emergency tow, ration crisis). Ids start with core_ and are exempt from the anti-repeat window.
const one = (id, ctx, title, text, fx = [], extra = {}) => ({
  id, title, ctx, weight: 1, tags: [], internal: true, art: extra.art || { scene: 'bridge' }, start: 'a',
  nodes: { a: { speaker: extra.speaker, text, choices: [{ label: extra.label || 'Carry on', tag: 'wait', do: { text: extra.result || 'Logged, filed and gently forgotten.', fx } }] } },
});

export const BUILTIN = {
  phenomenon: one('core_phenomenon_generic', 'phenomenon', 'Careful Observations',
    'Sensors hum and the science station fills with soft numbers. It is lovely, and quite well behaved. You record everything and add a small sketch in the margin.',
    [{ credits: 10 }, { xp: { science: 1 } }], { art: { scene: 'starfield' }, result: 'The log is a little richer than before.' }),
  crew: one('core_crew_chat', 'crew', 'A Quiet Word',
    '{crew:random} wanders into the lounge and you share a cup of tea. Nothing much is said, and it is exactly what both of you needed.',
    [{ morale: 1 }], { art: { scene: 'lounge' }, result: 'The kettle clicks off. The evening is a little warmer.' }),
  idle: one('core_idle', 'idle', 'A Slow Hour',
    'The ship ticks and hums. Somebody is playing a record in the lounge, somebody else is arguing amiably about biscuits. The stars drift by like patient fish.',
    [{ morale: 2 }], { art: { scene: 'lounge' } }),
  rations: one('core_rations', 'idle', 'Tightening Belts',
    'The galley is empty. {crew:medicine} suggests a rota, {crew:engineering} finds a forgotten crate of hardtack behind the coolant pipes, and everyone agrees to call it an adventure.',
    [{ supplies: 6 }, { morale: -6 }], { art: { scene: 'lounge' }, label: 'Ration carefully', result: 'It tastes like cardboard and good intentions. It will last a few days. Resupply soon.' }),
  tow: {
    id: 'core_tow', title: 'Meridian Tender to the Rescue', ctx: 'idle', weight: 1, tags: ['relief'], internal: true,
    art: { scene: 'void', species: 'human' }, start: 'a',
    nodes: {
      a: {
        speaker: { name: 'Tender Captain Wren', species: 'human' },
        text: '"Halcyon, this is the Meridian tender Kindly Light. Your fuel is bone dry, and I do not say that to scold. We have a line ready and a kettle on. Shall we bring you in?"',
        choices: [
          { label: 'Accept the tow with thanks', tag: 'wait', do: { text: 'The tender takes your line with practised ease. A few days later you are somewhere with docking lights and a fuel pump.', fx: [{ tow: true }] } },
          { label: 'Charm the captain into a discount', tag: 'diplomacy', check: { skill: 'diplomacy', diff: 2 },
            pass: { text: '"Oh, go on," says Wren, grinning. "Half the usual, and bring us some tea next time."', fx: [{ tow: 'cheap' }] },
            fail: { text: 'Wren smiles kindly and does not budge. "Regulations, dear. We will manage."', fx: [{ tow: true }] } },
        ],
      },
    },
  },
};
export const BUILTIN_BY_ID = Object.fromEntries(Object.values(BUILTIN).map((e) => [e.id, e]));
