// WORLD-B (round 5): the hand-built set piece "The Night of a Thousand Lamps" at Pennywhistle Exchange.
// Fired on ARRIVAL at pennywhistle while mission m_setpiece_night_of_lamps is active. Three beats, two real choices,
// and a lasting ship change (one reward-only upgrade of your choosing). FLAGS: night_of_lamps_done, lamps_<role>.
// CODEX: codex_night_of_lamps
const DOTT = { name: 'Festival Marshal Dott', species: 'quillari' };
export default [
  {
    id: 'setpiece_night_of_lamps', title: 'The Night of a Thousand Lamps', tags: ['wonder', 'diplomacy'], ctx: 'arrive', weight: 95, once: true,
    when: [{ mission: 'm_setpiece_night_of_lamps' }, { system: { story: 'pennywhistle' } }],
    art: { scene: 'beacon', species: 'quillari', palette: 'warm' }, start: 'a',
    nodes: {
      a: { speaker: DOTT,
        text: `Every light in the Bazaar goes out at once. In the dark, Dott whispers: "Now." A thousand paper lamps lift from the stalls, each one lit by someone's grandmother's grandmother, and rise toward the twin suns like sparks going home. "We have a place at the head of the flotilla, Captain. What will Halcyon be?"`,
        choices: [
          { label: 'The flagship: lead them with the running lights', tag: 'diplomacy', do: { text: `Halcyon's lamps wink on, and the whole sky follows. Dott weeps happily into her feathers. Somewhere behind you, four hundred stalls cheer.`, fx: [{ rep: { quillari: 6 } }, { morale: 6 }, { flag: 'lamps_flagship' }], goto: 'b' } },
          { label: 'The escort: hang back and keep the lamps safe', tag: 'wait', do: { text: `You drift at the flotilla's edge, nudging stray lamps back into line with the tractor beam. The crew learns that gentleness is also a kind of steering.`, fx: [{ rep: { quillari: 3, concord: 3 } }, { xp: { piloting: 2 } }, { flag: 'lamps_escort' }], goto: 'b' } },
          { label: 'The choir: ask the Vesperine to sing the lamps up', tag: 'persuade', check: { skill: 'diplomacy', diff: 3 }, pass: { text: `A single chord crosses the Bazaar, soft as a held breath. The lamps rise in step with it, and the flotilla blooms into a spiral.`, fx: [{ rep: { vesperine: 5, quillari: 4 } }, { morale: 8 }, { flag: 'lamps_choir' }], goto: 'b' }, fail: { text: `The chord arrives a half-second late and the lamps wobble. But the wobble is beautiful, a ripple in the dark, and nobody complains.`, fx: [{ rep: { vesperine: 2, quillari: 2 } }, { morale: 4 }, { flag: 'lamps_choir' }], goto: 'b' } },
        ] },
      b: { speaker: DOTT,
        text: `The lamps climb until they gather into a shape: the five Lanterns, and a sixth, not yet lit. "That one is for whoever carries it next," says Dott. The flotilla parts around Halcyon like water. A single gift drifts down onto the foredeck, waiting for you to choose.`,
        choices: [
          { label: 'Take the lamp-glass plate for the hull', tag: 'wait', do: { text: `Warm glass settles over the hull like a second skin, humming faintly. Micrometeorites bounce off with a tiny ding of apology. The crew polish it daily, for no reason except love.`, fx: [{ upgrade: 'singing_hull_plating' }, { flag: 'night_of_lamps_done' }, { codex: 'codex_night_of_lamps' }, { toast: 'A new hull shines. The Night of a Thousand Lamps will not be forgotten.', tone: 'good' }] } },
          { label: 'Take the old pilots\' astrolabe', tag: 'wait', do: { text: `Brass rings turn in your hands until they point, very gently, at nothing in particular, then at everything. Whatever storms lie ahead, the helm will thread them like a needle.`, fx: [{ upgrade: 'brass_astrolabe' }, { flag: 'night_of_lamps_done' }, { codex: 'codex_night_of_lamps' }, { toast: 'You hold the astrolabe. The sky feels a little smaller and friendlier.', tone: 'good' }] } },
          { label: 'Take the drifters\' lantern quilt for the lounge', tag: 'wait', do: { text: `A patchwork quilt unfurls, stitched with a thousand tiny lamps that glow when someone is sad. By the end of the evening the lounge has a new favourite seat, and nobody is sad.`, fx: [{ upgrade: 'drifter_quilt_lounge' }, { flag: 'night_of_lamps_done' }, { codex: 'codex_night_of_lamps' }, { toast: 'The lounge glows. Morale will remember this night.', tone: 'good' }] } },
        ] },
    },
  },
];
