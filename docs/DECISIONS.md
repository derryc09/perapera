# PeraPera — Decision Log

A record of consequential decisions and the reasoning. When something
"feels off" later, check this first — there's a good chance there's a
reason we picked the current path.

Format: each entry is a decision + the rationale + (where relevant)
the alternative we rejected.

---

## Product strategy

### Curriculum-aligned, JLPT-serious is the wedge
Picked over: broad/casual / Duolingo-style.
Reason: that segment is dominated. The serious-learner-with-curriculum
niche is underserved and willing to pay.

### Don't try to be Duolingo
Reason: Duolingo is mass-market casual; competing there gives up the
wedge. The realistic ceiling is "dominant serious test-prep app",
multi-language. That's a $100M+ business, not $15B. Build for that.

### Position vs Anki: "found before Anki, not instead of Anki"
Reason: Anki users are habituated; community moat is real. Capture
learners at the beginning of their journey when they're choosing a tool
alongside their textbook, not after they've sunk hours into Anki decks.

### MVP = vocab + conjugation + grammar + voice
Cut from MVP: leaderboards, social, rewards, multi-language.
Reason: scope creep kills indie apps far more than weak ideas do. Ship
the wedge; validate; expand.

---

## Content / data

### Use AI for first drafts, instructors for final review
Applies to: vocab categorization, conjugations, future example sentences
and grammar explanations.
Reason: AI generation can't be promised 100% accurate; spot-checks
caught real bugs even after careful coding. Human review is the only
honest path to 100%. The economics work because AI does the heavy lift
and instructors review, not author.

