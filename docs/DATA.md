# PeraPera — Data Pipeline

The vocabulary data underlying PeraPera. This file is the record of where
it came from, what's been done to it, what's known-imperfect, and how to
regenerate the in-app data when content changes.

---

## Source

`scripts/Vocabulary_with_conjugations.csv` — the canonical source of
truth. 2,189 rows, 46 columns. UTF-8 with BOM.

Originally derived from a Minna no Nihongo-aligned vocabulary list, then
processed through 5 cleaning/enrichment passes (see history below).

## Columns

| Column            | What it is                                      |
|-------------------|-------------------------------------------------|
| `Lesson`          | Minna lesson number (1–50)                      |
| `Section`         | textbook section (単語 / 練習C / 読み物 etc.)   |
| `Number`          | order within the section                         |
| `Kana`            | hiragana/katakana reading                        |
| `Kanji`           | kanji form (may be blank)                        |
| `Chinese`         | Chinese gloss (the only translation currently)   |
| `Type`            | normalised part-of-speech (12 values)            |
| `Category`        | semantic sub-category (38 buckets)               |
| `VerbGroup`       | I / II / III for verbs; blank otherwise          |
| `動詞基本体_kana` … `意向形_kanji` | 34 conjugation columns (17 forms × kana/kanji) |
| `ReviewFlag`      | instructor-review markers (see below)            |

### Type values (12)

`Noun`, `Verb`, `i-Adjective`, `na-Adjective`, `Adverb`, `Phrase`,
`Pronoun`, `Conjunction`, `Particle`, `Suffix`, `Interjection`,
`Prenominal`.

### Category values (38)

Nouns: `people`, `family`, `occupation`, `country`, `proper-noun`,
`place`, `transport`, `food-drink`, `clothing`, `stationery`,
`electronics`, `furniture`, `body-health`, `nature-weather`,
`animals-plants`, `hobby-sport`, `arts-media`, `language-study`,
`communication`, `money-shopping`, `position`, `number-quantity`,
`time`, `abstract`, `object` (generic fallback).

Verbs: `v-motion`, `v-daily`, `v-communication`, `v-thinking`,
`v-workstudy`, `v-transaction`, `v-handling`, `v-change`, `v-other`
(generic fallback).

Other: `descriptive` (adjectives), `greeting` / `expression` (phrases),
`function` (function words).

## The 17 conjugation forms

For every verb with `VerbGroup`, all 17 forms are generated. Both kana
and kanji columns are populated (kanji blank for verbs without kanji).

Forms (some are intentional duplicates per the original spec):

```
動詞基本体      dictionary form
辭書形          dictionary form (duplicate label, kept)
ます形          polite present
敬体            polite present (duplicate of ます形, kept)
ました形        polite past
ません形        polite negative
て形            te-form
た形            plain past
否定形          plain negative (ない)
なかった形      plain past negative
ない形stem      stem before ない
仮定形          conditional (ば)
可能形          potential
受身形          passive
使役形          causative
使役受身形      causative-passive
命令形          imperative
意向形          volitional
```

## The 5-pass cleaning history

These scripts are kept in `scripts/` for reproducibility. They were run
in sequence; each builds on the previous output.

| Pass | Script                  | What it did                                  |
|------|-------------------------|----------------------------------------------|
| 1    | `clean_vocab.py`        | Normalised Type case, filled 320 blanks, repaired 9 garbage entries, fixed obvious mis-types. |
| 2    | `categorize_vocab.py`   | Split Adjective → i-Adjective / na-Adjective. Assigned semantic categories via keyword classifier over Chinese glosses. |
| 3    | `verb_group.py`         | Extracted Ⅰ/Ⅱ/Ⅲ markers from the Kana field (cleaning Kana). Inferred groups for the 54 unmarked early-lesson verbs. |
| 4    | `fix_suru_verbs.py`     | Flipped 13 pure suru-verbs (コピーします, 紹介します, etc.) from Phrase to Verb with proper verb category. |
| 5    | `conjugate_verbs.py`    | Generated 17 conjugation forms × kana/kanji for all 439 verbs. Used rules for Groups I/II + an irregular-overrides table for Group III, kudasaru-family, 行く, ある, 来る compounds, etc. |

