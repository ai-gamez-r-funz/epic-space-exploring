// The engine must boot and play with a tiny stub content set (content files may be partial during development).
import test from 'node:test';
import assert from 'node:assert/strict';
import { setContent } from '../src/core/content.js';
import { stub } from './fixtures/content.js';
import { Game } from '../src/core/game.js';
import { freshStorage } from './helpers.js';

test('engine plays with minimal stub content', () => {
  freshStorage();
  setContent(stub);
  Game.strict = true;
  const g = Game.create({ seed: 5, legacy: false, autosave: false });
  assert.equal(g.state.galaxy.systems.length, 42);
  for (let i = 0; i < 60 && g.state.phase === 'play'; i++) {
    if (g.state.pending) { g.resolveChoice(0); continue; }
    const here = g.here();
    if (here.planets.some((p) => !p.scanned)) g.scanSystem();
    const n = g.neighbors().find((x) => g.canJump(x.id).ok);
    if (n) g.jump(n.id); else g.rest(1);
  }
  assert.ok(g.state.day > 1);
  const back = Game.load(g.save());
  assert.ok(back);
});
