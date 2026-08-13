# PeraPera — Architecture

The technical state of the app, the decisions behind it, and what is
deliberately *not* there yet. Read alongside `ROADMAP.md` for what's
coming next.

---

## Stack

| Layer            | Choice                       | Why                                  |
|------------------|------------------------------|--------------------------------------|
| Framework        | **Expo** (managed workflow)  | Fastest path; plays well with Cursor |
| Routing          | **expo-router** (file-based) | Screens are files in `app/`          |
| Language         | **TypeScript**, strict       | Catches data-shape bugs early        |
| State            | **Zustand**                  | Light, no boilerplate                |
| Persistence      | **expo-sqlite** + **drizzle-orm** | Local user progress & settings  |
| Animation        | **react-native-reanimated**  | For card transitions                 |
| SVG              | **react-native-svg**         | Used by the (currently-unused) Ring  |
| Icons            | **@expo/vector-icons** (Ionicons) | Comes with Expo, no install   |
| Fonts            | **@expo-google-fonts**       | Fraunces + KleeOne loaded at boot    |
| Styling          | Plain React Native `StyleSheet` | No NativeWind; design tokens in `theme.ts` |

**Dev tooling**: Cursor. The agentic-editing experience lives in Cursor;
chat-claude.ai is reserved for design discussions, large dataset
generation, and visual mockups.

## Project layout

```
perapera/
├── app/                        ← expo-router screens
│   ├── _layout.tsx             font loading + DB init + nav stack
│   ├── index.tsx               Home (stats dashboard)
│   ├── vocab.tsx               DeckBuilder (filter + start)
│   ├── study.tsx               StudySession (prompt + reveal)
│   ├── summary.tsx             SessionSummary (correct/incorrect)
│   └── settings.tsx            App + meaning language
├── src/
│   ├── db/                     SQLite schema, sessions, stats, settings
│   ├── hooks/                  usePerCardStudyTimer, etc.
│   ├── i18n/                   UI strings (en, zh-Hant, ko)
│   ├── studyTiming.ts          CARD_STUDY_TIME_CAP_SEC (15)
│   ├── stats.ts                dashboard formatters + compute entry
│   ├── theme.ts                design tokens (colors, font names)
│   ├── types.ts                core data model
│   ├── store.ts                Zustand store (filters, mode, session)
│   ├── meta.ts                 display metadata (POS groups, categories)
│   ├── ui.tsx                  shared components (Chip, SectionHeader, Pill, Ring)
│   ├── srs.ts                  ONLY the shuffle() helper now (SRS engine removed)
│   ├── LessonBlocks.tsx        block-chip lesson selector with drill-down
│   └── data/
│       ├── vocab.json          bundled vocab + conjugations (~1.3MB)
│       └── vocab.ts            typed re-export of vocab.json
├── scripts/                    Python data-pipeline tools
│   ├── Vocabulary_with_conjugations.csv   source of truth
│   └── import_vocab.py         CSV → vocab.json (run when CSV edits land)
└── docs/                       this folder
```

## Data flow

```
   [Vocabulary_with_conjugations.csv]   ← instructors edit this
              │
              │ scripts/import_vocab.py
              ▼
        [vocab.json]                    ← bundled with the app
              │
              ▼
        [src/data/vocab.ts] ──── VOCAB ────► app screens
```

The CSV is the **source of truth**. The JSON is a generated artifact. The
loop when content changes is: edit CSV → re-run `import_vocab.py` → copy
JSON to `src/data/` → app reload.

No runtime fetch. The full 2,189-word dataset ships bundled in the app —
1.3MB JSON, perfectly fine for an in-memory asset.

## Persistence & metrics

User progress is stored locally in **SQLite** (`perapera.db`), initialized
in `app/_layout.tsx` via `src/db/client.ts`.

### Schema (three layers)

```
L1  RAW (source of truth)
    study_sessions     session metadata + close snapshot
    session_results    one row per committed answer (append-only)

L2  DERIVED CACHES (rebuildable)
    vocab_progress     per vocab_id × direction totals
    daily_rollup       daily study_time / cards / correct aggregates
    user_settings      appLang, nativeLang

L3  UI (never stored as truth)
    Home dashboard     computeDashboardStats() in src/db/stats.ts
```

