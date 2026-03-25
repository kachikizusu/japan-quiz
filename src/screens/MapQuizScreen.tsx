import { useState, useCallback, useRef, useEffect } from 'react';
import JapanMap from '../components/JapanMap';
import TimerBar from '../components/TimerBar';
import PrefectureShapePiece from '../components/PrefectureShapePiece';
import { useTimer } from '../hooks/useTimer';
import { useElapsedTime, formatElapsed } from '../hooks/useElapsedTime';
import { useSound } from '../hooks/useSound';
import { prefectures } from '../data/prefectures';
import { shuffleArray, getPrefecturesByRegion, generateChoices } from '../utils/quizLogic';
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

  // ── 地図配置フェーズの状態 ────────────────────
  const [statuses, setStatuses] = useState<Record<string, PrefectureStatus>>({});
  const [solvedCodes, setSolvedCodes] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [ghost, setGhost] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0, y: 0, visible: false,
  });
  const [placeFeedback, setPlaceFeedback] = useState<'correct' | 'wrong' | null>(null);

  // ── Refs ──────────────────────────────────────
  const dragRef = useRef<{ code: string | null; startX: number; startY: number; moved: boolean }>(
    { code: null, startX: 0, startY: 0, moved: false }
  );
  const solvedRef    = useRef(solvedCodes);   solvedRef.current    = solvedCodes;
  const sessionRef   = useRef(session);       sessionRef.current   = session;
  const phaseRef     = useRef(phase);         phaseRef.current     = phase;
  const nameFbRef    = useRef(nameFeedback);  nameFbRef.current    = nameFeedback;
  const placeFbRef   = useRef(placeFeedback); placeFbRef.current   = placeFeedback;
  const timerResetRef = useRef<() => void>(() => {});
  const timerStopRef  = useRef<() => void>(() => {});

  const { playCorrect, playWrong } = useSound();
  const elapsed = useElapsedTime(session.startTime);

  // ── 問題を次に進める ─────────────────────────
  const advanceQuestion = useCallback((wasCorrect: boolean) => {
    const s = sessionRef.current;
    const newCorrect = s.correctCount + (wasCorrect ? 1 : 0);
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
      playWrong();
      // 時間切れ → 正解をハイライト表示してから再チャレンジ
      const correct = sessionRef.current.questions[sessionRef.current.currentIndex];
      setNameFeedback({ code: correct.code, correct: false });
      setTimeout(() => {
        setNameFeedback(null);
        timerResetRef.current();
      }, 1500);
    } else {
      if (placeFbRef.current) return;
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
      playWrong();
      setNameFeedback({ code: chosen.code, correct: false });
      setTimeout(() => {
        setNameFeedback(null);
        timerResetRef.current();
      }, 900);
    }
  }, [playCorrect, playWrong]);

  // ── フェーズ2：ドラッグ開始 ───────────────────
  const handleDragStart = useCallback((e: React.PointerEvent) => {
    const current = sessionRef.current.questions[sessionRef.current.currentIndex];
    if (!current) return;
    e.preventDefault();
    dragRef.current = { code: current.code, startX: e.clientX, startY: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const getPrefCodeAtPoint = useCallback((x: number, y: number): string | null => {
    for (const el of document.elementsFromPoint(x, y)) {
      const code = (el as HTMLElement).dataset?.code;
      if (code) return code;
    }
    return null;
  }, []);

  // ── グローバルポインターイベント ─────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current.code) return;
      e.preventDefault(); // スクロール抑制（モバイル必須）
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (!dragRef.current.moved && Math.hypot(dx, dy) < 6) return;
      dragRef.current.moved = true;
      setIsDragging(true);
      setGhost({ x: e.clientX, y: e.clientY, visible: true });

      const targetCode = getPrefCodeAtPoint(e.clientX, e.clientY);
      setStatuses(prev => {
        const next = { ...prev };
        for (const k of Object.keys(next)) {
          if (next[k] === 'hover') next[k] = 'idle';
        }
        if (targetCode && !solvedRef.current.has(targetCode)) next[targetCode] = 'hover';
        return next;
      });
    };

    const onUp = (e: PointerEvent) => {
      const code  = dragRef.current.code;
      const moved = dragRef.current.moved;
      dragRef.current = { code: null, startX: 0, startY: 0, moved: false };
      setIsDragging(false);
      setGhost(g => ({ ...g, visible: false }));

      setStatuses(prev => {
        const next = { ...prev };
        for (const k of Object.keys(next)) {
          if (next[k] === 'hover') next[k] = 'idle';
        }
        return next;
      });

      if (!code || !moved) return;
      if (placeFbRef.current) return;

      const targetCode = getPrefCodeAtPoint(e.clientX, e.clientY);
      if (!targetCode) return;

      if (targetCode === code) {
        playCorrect();
        timerStopRef.current();
        setSolvedCodes(prev => new Set([...prev, code]));
        setStatuses(prev => ({ ...prev, [code]: 'correct' }));
        setPlaceFeedback('correct');
        setTimeout(() => advanceQuestion(true), 900);
      } else {
        playWrong();
        setStatuses(prev => ({ ...prev, [targetCode]: 'wrong' }));
        setPlaceFeedback('wrong');
        setTimeout(() => {
          setStatuses(prev =>
            prev[targetCode] === 'wrong' ? { ...prev, [targetCode]: 'idle' } : prev
          );
          setPlaceFeedback(null);
          timerResetRef.current();
        }, 1000);
      }
    };

    // window → document、passive:false でモバイルのスクロール横取りを防ぐ
    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, [getPrefCodeAtPoint, advanceQuestion, playCorrect, playWrong]);

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

      {/* ════════ フェーズ2：地図配置 ════════ */}
      {phase === 'place' && (
        <> {/* touch-action:none はドラッグ中のスクロール防止のため各要素に設定済み */}
          {/* ドラッグピース */}
          <div className="px-4 py-3 border-b border-blue-900 shrink-0 text-center" style={{ background: '#0a1638' }}>
            <p className="text-xs text-blue-400 font-bold mb-2">地図の正しい場所にドラッグしよう！</p>
            <div
              className={`
                inline-flex flex-col items-center gap-1
                px-5 py-2 rounded-2xl border-2 border-yellow-400
                cursor-grab active:cursor-grabbing select-none touch-none
                ${placeFeedback === 'wrong' ? 'shake' : ''}
              `}
              style={{
                background: 'linear-gradient(to bottom, #1e40af, #1e3a8a)',
                boxShadow: '0 0 20px rgba(250,204,21,0.4), 0 4px 0 #92400e',
                touchAction: 'none',
              }}
              onPointerDown={handleDragStart}
            >
              <div className="w-16 h-16">
                <PrefectureShapePiece code={currentPref.code} region={currentPref.region} />
              </div>
              <span className="font-black text-lg leading-tight text-white">{currentPref.name}</span>
              <span className="text-xs text-blue-300">{currentPref.nameKana}</span>
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

          {/* 日本地図 */}
          <JapanMap
            statuses={statuses}
            solvedCodes={solvedCodes}
            isDragging={isDragging}
            highlightRegion={region}
            challengeMode={challenge}
          />

          {/* ドラッグゴースト */}
          {ghost.visible && (
            <div
              className="fixed pointer-events-none z-50 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 border-yellow-400"
              style={{
                left: ghost.x, top: ghost.y, transform: 'translate(-50%, -120%)',
                background: 'linear-gradient(to bottom, #1e40af, #1e3a8a)',
                boxShadow: '0 0 20px rgba(250,204,21,0.6)',
                opacity: 0.92,
              }}
            >
              <div className="w-12 h-12">
                <PrefectureShapePiece code={currentPref.code} region={currentPref.region} ghost />
              </div>
              <span className="font-black text-xs text-white">{currentPref.name}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
