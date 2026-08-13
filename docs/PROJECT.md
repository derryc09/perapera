# PeraPera — Project Context

This is the durable record of *why* PeraPera exists, who it's for, and the
strategic decisions that shape every product and engineering choice. Keep
this current. When in doubt about scope or direction, this file is the
tiebreaker.

---

## What PeraPera is

A Japanese-language learning app for **serious learners** — people studying
toward standardized proficiency tests (JLPT N5 → N1), not casual users
collecting streaks. The wedge: **curriculum-aligned, JLPT-serious, and
voice-friendly**, in a market where existing apps each miss at least two of
those three.

The name "PeraPera" (ぺらぺら) is the Japanese onomatopoeia for fluent speech.

## Who it's for

Concretely: an adult learner working through a structured curriculum
(Minna no Nihongo is the canonical example), aiming for a JLPT level, who
will pay $5–10/month for a tool that respects their seriousness. Often a
classroom student looking for a companion to their textbook.

NOT for: casual dabblers, kids, gamification-driven users. Duolingo serves
them better; we don't try to compete there.

## The wedge — why this can win

The current landscape:

| Tool        | Strength                | Critical gap                              |
|-------------|-------------------------|-------------------------------------------|
| Duolingo    | habit, broad reach      | weak on grammar depth, not JLPT-aligned   |
| WaniKani    | SRS for kanji/vocab     | reading only, no production / no grammar |
| LingoDeer   | structured curriculum   | not tied to a specific textbook           |
| Anki        | community decks, SRS    | brutal UX, $25 iOS app, user builds all   |

**No one** combines: textbook-aligned curriculum + JLPT prep + verb
conjugation drilling + voice-friendly interaction. That gap is the moat.

The market: online Japanese learning was ~$860M in 2025, projected $2.5B by
2032 (16% CAGR). Anime/manga interest globally is rising; serious
JLPT-aligned learners are an underserved, willing-to-pay slice.

## The honest ceiling

This is **not a Duolingo-scale ($15B+) opportunity**, and that framing is
the wrong one to chase. Duolingo is mass-market casual; chasing that gives
up the wedge and loses to Duolingo. PeraPera's defensible ceiling is
"the dominant serious-test-prep language app" — eventually multi-language
(JLPT → TOPIK → HSK). That's a genuinely venture-scale business in the
hundreds of millions to low billions range, not tens of billions. Build for
that, not for Duolingo.

## Competitive posture vs Anki specifically

Anki's strength is its community (millions of shared decks, plugins, deep
customization). Its UX is genuinely bad. Don't position as "kill Anki" —
position as **"the app serious learners find *before* they ever try Anki."**
Capture them at the start of their journey when they're picking up a
textbook, not after they've sunk hours into Anki decks.

## Founder context

- Building solo at first
- Works as a PM at Google → familiar with Google Cloud
- Currently taking Japanese classes (test user #1)
- Plans to hire Japanese instructors from **Taiwan** for content review
  (strong Japanese proficiency, cost arbitrage). This is a real ongoing
  pipeline, not a one-off

## Go-to-market

- **Community first**: Discord (not in-app chat — avoids moderation/safety
  burden, meets users where Japanese-learner communities already are)
- **Social media + content** for top-of-funnel
- **Freemium model**: free for core lessons, paywall around advanced JLPT
  practice packs, voice mode, progress analytics
- **Pricing target**: $5–10/month — serious learners pay, and this clears
  the "$25 lifetime app" Anki resentment

## Legal posture — important, recurring

There is a real but **manageable** copyright question because PeraPera's
lesson structure mirrors Minna no Nihongo's 50-lesson sequence. Key points:

- **Individual vocab words are not copyrightable.** Safe.
- **Compilation copyright** can protect the *selection and arrangement* of
  vocab into lessons. This is the only arguable exposure.
- **Idea/expression and merger doctrine** are strong counterarguments —
  beginner sequencing is largely functional, not creative expression.
- **Original explanations and original example sentences** (no copying
  textbook prose). This is firm.
- **No example sentences from the textbook are used.** Examples are either
  written by instructors or generated and instructor-reviewed.
- The realistic exposure is "publisher sends an annoyed letter," not
  "lawsuit kills the company." Especially pre-revenue.

**Risk-reduction moves we're committed to:**

1. Treat the vocab list as a *starting reference*; instructor review and
   refinement of selection/grouping = independent editorial judgment.
2. Consider migrating the curriculum spine from lesson numbers to
   **JLPT levels** (N5 → N1) — public standard, not one publisher's
   property. Minna-compatible view is offered, but the spine is JLPT.
3. All explanations, examples, and grammar prose are original.
4. Trademark: never market as *the* Minna no Nihongo app. Nominative
   reference ("compatible with the lesson structure of popular textbooks")
   is acceptable.
5. Get a real IP lawyer consult before raising serious money or going
   high-profile. Especially someone familiar with Japanese copyright.

## Funding stance / valuation reality check

Honest snapshot:
- **Right now (pre-launch, no users)**: a friends-and-angels pre-seed cap
  in the rough ~$1–3M range is plausible — it's a bet on the founder, not
  the product, because there's no evidence to underwrite.
- **With v1 + early retention signal**: ~$5–12M seed plausible.
- **With retention + revenue + first language expansion proven**:
  Series A territory.

The valuation conversation is the wrong one to optimize. The single input
that determines all of those numbers is **retention**: do serious learners
open the app daily, and do they pay. Nothing else matters more.

## Strategic discipline (the recurring temptation to fight)

The vision has expanded across conversations to: flashcards + conjugation +
grammar + translation + voice + leaderboards + competitions + rewards +
community + multi-language expansion.

Each is reasonable. **Together they're a multi-year roadmap**, and scope
creep kills indie apps far more often than weak ideas do.

**MVP discipline:**
- v1 = vocabulary flashcards + verb conjugation practice + grammar practice
- v1.5 = voice recognition (whisper.rn)
- Everything else (leaderboards, competitions, rewards, social, multi-lang)
  is **explicitly post-validation** — design so nothing blocks them; do not
  build them until v1 retention proves the core thesis.

**Validation gate**: ~50 real JLPT learners using v1 for two weeks, with a
measured day-7 retention number, before expanding scope.
