# Version 3.1: Rules Accuracy, Clearer Play, Tidier Code

## Rules

- **Climbing Against an Ace Team.** When the Level Team is on Ace and loses, the
  winners now climb +1/+2/+3 from their own level, as in the standard rules.
  Before, they jumped straight to Ace (for example 4 → A). The Ace team still
  records a failed attempt, and three failures still send it back to 2.
- **Tribute Returns Must Be 10 or Lower.** A winner who receives tribute hands
  back a card of 10 or lower, or any card if they hold none. The rule is checked
  by the engine, so practice, the online server, AI seats and absent-seat
  substitutes all follow it. In the hand, cards you may not return are dimmed
  and the Return button stays off until you pick an allowed card.
- How to Play (English and Chinese) describes both rules.

## Play and Interface

- **Partner-Aware Guidance.** When your partner is winning the trick, the status
  line says so instead of "Beat the …", and the first Hint is *Pass*; pressing
  Hint again cycles through legal plays.
- **Selected cards** lift and glow gold on a white face instead of turning a
  dull khaki, so selection reads as "picked", not "disabled".
- **The Action Bar Stays in Reach.** It sticks to the bottom of the screen, so
  Play/Pass/Hint are always visible on laptops and phones. On screens shorter
  than 860px the bar drops the selection chips and the "To Beat" line (both are
  already visible on the table and in the raised cards) to stay one row tall.

## Reading the Table

- **Every Seat Shows Its Play in the Current Trick.** A small label under
  each player (beside your partner, above you) says what they played this
  trick, such as "Pair · 9", or a dashed "Pass". Before, only the play on top
  was visible. The labels clear when a new trick starts.
- **Players Close to Going Out Stand Out.** At 6 cards or fewer the card
  count turns into an amber pill. At 1–2 cards it turns red and the avatar
  pulses gently (no pulse when reduced motion is on).
- **Hand Results Show Both Teams' Levels.** The end-of-hand panel adds a
  compact row such as "Your Team 2 · Opponents 7 +3", with "Match won" or
  "Back to 2" where they apply. The level numbers in the score strip briefly
  pop when they change.
- The last-place player is no longer labelled "Finished" at the end of a
  hand, since they still held cards.

## Code

- Card markup moved from `app.js` into `dist/card-view.js`, a pure, tested module.
- Room details no longer rewrite their own paragraph after rendering; the sort
  label and URL parameters are each handled in one place.

## Verification

- 85 automated tests pass (80 before, plus 5 new ones: normal climb against an Ace
  team, stopping at Ace, human and AI tribute-return limits, card markup). The
  table-status test now checks that last place is not shown as Finished.
- `pnpm build`, `pnpm build:demo`, `node verify-release.mjs`, and
  `prettier --check` all pass. `node ai/arena.mjs expert hard 100`: Expert wins 71.5%.
- Browser checks: selecting cards and the sticky action bar at 1280×720, the
  tribute screen (dimmed cards, blocked K, a valid return starting play), and
  the 375×812 phone layout with no sideways scrolling, seat play labels and
  low-card warnings in English and Chinese, and the end-of-hand level row
  with the deal button still in view.
