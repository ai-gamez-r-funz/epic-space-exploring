// Minimal stub content used ONLY by tests (never placed in src/content).
export const stub = {
  __reset: true,
  FACTIONS: { concord: { id: 'concord', name: 'Concord', likes: [], dislikes: [] } },
  GOODS: [
    { id: 'widgets', name: 'Widgets', category: 'material', base: 20, volatility: 0.2, bulk: 1 },
    { id: 'gizmos', name: 'Gizmos', category: 'tech', base: 60, volatility: 0.4, bulk: 1 },
  ],
  ECONOMY_BIAS: {},
  UPGRADES: [{ id: 'tiny_tank', name: 'Tiny Tank', slot: 'engine', tier: 1, cost: 100, requires: [], bonus: { fuelMax: 5 } }],
  CREW_START: [
    { id: 'eng', name: 'Eng', species: 'human', role: 'engineering', skills: { science: 0, engineering: 3, medicine: 0, diplomacy: 0, piloting: 1 }, trait: 'x', bio: '' },
    { id: 'sci', name: 'Sci', species: 'human', role: 'science', skills: { science: 3, engineering: 0, medicine: 0, diplomacy: 0, piloting: 0 }, trait: 'x', bio: '' },
  ],
  CREW_POOL: [],
  MISSIONS: [], TEMPLATES: [],
  STORY_SYSTEMS: [], ENDINGS: {}, CODEX: [], EVENTS: [],
};
