export interface Prefecture {
  id: number;
  code: string;
  name: string;
  nameKana: string;
  capital: string;
  region: string;
  color: string;
}

export type QuizType = 'name' | 'capital' | 'shape' | 'mark' | 'region' | 'location';

export type Screen =
  | { name: 'title' }
  | { name: 'quizType' }
  | { name: 'regionSelect'; quizType: QuizType }
  | { name: 'difficultySelect'; quizType: QuizType; region: string }
  | { name: 'quiz'; quizType: QuizType; region: string; challenge: boolean }
  | { name: 'result'; result: QuizResult; challenge: boolean }
  | { name: 'records' };

export interface PersonalBest {
  /** Best completion time in ms — only recorded on perfect (all correct) runs */
  perfectTimeMs: number | null;
  /** Best score (number correct) achieved */
  bestScore: number;
  /** Total questions in this quiz */
  totalCount: number;
  /** ISO date string of when the record was set */
  date: string;
}

export interface QuizResult {
  quizType: QuizType;
  region: string;
  correctCount: number;
  totalCount: number;
  totalTimeMs: number;
}

export type PrefectureStatus = 'idle' | 'hover' | 'correct' | 'wrong';