### Source data: Minna no Nihongo vocabulary list
Risk: compilation copyright on lesson grouping.
Mitigations committed to:
- Migrate spine to JLPT levels eventually (public standard, not one
  publisher's property)
- Instructor-refined groupings = independent editorial work
- All explanations/examples original
- Never market as "the Minna app"; nominative reference only

### Chinese glosses only at launch
Reason: source data has Chinese only; instructors are Taiwanese
(native Chinese speakers). English glosses are post-launch work.

### No example sentences in source data
Reason: textbook examples are copyrighted. Future examples will be
instructor-written or AI-generated + instructor-reviewed.

### Conjugation accuracy: ~99%, with ReviewFlag for known-uncertain rows
Rejected: claiming 100% accuracy.
Reason: spot-checks during generation found real bugs (kudasaru-family,
kuru-compound kanji). Promising 100% would have shipped errors. Honest
flagging + instructor pass = real 100%.

---

## Architecture

### Expo (managed) + TypeScript + Zustand
Picked for: shortest path from idea to running on a device.
Rejected: bare React Native (too much setup); Redux (overkill); MobX
(extra concepts for no benefit at this scale).

### Bundled JSON for vocab data (1.3MB)
Picked over: SQLite-from-launch for reference vocab.
Reason: 2,189 rows is trivially small in memory; bundling avoids needing
a seed step. **User progress** migrated to SQLite when persistence shipped
(vocab list stays bundled). See **Metrics & persistence** below.

### Drop the SRS rating system; binary correct/incorrect
Rejected: 4-grain Anki-style ratings; familiarity scoring; "Focus on
weak" toggle.
Reason: founder wanted simpler UX. The complexity wasn't earning its
keep — we were building infrastructure ahead of demand. Keep the door
open via `ts-fsrs` (well-maintained package) when SRS returns.

### Lesson selector: 5-block chips with drill-down
Rejected: range slider (only allows contiguous selection — lost the
"3, 7, and 20" case); flat grid of 50 (too tall — 9 rows of chips);
drag-to-paint gesture (clever but fights vertical scroll).
Reason: blocks let users think in chunks (which is how they actually
think about progress), drill-down handles the surgical case.

### Word-type filter: 4 groups (Noun / Verb / Adjective / Other)
Rejected: showing all 12 underlying POS types as top-level chips.
Reason: 12 is too many; users don't think in 12 categories. Categories
panel handles the i/na split where it's actually grammatically useful.

### Production mode as default (native → Japanese)
Rejected: Recognition as default.
Reason: production is harder (you have to *generate* the Japanese);
making it default trains the harder skill by default.

### Mixed-direction mode removed
Reason: complexity for no gain. Recognition and Production are distinct
study activities; mixing them is rarely what users want.

---

## Metrics & persistence

### Raw event log is the source of truth
**Raw (append-only, never UPDATE/DELETE on facts):**
- `session_results` — one row per committed card answer
- `study_sessions` metadata — `started_at`, `mode`, `filter_json`, `feature`,
  `card_count`, and session-close fields (`ended_at`, `active_duration_sec`,
  `completed`, `quit_at_index`)

**Derived (rebuildable caches — not canonical):**
- `vocab_progress` — running totals per word × direction
- `daily_rollup` — pre-aggregated daily stats for fast reads
- Counters on `study_sessions` (`cards_answered`, `correct_count`) — should
  match `session_results` but are not authoritative
- Home dashboard stats (JLPT estimate, coverage, readiness %) — computed at
  read time from progress + reference vocab

**Policy:** log every user action once; treat all summaries as disposable
views of that log. If metric definitions change, update derivation code and
recompute caches — do not rewrite raw rows.

**Not yet done (known gaps):** full deck queue not stored per session;
`card_index` not on each result; home stats still read `vocab_progress`
instead of aggregating raw results directly. See future work in
`ARCHITECTURE.md`.

### Bundled JSON for vocab; SQLite for user data
Vocab reference data stays in bundled `vocab.json`. User progress lives in
**expo-sqlite** + **drizzle-orm** (`src/db/`). Settings (`appLang`,
`nativeLang`) persist in `user_settings`.

Rejected: seeding the full vocab list into SQLite at launch.
Reason: 2,189 rows is trivial in memory; the CSV/JSON pipeline stays the
content source of truth.

### Study time = per-card foreground seconds, capped at 15s
**What "study time" means on the home screen:** the sum of foreground
time spent on each card during a session, where each card contributes at
most **15 seconds**.

Rules:
1. **Per card, not per session.** The timer resets when the user advances
   to the next card (`session.index` changes). Prompt and reveal on the
   same card share one budget.
2. **15-second cap per card.** Foreground counting stops once a card hits
   15s. It does not resume until the next card. Prevents idle screens
   (e.g. study left open overnight in the foreground) from inflating stats.
3. **Foreground only.** AppState background/inactive pauses the clock
   (same as before). Locked phone / app switcher = paused.
4. **Deck builder doesn't count.** Timer runs only on `/study` with an
   active session. Opening vocab filters without starting adds zero time.
5. **Persisted on session close.** `active_duration_sec` is written when
   the user finishes or quits (✕). Unfinalized sessions contribute zero
   to home totals until closed.
6. **Cap is tunable.** Constant `CARD_STUDY_TIME_CAP_SEC` in
   `src/studyTiming.ts`; implementation in `src/hooks/usePerCardStudyTimer.ts`.

**Also stored but not shown on home:** `duration_sec` = wall-clock
`ended_at − started_at` (includes background idle while session open).

**Example:** 25-card session where every card hits the cap → max 375s
(~6.3 min) of study time regardless of real elapsed time.

Rejected: uncapped session-wide foreground timer.
Reason: one abandoned study screen could dominate metrics; per-card cap
matches flashcard pacing and keeps derived stats trustworthy.

### Metric definitions (derived — change here, recompute, not raw)
| Term | Definition |
|------|------------|
| **Practiced (word/phrase)** | Distinct `vocab_id` with ≥1 row in `vocab_progress` (or ≥1 `session_results` row once raw aggregation is canonical) |
| **Word vs phrase** | `partOfSpeech === 'phrase'` → phrase; everything else → word |
| **Accuracy** | `correct / (correct + incorrect)` over all committed answers |
| **JLPT band coverage** | Distinct practiced IDs in band ÷ total IDs in band (from reference vocab) |
| **Band accuracy (home)** | Production-direction correct ÷ total production answers, band-scoped |
| **Estimated level** | Highest band with ≥50% coverage, ≥60% production accuracy, ≥20 words practiced; else N5. Readiness % = average of coverage + production accuracy for that band |

---

## Study card design

### Prompt anchored at the top across both stages
Rejected: prompt and answer occupying the same slot (eye had to
re-locate fields on reveal); centered scaffold (positions shifted when
empty fields were absent).
Reason: founder noted "my eyeball is jumping up and down on each flip"
— a real spatial-cognition flaw. Anchoring the prompt lets the eye
flow top-to-bottom on reveal, predictable, calm.

### Prompt stays in same color on reveal (does NOT dim)
Rejected: dimming prompt to ink2 on reveal.
Reason: founder pushback — "lets just keep it the original question
rather than making it lighter." Visual stability matters; the prompt is
still useful context during reveal.

### Same size for prompt and answer text
Rejected: oversized answer; shrinking prompt on reveal.
Reason: founder direction — "the answer doesn't need to be too big. It
should be around the same size, but visually distinct." Color + position
+ a small "ANSWER" label do the distinguishing work.

### Two-button commit (Don't recall / I know this); no flip
Rejected: 4-button SRS rating; tap-to-flip card.
Reason: forces honest commitment (can't peek then claim you knew it);
keeps the UI radically simple.

### No verdict pill ("KNEW IT" / "REVIEW") on reveal
Reason: founder noted it caused layout shift in the meta row and served
no clear purpose. The user already knows what they chose.

### Only Lesson tag shown on reveal (POS and Category removed)
Reason: clutter. Lesson is the actionable context ("this is from L7");
POS/Category are already filterable from the deck builder.

### Progress bar = committed answers count
Rejected: progress = current index + half-step at reveal.
Reason: half-step formula caused flicker on stage transition; honest
read is "how many cards have been answered."

### Reset stage BEFORE incrementing index in `next()`
Rejected: useEffect-on-index to reset stage reactively.
Reason: the reactive pattern leaves a 1-frame window where the new
card's data renders with the old stage, causing answer "flash." Setting
stage synchronously before index removes the race.

---

## Visual identity

### Washi-paper palette + Klee One (Japanese) + Fraunces (display)
Picked for: "serious tool, not a toy" — distancing from Duolingo's
cartoon energy and Anki's generic UI.
Rejected: any green/owl/streak-flame iconography.

### Accent color = "this is the answer / focus"
Reason: a specific signaling rule, not a generic "primary." Overuse
dilutes the meaning. Use accent for: the answer on a study card, an
active filter, a single CTA per screen.

### Icons via @expo/vector-icons (Ionicons), not text glyphs
Reason: text carets like ⌄ render inconsistently across platforms and
fonts. Ionicons chevron-down is consistent and crisp; ships with Expo.

### "Clear" in section header, not as a separate row
Rejected: a "Clear selection" button that appears below the filter when
items are selected.
Reason: it caused layout reflow on the first selection. Pinning it in
the section header (right slot) means zero movement — the button is
always there, just toggles its enabled state.

---

## Infrastructure

### GCP-only for cloud
Reason: founder is a Google PM; familiarity > raw best-fit comparison.
Firestore + Cloud Functions handle the planned scale through v2.

### Firestore for synced user data (not Cloud SQL)
Reason: built-in offline persistence and sync for mobile is worth more
than SQL's query power for this stage. Migrate later if analytics needs
demand it.

### Local-first writes with batched cloud sync
Rejected: per-card writes to Firestore.
Reason: cost (Firestore bills per write) and offline-tolerance. Local
SQLite is the source of truth; cloud is a mirror that catches up.

### Async multiplayer before live multiplayer
Reason: live needs a WebSocket layer (Cloud Run or Firebase Realtime
Database) and ongoing on-call cost. Async handles 80% of the social
hook with infrastructure that already needs to exist.

### Status rewards before cash-value rewards
Rejected: launching subscription-month rewards with launch leaderboards.
Reason: the moment money is on the table, scripts/multi-accounting/abuse
appear. Server-side score validation must ship first.

---

## Voice recognition

### Whisper.rn for v1
Reason: on-device, no API cost, no latency, no privacy concerns. Good
enough for the launch bar.

### Scoring module = separable from UI
Reason: launch scoring is exact-match-after-normalization (kana form,
small edit-distance tolerance). Next iteration: accept-set authored by
instructors. Final: LLM-as-judge. Keeping the scorer a swap-in module
means each upgrade is one file's change, not a rewrite.

### Don't promise pronunciation feedback at launch
Reason: Whisper gives you transcription, not phoneme-level scoring.
"Did you say the right thing" is launchable; "is your pitch accent
correct" is not, and overpromising hurts trust.
