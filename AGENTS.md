# microbreak — agent brief

## The Project

Microbreak is a small collection of short, non-addictive puzzle games for the gaps between builds, test runs, deployments, and package installs. It exists to replace mindless scrolling with a few minutes of genuine mental engagement, then get out of the way. Everything runs in the browser: no accounts, no server, no tracking.

What makes it special is restraint. Every game is short by design and ends cleanly, and there are no ads, streaks, notifications, leaderboards, or analytics. These are non-negotiables, not roadmap items. A change that needs a backend, an external API, tracking, or an engagement hook to work does not belong here.

## How I Work Here

- Run `bun run verify` before handoff.
- Write focused tests for the logic you touched; CI owns the full suite.
- Run `bun run test:e2e:build` when you change UI flows.
- Conventional Commits; the allowed types live in `commitlint.config.ts`.
- Branch, open one pull request, squash merge. Never push directly to main.
- Keep a pull request scoped to one concern; leave unrelated refactors and formatting fixes out.
- New games follow the same layered shape as the existing ones; `CONTRIBUTING.md` has the checklist.
- Never hand-edit `CHANGELOG.md`; it is release-please output.

## Sources of Truth

| Fact             | Where                     |
| ---------------- | ------------------------- |
| Product intent   | § The Project (this file) |
| Runtime behavior | code + tests              |
| Commands & deps  | package.json              |
| Commit rules     | commitlint.config.ts      |

Code and tests are the authority; this file never overrides executable truth.
