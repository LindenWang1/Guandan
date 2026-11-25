# Review of Guandan Project v2

> Kept as written for that release. Paths have since moved: `REVIEW.md` is `docs/REVIEW-v2.md`, `START-HERE.md` is `docs/DEPLOY.md`, `review/` screenshots are in `docs/screenshots/`, and `demo/guandan-demo.html` is built with `pnpm build:demo`.

## October 3 Polish — Version 2.3

Card selection, Clear and Hint now update selection styling in place rather than rebuilding the table, history and saved practice state. Sorting and grouping redraw only the hand area, retaining card or group keyboard focus. Unchanged declaration choices retain their DOM nodes. A localized action indicator distinguishes ready, turn, waiting, paused, tribute, sending, reconnecting and finished states; malformed combinations get different guidance from plays that simply cannot beat the table.

Desktop cards are larger, the phone toolbar uses predictable rows, touch devices avoid sticky hover lifts, and selected groups have a clearer border. Compact Joker labels no longer crowd the symbol on the phone table. Emotes support arrow/Home/End navigation and show a disabled control while sending or cooling down. Existing reduced-motion rules apply to card transitions and emotes.

Validation: 50 automated tests, including localized action-state precedence, rules, AI simulations and online room behavior. Browser checks covered selecting and playing a card, waiting and pause feedback, reload recovery, group selection/focus, Clear, and English/Chinese played-card history. Phone inspection confirmed no horizontal overflow and all 25 cards accounted for between hand and saved group. This is a polished local release; real-device and production-scale testing remain separate, and the public website has not been redeployed.

Reviewed September 29, 2026. Target: balanced desktop and mobile social card play. Original ZIP preserved; improvements made in a separate working copy.

## September 30 Follow-Up — Version 2.1.1

Group Selected now clears the active selection and moves the cards into a separate Grouped Cards tray below the remaining hand. A group name recalls only that group; individual cards remain selectable. Keyboard navigation works in either area. New copy is available in English and Chinese. All-grouped hands show an explanatory message rather than the finished-hand message.

Verified grouping clears selection, independent card selection, and recalling a saved pair in the local browser. Reviewed desktop and 390-pixel phone layouts; updated screenshots are in review/. All 46 existing automated tests pass. Rebuilt the Worker and offline demo from the same source.

## Findings and Fixes

Version 2.2 adds a four-expression emote wheel for practice and active online matches. Preset identifiers are validated server-side, reactions expire after five seconds, and each seat has a three-second cooldown. Online emotes use the existing authenticated, versioned, idempotent room action flow. Tests verify cross-seat visibility, expiry, authentication, invalid input, duplicate requests, cooldown and unchanged gameplay. The 47-test suite passes; desktop and phone wheel layouts were checked in-browser. Online delivery is covered by API tests rather than a four-browser visual test.

Version 2.1.2 adds lightweight CSS felt and background textures, a gold table rail, decorative suit motifs, an embossed brand mark, and refined card, button and saved-group surfaces. Decorations are hidden from assistive technology, ignore pointer input, and simplify on smaller screens. No remote images, fonts, or animation dependencies were introduced. Desktop and phone layouts were visually checked; gameplay is unchanged.

