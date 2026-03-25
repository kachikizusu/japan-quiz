// 地方ごとの目標タイム（レベル別）
// 1都道府県あたりの目標タイム（秒）× 都道府県数 で計算

export interface TargetTimes {
  gold: number;   // ms
  silver: number; // ms
  bronze: number; // ms
}

export type Medal = 'gold' | 'silver' | 'bronze' | null;

// 地方ごとの都道府県数
const REGION_PREF_COUNT: Record<string, number> = {
  '北海道':    1,
  '東北':      6,
  '関東':      7,
  '中部':      9,
  '近畿':      7,
  '中国':      5,
  '四国':      4,
  '九州・沖縄': 8,
  '全国':       47,
};

// 1都道府県あたりの目標タイム（秒）
// name/shape: 「①名前選択 + ②地図タップ」の2フェーズ
// location:   「地図タップのみ」の1フェーズ（早め）
const PER_PREF: Record<string, { normal: { gold: number; silver: number; bronze: number }; challenge: { gold: number; silver: number; bronze: number } }> = {
  name:     { normal: { gold: 18, silver: 30, bronze: 48 }, challenge: { gold: 28, silver: 45, bronze: 70 } },
  shape:    { normal: { gold: 18, silver: 30, bronze: 48 }, challenge: { gold: 28, silver: 45, bronze: 70 } },
  location: { normal: { gold: 10, silver: 17, bronze: 27 }, challenge: { gold: 15, silver: 25, bronze: 40 } },
  capital:  { normal: { gold: 15, silver: 25, bronze: 40 }, challenge: { gold: 15, silver: 25, bronze: 40 } },
  region:   { normal: { gold: 12, silver: 20, bronze: 32 }, challenge: { gold: 12, silver: 20, bronze: 32 } },
  mark:     { normal: { gold: 14, silver: 22, bronze: 35 }, challenge: { gold: 14, silver: 22, bronze: 35 } },
};

export function getTargetTimes(region: string, challenge: boolean, quizType = 'name'): TargetTimes {
  const n = REGION_PREF_COUNT[region] ?? 7;
  const perPref = PER_PREF[quizType] ?? PER_PREF.name;
  const per = challenge ? perPref.challenge : perPref.normal;
  const MIN_MS = 8000; // 最低8秒（1問でも意味のあるターゲット）
  return {
    gold:   Math.max(MIN_MS, n * per.gold   * 1000),
    silver: Math.max(MIN_MS, n * per.silver * 1000),
    bronze: Math.max(MIN_MS, n * per.bronze * 1000),
  };
}

export function getMedal(timeMs: number, targets: TargetTimes, perfect: boolean): Medal {
  if (!perfect) return null;
  if (timeMs <= targets.gold)   return 'gold';
  if (timeMs <= targets.silver) return 'silver';
  if (timeMs <= targets.bronze) return 'bronze';
  return null;
}

export function formatTarget(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0) return `${m}分${sec}秒`;
  return `${s}秒`;
}
