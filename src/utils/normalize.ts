// カタカナ→ひらがな
function kataToHira(s: string): string {
  return s.replace(/[\u30A1-\u30F6]/g, c =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  );
}

// 全角英数→半角
function fullToHalf(s: string): string {
  return s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, c =>
    String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
  );
}

// 長音符・っ などの正規化
function normalizeStr(s: string): string {
  return kataToHira(fullToHalf(s.trim()))
    .replace(/[市区町村]/g, '')   // 「市」「町」等を除去
    .replace(/\s+/g, '');
}

// 県庁所在地の正解パターン（ひらがな正規化後）
// normalizeStr を通して比較するため、ここもひらがなで記載
const CAPITAL_ANSWERS: Record<string, string[]> = {
  hokkaido:  ['さっぽろ', '札幌'],
  aomori:    ['あおもり', '青森'],
  iwate:     ['もりおか', '盛岡'],
  miyagi:    ['せんだい', '仙台'],
  akita:     ['あきた', '秋田'],
  yamagata:  ['やまがた', '山形'],
  fukushima: ['ふくしま', '福島'],
  ibaraki:   ['みと', '水戸'],
  tochigi:   ['うつのみや', '宇都宮'],
  gunma:     ['まえばし', '前橋'],
  saitama:   ['さいたま'],
  chiba:     ['ちば', '千葉'],
  tokyo:     ['とうきょう', '東京'],
  kanagawa:  ['よこはま', '横浜'],
  niigata:   ['にいがた', '新潟'],
  toyama:    ['とやま', '富山'],
  ishikawa:  ['かなざわ', '金沢'],
  fukui:     ['ふくい', '福井'],
  yamanashi: ['こうふ', '甲府'],
  nagano:    ['ながの', '長野'],
  gifu:      ['ぎふ', '岐阜'],
  shizuoka:  ['しずおか', '静岡'],
  aichi:     ['なごや', '名古屋'],
  mie:       ['つ', '津'],
  shiga:     ['おおつ', '大津'],
  kyoto:     ['きょうと', '京都'],
  osaka:     ['おおさか', '大阪'],
  hyogo:     ['こうべ', '神戸'],
  nara:      ['なら', '奈良'],
  wakayama:  ['わかやま', '和歌山'],
  tottori:   ['とっとり', '鳥取'],
  shimane:   ['まつえ', '松江'],
  okayama:   ['おかやま', '岡山'],
  hiroshima: ['ひろしま', '広島'],
  yamaguchi: ['やまぐち', '山口'],
  tokushima: ['とくしま', '徳島'],
  kagawa:    ['たかまつ', '高松'],
  ehime:     ['まつやま', '松山'],
  kochi:     ['こうち', '高知'],
  fukuoka:   ['ふくおか', '福岡'],
  saga:      ['さが', '佐賀'],
  nagasaki:  ['ながさき', '長崎'],
  kumamoto:  ['くまもと', '熊本'],
  oita:      ['おおいた', '大分'],
  miyazaki:  ['みやざき', '宮崎'],
  kagoshima: ['かごしま', '鹿児島'],
  okinawa:   ['なは', '那覇'],
};

export function isCorrectPrefName(pref: { name: string; nameKana: string }, input: string): boolean {
  const norm = kataToHira(fullToHalf(input.trim())).replace(/\s+/g, '');
  // 漢字入力（都/道/府/県 あり・なし両対応）
  const normStripped = norm.replace(/[都道府県]$/, '');
  const nameStripped = pref.name.replace(/[都道府県]$/, '');
  if (norm === pref.name || normStripped === nameStripped) return true;
  // ひらがな入力（完全一致）
  if (norm === pref.nameKana) return true;
  return false;
}

export function isCorrectCapital(code: string, input: string): boolean {
  const answers = CAPITAL_ANSWERS[code];
  if (!answers) return false;
  const norm = normalizeStr(input);
  return answers.some(a => normalizeStr(a) === norm);
}

export function getCapitalAnswerDisplay(code: string): string {
  const answers = CAPITAL_ANSWERS[code];
  if (!answers) return '';
  // 漢字表記（2文字目以降）を返す
  return answers.find(a => /[^\u3040-\u309F]/.test(a)) ?? answers[0];
}
