# PeraPera — Design Language

The UX principles that have been locked in across many iterations. When
building a new screen, this is the source of truth for *how it should feel*.

---

## Core principles

1. **Serious tool, not a toy.** PeraPera is for learners with goals. Visual
   language is calm and editorial — closer to a study notebook than a
   gamified app. No cartoon characters, no celebration animations, no
   streaks-as-emotional-blackmail.

2. **The eye should never search.** Every screen has predictable spatial
   layout. Same information lives in the same place every time. The
   user's brain stops scanning and starts reading. This matters on a
   flashcard app where someone does hundreds of cards in a session.

3. **Minimum formatting needed for clarity.** No bold-everything, no
   excessive headers, no decorative emoji. Lists, bullets, and headers
   only when content is genuinely multi-faceted.

4. **The UI must be intuitive without explanation.** Remove explainer
   text. If something needs a "Tap X to do Y" hint, redesign it. Trust
   the user to figure out a simple interface.

5. **Fixed positions over dynamic balance.** Empty slots stay empty;
   fields do not slide up to fill them. Reflow is the enemy.

## Visual identity

- **Palette**: washi paper — `#f6f0e4` background, ink `#2a2620`, muted ink
  `#6f6557`, vermilion accent `#c5452c`. Warm, slightly aged feel.
- **Japanese type**: **Klee One** (looks like textbook handwriting) for
  all kanji and kana. This was a deliberate identity choice — distances
  PeraPera from Anki/Duolingo's generic Helvetica-Japanese.
- **Display type**: **Fraunces** (serif) for big numbers and display text
  like the count "2,189 words".
- **Body**: **Hanken Grotesk** (sans) for UI labels and meanings.

## The accent color rule

`theme.accent` (vermilion) marks **the answer** or **focus**. It's not a
generic "primary" color. Use it only when something is the answer the user
is being tested on, a thing they should look at first, or an active filter
state. Overuse dilutes the signal.

## Filter UI — the design we landed on

After several iterations:

- **Lessons**: block-chip selector. 10 blocks of 5 lessons each
  (`1–5`, `6–10`, …). Tap a block → selects all 5. Tap the ⌄ caret next
  to it → drill-down panel with the 5 individual lessons. **Accordion**:
  one drill-down at a time. Partial state shows `n/5` indicator. Drill-down
  closes automatically on: selecting a block, opening another, clicking
  Clear, or scrolling past a small threshold (`SCROLL_CLOSE_PX = 36`).
- **Word type**: 4 top-level groups — Nouns, Verbs, Adjectives, Other.
  Adjectives includes both i- and na- under the hood.
- **Study mode**: 2 cards — Production (native → JP, default) and
  Recognition (JP → native). Mixed mode was removed as unnecessary
  complexity.
- **Session size**: 10 / 25 / 50 / All (always visible).
- **More options** (collapsible): Verb group filter, semantic categories.
  Collapsed by default; shows a count badge if hidden filters are active.

## "More options" — sub-filter philosophy

The Categories panel changes shape based on what's in scope:

- **Nouns / Verbs in scope** → rich semantic category chips
  (transport, family, food-drink for nouns; v-motion, v-daily for verbs).
- **Adjectives in scope** → two chips: i-Adjectives / na-Adjectives.
  (Selecting one writes to `filters.pos`, not categories — the i/na
  distinction is grammatical, not semantic.)
- **Other in scope** → row of POS checkboxes (Adverbs, Phrases, Pronouns,
  Conjunctions, Particles, Suffixes, Interjections, Prenominals).

The general rule: **when a POS has only one category, don't show a
single-chip "category"** (no "Function words" chip). Use the POS itself
as the selectable.

The `HAS_RICH_CATEGORIES` constant in `meta.ts` controls this; currently
only `'noun'` and `'verb'` qualify.

## Study card — the locked layout

After many iterations, the structure is:

```
┌─────────────────────────────────────┐
│ ✕   ████████░░░░░░░░░░    7/25     │  top bar (progress)
│   日本語 → 中文                       │  meta row (direction)
├─────────────────────────────────────┤
│                                     │
│           PROMPT (top, fixed)       │  prompt header — always here
│                                     │
│           ─────────                 │  divider (reveal only)
│                                     │
│           ANSWER                    │  small label (reveal only)
│           [kanji + kana + romaji    │  answer block (reveal only)
│            OR meaning]              │
│                                     │
│           [Lesson 5]                │  tag (reveal only)
│                                     │
├─────────────────────────────────────┤
│  [Don't recall]    [I know this]    │  commit buttons (prompt stage)
│                 OR                  │
│       [Next question]               │  next button (reveal stage)
└─────────────────────────────────────┘
```

### Why this works

- **Prompt always at the top** across both stages. The user's eye never
  has to re-locate it. Reveal stage just adds content *below* the prompt
  — eye flows top-to-bottom naturally.
- **Prompt stays the same color** on reveal (does not dim). The user said
  "I know what the prompt was; don't change it." Visual stability matters.
- **Answer slots have reserved heights** so a verb with no kanji doesn't
  cause the layout to shift — the kanji slot stays empty but the kana,
  romaji, and meaning below sit where they always sit.
- **Same size, different role**: prompt and answer are at similar point
  sizes. What distinguishes them is **color** (ink vs accent), **position**
  (above vs below the divider), and a small "ANSWER" label.

### Slot heights (the tuning knobs in `study.tsx`)

```
PROMPT_KANJI    = 80px   accommodates 一生懸命-sized compounds
PROMPT_KANA     = 36px
PROMPT_MEANING  = 120px  3 lines at fontSize 26 / lineHeight 34
ANS_KANJI       = 70px
ANS_KANA        = 36px
ANS_MEANING     = 110px  3 lines
ANS_ROMAJI      = 22px
```

Long Chinese glosses wrap to 3 lines with tail ellipsis. Don't shrink
these below current sizes without testing against the longest entries.

## The two-button commitment model

Originally there were 4 SRS rating buttons (Again/Hard/Good/Easy) and a
flip-the-card flow. We collapsed to:

- **Prompt stage**: two buttons — **Don't recall** (left, red) and
  **I know this** (right, green).
- **Reveal stage**: single **Next question** button.

Why: it forces honest commitment (you can't peek and rationalize), and
keeps the UI dead simple. The SRS engine that consumed 4-grain ratings
was removed; data model is now binary `correct: boolean` per card.

If/when SRS returns, the UI stays 2-button; map "I know this" → good,
"Don't recall" → again under the hood.

## Animation philosophy

- **FadeIn for content reveals.** No slides, no scales, no springs.
- **No success/failure celebration.** Adults don't need a "great job!"
- **Stage transitions are instant where possible**, animated only if the
  alternative is jarring (e.g. the answer fading in is gentler than
  popping in).

## What we don't do

- No streak badges, no XP, no leaderboards in-app (yet — see ROADMAP).
- No emoji in UI strings.
- No success sounds.
- No "you're on fire" / "keep going" copy. Just the work.
- No reflow on selection. Buttons appearing/disappearing must be in
  reserved space, never push other content.

## Mockup-first for new interactions

For non-trivial new UI (the lesson selector was the canonical example),
sketch an interactive HTML mockup in chat-claude.ai *before* writing RN
code. Saves multiple Cursor iterations on the same component. The "block
chip + drill-down" design was settled this way.
