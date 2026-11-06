# Halcyon Reach

A cozy, **no-combat** space exploration game for the browser, built from scratch with [PixiJS](https://pixijs.com) v8.

You captain the survey ship **ISV Halcyon** for the **Meridian Society for Open Skies** — an interstellar NGO of
cartographers, relief workers and translators. A stable wormhole has just opened onto an uncharted galactic
segment, the **Lantern Reach**. Map it, help whoever you meet, make an honest living, and find out who lit the Lanterns.

The tone is Star Trek: The Original Series by way of a 1960s world's fair: warm, wry, optimistic and a little anachronistic
(slide rules beside warp coils, tea in the observation lounge). Encounters are settled by **diplomacy, trade, persuasion,
science, clever flying, or running away** — never by fighting.

## Play

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/ (relative base path, deployable anywhere)
npm run preview
```

Everything (art, music, sound) is generated procedurally at runtime — there are no image or audio assets.

### Controls

Mouse/touch everywhere; keyboard for everything. On the Bridge: `C` chart · `O` orbit · `S` scan · `L` land ·
`I` investigate · `H` hail · `D` dock · `T` trade · `U` ship · `R` crew · `J` log · `K` codex · `Z` rest · `F1`/`?` help · `Esc` pause.
Event choices: `1`–`9`. On a phone, play in landscape.

## Development

```bash
npm test                                   # engine + content tests (node:test)
node tools/sim.mjs --runs 200 --policy all # headless balance simulation
```

| Path | What |
|---|---|
| `src/core` | pure-JS rules engine: galaxy generation, events, economy, missions, saves (runs under plain node) |
| `src/content` | data: events, missions, upgrades, goods, crew, story, codex |
| `src/gfx` | procedural Pixi art (planets, stars, ships, portraits, scenes) |
| `src/audio` | WebAudio synthesis: sfx and generative music |
| `src/ui` | scenes, overlays and a small widget kit (`src/ui/kit/README.md`) |
| `docs/CONTRACT.md` | the architecture contract all modules follow |
| `docs/critic/` | quality-gate review reports |

## Licence

MIT — see `LICENSE`.
