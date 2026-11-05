// Shared colour tokens (numeric 0xRRGGBB) + css strings
export const palette = {
  ink: 0x070914,
  deepSpace: 0x0b0d1e,
  teal: 0x3fc1b0,
  brass: 0xd9a441,
  cream: 0xf2e3b8,
  coral: 0xef6f5e,
  mustard: 0xe8b94a,
  sage: 0x8fb996,
  plum: 0x8c5a8a,
  panel: 0x1b2140,
  panelLight: 0x2a3566,
  text: 0xf2e3b8,
  textDim: 0x9aa3c7,
  good: 0x7fd18b,
  bad: 0xef6f5e,
  warn: 0xf0b64a,
};
export const hex = (n) => '#' + (n & 0xffffff).toString(16).padStart(6, '0');
export const rgb = (n) => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
export const mix = (a, b, t) => {
  const A = rgb(a), B = rgb(b);
  return ((A[0] + (B[0] - A[0]) * t) << 16) | ((A[1] + (B[1] - A[1]) * t) << 8) | (A[2] + (B[2] - A[2]) * t) | 0;
};
export const FACTION_COLOURS = {
  concord: 0x5aa0e0, quillari: 0xe8b94a, vesperine: 0xb28be0, archivists: 0xd9a441, drifters: 0xef8f5e, none: 0x9aa3c7,
};
