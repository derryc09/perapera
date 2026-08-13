#!/usr/bin/env python3
"""
PeraPera — import pipeline (v2: includes verb conjugations).
Converts Vocabulary_with_conjugations.csv into vocab.json.

Run from the project root:
    python3 scripts/import_vocab.py
Output: vocab.json (defaults next to script; set VOCAB_OUT to redirect)
"""
import csv, json, re, sys, os

SRC = os.environ.get('VOCAB_CSV', 'Vocabulary_with_conjugations.csv')
OUT = os.environ.get('VOCAB_OUT', 'vocab.json')

POS_MAP = {
    'Noun': 'noun', 'Verb': 'verb', 'i-Adjective': 'i-adjective',
    'na-Adjective': 'na-adjective', 'Adverb': 'adverb', 'Phrase': 'phrase',
    'Pronoun': 'pronoun', 'Conjunction': 'conjunction', 'Particle': 'particle',
    'Suffix': 'suffix', 'Interjection': 'interjection', 'Prenominal': 'prenominal',
}

# the 17 conjugation forms (column-prefix names, matching the CSV)
FORMS = [
    '動詞基本体', '辭書形',
    'ます形', '敬体',
    'ました形', 'ません形',
    'て形', 'た形',
    '否定形', 'なかった形', 'ない形stem',
    '仮定形', '可能形',
    '受身形', '使役形', '使役受身形',
    '命令形', '意向形',
]

# ---- kana -> romaji --------------------------------------------------------
KATA = 'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロワヲンヴ'
HIRA = 'ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろわをんゔ'
K2H = {k: h for k, h in zip(KATA, HIRA)}

ROMA = {
 'あ':'a','い':'i','う':'u','え':'e','お':'o',
 'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
 'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
 'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
 'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
 'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
 'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do',
 'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
 'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
 'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
 'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
 'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
 'や':'ya','ゆ':'yu','よ':'yo',
 'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
 'わ':'wa','を':'o','ん':'n','ゔ':'vu',
 'ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o',
}
YOUON = {
 'きゃ':'kya','きゅ':'kyu','きょ':'kyo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
 'しゃ':'sha','しゅ':'shu','しょ':'sho','じゃ':'ja','じゅ':'ju','じょ':'jo',
 'ちゃ':'cha','ちゅ':'chu','ちょ':'cho','にゃ':'nya','にゅ':'nyu','にょ':'nyo',
 'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','びゃ':'bya','びゅ':'byu','びょ':'byo',
 'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo','みゃ':'mya','みゅ':'myu','みょ':'myo',
 'りゃ':'rya','りゅ':'ryu','りょ':'ryo',
}


def romaji(kana):
    s = ''.join(K2H.get(c, c) for c in kana)
    out, i = [], 0
    while i < len(s):
        c = s[i]
        if c == 'ー':
            out.append(out[-1][-1] if out else ''); i += 1; continue
        if c == 'っ':
            nxt = s[i+1:i+2]
            r = YOUON.get(s[i+1:i+3]) or ROMA.get(nxt, '')
            if r:
                out.append(r[0])
            i += 1; continue
        pair = s[i:i+2]
        if pair in YOUON:
            out.append(YOUON[pair]); i += 2; continue
        out.append(ROMA.get(c, c)); i += 1
    return ''.join(out)


def clean(s):
    s = s.replace('*', '').replace('※', '')
    s = re.sub(r'[\[「(（][^\]」)）]*[〜～][^\]」)）]*[\]」)）]', '', s)
    s = re.sub(r'[\[「]([^\]」]*)[\]」]', r'\1', s)
    s = re.sub(r'[(（][^)）]*[)）]', '', s)
    s = s.split('／')[0].split('/')[0]
    return s.replace('〜', '').replace('～', '').strip()


def main():
    if not os.path.exists(SRC):
        sys.exit(f'CSV not found: {SRC}  (set VOCAB_CSV env var to override)')
    rows = list(csv.DictReader(open(SRC, encoding='utf-8-sig')))

    out = []
    verbs_with_conj = 0
    for n, r in enumerate(rows, 1):
        lesson = int(r['Lesson'])
        reading = clean(r['Kana'])
        kanji = clean(r['Kanji'])
        japanese = kanji or reading
        entry = {
            'id': f'v{n:04d}',
            'japanese': japanese,
            'reading': reading,
            'romaji': romaji(reading),
            'meanings': {'zh': r['Chinese'].strip()},
            'partOfSpeech': POS_MAP[r['Type']],
            'category': r['Category'],
            'lessonIds': [lesson],
            'section': r['Section'],
            'jlptLevel': 'N5' if lesson <= 25 else 'N4',
        }
        if r.get('VerbGroup'):
            entry['verbGroup'] = r['VerbGroup']

        # ---- conjugations: include only when at least the dict-form is filled
        dict_kana = (r.get('辭書形_kana') or '').strip()
        if dict_kana:
            conj = {}
            for f in FORMS:
                conj[f] = {
                    'kana':  (r.get(f + '_kana')  or '').strip(),
                    'kanji': (r.get(f + '_kanji') or '').strip(),
                }
            entry['conjugations'] = conj
            verbs_with_conj += 1

        flag = (r.get('ReviewFlag') or '').strip()
        if flag:
            entry['conjugationFlag'] = flag

        out.append(entry)

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    size_kb = os.path.getsize(OUT) // 1024
    print(f'wrote {OUT}  ({len(out)} entries, {size_kb} KB)')
    print(f'  with conjugations: {verbs_with_conj}')
    print(f'  sample (first verb): {json.dumps(next(e for e in out if "conjugations" in e), ensure_ascii=False)[:300]}...')


if __name__ == '__main__':
    main()