# PeraPera — Roadmap

Where the project is going, in priority order. **Do these in sequence**;
each item unblocks or de-risks the next.

---

## Where we are right now (current state)

- Deck builder: filterable by lesson (5-block selector w/ drill-down),
  word type (4 groups), study mode (Production / Recognition), session
  size (10/25/50/All), plus advanced filters under "More options" (verb
  group, semantic categories).
- Study session: prompt-anchored card with 2-button commit
  (Don't recall / I know this), reveal stage with fixed-position answer
  slots, Next button.
- Summary: simple correct % + missed words list.
- Real vocab data: 2,189 entries, all 50 Minna no Nihongo lessons,
  with conjugations on 439 verbs (17 forms × kana/kanji each).
- All in-memory; no persistence; no cloud.

## v1 — MVP

The bar: 50 real JLPT learners can use this for two weeks and form a habit.

### 1. Persistence (expo-sqlite) — THE NEXT THING

**Without this nothing else is real.** Right now progress evaporates on
reload, so no real user can test the app.

- Library: `expo-sqlite` + `drizzle-orm` for typed queries.
- Schema:
  - `vocab_progress(vocab_id, direction, correct_count, incorrect_count, last_seen)`
  - `sessions(id, started_at, ended_at, duration_sec, card_count, mode)`
  - `session_results(session_id, vocab_id, direction, correct, ts)`
- The vocab list stays bundled (no need to seed it into SQLite —
  it's reference data, not user data).
- Optional but valuable: track *active* study time only (pause the
  session-duration timer on AppState 'background').

### 2. Verb conjugation practice

Data is already in `vocab.json` — 17 forms × kana/kanji per verb.
Build a parallel-structured screen to the vocab flashcard:

- Filter by lesson (reuse `LessonBlocks`), word type (verb auto-selected),
  verb group, form (which conjugation to test).
- Prompt: dictionary form (or ます-form) + the target conjugation name.
- Answer: the target conjugated form (kana + kanji).
- Same 2-button commit / reveal flow.

This is the second JLPT-essential drilling feature.

### 3. Grammar practice

The biggest gap in current apps. Per-lesson grammar points (~3–5 per Minna
lesson). Each point: a brief original explanation + 5–10 practice
sentences. Practice format TBD — multiple choice and fill-in-the-blank
are obvious starts; sentence ordering / particle picking come later.

Content generation: AI-drafted, instructor-reviewed (see `DATA.md`).

### 4. Translation practice

User reads a native-language sentence, types or speaks the Japanese
equivalent. At launch: exact-match (after kana normalization). Later:
LLM-as-judge for "is this a valid translation."

### 5. Voice recognition (v1.5)

- Library: `whisper.rn` — local on-device, no API cost.
- Two features:
  - Flashcard in native language, user speaks Japanese vocab.
  - Sentence in native language, user speaks Japanese translation.
- Scoring: launch with normalized exact-match (kana form, edit-distance
  tolerance for recognizer slips). Next iteration: accept-set (instructor
  authors 3–5 valid answers per prompt). Final iteration: LLM-as-judge.

Architecture decision: **the scoring module is separate from the UI** so
swapping exact-match → accept-set → LLM-judge is a module change, not a
rewrite.

## v1 → v2 bridge: validation gate

Before scope expands, validate. Concrete bar:

- ≥50 JLPT learners using the app for ≥2 weeks
- Measured day-7 retention number
- At least a few paying customers (any conversion at all)

If retention is real, proceed. If not, fix the core before adding
breadth.

## v2 — Cloud, accounts, social

### 6. Auth + Firestore sync

Local-first writes; background sync to cloud. Anonymous SQLite progress
gets attached to an account on sign-up.

- **Firebase Auth** for identity (Google / Apple / email).
- **Firestore** for synced user data:
  - `users/{uid}` profile (display name, native lang, optional city/country)
  - `users/{uid}/progress/{vocab_id}` mirrored SRS state
  - `users/{uid}/sessions/{session_id}` session history
- Critical: batched sync, not per-card. Per-card writes will burn Firestore
  budget fast.

### 7. Leaderboards (city / country / global)

- Global first (no privacy surface).
- City/country **opt-in only**, manual selection (no silent geolocation).
- Implemented via **rollup docs** updated by Cloud Functions, NOT
  query-on-read. At scale, consider Memorystore (Redis sorted sets) for
  precise ranking.

### 8. Competitions (status rewards only)

Limited-time tournaments. Same data shape as the future game-mode
matches, just with many players and a time window. Cloud Function settles
the result on close.

**Status rewards only at this stage** — badges, titles, "Season N winner"
flair. NOT subscription-month payouts.

### 9. Server-side score validation + abuse detection

**Prerequisite for cash-value rewards.** Cannot trust the client to
report scores. The moment money is on the table, scripts and
multi-accounting follow.

### 10. Cash-value rewards (subscription months)

Only after #9 ships. Cap monthly budget. Treat as a marketing line item.

## v3 — Game mode

The "real-time competition" feature.

**Important distinction**: Firestore is a database, not a game server.

- **Async / turn-based** ("you both get the same 20 cards") — Firestore
  handles this today. Build this first.
- **Live head-to-head** (shared timer, ticker updates) — needs a
  persistent connection layer. Options: Cloud Run WebSocket service, or
  **Firebase Realtime Database** (different from Firestore — built for
  ephemeral live state). Matchmaking via Cloud Function; match runs over
  socket; result settled to Firestore.

**Don't build live multiplayer until traction justifies the ops/on-call
cost.** Async-first covers 80% of the social hook for 20% of the
infrastructure.

## v4 — Multi-language expansion

The real long-term vision: PeraPera's engine is fundamentally a
**test-prep language learning** product. Japanese (JLPT) is the wedge;
the franchise is:

- Korean (TOPIK)
- Chinese (HSK)
- Eventually others

Architecture should NOT couple Japanese-specific logic into the core. Verb
groups, kana handling, particle parsing — keep these in language-specific
modules. The SRS engine, the deck builder, the session flow, the cloud
sync — language-agnostic.

This is also the **best argument against Duolingo-as-ceiling**:
"the dominant serious-test-prep app for every major Asian language" is a
defensible $100M+ business; not Duolingo, but real.

## Recurring temptations to push back on

- "Let's add streaks" — no, that's Duolingo. We don't compete there.
- "Let's add in-app chat" — Discord. Moderation/safety burden not worth
  it for a study-app team.
- "Let's add example sentences from textbooks" — never. Legal risk.
  Generate originals + instructor review.
- "Let's add 30 languages" — see v4. Japanese first, validate, expand
  deliberately.
- "Let's promise 100% accuracy on AI-generated content" — every AI
  output that ships to users needs an instructor review pass first.
