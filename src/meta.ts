import { Pos } from './types';

/** Native (mother) languages. Data currently ships Chinese only;
 *  English glosses can be added to vocab meanings later. */
export const NATIVE: Record<string, string> = {
  zh: '中文',
};

/** Fine-grained part-of-speech order — used for displaying categories,
 *  reading vocab data, and anything that needs the actual POS. */
export const POS_ORDER: Pos[] = [
  'noun', 'verb', 'i-adjective', 'na-adjective', 'adverb', 'phrase',
  'pronoun', 'conjunction', 'particle', 'suffix', 'interjection', 'prenominal',
];

export const POS_META: Record<string, { label: string; jp: string }> = {
  noun:          { label: 'Nouns',          jp: '名詞' },
  verb:          { label: 'Verbs',          jp: '動詞' },
  'i-adjective': { label: 'i-Adjectives',   jp: 'い形容詞' },
  'na-adjective':{ label: 'na-Adjectives',  jp: 'な形容詞' },
  adverb:        { label: 'Adverbs',        jp: '副詞' },
  phrase:        { label: 'Phrases',        jp: '表現' },
  pronoun:       { label: 'Pronouns',       jp: '代名詞' },
  conjunction:   { label: 'Conjunctions',   jp: '接続詞' },
  particle:      { label: 'Particles',      jp: '助詞' },
  suffix:        { label: 'Suffixes',       jp: '接尾辞' },
  interjection:  { label: 'Interjections',  jp: '感動詞' },
  prenominal:    { label: 'Prenominals',    jp: '連体詞' },
};

/** Simplified groups shown in the Word-type filter on the deck builder.
 *  Each group is one button that selects every Pos in `members`.
 *  Categories below still expand per fine-grained Pos. */
export const POS_GROUPS: { id: string; label: string; jp: string; members: Pos[] }[] = [
  { id: 'noun',       label: 'Nouns',      jp: '名詞',   members: ['noun'] },
  { id: 'verb',       label: 'Verbs',      jp: '動詞',   members: ['verb'] },
  { id: 'adjective',  label: 'Adjectives', jp: '形容詞', members: ['i-adjective', 'na-adjective'] },
  { id: 'other',      label: 'Other',      jp: 'その他',
    members: ['adverb', 'phrase', 'pronoun', 'conjunction',
              'particle', 'suffix', 'interjection', 'prenominal'] },
];

/** POSs whose semantic `category` field is meaningful enough to show as
 *  a sub-filter (e.g. nouns have transport/family/food/...). Other POSs
 *  collapse to a single bucket — show no category chips for them; let
 *  the user select the POS itself instead. */
export const HAS_RICH_CATEGORIES: Pos[] = ['noun', 'verb'];

export const VERB_GROUPS: { id: string; label: string; jp: string }[] = [
  { id: 'I',   label: 'Group I',   jp: '五段 · godan' },
  { id: 'II',  label: 'Group II',  jp: '一段 · ichidan' },
  { id: 'III', label: 'Group III', jp: '不規則 · irregular' },
];

/** Semantic categories. Any key missing here falls back to the raw string. */
export const CATEGORY_META: Record<string, { label: string; jp: string }> = {
  // nouns
  people:          { label: 'People',           jp: '人' },
  family:          { label: 'Family',           jp: '家族' },
  occupation:      { label: 'Occupations',      jp: '職業' },
  country:         { label: 'Countries',        jp: '国' },
  'proper-noun':   { label: 'Proper nouns',     jp: '固有名詞' },
  place:           { label: 'Places',           jp: '場所' },
  transport:       { label: 'Transport',        jp: '乗り物' },
  'food-drink':    { label: 'Food & drink',     jp: '食べ物' },
  clothing:        { label: 'Clothing',         jp: '衣類' },
  stationery:      { label: 'Stationery',       jp: '文房具' },
  electronics:     { label: 'Electronics',      jp: '電化製品' },
  furniture:       { label: 'Furniture',        jp: '家具' },
  'body-health':   { label: 'Body & health',    jp: '体・健康' },
  'nature-weather':{ label: 'Nature & weather', jp: '自然・天気' },
  'animals-plants':{ label: 'Animals & plants', jp: '動植物' },
  'hobby-sport':   { label: 'Hobbies & sport',  jp: '趣味・スポーツ' },
  'arts-media':    { label: 'Arts & media',     jp: '芸術・娯楽' },
  'language-study':{ label: 'Language & study', jp: '言語・勉強' },
  communication:   { label: 'Communication',    jp: '通信' },
  'money-shopping':{ label: 'Money',            jp: 'お金' },
  position:        { label: 'Position',         jp: '位置' },
  'number-quantity':{ label: 'Numbers',         jp: '数量' },
  time:            { label: 'Time',             jp: '時間' },
  abstract:        { label: 'Abstract',         jp: '抽象概念' },
  object:          { label: 'Objects',          jp: '物・道具' },
  // verbs
  'v-motion':      { label: 'Motion',           jp: '移動' },
  'v-daily':       { label: 'Daily actions',    jp: '日常動作' },
  'v-communication':{ label: 'Communication',   jp: '伝達' },
  'v-thinking':    { label: 'Thought & sense',  jp: '思考・知覚' },
  'v-workstudy':   { label: 'Work & study',     jp: '仕事・勉強' },
  'v-transaction': { label: 'Giving & trade',   jp: '授受・取引' },
  'v-handling':    { label: 'Making & handling',jp: '操作・作成' },
  'v-change':      { label: 'Change of state',  jp: '変化' },
  'v-other':       { label: 'Other verbs',      jp: 'その他' },
  // adjectives / phrases / function
  descriptive:     { label: 'Descriptive',      jp: '描写' },
  greeting:        { label: 'Greetings',        jp: 'あいさつ' },
  expression:      { label: 'Expressions',      jp: '表現' },
  function:        { label: 'Function words',   jp: '機能語' },
};

export const SESSION_ALL = 9999;