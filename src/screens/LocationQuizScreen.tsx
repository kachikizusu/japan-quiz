import { useState, useCallback, useRef, useEffect } from 'react';
import RegionalMap from '../components/RegionalMap';
import TimerBar from '../components/TimerBar';
import { useTimer } from '../hooks/useTimer';
import { useElapsedTime, formatElapsed } from '../hooks/useElapsedTime';
import { useSound } from '../hooks/useSound';
import { prefectures } from '../data/prefectures';
import { shuffleArray, getPrefecturesByRegion } from '../utils/quizLogic';
import { getTargetTimes, formatTarget } from '../data/targetTimes';
import type { Prefecture, PrefectureStatus, QuizResult } from '../types';

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

export default function LocationQuizScreen({ region, onFinish, onBack }: Props) {
  const regionPrefs = getPrefecturesByRegion(prefectures, region);
  const targets = getTargetTimes(region, false, 'location');

  const [session, setSession] = useState<SessionState>(() => ({
    questions: shuffleArray(regionPrefs),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
  }));

  const [statuses, setStatuses] = useState<Record<string, PrefectureStatus>>({});
  const [solvedCodes, setSolvedCodes] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const sessionRef = useRef(session); sessionRef.current = session;
  const feedbackRef = useRef(feedback); feedbackRef.current = feedback;
  const timerResetRef = useRef<() => void>(() => {});
  const timerStopRef  = useRef<() => void>(() => {});
  const hasWrongRef = useRef(false);

  const { playCorrect, playWrong } = useSound();
  const elapsed = useElapsedTime(session.startTime);

  const advanceQuestion = useCallback((wasCorrect: boolean) => {
    const s = sessionRef.current;
    const actuallyCorrect = wasCorrect && !hasWrongRef.current;
    hasWrongRef.current = false;
    const newCorrect = s.correctCount + (actuallyCorrect ? 1 : 0);
    const nextIndex  = s.currentIndex + 1;

    if (nextIndex >= s.questions.length) {
      onFinish({
        quizType: 'location',
        region,
        correctCount: newCorrect,
        totalCount: s.questions.length,
        totalTimeMs: Date.now() - s.startTime,
      });
      return;
    }

    setSession(prev => ({ ...prev, currentIndex: nextIndex, correctCount: newCorrect }));
    setFeedback(null);
    timerResetRef.current();
  }, [onFinish, region]);

  const handleExpire = useCallback(() => {
    if (feedbackRef.current) return;
    hasWrongRef.current = true;
    playWrong();
    setFeedback('wrong');
    setTimeout(() => {
      setFeedback(null);
      timerResetRef.current();
    }, 1500);
  }, [playWrong]);

  const { remaining, start, reset, stop } = useTimer(TIMER_SECONDS, handleExpire);
  timerResetRef.current = reset;
  timerStopRef.current  = stop;

  useEffect(() => {
    start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.currentIndex]);

  const handleTap = useCallback((tappedCode: string) => {
    if (feedbackRef.current) return;
    const current = sessionRef.current.questions[sessionRef.current.currentIndex];
    if (!current) return;

    if (tappedCode === current.code) {
      playCorrect();
      timerStopRef.current();
      setSolvedCodes(prev => new Set([...prev, current.code]));
      setStatuses(prev => ({ ...prev, [current.code]: 'correct' }));
      setFeedback('correct');
      setTimeout(() => advanceQuestion(true), 900);
    } else {
      hasWrongRef.current = true;
      playWrong();
      setStatuses(prev => ({ ...prev, [tappedCode]: 'wrong' }));
      setFeedback('wrong');
      setTimeout(() => {
        setStatuses(prev =>
          prev[tappedCode] === 'wrong' ? { ...prev, [tappedCode]: 'idle' } : prev
        );
        setFeedback(null);
        timerResetRef.current();
      }, 1000);
    }
  }, [playCorrect, playWrong, advanceQuestion]);

  const currentPref = session.questions[session.currentIndex];
  if (!currentPref) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0d1b4b' }}>
      {/* ヘッダー */}
      <header className="flex items-center gap-3 px-4 py-2 border-b border-blue-900 text-white shrink-0"
        style={{ background: 'linear-gradient(to right, #1e3a8a, #312e81)' }}>
        <button onClick={onBack} className="text-yellow-300 text-2xl px-1 font-black hover:scale-110 transition-transform" aria-label="戻る">←</button>
        <div className="flex-1">
          <div className="text-xs text-blue-300 font-bold">位置クイズ・{region}</div>
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

      {/* 目標タイムバッジ */}
      <div className="flex justify-center gap-2 px-3 py-1.5 border-b border-blue-900 shrink-0"
        style={{ background: '#0a1638' }}>
        <span className="text-xs text-yellow-400 font-bold">🥇 {formatTarget(targets.gold)}</span>
        <span className="text-xs text-gray-300 font-bold">🥈 {formatTarget(targets.silver)}</span>
        <span className="text-xs text-orange-400 font-bold">🥉 {formatTarget(targets.bronze)}</span>
      </div>

      {/* タイマーバー */}
      <TimerBar remaining={remaining} total={TIMER_SECONDS} />

      {/* 問題カード */}
      <div className="px-4 py-3 border-b border-blue-900 shrink-0 text-center" style={{ background: '#0a1638' }}>
        <p className="text-xs text-blue-400 font-bold mb-2">この都道府県はどこ？地図をタップしよう！</p>
        <div
          className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-yellow-400"
          style={{
            background: 'linear-gradient(to bottom, #1e40af, #1e3a8a)',
            boxShadow: '0 0 20px rgba(250,204,21,0.4)',
          }}
        >
          <div className="text-left">
            <span className="font-black text-2xl text-white">{currentPref.name}</span>
            <span className="block text-sm text-blue-300 mt-0.5">{currentPref.nameKana}</span>
          </div>
        </div>
      </div>

      {/* フィードバックバナー */}
      {feedback && (
        <div className={`
          text-center py-2 text-sm font-black shrink-0 border-b
          ${feedback === 'correct'
            ? 'bg-green-500 text-white border-green-400'
            : 'bg-red-500 text-white border-red-400'}
        `}>
          {feedback === 'correct' ? '⭐ せいかい！すごい！' : '💥 ちがうよ！もう一度！'}
        </div>
      )}

      {/* 地域拡大マップ */}
      <RegionalMap
        region={region}
        statuses={statuses}
        solvedCodes={solvedCodes}
        onTap={handleTap}
        disabled={feedback !== null}
        zoomable
      />
    </div>
  );
}
