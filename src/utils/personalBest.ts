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

  const isNewPerfect =
    isPerfect &&
    (prev?.perfectTimeMs === null ||
      prev?.perfectTimeMs === undefined ||
      result.totalTimeMs < (prev?.perfectTimeMs ?? Infinity));

  const isNewScore =
    !isPerfect && result.correctCount > (prev?.bestScore ?? -1);

  if (!isNewPerfect && !isNewScore && prev !== null) {
    return { isNewPerfect: false, isNewScore: false, prev };
  }

  const next: PersonalBest = {
    perfectTimeMs: isPerfect
      ? isNewPerfect
        ? result.totalTimeMs
        : (prev?.perfectTimeMs ?? null)
      : (prev?.perfectTimeMs ?? null),
    bestScore: Math.max(result.correctCount, prev?.bestScore ?? 0),
    totalCount: result.totalCount,
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
