import { useEffect, useRef, useState } from 'react';
import type { QuizResult } from '../types';
import { savePersonalBest, loadPersonalBest } from '../utils/personalBest';
import { getTargetTimes, getMedal, formatTarget } from '../data/targetTimes';
import type { Medal } from '../data/targetTimes';

interface Props {
  result: QuizResult;
  challenge: boolean;
  onRetry: () => void;
  onBackToRegion: () => void;
  onRecords: () => void;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0) return `${m}分${sec}秒`;
  return `${s}秒`;
}

function formatTimeMs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}秒`;
}

const MEDAL_CONFIG: Record<NonNullable<Medal>, { emoji: string; label: string; color: string; bg: string; border: string }> = {
  gold:   { emoji: '🥇', label: 'ゴールド', color: 'text-yellow-300', bg: 'from-yellow-700 to-yellow-900', border: 'border-yellow-400' },
  silver: { emoji: '🥈', label: 'シルバー', color: 'text-gray-200',   bg: 'from-gray-600 to-gray-800',   border: 'border-gray-400' },
  bronze: { emoji: '🥉', label: 'ブロンズ', color: 'text-orange-300', bg: 'from-orange-700 to-orange-900', border: 'border-orange-400' },
};

export default function ResultScreen({ result, challenge, onRetry, onBackToRegion, onRecords }: Props) {
  const { correctCount, totalCount, totalTimeMs } = result;
  const pct = Math.round((correctCount / totalCount) * 100);
  const perfect = correctCount === totalCount;

  const targets = getTargetTimes(result.region, challenge, result.quizType);
  const medal = getMedal(totalTimeMs, targets, perfect);

  const savedRef = useRef(false);
  const [isNewPerfect, setIsNewPerfect] = useState(false);
  const [isNewScore, setIsNewScore] = useState(false);
  const [prevBestMs, setPrevBestMs] = useState<number | null>(null);

  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;
    const prev = loadPersonalBest(result.quizType, result.region);
    setPrevBestMs(prev?.perfectTimeMs ?? null);
    const { isNewPerfect: np, isNewScore: ns } = savePersonalBest(result);
    setIsNewPerfect(np);
    setIsNewScore(ns);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const emoji = perfect ? '🎉' : pct >= 70 ? '😄' : '😢';

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d1b4b' }}>
      <header className="px-4 py-3 border-b border-blue-900 text-white text-center shrink-0"
        style={{ background: 'linear-gradient(to right, #1e3a8a, #312e81)' }}>
        <h2 className="text-xl font-black text-yellow-300"
          style={{ textShadow: '2px 2px 0 #92400e' }}>
          🏁 けっか発表！{challenge && <span className="ml-2 text-base">🔥チャレンジ</span>}
        </h2>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 overflow-y-auto py-4">

        {/* 新記録バナー */}
        {isNewPerfect && (
          <div className="record-pulse w-full max-w-xs rounded-2xl px-4 py-3 text-center border-2 border-yellow-400 bounce-in"
            style={{ background: 'linear-gradient(to bottom, #78350f, #92400e)' }}>
            <div className="text-2xl font-black text-yellow-300">🏆 タイムアタック新記録！</div>
            <div className="text-sm font-bold text-yellow-400 mt-1">
              {formatTimeMs(totalTimeMs)}
              {prevBestMs !== null && (
                <span className="text-yellow-700 ml-1">（前回：{formatTimeMs(prevBestMs)}）</span>
              )}
            </div>
          </div>
        )}

        {isNewScore && !isNewPerfect && (
          <div className="w-full max-w-xs rounded-2xl px-4 py-3 text-center border-2 border-green-400 bounce-in"
            style={{ background: 'linear-gradient(to bottom, #14532d, #166534)' }}>
            <div className="text-xl font-black text-green-300">✨ スコア新記録！</div>
            <div className="text-sm font-bold text-green-400 mt-1">{correctCount} 問正解</div>
          </div>
        )}

        {/* メダル */}
        {medal && (() => {
          const m = MEDAL_CONFIG[medal];
          return (
            <div className={`w-full max-w-xs rounded-2xl px-4 py-3 text-center border-2 ${m.border} bounce-in bg-gradient-to-b ${m.bg}`}>
              <div className={`text-4xl mb-1`}>{m.emoji}</div>
              <div className={`text-xl font-black ${m.color}`}>{m.label}メダル獲得！</div>
              <div className={`text-xs font-bold ${m.color} opacity-80 mt-1`}>
                全問正解 {formatTimeMs(totalTimeMs)} でクリア！
              </div>
            </div>
          );
        })()}

        {/* 目標タイム（全問正解でない場合も表示） */}
        {!medal && (
          <div className="w-full max-w-xs rounded-xl px-3 py-2 border border-blue-700 text-xs"
            style={{ background: '#0e2a4d' }}>
            <div className="text-blue-400 font-bold mb-1 text-center">🎯 目標タイム（全問正解で獲得）</div>
            <div className="flex justify-around">
              <span className="text-yellow-400 font-bold">🥇 {formatTarget(targets.gold)}</span>
              <span className="text-gray-300 font-bold">🥈 {formatTarget(targets.silver)}</span>
              <span className="text-orange-400 font-bold">🥉 {formatTarget(targets.bronze)}</span>
            </div>
          </div>
        )}

        {/* スコア */}
        <div className="text-center">
          <div className="text-7xl mb-2">{emoji}</div>
          <div className="text-7xl font-black text-yellow-300 mb-1"
            style={{ textShadow: '3px 3px 0 #92400e' }}>
            {correctCount}
            <span className="text-3xl text-blue-400 font-normal" style={{ textShadow: 'none' }}> / {totalCount}</span>
          </div>
          <div className="text-blue-300 text-sm font-bold">もんだいせいかい！</div>
        </div>

        {/* 統計カード */}
        <div className="w-full max-w-xs rounded-2xl p-4 flex flex-col gap-3 border-2 border-blue-700"
          style={{ background: '#0e2a4d' }}>
          <div className="flex justify-between items-center">
            <span className="text-blue-300 text-sm font-bold">せいかいりつ</span>
            <span className={`font-black text-xl ${perfect ? 'text-yellow-300' : 'text-white'}`}>{pct}%</span>
          </div>
          <div className="w-full rounded-full h-4 border border-blue-700 overflow-hidden" style={{ background: '#071028' }}>
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                perfect
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-300 text-sm font-bold">かかった時間</span>
            <span className="font-black text-white">{formatTime(totalTimeMs)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-300 text-sm font-bold">地方</span>
            <span className="font-black text-white">{result.region}</span>
          </div>
        </div>

        {perfect && !isNewPerfect && (
          <div className="text-center font-black text-xl text-yellow-300 animate-bounce"
            style={{ textShadow: '2px 2px 0 #92400e' }}>
            ぜんもんせいかい！すごい！🌟
          </div>
        )}

        {/* ボタン */}
        <div className="w-full max-w-xs flex flex-col gap-3">
          <button
            className="btn-3d w-full py-4 rounded-2xl font-black text-xl text-yellow-900 border-2 border-yellow-200 shadow-yellow-800 bg-gradient-to-b from-yellow-300 to-yellow-500 hover:brightness-110"
            onClick={onRetry}
          >
            🎮 もう一度！
          </button>
          <button
            className="btn-3d w-full py-3 rounded-xl font-black text-base text-white border-2 border-blue-500 shadow-blue-900 bg-gradient-to-b from-blue-500 to-blue-700 hover:brightness-110"
            onClick={onBackToRegion}
          >
            地方選びに戻る
          </button>
          <button
            className="btn-3d w-full py-3 rounded-xl font-black text-base text-white border-2 border-violet-500 shadow-violet-900 bg-gradient-to-b from-violet-500 to-violet-700 hover:brightness-110"
            onClick={onRecords}
          >
            🏆 きろくを見る
          </button>
        </div>
      </div>
    </div>
  );
}
