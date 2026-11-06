// No-op audio used when the real module is missing.
let vol = { master: 0.8, music: 0.6, sfx: 0.85 }, muted = false;
export const mockAudio = {
  init() {}, sfx() {}, music() {},
  setVolume(v) { vol = { ...vol, ...v }; }, getVolume() { return { ...vol }; },
  mute(b) { muted = !!b; }, isMuted() { return muted; },
};
