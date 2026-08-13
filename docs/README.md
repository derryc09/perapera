# PeraPera — Documentation

This folder is the durable context for PeraPera. If you're new (or it's
been a month since you last touched the code, or you're handing off to
an AI assistant in Cursor), start here.

## Order to read

1. **`PROJECT.md`** — what PeraPera is, who it's for, why it exists
2. **`ROADMAP.md`** — what's next, in priority order
3. **`ARCHITECTURE.md`** — the technical stack and how things fit together
4. **`DESIGN.md`** — UX principles and visual language
5. **`DATA.md`** — the vocabulary data pipeline
6. **`DECISIONS.md`** — log of consequential decisions, with reasoning

The `.cursorrules` file at the repo root is the short imperative version
of the above, for AI coding assistants.

## Keeping these alive

When you make a real decision — picked a stack, dropped a feature, locked
a design pattern — add a line to `DECISIONS.md`. Two minutes of work,
saves hours of "wait, why did we do it this way?" later.

When the roadmap actually advances (persistence ships, voice ships,
multi-language starts), update `ROADMAP.md`.

When the architecture changes (cloud sync arrives, SRS comes back), update
`ARCHITECTURE.md`.

The docs are a *tool*, not a chore. They keep the project's brain
externalised so it survives memory loss, contributor turnover, and the
inevitable months between active sprints.

## What's NOT in here

- Specific code (lives in the codebase)
- Conversation transcripts (lives in chat.claude.ai memory or chat history)
- Day-to-day TODO lists (use issues or a task tracker)
- Build / deploy specifics (those go in a `RUNBOOK.md` if/when needed)

These docs are about **durable knowledge** — the why, not the what or
the how-do-I-build-this-today.