Reference vocab (`vocab.json`) is **not** copied into SQLite.

### Study time

Home **study time** = Σ per-card foreground seconds, each capped at
**15 seconds** (`src/studyTiming.ts`).

| Behavior | Detail |
|----------|--------|
| When timer runs | `/study` only, while session is active |
| Per card | Prompt + reveal share one budget; resets on next card |
| Cap | Stops counting at 15s/card until user advances |
| Background | Paused when app is backgrounded/inactive |
| Persisted field | `study_sessions.active_duration_sec` on finish or quit |
| Not shown on home | `duration_sec` (wall-clock session length) |

Implementation: `src/hooks/usePerCardStudyTimer.ts`.

### Write path (study session)

1. `vocab` → `createStudySession()` → row in `study_sessions`
2. Each commit → `session_results` + update `vocab_progress` cache
3. Finish / quit → `finalizeStudySession()` with `active_duration_sec`

See `DECISIONS.md` → **Metrics & persistence** for raw-vs-derived policy
and metric definitions.

## State management — what's in the store

`src/store.ts` (Zustand). UI state only — durable data lives in SQLite:

```
appLang           UI language (persisted to user_settings)
nativeLang        gloss language for study (persisted)
filters           { lessons, pos, categories, verbGroups }
mode              'production' (default) | 'recognition'
length            session size (10/25/50/All)
session           active in-memory study queue (+ dbId for SQLite row)
```

**In SQLite, not Zustand:** vocab progress, session history, rollups,
settings. **Still not built:** SRS scheduling state.

## Design tokens — single source of truth

`src/theme.ts` is the **only** place colors and font names are defined.
**Never hardcode a color** in a component file; always reference `theme.*`.

Key tokens:
- `theme.paper` background (#f6f0e4 — washi/parchment feel)
- `theme.ink` / `theme.ink2` primary / muted text
- `theme.accent` the vermilion red — used for the "answer" / focus state
- `fonts.jp` Klee One (Japanese textbook-handwriting style)
- `fonts.display` Fraunces (serif for big numbers / display)

## What's deliberately NOT in the codebase

These are conscious omissions, not oversights:

1. **No SRS engine.** Originally there was a familiarity scheduler;
   simplified to binary correct/incorrect when the rating UI was cut.
   `src/srs.ts` retains only the `shuffle()` helper. If/when SRS returns,
   plan: use the `ts-fsrs` package (don't hand-roll). Progress counters
   in SQLite are a stepping stone, not a scheduler.
2. **No user accounts / no cloud.** No auth, no Firestore, no sync. All
   one-device, anonymous. Cloud arrives in v2 (see ROADMAP).
3. **No audio.** Voice recognition is on the roadmap (Whisper.rn). Audio
   playback (TTS for vocab) is planned for v2.
4. **No social, no leaderboards.** Explicitly post-validation work.
5. **No English glosses in vocab data.** Chinese-only in CSV for now;
   English column + `meanings.en` is post-launch content work.

## Performance / size notes

- `vocab.json` is 1.3MB — fine for bundled import. JS parses it once on
  app start; queries against the in-memory `VOCAB` array are negligible
  (2,189 entries).
- Font loading happens once in `_layout.tsx`; if it fails, the screen
  shows blank `theme.bg` rather than crashing (intentional fallback).
- Reanimated runs on UI thread for the card fade-in — no jank expected on
  any phone made in the last 5 years.

## Conventions

- All user-facing text inside `<Text>` (RN requirement, but easy to forget).
- New colors / fonts go in `theme.ts` *first*, then get referenced.
- Vocab data conforms to the `Vocab` interface in `src/types.ts`.
- Conjugations are NEVER mutated at runtime — they're frozen reference data.
- `ReviewFlag` rows in the CSV are instructor-review work; surface them in
  any future "review" / "admin" tools.
