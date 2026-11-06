// Resolves the real ENGINE / GFX / AUDIO / content modules, or thin mocks when they are missing/throw (or ?mock=1).
// UI code must reach those systems ONLY through `S` (S.Game, S.gfx, S.audio, S.content) so a half-landed module never
// blanks the screen. S.gfx / S.audio are "safe" facades: each call tries the real module, falls back to the mock.
import { mockGfx } from './dev/mocks/mockGfx.js';
import { mockAudio } from './dev/mocks/mockAudio.js';
import { MOCK_CONTENT } from './dev/mocks/mockContent.js';

const globs = import.meta.glob([
  '../core/game.js', '../gfx/index.js', '../audio/index.js',
  '../content/story.js', '../content/factions.js', '../content/names.js', '../content/goods.js',
  '../content/upgrades.js', '../content/crew.js', '../content/codex.js', '../content/missions.js',
]);

const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const forceMock = params.get('mock') === '1';
const warned = new Set();
const warnOnce = (k, e) => { if (!warned.has(k)) { warned.add(k); console.warn('[ui] ' + k, e?.message || e || ''); } };

export const S = {
  Game: null, gfx: null, audio: null, content: { ...MOCK_CONTENT },
  real: { game: false, gfx: false, audio: false, content: {} },
  rawGfx: null, rawAudio: null,
};

function safeFacade(real, mock, name) {
  return new Proxy({}, {
    get(_, prop) {
      if (prop === 'real') return real;
      const rv = real ? real[prop] : undefined;
      const mv = mock[prop];
      if (typeof rv === 'function' || typeof mv === 'function') {
        return (...a) => {
          if (typeof rv === 'function') { try { return rv.apply(real, a); } catch (e) { warnOnce(`${name}.${String(prop)} failed, using mock`, e); } }
          return typeof mv === 'function' ? mv.apply(mock, a) : undefined;
        };
      }
      return rv !== undefined ? rv : mv;
    },
  });
}

async function tryImport(path) {
  const loader = globs[path];
  if (!loader) return null;
  try { return await loader(); } catch (e) { warnOnce('import failed ' + path, e); return null; }
}

export async function loadServices() {
  let gfxMod = null, audMod = null, gameMod = null;
  if (!forceMock) {
    gameMod = await tryImport('../core/game.js');
    gfxMod = await tryImport('../gfx/index.js');
    audMod = await tryImport('../audio/index.js');
  }
  if (gameMod?.Game) { S.Game = gameMod.Game; S.real.game = true; }
  else if (import.meta.env.DEV || forceMock) { S.Game = (await import('./dev/mocks/MockGame.js')).MockGame; } // dev-only fallback; stripped from production builds
  const gfx = gfxMod?.gfx || gfxMod?.default || (gfxMod && Object.keys(gfxMod).length > 3 ? gfxMod : null);
  const aud = audMod?.audio || audMod?.default || (audMod && audMod.sfx ? audMod : null);
  S.rawGfx = gfx; S.rawAudio = aud;
  S.real.gfx = !!gfx; S.real.audio = !!aud;
  S.gfx = safeFacade(gfx, mockGfx, 'gfx');
  S.audio = safeFacade(aud, mockAudio, 'audio');
  const names = ['story', 'factions', 'names', 'goods', 'upgrades', 'crew', 'codex', 'missions'];
  for (const n of names) {
    const m = forceMock ? null : await tryImport(`../content/${n}.js`);
    if (m) { Object.assign(S.content, m); S.real.content[n] = true; }
  }
}

/** Safe sfx helper for kit widgets. */
export function sfx(name, opt) { try { S.audio?.sfx(name, opt); } catch (e) { /* silent */ } }
