## What this changes

A sentence or two on what's different after this PR lands.

## Why

What problem does it solve, or what was the motivation. Skip this for trivial fixes.

## How I tested it

What you actually did to convince yourself this works. Not what tests exist in CI; what you ran locally.

## Notes for the reviewer

Anything I should know before reading the diff: a tricky part, a deliberate non-obvious choice, a known follow-up.

---

Checks before opening:

- [ ] Lint and tests pass locally (`ruff check` and `npm run lint && npm run build`)
- [ ] If touching the editor, opened it in two browsers and confirmed sync still works
- [ ] If touching the AI path, confirmed it streams without errors
- [ ] No commented-out code, no `console.log`, no `print()` debug