## ReviewFlag — what to trust, what to verify

Set on rows that warrant instructor review before being shown to users.
Multiple values can be present, semicolon-separated. The set:

- `inferred-group` — 50 verbs whose I/II/III was inferred (not in source
  data). Highest priority for review — if the group is wrong, all 17
  conjugations are wrong.
- `irregular-override` — 100 verbs handled by the irregular table.
  Verify the override is the standard textbook form.
- `no-kanji` — verb has no kanji form. The kanji columns are blank.
  Sanity check: confirm nothing was missed.
- `failed: <reason>` — 5 rows the script couldn't process (already
  conjugated forms, idioms, etc.). Need manual entry.

The realistic accuracy ceiling, by construction, is **~99%**. Spot-checks
during generation confirmed the standard rules and the major irregulars
(行く, 来る, する compounds, kudasaru family). Residual risk is concentrated
in the inferred-group set.

**Before the conjugation feature ships, native-speaker review of the
~150 flagged rows is recommended.**

## The 5 unconjugated verbs (need manual entry)

| CSV row | Kana                       | Why                       |
|---------|----------------------------|---------------------------|
| 213     | あるいて / 歩いて          | Already in て-form        |
| 630     | つかれました。 / 疲れました。 | Already in past polite    |
| 669     | つけます (no kanji)         | Unmappable ます-stem       |
| 1813    | はなれた / 離れた          | Already in plain past     |
| 2018    | たのしみに しています       | Idiomatic continuous      |

## Known data quirks worth knowing

- **Chinese only.** No English glosses in the source. Adding English
  means adding an `English` column to the CSV and updating the import
  script to populate `meanings.en`.
- **No example sentences.** Deliberately — the source textbook's example
  sentences are copyrighted. Future example sentences must be original
  (instructor-written or AI-generated + instructor-reviewed).
- **No audio.** TBD via Google Cloud Text-to-Speech for v1 (Japanese
  neural voices, ~$1–4 to generate the whole corpus). Human-recorded
  audio is a post-traction quality upgrade.
- **JLPT level is currently derived from lesson** (L1–25 → N5, L26–50 →
  N4). If instructors set real per-word JLPT later, the JLPT filter UI
  can be enabled.
- **Categories are a strong first pass, not gospel.** ~24% of rows fell
  into generic buckets (`object`, `v-other`); these are good instructor
  refinement targets but acceptable for shipping.

## Regenerating vocab.json (the runtime data)

When the CSV is edited:

```bash
cd scripts
python3 import_vocab.py
cp vocab.json ../src/data/
```

Then in the app:

```bash
npx expo start -c        # -c clears Metro cache so the new JSON is picked up
```

That's the whole loop. The Python script is intentionally
dependency-free (stdlib only).

`import_vocab.py` also generates romaji from the kana (handles youon,
gemination, long-vowel marks) — no romaji column needed in the CSV.

## When new content gets added

Adding new vocabulary (e.g. JLPT N3 words, new lessons): append rows to
the CSV with the same columns. The script handles any Lesson number;
update the JLPT-by-lesson rule in `import_vocab.py` if the new entries
need different JLPT mapping than L1–25=N5 / L26–50=N4.

Adding example sentences: add `ExampleJp`, `ExampleZh`, `ExampleEn`
columns, then update `import_vocab.py` to map them onto the `Vocab.example`
field already in `types.ts`.

Adding English glosses: add `English` column, update script to populate
`meanings.en`, and add `en` back to `NATIVE` in `src/meta.ts` so the
language toggle re-enables.

## Instructor workflow (Taiwan instructors)

The pipeline assumes instructors will:

1. Edit the CSV directly (spreadsheet — Google Sheets export → CSV).
2. Focus review on rows where `ReviewFlag` is set.
3. Refine the generic `object` / `v-other` categories where they have
   better judgment.
4. Eventually add original example sentences and English glosses.

After any edit batch: re-run `import_vocab.py`, commit both the CSV and
the regenerated `vocab.json` to git, push a build.
