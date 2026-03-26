import { useState, useCallback, useRef, useEffect } from 'react';
import TimerBar from '../components/TimerBar';
import { useTimer } from '../hooks/useTimer';
import { useElapsedTime, formatElapsed } from '../hooks/useElapsedTime';
import { useSound } from '../hooks/useSound';
import { prefectures } from '../data/prefectures';
import { prefectureMarkPath } from '../data/prefectureMarks';
import { shuffleArray, getPrefecturesByRegion, generateChoices } from '../utils/quizLogic';
import { getTargetTimes, formatTarget } from '../data/targetTimes';
import { isCorrectPrefName } from '../utils/normalize';
import type { Prefecture, QuizResult } from '../types';

const TIMER_SECONDS = 20;

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

export default function MarkQuizScreen({ region, challenge, onFinish, onBack }: Props) {
  const regionPrefs = getPrefecturesByRegion(prefectures, region);
  const targets = getTargetTimes(region, challenge, 'mark');

  // 全国モード時は正解と同じ地方内を選択肢プールにする
  const getWrongPool = useCallback((pref: Prefecture) => {
    if (region === '全国') {
      return getPrefecturesByRegion(prefectures, pref.region === '九州' ? '九州・沖縄' : pref.region);
    }
    return regionPrefs;
  }, [region, regionPrefs]);

  const [session, setSession] = useState<SessionState>(() => ({
    questions: shuffleArray(regionPrefs),
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
  }));

  const [choices, setChoices] = useState<Prefecture[]>(() =>
    generateChoices(session.questions[0], prefectures, getWrongPool(session.questions[0]))
  );
  const [feedback, setFeedback] = useState<{ code: string; correct: boolean } | null>(null);
  const [imgError, setImgError] = useState(false);

  // チャレンジモード用
  const [inputValue, setInputValue] = useState('');
  const [textFeedback, setTextFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sessionRef   = useRef(session);  sessionRef.current  = session;
  const feedbackRef  = useRef(feedback); feedbackRef.current = feedback;
  const textFeedbackRef = useRef(textFeedback); textFeedbackRef.current = textFeedback;
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
        quizType: 'mark',
        region,
        correctCount: newCorrect,
        totalCount: s.questions.length,
        totalTimeMs: Date.now() - s.startTime,
      });
      return;
    }

    const nextPref = s.questions[nextIndex];
    setSession(prev => ({ ...prev, currentIndex: nextIndex, correctCount: newCorrect }));
    setChoices(generateChoices(nextPref, prefectures, getWrongPool(nextPref)));
    setFeedback(null);
    setTextFeedback(null);
    setInputValue('');
    setImgError(false);
    timerResetRef.current();
  }, [onFinish, region]);

  const handleExpire = useCallback(() => {
    if (challenge) {
      if (textFeedbackRef.current) return;
      hasWrongRef.current = true;
      playWrong();
      setTextFeedback('timeout');
      setTimeout(() => advanceQuestion(false), 1500);
    } else {
      if (feedbackRef.current) return;
      hasWrongRef.current = true;
      playWrong();
      const current = sessionRef.current.questions[sessionRef.current.currentIndex];
      setFeedback({ code: current.code, correct: false });
      setTimeout(() => {
        setFeedback(null);
        timerResetRef.current();
      }, 1500);
    }
  }, [challenge, playWrong, advanceQuestion]);

  const { remaining, start, reset, stop } = useTimer(TIMER_SECONDS, handleExpire);
  timerResetRef.current = reset;
  timerStopRef.current  = stop;

  useEffect(() => {
    start();
    if (challenge) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.currentIndex]);

  const handleTextSubmit = useCallback(() => {
    if (textFeedbackRef.current) return;
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const current = sessionRef.current.questions[sessionRef.current.currentIndex];
    if (isCorrectPrefName(current, trimmed)) {
      playCorrect();
      timerStopRef.current();
      setTextFeedback('correct');
      setTimeout(() => advanceQuestion(true), 1000);
    } else {
      hasWrongRef.current = true;
      playWrong();
      setTextFeedback('wrong');
      setTimeout(() => {
        setTextFeedback(null);
        setInputValue('');
        timerResetRef.current();
        inputRef.current?.focus();
      }, 1000);
    }
  }, [inputValue, playCorrect, playWrong, advanceQuestion]);

  const handleChoice = useCallback((chosen: Prefecture) => {
    if (feedbackRef.current) return;
    const current = sessionRef.current.questions[sessionRef.current.currentIndex];
    if (chosen.code === current.code) {
      playCorrect();
      timerStopRef.current();
      setFeedback({ code: chosen.code, correct: true });
      setTimeout(() => advanceQuestion(true), 700);
    } else {
      hasWrongRef.current = true;
      playWrong();
      setFeedback({ code: chosen.code, correct: false });
      setTimeout(() => {
        setFeedback(null);
        timerResetRef.current();
      }, 900);
    }
  }, [playCorrect, playWrong, advanceQuestion]);

  const currentPref = session.questions[session.currentIndex];
  if (!currentPref) return null;

  const markSrc = prefectureMarkPath[currentPref.code];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0d1b4b' }}>
      {/* ヘッダー */}
      <header className="flex items-center gap-3 px-4 py-2 border-b border-blue-900 text-white shrink-0"
        style={{ background: 'linear-gradient(to right, #1e3a8a, #312e81)' }}>
        <button onClick={onBack} className="text-yellow-300 text-2xl px-1 font-black hover:scale-110 transition-transform" aria-label="戻る">←</button>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-blue-300 font-bold">県章クイズ・{region}</span>
          {challenge && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-black bg-yellow-400 text-yellow-900">🔥</span>
          )}
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

      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-5 overflow-y-auto">
        <p className="text-blue-300 font-bold text-sm">この県章はどの都道府県？</p>

        {/* 県章画像 */}
        <div className="w-44 h-44 rounded-2xl border-4 border-blue-600 flex items-center justify-center p-5"
          style={{ background: '#ffffff', boxShadow: '0 0 24px rgba(59,130,246,0.5)' }}>
          {markSrc && !imgError ? (
            <img
              src={markSrc}
              alt="県章"
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-6xl">🏅</span>
          )}
        </div>

        {challenge ? (
          /* チャレンジモード：テキスト入力 */
          <div className="w-full max-w-xs flex flex-col gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleTextSubmit(); }}
              placeholder="ひらがな・漢字どちらでもOK"
              disabled={textFeedback === 'correct' || textFeedback === 'timeout'}
              className={`
                w-full text-center text-xl font-bold px-4 py-3 rounded-2xl border-2
                outline-none transition-all text-white placeholder:text-blue-700
                ${textFeedback === 'correct'
                  ? 'border-green-400 text-green-300'
                  : textFeedback === 'wrong'
                  ? 'border-red-400 shake text-red-300'
                  : 'border-blue-600 focus:border-yellow-400'}
              `}
              style={{ background: '#0e2a4d' }}
            />
            <button
              onClick={handleTextSubmit}
              disabled={!inputValue.trim() || !!textFeedback}
              className="
                btn-3d w-full py-4 rounded-2xl font-black text-xl text-yellow-900
                bg-gradient-to-b from-yellow-300 to-yellow-500
                border-2 border-yellow-200 shadow-yellow-800
                disabled:from-blue-900 disabled:to-blue-900 disabled:text-blue-700
                disabled:border-blue-800 disabled:shadow-none hover:brightness-110
              "
            >
              こたえる！
            </button>
            {textFeedback && (
              <div className={`
                text-center text-lg font-black px-6 py-2 rounded-2xl bounce-in
                ${textFeedback === 'correct'
                  ? 'bg-green-500 text-white'
                  : textFeedback === 'timeout'
                  ? 'bg-orange-500 text-white'
                  : 'bg-red-500 text-white'}
              `}>
                {textFeedback === 'correct' ? '⭐ せいかい！' :
                 textFeedback === 'timeout' ? `⏱ 時間切れ！→ ${currentPref.name}` :
                 '💥 ちがうよ！'}
              </div>
            )}
          </div>
        ) : (
          /* ふつうモード：4択ボタン */
          <div className="w-full max-w-sm grid grid-cols-2 gap-3">
            {choices.map(pref => {
              const fb = feedback?.code === pref.code;
              const isCorrect = pref.code === currentPref.code;
              let btnStyle = 'bg-blue-800 border-blue-600 text-white shadow-blue-950';
              if (fb && isCorrect)  btnStyle = 'bg-green-500 border-green-300 text-white shadow-green-900';
              if (fb && !isCorrect) btnStyle = 'bg-red-500 border-red-300 text-white shadow-red-900';
              return (
                <button
                  key={pref.code}
                  onClick={() => handleChoice(pref)}
                  disabled={feedback !== null}
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
        )}
      </div>
    </div>
  );
}
