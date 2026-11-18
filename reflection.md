# Vibe Coding Reflection — Royal Cuts Salon Queue Management

## What Went Well
Writing `AGENTS.md`, `docs/01-brief.md`, `docs/02-screens.md`, and `docs/03-flows-rules.md` before writing a single line of application code made the entire build dramatically faster and more consistent. Instead of the agent inventing arbitrary flows or adding unwanted payment/appointment screens, every screen matched the specification on the first pass. Putting all queue transitions, barber-preference matching, and wait-time calculations into a single shared module (`shared/queueRules.js`) also meant the Express backend and the local browser fallback behaved identically with zero logic drift.

## One Issue We Caught & How We Fixed It
During specification and implementation of the **online joining cutoff rule** (`"Online joining closes 30 min before closing; walk-ins still allowed"`, closing at 9:00 PM), we caught an important edge case before it broke live demos and grading:

- **What went wrong initially:** If the closing cutoff (`20:30` for a `21:00` closing time) is enforced unconditionally against the user's real wall-clock time, anyone opening the deployed link after 8:30 PM — including a TA or professor grading late in the evening before the `23:59` submission deadline — would find the `[ Join Queue ]` button permanently disabled!
- **How we noticed it:** While translating `docs/03-flows-rules.md` into `isOnlineJoiningOpen()` in `shared/queueRules.js`, we traced what would happen during night-time testing against `new Date()`.
- **How we fixed the doc and implementation:** We kept the exact 30-minute closing cutoff logic (`isWithinClosingCutoff`) intact and covered it in our automated unit tests (`20:15` open vs `20:35` closed), while exposing an explicit **Owner Settings toggle** (`"Auto-close 30 min before closing (9 PM)"`) that defaults to `OFF` for 24/7 demo accessibility and can be flipped `ON` anytime to demonstrate the automatic cutoff rule. Meanwhile, the main **Accept Online Queue Joining** switch immediately disables online joining on Home & Join while keeping Reception walk-ins working.

## Key Takeaway
In vibe coding, edge cases don't disappear just because code generation is fast — they shift to **product thinking and verification**. Clear docs, small scoped commits, automated rule tests, and clicking through the real app in a browser (including switching to Gujarati on mobile widths) caught subtle UX and timing edge cases early and ensured a reliable, deployable product.
