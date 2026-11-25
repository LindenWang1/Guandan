# Version 2.9 — Full-Hand Layout

> Kept as written for that release. Paths have since moved: `REVIEW.md` is `docs/REVIEW-v2.md`, `START-HERE.md` is `docs/DEPLOY.md`, `review/` screenshots are in `docs/screenshots/`, and `demo/guandan-demo.html` is built with `pnpm build:demo`.

Open demo/guandan-demo.html for the self-contained AI practice demo.
The dist folder and rebuilt dist/server/index.js contain the updated website.

Changes:
- Removed the fixed viewport height and the nested scrolling hand panel.
- All cards occupy full rows; the page grows when needed.
- Action controls follow the last card and cannot cover the hand.
- Compact table on laptops; responsive 14-, 9-, and 6-column hand layouts.
- Wrapped navigation and tools, improved spacing, mobile touch targets, and selected-card preview wrapping.
- Preserved existing game rules, online rooms, artwork, and bilingual support.

Verification:
- All 69 existing tests passed.
- Production Worker and standalone demo rebuilt successfully.
- Release verification passed for all 24 client assets and Worker routes.
- Browser inspected at desktop and phone sizes with 27 cards: no nested hand clipping, and action controls below the final row.

This is a local project update. It has not been deployed to the live website.
