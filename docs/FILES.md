# File Guide (Version 3.0)

## Website (`dist/`)

The site is plain HTML, CSS and JavaScript modules, edited directly. Only
`dist/server/` is generated (by `pnpm build`).

| File | What it does |
| --- | --- |
| `index.html`, `style.css` | Page structure, table layout, themes and responsive styles |
| `boot.js`, `app.js` | Startup recovery and the table interface for practice and online play |
| `engine.js` | Shared rules: legal combinations, wild cards, bombs, tribute, levels; Beginner/Medium/Hard AI |
| `expert-ai.js` | Expert AI: hand planning, played-card tracking, `DEFAULT_WEIGHTS`, tribute-return choice |
| `table-status.js` | Per-seat labels: to play, passed, cards on table, finished, place |
| `online.js` | Room connection, saved seat, retries and stale-response protection |
| `practice-session.js`, `stats.js` | Saving practice games on the device; win statistics |
| `played-history.js` | Played Cards review with player filters |
| `hand-groups.js`, `hand-group-ui.js` | Private card grouping |
| `selection.js` | Selection undo and shift-click range selection |
| `i18n.js`, `rules.js` | English/Chinese text and the How to Play guide |
| `preferences.js`, `audio.js` | Settings dialog, themes, card backs, synthesized sound cues |
| `emotes.js`, `emote-ui.js` | Emote presets and the emote wheel |
| `play-feedback.js` | The action indicator (your turn, waiting, paused, tribute, ...) |
| `turn-clock.js`, `turn-clock-ui.js` | Optional turn timer |
| `scorebook.js`, `scoreboard-ui.js` | Running scoreboard across hands and matches |

## Server and Data

- `server/rooms.js`: the online room API. Validates every move, versions every change, runs AI seats and absent-seat substitutes.
- `server/worker.js`: Cloudflare Worker entry point. `server/local-db.mjs`: SQLite stand-in for local development.
- `db/schema.ts`, `drizzle/`: database schema and migrations (`pnpm db:generate` creates new ones).
- `wrangler.example.toml`: template for your own Cloudflare deployment (copy to `wrangler.toml`, which is not committed).

## Tools

- `serve.mjs`: local server with practice and online rooms (`pnpm start`).
- `assets.mjs`: the one list of site files, shared by the local server, the build and the tests.
- `build.mjs`: bundles the Worker into `dist/server/`. `build-demo.mjs`: builds `demo/guandan-demo.html`, a single-file practice game.
- `verify-release.mjs`: checks that the built Worker serves exactly the current files.
- `ai/arena.mjs`: AI-vs-AI matches with mirrored deals (`pnpm arena`, or `node ai/arena.mjs expert hard 200`).

## Tests

`pnpm test` runs every `*.test.mjs` file: rules and scoring (`test.mjs`), online rooms
(`multiplayer.test.mjs`, `online-bots.test.mjs`), AI (`expert-ai.test.mjs`), translations
(`i18n.test.mjs`), and interface models and reliability (`experience`, `interaction`,
`play-feedback`, `reliability`, `stats`, `hand-groups`).

## Docs

- `DEPLOY.md`: running locally and deploying to Cloudflare.
- `UPDATE-v2.9.md`, `CHANGELOG-v2.md`, `REVIEW-v2.md`: release notes and reviews of earlier versions (they mention files from those releases that are no longer part of the project). The README describes what's new in 3.0.
- `screenshots/`: images used by the README and the earlier reviews.

## Not Committed

`node_modules/`, `.local/` (local room database), `dist/server/` and `demo/` (build
outputs), and `wrangler.toml` are listed in `.gitignore`.
