import type { Prefecture } from '../types';

export const prefectures: Prefecture[] = [
  // 北海道地方
  { id: 1,  code: 'hokkaido',  name: '北海道', nameKana: 'ほっかいどう', capital: '札幌',   region: '北海道', color: 'bg-blue-100' },
  // 東北地方
  { id: 2,  code: 'aomori',    name: '青森',   nameKana: 'あおもり',     capital: '青森',   region: '東北',   color: 'bg-violet-100' },
  { id: 3,  code: 'iwate',     name: '岩手',   nameKana: 'いわて',       capital: '盛岡',   region: '東北',   color: 'bg-violet-100' },
  { id: 4,  code: 'miyagi',    name: '宮城',   nameKana: 'みやぎ',       capital: '仙台',   region: '東北',   color: 'bg-violet-100' },
  { id: 5,  code: 'akita',     name: '秋田',   nameKana: 'あきた',       capital: '秋田',   region: '東北',   color: 'bg-violet-100' },
  { id: 6,  code: 'yamagata',  name: '山形',   nameKana: 'やまがた',     capital: '山形',   region: '東北',   color: 'bg-violet-100' },
  { id: 7,  code: 'fukushima', name: '福島',   nameKana: 'ふくしま',     capital: '福島',   region: '東北',   color: 'bg-violet-100' },
  // 関東地方
  { id: 8,  code: 'ibaraki',   name: '茨城',   nameKana: 'いばらき',     capital: '水戸',   region: '関東',   color: 'bg-pink-100' },
  { id: 9,  code: 'tochigi',   name: '栃木',   nameKana: 'とちぎ',       capital: '宇都宮', region: '関東',   color: 'bg-pink-100' },
  { id: 10, code: 'gunma',     name: '群馬',   nameKana: 'ぐんま',       capital: '前橋',   region: '関東',   color: 'bg-pink-100' },
  { id: 11, code: 'saitama',   name: '埼玉',   nameKana: 'さいたま',     capital: 'さいたま', region: '関東', color: 'bg-pink-100' },
  { id: 12, code: 'chiba',     name: '千葉',   nameKana: 'ちば',         capital: '千葉',   region: '関東',   color: 'bg-pink-100' },
  { id: 13, code: 'tokyo',     name: '東京',   nameKana: 'とうきょう',   capital: '東京',   region: '関東',   color: 'bg-pink-100' },
  { id: 14, code: 'kanagawa',  name: '神奈川', nameKana: 'かながわ',     capital: '横浜',   region: '関東',   color: 'bg-pink-100' },
  // 中部地方
  { id: 15, code: 'niigata',   name: '新潟',   nameKana: 'にいがた',     capital: '新潟',   region: '中部',   color: 'bg-yellow-100' },
  { id: 16, code: 'toyama',    name: '富山',   nameKana: 'とやま',       capital: '富山',   region: '中部',   color: 'bg-yellow-100' },
  { id: 17, code: 'ishikawa',  name: '石川',   nameKana: 'いしかわ',     capital: '金沢',   region: '中部',   color: 'bg-yellow-100' },
  { id: 18, code: 'fukui',     name: '福井',   nameKana: 'ふくい',       capital: '福井',   region: '中部',   color: 'bg-yellow-100' },
  { id: 19, code: 'yamanashi', name: '山梨',   nameKana: 'やまなし',     capital: '甲府',   region: '中部',   color: 'bg-yellow-100' },
  { id: 20, code: 'nagano',    name: '長野',   nameKana: 'ながの',       capital: '長野',   region: '中部',   color: 'bg-yellow-100' },
  { id: 21, code: 'gifu',      name: '岐阜',   nameKana: 'ぎふ',         capital: '岐阜',   region: '中部',   color: 'bg-yellow-100' },
  { id: 22, code: 'shizuoka',  name: '静岡',   nameKana: 'しずおか',     capital: '静岡',   region: '中部',   color: 'bg-yellow-100' },
  { id: 23, code: 'aichi',     name: '愛知',   nameKana: 'あいち',       capital: '名古屋', region: '中部',   color: 'bg-yellow-100' },
  // 近畿地方
  { id: 24, code: 'mie',       name: '三重',   nameKana: 'みえ',         capital: '津',     region: '近畿',   color: 'bg-orange-100' },
  { id: 25, code: 'shiga',     name: '滋賀',   nameKana: 'しが',         capital: '大津',   region: '近畿',   color: 'bg-orange-100' },
  { id: 26, code: 'kyoto',     name: '京都',   nameKana: 'きょうと',     capital: '京都',   region: '近畿',   color: 'bg-orange-100' },
  { id: 27, code: 'osaka',     name: '大阪',   nameKana: 'おおさか',     capital: '大阪',   region: '近畿',   color: 'bg-orange-100' },
  { id: 28, code: 'hyogo',     name: '兵庫',   nameKana: 'ひょうご',     capital: '神戸',   region: '近畿',   color: 'bg-orange-100' },
  { id: 29, code: 'nara',      name: '奈良',   nameKana: 'なら',         capital: '奈良',   region: '近畿',   color: 'bg-orange-100' },
  { id: 30, code: 'wakayama',  name: '和歌山', nameKana: 'わかやま',     capital: '和歌山', region: '近畿',   color: 'bg-orange-100' },
  // 中国地方
  { id: 31, code: 'tottori',   name: '鳥取',   nameKana: 'とっとり',     capital: '鳥取',   region: '中国',   color: 'bg-lime-100' },
  { id: 32, code: 'shimane',   name: '島根',   nameKana: 'しまね',       capital: '松江',   region: '中国',   color: 'bg-lime-100' },
  { id: 33, code: 'okayama',   name: '岡山',   nameKana: 'おかやま',     capital: '岡山',   region: '中国',   color: 'bg-lime-100' },
  { id: 34, code: 'hiroshima', name: '広島',   nameKana: 'ひろしま',     capital: '広島',   region: '中国',   color: 'bg-lime-100' },
  { id: 35, code: 'yamaguchi', name: '山口',   nameKana: 'やまぐち',     capital: '山口',   region: '中国',   color: 'bg-lime-100' },
  // 四国地方
  { id: 36, code: 'tokushima', name: '徳島',   nameKana: 'とくしま',     capital: '徳島',   region: '四国',   color: 'bg-cyan-100' },
  { id: 37, code: 'kagawa',    name: '香川',   nameKana: 'かがわ',       capital: '高松',   region: '四国',   color: 'bg-cyan-100' },
  { id: 38, code: 'ehime',     name: '愛媛',   nameKana: 'えひめ',       capital: '松山',   region: '四国',   color: 'bg-cyan-100' },
  { id: 39, code: 'kochi',     name: '高知',   nameKana: 'こうち',       capital: '高知',   region: '四国',   color: 'bg-cyan-100' },
  // 九州・沖縄地方
  { id: 40, code: 'fukuoka',   name: '福岡',   nameKana: 'ふくおか',     capital: '福岡',   region: '九州',   color: 'bg-green-100' },
  { id: 41, code: 'saga',      name: '佐賀',   nameKana: 'さが',         capital: '佐賀',   region: '九州',   color: 'bg-green-100' },
  { id: 42, code: 'nagasaki',  name: '長崎',   nameKana: 'ながさき',     capital: '長崎',   region: '九州',   color: 'bg-green-100' },
  { id: 43, code: 'kumamoto',  name: '熊本',   nameKana: 'くまもと',     capital: '熊本',   region: '九州',   color: 'bg-green-100' },
  { id: 44, code: 'oita',      name: '大分',   nameKana: 'おおいた',     capital: '大分',   region: '九州',   color: 'bg-green-100' },
  { id: 45, code: 'miyazaki',  name: '宮崎',   nameKana: 'みやざき',     capital: '宮崎',   region: '九州',   color: 'bg-green-100' },
  { id: 46, code: 'kagoshima', name: '鹿児島', nameKana: 'かごしま',     capital: '鹿児島', region: '九州',   color: 'bg-green-100' },
  { id: 47, code: 'okinawa',   name: '沖縄',   nameKana: 'おきなわ',     capital: '那覇',   region: '九州',   color: 'bg-green-100' },
];

export const prefectureByCode = Object.fromEntries(prefectures.map(p => [p.code, p]));