| Finding | Impact | Change |
| --- | --- | --- |
| stats.js imported but omitted from the local server allowlist | Blank/inert game on local startup despite passing unit tests | Shared asset inventory for build and server; import coverage test; visible boot failure message |
| Played-card review and capitalization from the previous release missing in v2 | Players lose sight of past plays | Structured public card history, player filters, wildcard declarations, restored title case |
| Stats storage fallback only returned a transient result | Consecutive records disappear when storage fails | Persistent in-memory fallback; repeated-record test; safely acquire browser storage |
| Full-house declarations shared identifiers for different pair ranks | A chosen wild-card interpretation could resolve to another interpretation | Include the pair rank in the declaration key; end-to-end engine test |
| Greedy straight matching selected only a flush candidate | AI/hints could miss a valid mixed-suit straight | Search for a same-rank off-suit alternative; regression test |
| Refresh discarded practice progress | Interrupted play could not resume | Validated, versioned local snapshot; restore paused; preserve private hand groups |
| Failed joins overwrote existing seat credentials | Returning to an earlier room became harder | Restore previous credentials on definitive rejection; retain uncertain requests for recovery |
| Resume failure did not schedule retries | Temporary connectivity failure could strand a player | Backoff, explicit reconnect, terminal failure state, late-response guard |
| Ready flags survived partnership changes | Host could start after a lineup changed without renewed consent | Reset readiness whenever lineup changes |
| 27 overlapping cards and permanently expanded grouping tools | Hard to scan/select on phones | Full card rows, compact hand toolbar, expandable grouping, sticky target reminder |
| Compressed source and duplicated asset lists | Harder to maintain and easy to omit assets | Consistent formatting, extracted persistence/history modules, shared assets.mjs |
| Presence updated the database every poll | Avoidable database writes | Throttle heartbeat writes to once per eight seconds per seat |
| AI sorted all candidates and repeatedly scored them | Unnecessary move-selection work | Filter impossible responses before filling cards; single-pass scoring |
| External font request on first render | Extra network dependency for the table | System typography; no external font downloads |

The v2 change that checks the actual first-place finisher for all-Aces demotion is preserved, along with its regression test. Winner-only promotion, +3 default double-up, +4 practice variant, tribute and language choices remain intact.

## Validation

46 automated tests pass, including 30 seeded AI hands and three complete online hands. Tests include duplicate/forged cards, hand privacy, stale updates, replay protection, wildcard interpretations, score rules, grouping, localized copy, restored snapshots, blocked storage, retry idempotency, delayed responses and seat rotation in card history.

Browser checks at the normal desktop viewport and 390×844 phone viewport cover dealing, pause/resume, grouping, reload recovery, English/Chinese history filters, pass, online room creation, four seats readying and starting, and online reconnect. Three other test seats used independent local API clients. The browser check found and corrected a native fetch binding issue and a custom-port origin mismatch in the development server. Physical iOS/Android hardware has not been tested.

## Remaining Work Before a Large Public Launch

This release is a substantially stronger social-game foundation. It is not evidence that the project matches the strongest commercial poker platforms. Those claims require sustained real-player testing and production measurement.

- Load-test D1 contention, polling traffic and reconnect storms at the intended player count; consider a per-room real-time service if measurements justify it.
- Add production monitoring, abuse/rate controls and operational alerts before opening public matchmaking or advertising at scale.
- Test Safari/iOS, Android Chrome, keyboard-only and screen-reader play with real users, including slow devices and unstable mobile networks.
- Choose a product policy for disconnect timeouts, host transfer and replacements. Current behavior deliberately reserves seats and waits.
- Improve AI through measured strategy benchmarks or search if expert solo play becomes a goal. The current bot is a legal, partner-aware heuristic.

No paid services, accounts, domain changes, or live-site replacement were performed during this review. The offline demo and deployment bundle are rebuilt from the reviewed source.

## October 18, 2026 — v2.4 Feature Update

Added three practice difficulty levels, opt-in synthesized audio, three table themes, three card-back styles, four additional emotes, private read-only spectator links, and opt-in host-configured absent-seat bots. Absent-seat decisions compare both room version and presence to avoid overwriting a racing reconnect. Bots act only when seated clients poll; no background scheduler was introduced. Existing room JSON receives defaults without a database migration.

Validation: 56 tests pass, including legal complete hands at each difficulty, no hidden-hand input to Hard decisions, spectator privacy, write rejection, saved-seat preservation, host-only settings, bot pacing, concurrent poll safety, reconnect cancellation, tribute, and next-hand continuation. Production Worker build and all 17 embedded assets verified. Standalone practice demo regenerated. Browser visual/audio interaction verification was unavailable because the in-app browser failed to attach; earlier screenshots in this folder describe v2.3, not this update.

## October 18, 2026 — v2.5 Interaction Refinement

Selection preview with removable cards, selection-only undo, desktop range selection, mirrored card indices, single-event play animation, bomb announcements, and last-play reminders. Added local volume and sound testing, quick mute, and distinct short cues. All 60 tests pass, including audio node release and safe selection restoration. Browser UI verification was blocked by the browser access policy; no alternate browser surface was used.
