import { useState, useEffect, useRef, useCallback } from 'react';
import TimerBar from '../components/TimerBar';
import { useTimer } from '../hooks/useTimer';
import { useElapsedTime, formatElapsed } from '../hooks/useElapsedTime';
import { useSound } from '../hooks/useSound';
import { prefectures } from '../data/prefectures';
import { shuffleArray, getPrefecturesByRegion } from '../utils/quizLogic';
import { isCorrectCapital } from '../utils/normalize';
import type { Prefecture, QuizResult } from '../types';

const TIMER_SECONDS = 20;

interface Props {
  region: string;
  onFinish: (result: QuizResult) => void;
  onBack: () => void;
}

interface SessionState {
  questions: Prefecture[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
}

export default function TextQuizScreen({ region, onFinish, onBack }: Props) {
  const regionPrefs = getPrefecturesByRegion(prefectures, region);

  const [session, setSession] = useState<SessionState>(() => ({
    questions: shuffleArray(regionPrefs),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
  }));

  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);

  const sessionRef = useRef(session);
  sessionRef.current = session;
  const feedbackRef = useRef(feedback);
  feedbackRef.current = feedback;
  const timerResetRef = useRef<() => void>(() => {});
  const timerStopRef  = useRef<() => void>(() => {});

  const inputRef = useRef<HTMLInputElement>(null);
  const { playCorrect, playWrong } = useSound();
  const elapsed = useElapsedTime(session.startTime);

  const currentPref = session.questions[session.currentIndex];

  const advanceQuestion = useCallback((wasCorrect: boolean) => {
    const s = sessionRef.current;
    const newCorrect = s.correctCount + (wasCorrect ? 1 : 0);
    const nextIndex  = s.currentIndex + 1;

    if (nextIndex >= s.questions.length) {
      onFinish({
        quizType: 'capital',
        region,
        correctCount: newCorrect,
        totalCount: s.questions.length,
        totalTimeMs: Date.now() - s.startTime,
      });
      return;
    }

    setSession(prev => ({ ...prev, currentIndex: nextIndex, correctCount: newCorrect }));
    setInputValue('');
    setFeedback(null);
    timerResetRef.current();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [onFinish, region]);

  const handleExpire = useCallback(() => {
    if (feedbackRef.current) return;
    playWrong();
    setFeedback('timeout');
    setTimeout(() => advanceQuestion(false), 1500);
  }, [playWrong, advanceQuestion]);

  const { remaining, start, reset, stop } = useTimer(TIMER_SECONDS, handleExpire);
  timerResetRef.current = reset;
  timerStopRef.current  = stop;

  useEffect(() => {
    start();
    setTimeout(() => inputRef.current?.focus(), 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.currentIndex]);

  const handleSubmit = useCallback(() => {
    if (feedbackRef.current) return;
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const current = sessionRef.current.questions[sessionRef.current.currentIndex];
    if (isCorrectCapital(current.code, trimmed)) {
      playCorrect();
      timerStopRef.current();
      setFeedback('correct');
      setTimeout(() => advanceQuestion(true), 1000);
    } else {
      playWrong();
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setInputValue('');
        timerResetRef.current();
        inputRef.current?.focus();
      }, 1000);
    }
  }, [inputValue, playCorrect, playWrong, advanceQuestion]);

  if (!currentPref) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0d1b4b' }}>
      {/* ヘッダー */}
      <header className="flex items-center gap-3 px-4 py-2 border-b border-blue-900 text-white shrink-0"
        style={{ background: 'linear-gradient(to right, #1e3a8a, #312e81)' }}>
        <button onClick={onBack} className="text-yellow-300 text-2xl px-1 font-black hover:scale-110 transition-transform" aria-label="戻る">←</button>
        <div className="flex-1">
          <div className="text-xs text-blue-300 font-bold">県庁所在地クイズ・{region}</div>
          <div className="text-sm font-black text-white">
            {session.currentIndex + 1}<span className="text-blue-400 font-normal"> / {session.questions.length}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <div className="text-sm font-black bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-lg">
            ⭐ {session.correctCount}
          </div>
          <div className="text-xs font-mono text-blue-400">⏱ {formatElapsed(elapsed)}</div>
        </div>
      </header>

      <TimerBar remaining={remaining} total={TIMER_SECONDS} />

      {/* 問題エリア */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {/* 問題 */}
        <div className="text-center">
          <p className="text-blue-300 font-bold text-sm mb-3">県庁所在地はどこ？</p>
          <div className="inline-block px-8 py-4 rounded-2xl font-black text-3xl text-white border-2 border-yellow-400"
            style={{
              background: 'linear-gradient(to bottom, #1e3a8a, #1e1b4b)',
              boxShadow: '0 0 20px rgba(250,204,21,0.3), 0 4px 0 #92400e',
            }}>
            {currentPref.name}
            <span className="block text-sm font-normal text-blue-300 mt-0.5">
              {currentPref.nameKana}
            </span>
          </div>
        </div>

        {/* 入力フォーム */}
        <div className="w-full max-w-xs">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder="ひらがな・漢字どちらでもOK"
            disabled={feedback === 'correct' || feedback === 'timeout'}
            className={`
              w-full text-center text-xl font-bold px-4 py-3 rounded-2xl border-2
              outline-none transition-all text-white
              placeholder:text-blue-700
              ${feedback === 'correct'
                ? 'border-green-400 text-green-300'
                : feedback === 'wrong'
                ? 'border-red-400 shake text-red-300'
                : 'border-blue-600 focus:border-yellow-400'}
            `}
            style={{ background: '#0e2a4d' }}
          />

          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || !!feedback}
            className="
              btn-3d w-full mt-3 py-4 rounded-2xl font-black text-xl text-yellow-900
              bg-gradient-to-b from-yellow-300 to-yellow-500
              border-2 border-yellow-200 shadow-yellow-800
              disabled:from-blue-900 disabled:to-blue-900 disabled:text-blue-700
              disabled:border-blue-800 disabled:shadow-none
              hover:brightness-110
            "
          >
            こたえる！
          </button>
        </div>

        {/* フィードバック */}
        {feedback && (
          <div className={`
            text-center text-lg font-black px-6 py-2 rounded-2xl bounce-in
            ${feedback === 'correct'
              ? 'bg-green-500 text-white'
              : feedback === 'timeout'
              ? 'bg-orange-500 text-white'
              : 'bg-red-500 text-white'}
          `}>
            {feedback === 'correct' ? '⭐ せいかい！' :
             feedback === 'timeout' ? '⏱ 時間切れ！' :
             '💥 ちがうよ！'}
          </div>
        )}
      </div>
    </div>
  );
}
