import type { Prefecture } from '../types';

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 正解1つ＋ランダム3つの4択選択肢を生成
 *  wrongPool を指定するとその中から誤答候補を選ぶ（不足時は allPrefs で補完）
 */
export function generateChoices(
  correct: Prefecture,
  allPrefs: Prefecture[],
  wrongPool?: Prefecture[]
): Prefecture[] {
  const pool = wrongPool ?? allPrefs;
  const poolWithout = pool.filter(p => p.code !== correct.code);
  let others = shuffleArray(poolWithout).slice(0, 3);
  // 不足分を全国から補完
  if (others.length < 3) {
    const fallback = allPrefs.filter(
      p => p.code !== correct.code && !others.some(o => o.code === p.code)
    );
    others = [...others, ...shuffleArray(fallback)].slice(0, 3);
  }
  return shuffleArray([correct, ...others]);
}

export function getPrefecturesByRegion(
  prefectures: Prefecture[],
  region: string
): Prefecture[] {
  if (region === 'すべて' || region === '全国') return prefectures;
  // 選択肢は「九州・沖縄」だがデータは「九州」で統一
  const match = region === '九州・沖縄' ? '九州' : region;
  return prefectures.filter(p => p.region === match);
}
