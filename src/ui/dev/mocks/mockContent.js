// Minimal fallbacks for content modules (the real ones live in src/content and override these).
export const MOCK_CONTENT = {
  INTRO_TEXT: ['Stardate 2461. The Gate has opened.', 'You are the captain. Go gently. Say please.'],
  TIPS: ['Fuel is life.'],
  REGIONS: {
    gate: { id: 'gate', name: 'The Gate Shallows', colour: 0x3fb6a8, hue: 175 },
    shoals: { id: 'shoals', name: 'The Brightwater Shoals', colour: 0xe0a93b, hue: 38 },
    veil: { id: 'veil', name: 'The Vesper Veil', colour: 0x9a6fd0, hue: 275 },
    rim: { id: 'rim', name: 'The Quiet Rim', colour: 0xd0705a, hue: 12 },
  },
  FACTIONS: {
    concord: { id: 'concord', name: 'Concord of Lyra', colour: 0x4aa3a8 }, quillari: { id: 'quillari', name: 'Quillari Clans', colour: 0xe8b94a },
    vesperine: { id: 'vesperine', name: 'Vesperine Choir', colour: 0xb28be0 }, archivists: { id: 'archivists', name: 'Hollow Archive', colour: 0xd9a441 },
    drifters: { id: 'drifters', name: 'Drifter Fleets', colour: 0xef8f5e },
  },
  SHIP_NAME_SUGGESTIONS: ['ISV Halcyon', 'ISV Kettle & Compass', 'ISV Gentle Parallax'],
  ENDINGS: {},
};
