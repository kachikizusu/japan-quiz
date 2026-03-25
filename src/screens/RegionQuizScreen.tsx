import { useState, useCallback, useRef, useEffect } from 'react';
import TimerBar from '../components/TimerBar';
import { useTimer } from '../hooks/useTimer';
import { useElapsedTime, formatElapsed } from '../hooks/useElapsedTime';
import { useSound } from '../hooks/useSound';
import { prefectures } from '../data/prefectures';
import { shuffleArray } from '../utils/quizLogic';
import type { Prefecture, QuizResult } from '../types';

const TIMER_SECONDS = 20;

const REGION_BUTTONS = [
  { label: '北海道',    gradient: 'from-sky-500 to-blue-600',      shadow: 'shadow-blue-900' },
  { label: '東北',      gradient: 'from-violet-500 to-purple-700', shadow: 'shadow-purple-900' },
  { label: '関東',      gradient: 'from-pink-500 to-rose-700',     shadow: 'shadow-rose-900' },
  { label: '中部',      gradient: 'from-amber-400 to-orange-600',  shadow: 'shadow-orange-900' },
  { label: '近畿',      gradient: 'from-orange-500 to-red-700',   shadow: 'shadow-red-900' },
  { label: '中国',      gradient: 'from-lime-500 to-green-700',   shadow: 'shadow-green-900' },
  { label: '四国',      gradient: 'from-cyan-400 to-teal-600',    shadow: 'shadow-teal-900' },
  { label: '九州・沖縄', gradient: 'from-emerald-400 to-green-700', shadow: 'shadow-green-900' },
];

interface Props {
  onFinish: (result: QuizResult) => void;
  onBack: () => void;
}

interface SessionState {
  questions: Prefecture[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
}

// データ上は「九州」だが表示は「九州・沖縄」
function getRegionLabel(region: string): string {
  return region === '九州' ? '九州・沖縄' : region;
}

export default function RegionQuizScreen({ onFinish, onBack }: Props) {
  const [session, setSession] = useState<SessionState>(() => ({
    questions: shuffleArray(prefectures),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
  }));

  const [feedback, setFeedback] = useState<{
    selected: string;
    correct: boolean;
  } | null>(null);

  const sessionRef = useRef(session);
  sessionRef.current = session;
  const feedbackRef = useRef(feedback);
  feedbackRef.current = feedback;
  const timerResetRef = useRef<() => void>(() => {});
  const timerStopRef  = useRef<() => void>(() => {});

  const { playCorrect, playWrong } = useSound();
  const elapsed = useElapsedTime(session.startTime);

  const currentPref = session.questions[session.currentIndex];

  const advanceQuestion = useCallback((wasCorrect: boolean) => {
    const s = sessionRef.current;
    const newCorrect = s.correctCount + (wasCorrect ? 1 : 0);
    const nextIndex  = s.currentIndex + 1;

    if (nextIndex >= s.questions.length) {
      onFinish({
        quizType: 'region',
        region: 'すべて',
        correctCount: newCorrect,
        totalCount: s.questions.length,
        totalTimeMs: Date.now() - s.startTime,
      });
      return;
    }

    setSession(prev => ({ ...prev, currentIndex: nextIndex, correctCount: newCorrect }));
    setFeedback(null);
    timerResetRef.current();
  }, [onFinish]);

  const handleExpire = useCallback(() => {
    if (feedbackRef.current) return;
    playWrong();
    setFeedback({ selected: '', correct: false });
    setTimeout(() => advanceQuestion(false), 1800);
  }, [playWrong, advanceQuestion]);

  const { remaining, start, reset, stop } = useTimer(TIMER_SECONDS, handleExpire);
  timerResetRef.current = reset;
  timerStopRef.current  = stop;

  useEffect(() => {
    start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.currentIndex]);

  const handleSelect = useCallback((label: string) => {
    if (feedbackRef.current) return;
    const current = sessionRef.current.questions[sessionRef.current.currentIndex];
    const correctLabel = getRegionLabel(current.region);
    const isCorrect = label === correctLabel;

    if (isCorrect) {
      playCorrect();
      timerStopRef.current();
      setFeedback({ selected: label, correct: true });
      setTimeout(() => advanceQuestion(true), 900);
    } else {
      playWrong();
      setFeedback({ selected: label, correct: false });
      setTimeout(() => {
        setFeedback(null);
        timerResetRef.current();
      }, 1200);
    }
  }, [playCorrect, playWrong, advanceQuestion]);

  if (!currentPref) return null;

  const correctLabel = getRegionLabel(currentPref.region);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0d1b4b' }}>
      {/* ヘッダー */}
      <header className="flex items-center gap-3 px-4 py-2 border-b border-blue-900 text-white shrink-0"
        style={{ background: 'linear-gradient(to right, #1e3a8a, #312e81)' }}>
        <button onClick={onBack} className="text-yellow-300 text-2xl px-1 font-black hover:scale-110 transition-transform" aria-label="戻る">←</button>
        <div className="flex-1">
          <div className="text-xs text-blue-300 font-bold">地方ブロック分類クイズ</div>
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

      {/* 問題 */}
      <div className="px-4 py-4 text-center shrink-0">
        <p className="text-blue-300 font-bold text-sm mb-3">どの地方に属してる？</p>
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

      {/* フィードバック */}
      {feedback !== null && (
        <div className={`
          text-center text-sm font-black py-2 shrink-0
          ${feedback.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
        `}>
          {feedback.correct
            ? `⭐ せいかい！${correctLabel}だよ！`
            : feedback.selected
            ? '💥 ちがうよ！もう一度！'
            : '⏱ 時間切れ！もう一度！'}
        </div>
      )}

      {/* 8択ボタン */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2.5">
        {REGION_BUTTONS.map(({ label, gradient, shadow }) => {
          const isSelected = feedback?.selected === label;
          const isCorrectBtn = feedback !== null && label === correctLabel;

          let cls = `bg-gradient-to-br ${gradient} ${shadow} border-white/20`;
          if (isSelected && !feedback?.correct) cls = 'bg-red-600 border-red-300 shadow-red-900';
          if (isCorrectBtn && feedback?.correct) cls = 'bg-green-500 border-green-300 shadow-green-900';

          return (
            <button
              key={label}
              onClick={() => handleSelect(label)}
              disabled={feedback !== null}
              className={`
                btn-3d py-4 rounded-2xl font-black text-base text-white border-2
                disabled:cursor-not-allowed hover:brightness-110
                ${cls}
              `}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
