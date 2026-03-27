import type { PersonalBest, QuizResult } from '../types';

function storageKey(quizType: string, region: string): string {
  return `pb-${quizType}-${region}`;
}

export function loadPersonalBest(quizType: string, region: string): PersonalBest | null {
  try {
    const raw = localStorage.getItem(storageKey(quizType, region));
    if (!raw) return null;
    return JSON.parse(raw) as PersonalBest;
  } catch {
    return null;
  }
}

export function loadAllPersonalBests(): Record<string, PersonalBest> {
  const out: Record<string, PersonalBest> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('pb-')) continue;
      const raw = localStorage.getItem(key);
      if (raw) out[key.slice(3)] = JSON.parse(raw) as PersonalBest;
    }
  } catch {
    // ignore
  }
  return out;
}

/** Returns { isNewPerfect, isNewScore } to drive UI banners */
export function savePersonalBest(result: QuizResult): {
  isNewPerfect: boolean;
  isNewScore: boolean;
  prev: PersonalBest | null;
} {
  const prev = loadPersonalBest(result.quizType, result.region);
  const isPerfect = result.correctCount === result.totalCount;

  // 全問正解で前回より速いか、初めての全問正解
  const isNewPerfect =
    isPerfect &&
    (prev?.perfectTimeMs == null ||
      result.totalTimeMs < prev.perfectTimeMs);

  // 全問正解でなく、前回の最新スコアより良い
  const isNewScore =
    !isPerfect && result.correctCount > (prev?.bestScore ?? -1);

  // 常に最新結果を保存する（早期リターンしない）
  // bestScore = 最新プレイの正解数（常に上書き）
  // perfectTimeMs = 全問正解の中で最速タイム（更新時のみ上書き）
  const next: PersonalBest = {
    perfectTimeMs: isNewPerfect
      ? result.totalTimeMs
      : (prev?.perfectTimeMs ?? null),
    bestScore: result.correctCount,
    totalCount: result.totalCount,
    bestTimeMs: result.totalTimeMs,
    date: new Date().toISOString(),
  };

  try {
    localStorage.setItem(
      storageKey(result.quizType, result.region),
      JSON.stringify(next)
    );
  } catch {
    // ignore quota errors
  }

  return { isNewPerfect, isNewScore, prev };
}
