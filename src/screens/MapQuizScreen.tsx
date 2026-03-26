import { useState, useCallback, useRef, useEffect } from 'react';
import RegionalMap from '../components/RegionalMap';
import TimerBar from '../components/TimerBar';
import PrefectureShapePiece from '../components/PrefectureShapePiece';
import { useTimer } from '../hooks/useTimer';
import { useElapsedTime, formatElapsed } from '../hooks/useElapsedTime';
import { useSound } from '../hooks/useSound';
import { prefectures } from '../data/prefectures';
import { shuffleArray, getPrefecturesByRegion, generateChoices } from '../utils/quizLogic';
import { getTargetTimes, formatTarget } from '../data/targetTimes';
import type { Prefecture, PrefectureStatus, QuizResult } from '../types';

const TIMER_SECONDS = 20;

type Phase = 'name' | 'place';

interface Props {
  region: string;
  challenge: boolean;
  onFinish: (result: QuizResult) => void;
  onBack: () => void;
}

interface SessionState {
  questions: Prefecture[];
  currentIndex: number;
  correctCount: number;
  startTime: number;
}

export default function MapQuizScreen({ region, challenge, onFinish, onBack }: Props) {
  const regionPrefs = getPrefecturesByRegion(prefectures, region);
  const targets = getTargetTimes(region, challenge, 'name');

  const [session, setSession] = useState<SessionState>(() => ({
    questions: shuffleArray(regionPrefs),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
  }));

  // ── フェーズ管理 ──────────────────────────────
  const [phase, setPhase] = useState<Phase>('name');
  const [choices, setChoices] = useState<Prefecture[]>(() =>
    generateChoices(session.questions[0], prefectures)
  );
  const [nameFeedback, setNameFeedback] = useState<{ code: string; correct: boolean } | null>(null);

  // ── 地図タップフェーズの状態 ──────────────────
  const [statuses, setStatuses] = useState<Record<string, PrefectureStatus>>({});
  const [solvedCodes, setSolvedCodes] = useState<Set<string>>(new Set());
  const [placeFeedback, setPlaceFeedback] = useState<'correct' | 'wrong' | null>(null);

  // ── Refs ──────────────────────────────────────
  const solvedRef    = useRef(solvedCodes);   solvedRef.current    = solvedCodes;
  const sessionRef   = useRef(session);       sessionRef.current   = session;
  const phaseRef     = useRef(phase);         phaseRef.current     = phase;
  const nameFbRef    = useRef(nameFeedback);  nameFbRef.current    = nameFeedback;
  const placeFbRef   = useRef(placeFeedback); placeFbRef.current   = placeFeedback;
  const timerResetRef = useRef<() => void>(() => {});
  const timerStopRef  = useRef<() => void>(() => {});
  // この問題で1度でも間違えたか
  const hasWrongRef = useRef(false);

  const { playCorrect, playWrong } = useSound();
  const elapsed = useElapsedTime(session.startTime);

  // ── 問題を次に進める ─────────────────────────
  const advanceQuestion = useCallback((wasCorrect: boolean) => {
    const s = sessionRef.current;
    const actuallyCorrect = wasCorrect && !hasWrongRef.current;
    hasWrongRef.current = false;
    const newCorrect = s.correctCount + (actuallyCorrect ? 1 : 0);
    const nextIndex  = s.currentIndex + 1;

    if (nextIndex >= s.questions.length) {
      onFinish({
        quizType: 'name',
        region,
        correctCount: newCorrect,
        totalCount: s.questions.length,
        totalTimeMs: Date.now() - s.startTime,
      });
      return;
    }

    const nextPref = s.questions[nextIndex];
    setSession(prev => ({ ...prev, currentIndex: nextIndex, correctCount: newCorrect }));
    setChoices(generateChoices(nextPref, prefectures));
    setPhase('name');
    setNameFeedback(null);
    setPlaceFeedback(null);
    timerResetRef.current();
  }, [onFinish, region]);

  // ── タイマー時間切れ ─────────────────────────
  const handleExpire = useCallback(() => {
    if (phaseRef.current === 'name') {
      if (nameFbRef.current) return;
      hasWrongRef.current = true;
      playWrong();
      const correct = sessionRef.current.questions[sessionRef.current.currentIndex];
      setNameFeedback({ code: correct.code, correct: false });
      setTimeout(() => {
        setNameFeedback(null);
        timerResetRef.current();
      }, 1500);
    } else {
      if (placeFbRef.current) return;
      hasWrongRef.current = true;
      playWrong();
      setPlaceFeedback('wrong');
      setTimeout(() => {
        setPlaceFeedback(null);
        timerResetRef.current();
      }, 1500);
    }
  }, [playWrong]);

  const { remaining, start, reset, stop } = useTimer(TIMER_SECONDS, handleExpire);
  timerResetRef.current = reset;
  timerStopRef.current  = stop;

  // フェーズが変わるたびにタイマーをスタート
  useEffect(() => {
    start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.currentIndex, phase]);

  // ── フェーズ1：名前4択の回答 ─────────────────
  const handleNameChoice = useCallback((chosen: Prefecture) => {
    if (nameFbRef.current) return;
    const current = sessionRef.current.questions[sessionRef.current.currentIndex];
    if (chosen.code === current.code) {
      playCorrect();
      timerStopRef.current();
      setNameFeedback({ code: chosen.code, correct: true });
      setTimeout(() => {
        setNameFeedback(null);
        setPhase('place');
      }, 700);
    } else {
      hasWrongRef.current = true;
      playWrong();
      setNameFeedback({ code: chosen.code, correct: false });
      setTimeout(() => {
        setNameFeedback(null);
        timerResetRef.current();
      }, 900);
    }
  }, [playCorrect, playWrong]);

  // ── フェーズ2：地図タップ ─────────────────────
  const handleTap = useCallback((tappedCode: string) => {
    if (placeFbRef.current) return;
    const current = sessionRef.current.questions[sessionRef.current.currentIndex];
    if (!current) return;

    if (tappedCode === current.code) {
      playCorrect();
      timerStopRef.current();
      setSolvedCodes(prev => new Set([...prev, current.code]));
      setStatuses(prev => ({ ...prev, [current.code]: 'correct' }));
      setPlaceFeedback('correct');
      setTimeout(() => advanceQuestion(true), 900);
    } else {
      hasWrongRef.current = true;
      playWrong();
      setStatuses(prev => ({ ...prev, [tappedCode]: 'wrong' }));
      setPlaceFeedback('wrong');
      setTimeout(() => {
        setStatuses(prev =>
          prev[tappedCode] === 'wrong' ? { ...prev, [tappedCode]: 'idle' } : prev
        );
        setPlaceFeedback(null);
        timerResetRef.current();
      }, 1000);
    }
  }, [playCorrect, playWrong, advanceQuestion]);

  // ─────────────────────────────────────────────
  const currentPref = session.questions[session.currentIndex];
  if (!currentPref) return null;

  const headerBg = 'linear-gradient(to right, #1e3a8a, #312e81)';

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0d1b4b' }}>
      {/* ヘッダー */}
      <header className="flex items-center gap-3 px-4 py-2 border-b border-blue-900 text-white shrink-0" style={{ background: headerBg }}>
        <button onClick={onBack} className="text-yellow-300 text-2xl px-1 font-black hover:scale-110 transition-transform" aria-label="戻る">←</button>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-blue-300 font-bold">都道府県と形・{region}</span>
            {challenge && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-black bg-yellow-400 text-yellow-900">
                🔥
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              phase === 'name'
                ? 'bg-yellow-400 text-yellow-900'
                : 'bg-green-400 text-green-900'
            }`}>
              {phase === 'name' ? '① 名前は？' : '② どこ？'}
            </span>
          </div>
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

      {/* ════════ フェーズ1：名前4択 ════════ */}
      {phase === 'name' && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-5 overflow-y-auto">
          <p className="text-blue-300 font-bold text-sm">この形はどの都道府県？</p>

          {/* シルエット表示 */}
          <div className="w-40 h-40 rounded-2xl border-2 border-blue-600 p-3"
            style={{ background: '#0e2a4d', boxShadow: '0 0 20px rgba(59,130,246,0.3), inset 0 2px 8px rgba(0,0,0,0.5)' }}>
            <PrefectureShapePiece code={currentPref.code} region={currentPref.region} />
          </div>

          {/* 4択ボタン */}
          <div className="w-full max-w-sm grid grid-cols-2 gap-3">
            {choices.map(pref => {
              const fb = nameFeedback?.code === pref.code;
              const isCorrect = pref.code === currentPref.code;
              let btnStyle = 'bg-blue-800 border-blue-600 text-white shadow-blue-950';
              if (fb && isCorrect)  btnStyle = 'bg-green-500 border-green-300 text-white shadow-green-900';
              if (fb && !isCorrect) btnStyle = 'bg-red-500 border-red-300 text-white shadow-red-900';
              return (
                <button
                  key={pref.code}
                  onClick={() => handleNameChoice(pref)}
                  disabled={nameFeedback !== null}
                  className={`
                    btn-3d py-4 rounded-2xl font-black text-base border-2
                    disabled:cursor-not-allowed hover:brightness-110
                    ${btnStyle}
                  `}
                >
                  {pref.name}
                  <span className="block text-xs font-normal opacity-70 mt-0.5">{pref.nameKana}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════ フェーズ2：地図タップ ════════ */}
      {phase === 'place' && (
        <>
          {/* 配置対象の表示 */}
          <div className="px-4 py-2.5 border-b border-blue-900 shrink-0 text-center" style={{ background: '#0a1638' }}>
            <p className="text-xs text-blue-400 font-bold mb-2">地図の正しい場所をタップしよう！</p>
            <div
              className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl border-2 border-yellow-400"
              style={{
                background: 'linear-gradient(to bottom, #1e40af, #1e3a8a)',
                boxShadow: '0 0 20px rgba(250,204,21,0.4)',
              }}
            >
              <div className="w-12 h-12">
                <PrefectureShapePiece code={currentPref.code} region={currentPref.region} />
              </div>
              <div className="text-left">
                <span className="font-black text-lg text-white">{currentPref.name}</span>
                <span className="block text-xs text-blue-300">{currentPref.nameKana}</span>
              </div>
            </div>
          </div>

          {/* フィードバックバナー */}
          {placeFeedback && (
            <div className={`
              text-center py-2 text-sm font-black shrink-0 border-b
              ${placeFeedback === 'correct'
                ? 'bg-green-500 text-white border-green-400'
                : 'bg-red-500 text-white border-red-400'}
            `}>
              {placeFeedback === 'correct' ? '⭐ せいかい！すごい！' : '💥 ちがうよ！もう一度！'}
            </div>
          )}

          {/* 地域拡大マップ（タップ操作） */}
          <RegionalMap
            region={region}
            statuses={statuses}
            solvedCodes={solvedCodes}
            onTap={handleTap}
            disabled={placeFeedback !== null}
            challengeMode={challenge}
          />
        </>
      )}
    </div>
  );
}
