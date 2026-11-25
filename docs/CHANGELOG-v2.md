# Guandan 2.8 — Table Records and Match Celebrations

> Kept as written for that release. Paths have since moved: `REVIEW.md` is `docs/REVIEW-v2.md`, `START-HERE.md` is `docs/DEPLOY.md`, `review/` screenshots are in `docs/screenshots/`, and `demo/guandan-demo.html` is built with `pnpm build:demo`.

Four-player partnership Guandan, with AI Practice and private Online 2v2 rooms. English and Simplified Chinese share the same interface; each player chooses their own language. This version improves the supplied v2 ZIP. See REVIEW.md for the audit, evidence, and remaining production work.

## Start Playing Locally

Use Node.js 24 or newer and pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm start
```

Open http://127.0.0.1:4174. The local server creates its own SQLite database in `.local/`; these rooms are separate from any hosted website. Use the same hosted URL for friends on different devices. A localhost address is only reachable on your own computer.

For a quick practice-only preview, open `demo/guandan-demo.html` directly. It is generated from the current source, works without downloading fonts or scripts, and disables online rooms. Run the local server or deploy the Worker for multiplayer.

## Version 2.8

**Scoreboard** opens the table record at any time. Winning partnerships earn 3 / 2 / 1 points for 1–2 / 1–3 / 1–4 finishes; net points are earned points minus the other team's earned points, allowing negative scores without changing level promotion. Each player's row shows partnership hand wins, individual first finishes, and partnership match wins. Online totals are server-owned and rotated to each player's viewpoint; spectators see Team A and Team B. Play Again carries totals forward; New Game or a new room resets the record. Scores begin with hands completed after this update; earlier hands are not reconstructed. Practice records survive reloads with the saved game.

The final scoreboard opens once on match completion, waits for another open menu to close, and adds a brief confetti celebration plus a crowned-egg medal. Reduced-motion preferences keep the static celebration and skip confetti. Refined mint/coral team accents and gold egg/flower seals stay outside the central play stack. English and Chinese messages are included. Automated tests cover scoring, duplicate recording, seat rotation, rematches, and the reduced-motion completion flow. Live screenshot validation remains unavailable.

## Version 2.7

Open **Turn Timer** beside the mode controls. The default is Off; choose 15, 30, 45, 60, 90, or 120 seconds. Enabled timers default to auto-pass, with a warning-only alternative. An expired lead plays the lowest single because passing on an empty table is illegal. Pause, resume, and restart controls affect the clock only. Practice preferences persist on the device; practice countdowns stop while menus are open, the game is paused, or the tab is hidden. Online settings belong to the room and only the host can change them. The server enforces expiry with optimistic concurrency; player polling or a submitted play processes overdue turns, so automatic actions may follow the displayed zero by one polling interval. No active players means no background game progression. Tribute and completed hands have no timer.

Additional floral sprigs and gold corner engraving decorate the table edges without entering the central play stack. Timer controls and messages are available in English and Chinese. Validation includes timer expiry, legal lead fallback, pause/resume, host permissions, and simultaneous requests; live screenshot inspection remains unavailable.

## Version 2.6.1

The center now flows in a single stack: player, cards, combination, and compact pass or wildcard details. Bombs use the combination label instead of a second floating announcement. Played cards use responsive grid spacing without negative margins. Exceptionally narrow or zoomed layouts can scroll the center region without covering seats or controls.

## Version 2.6

Three refinement passes address the supplied overlap screenshot: compact north/south seats with reserved outer spacing, distinct blue table-owner and gold turn badges, and engraved egg/flower/bomb decorations on the felt and wider margins. Explicit Passed badges use only the current winning play's pass count, so they disappear when another player beats it. Results show all four finishing places from the completed result. Decorative SVGs are noninteractive and hidden from screen readers. Mobile decorations are reduced and the hand remains independently scrollable.

Validation: 62 tests and the production build pass. The supplied screenshot was reviewed; live browser inspection remains blocked, so the new layout has not been screenshot-verified.

## Board and Layout Update (2.5.1)

The board adds decorative gold stitching, engraved edge flourishes and faint felt texture, without interactive overlays or external images. The page uses the available browser height; table and play controls stay outside a keyboard-accessible, independently scrolling hand/group area. Desktop hands use 14 columns (two rows for the initial 27 cards); phones retain larger targets with seven columns and independent scrolling when needed. Hand history is in the hand toolbar. Very short windows or heavy zoom can still require scrolling so controls are not clipped. Actual viewport screenshots remain unverified because browser access was blocked.

## New in 2.5

- A compact selection tray keeps chosen cards beside the play controls. Click a card to remove it. Undo restores a previous local selection (including its declaration), never a submitted play. Unavailable cards are filtered on restore. The tray preserves focus across online polling.
- Shift-click selects a contiguous range in the displayed hand or grouped tray on desktop. Touch input retains normal tap selection and scrolling.
- Card faces have mirrored corner indices and a centered suit for readable hands. The action area highlights your turn. New table plays animate once, with reduced-motion support; bombs get a brief announcement. The last play remains identified when the trick clears.
- Sound On/Off is available beside the game mode. Settings adds saved volume and Test Sound. Short synthesized selection, card, turn, bomb and win cues replace the single generic card tone. Turn/win cues take priority; repeated polls do not replay sounds. Audio remains off by default and silent in hidden tabs; browser/device support is still required.
- English and Chinese translations cover the new controls. All 60 tests pass. Browser access policy blocked visual/audio interaction verification for this release; no new screenshot is claimed.

## New in 2.4

- **Settings → AI Difficulty:** Easy chooses a random legal move 60% of the time after finishing/partner checks; Normal retains the original partner-aware heuristic; Hard adds penalties for splitting bombs and leaving isolated cards. All three practice bots use the selected setting from their next move. This is heuristic AI, not an optimal solver; opponents’ private card identities are never used in its decision.
- **Settings → Sound Effects:** opt-in, synthesized cues for your turn, a play, and a won hand. Starts muted; enabling it previews a cue. No audio files or external services are loaded. Browsers may require a tap before audio starts.
- **Settings → Table Theme / Card Backs:** Jade, Midnight, Plum; Classic, Lattice, Stars. Cosmetic preferences are local to each device. Card backs appear by opponents’ seats; card faces stay readable.
- **Room Details → Copy Spectator Link:** an unguessable read-only link for friends to watch public plays, card counts, emotes and history without taking a seat. Spectators never receive a hand or seat credential. The link lasts for that room; share only with intended viewers. Stop Watching preserves any playing seat saved in that browser.
- **Room Details → Auto-Play Absent Seats:** host-controlled fallback as described below. Existing rooms default to Off and can generate spectator links without a schema migration.

## At the Table

- The sticky action area explains whose turn it is, when practice is paused, and when a connection or tribute action is required. Invalid combinations and combinations that cannot beat the table have distinct feedback.
- Card selection updates in place to preserve focus and avoid rebuilding the table. Desktop hands use larger cards; phone controls use a consistent three-column toolbar. Reduced-motion preferences are respected.

- Emotes opens a compact wheel with Happy, Angry, Surprised, Confused, Nice Play, Thanks, Good Luck and Oops. Reactions appear beside your seat for five seconds; online matches share them with all four players. A three-second cooldown limits repeated reactions. Emotes preserve your selected cards and do not consume a turn. English and Chinese labels, keyboard focus, Escape dismissal and reduced-motion settings are supported.

- Select cards and choose Play. Hint suggests legal combinations; Pass keeps your cards. The gold seat border identifies whose turn it is.
- The full hand uses readable rows on desktop and phone. The bottom controls retain the combination to beat while you scroll.
- Choose Organize to group a valid selection, release it, move groups, or reset groups. Group Selected moves cards to a separate Grouped Cards tray below your hand and clears the selection, leaving other cards ready to play. Grouping is independent of the current trick. Group labels select a whole group when you need it; Release Group returns it to your hand. Groups survive refresh in the same saved hand; using part of a group dissolves it.
- Played Cards shows actual cards and wild declarations for the current hand, newest first, with player filters. Hand history also records scoring and tribute. A new deal clears card review for the previous hand.
- Practice saves automatically when browser storage is available. Refresh restores progress in a paused state. Resume continues play. Pause and open dialogs stop the AI; hiding the browser pauses AI scheduling. Clearing browser storage loses saved practice and online seats.
- Arrow keys move focus between cards; Enter or Space selects the focused card. H suggests a move, P passes, Escape clears selection. These shortcuts are disabled in form fields and dialogs. Enter away from a button submits a legal selection.
- Statistics count completed practice matches, not abandoned matches or individual hands. Storage failure falls back to statistics held in memory for the current page session.

## Four Friends, Two Teams

Choose Online 2v2, enter a name, and create or join a room. Share its eight-character code or invitation link. Opposite seats are partners. Everyone readies; only the host starts. Changing the lineup clears readiness so players confirm their new partnerships.

The server validates turns, combinations, tribute and promotions. Each player receives only their own hand and public state. Reload reconnects with a credential held in this browser. Transient failures retry with increasing delays; an expired seat offers a route to another table. Failed joins with a definitive rejection retain the previously saved seat. An uncertain network response keeps the attempted room credential for recovery.

In Room details, the host can enable Auto-play Absent Seats after 1, 2, or 5 minutes (off by default). The server plays one legal move per poll interval, including tribute returns. A reconnecting player immediately regains control. Another seated player must keep the room open for this polling-driven fallback to run; spectators do not advance games. When the absent host qualifies for auto-play, another seated player can deal the next hand. Explicitly leaving an active match ends it for everyone; closing a tab reserves the seat. Rooms expire after 24 hours without a game action. Online actions use versions and idempotency keys to prevent conflicting or duplicate moves. Presence writes are throttled to eight seconds while room reads remain current.

## Build and Verify

```sh
pnpm test
pnpm format:check
pnpm build
pnpm build:demo
node verify-release.mjs
```

The test suite covers rules, AI simulations, complete online hands, authorization, privacy, races, reconnect behavior, persistence, localization and grouping. Release verification checks that each asset embedded in the Worker matches the source exactly. `pnpm format` applies the pinned formatter.

`dist/` contains the editable frontend source. Only `dist/server/index.js` and the standalone demo are generated. `assets.mjs` is the shared frontend asset inventory used by both local serving and production builds. No framework is required.

## Deployment

The production target is a Cloudflare Worker with a D1 binding called DB. Follow START-HERE.md and `wrangler.example.toml` for your own Cloudflare account. Apply the SQL migrations before serving online rooms. The working checkout retains its Sites identity. Portable release ZIPs omit that identity so they can be hosted independently. Domain purchase and DNS setup are separate from deployment.

This remains a social friends' table with heuristic practice AI. It has no public matchmaking, real-money functionality, ranking ladder, server-side practice accounts, or large-scale performance certification.
