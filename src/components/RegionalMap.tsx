import { useMemo } from 'react';
import { prefecturePaths, prefectureLabelPos } from '../data/prefecturePaths.generated';
import { prefectureByCode } from '../data/prefectures';
import type { PrefectureStatus } from '../types';

interface Props {
  region: string;
  statuses: Record<string, PrefectureStatus>;
  solvedCodes: Set<string>;
  onTap: (code: string) => void;
  disabled: boolean;
  challengeMode?: boolean;
}

function computeBBox(paths: string[], pad = 24) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const d of paths) {
    const nums = d.match(/[-\d.]+,[-\d.]+/g) || [];
    for (const pair of nums) {
      const [x, y] = pair.split(',').map(Number);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
}

export default function RegionalMap({ region, statuses, solvedCodes, onTap, disabled, challengeMode }: Props) {
  const regionCodes = useMemo(() =>
    Object.entries(prefectureByCode)
      .filter(([, p]) =>
        region === '全国' ||
        p.region === region ||
        (region === '九州・沖縄' && p.region === '九州')
      )
      .map(([code]) => code)
      .filter(code => code in prefecturePaths),
    [region]
  );

  const bbox = useMemo(() => {
    const paths = regionCodes.map(c => prefecturePaths[c]);
    return computeBBox(paths);
  }, [regionCodes]);

  const getStatusClass = (code: string) => {
    const s = statuses[code];
    if (s && s !== 'idle') return s;
    return challengeMode ? 'challenge-idle' : 'idle';
  };

  // ラベルが読みやすいサイズになるようbboxに合わせてfontSizeを調整
  const fontSize = Math.max(4, Math.min(10, bbox.w / regionCodes.length / 2));

  return (
    <div
      className="flex-1 flex items-center justify-center overflow-hidden min-h-0"
      style={{ background: '#071028', touchAction: 'none' }}
    >
      <svg
        viewBox={`${bbox.x} ${bbox.y} ${bbox.w} ${bbox.h}`}
        className="w-full h-full"
        style={{ touchAction: 'none', maxWidth: '100%', maxHeight: '100%' }}
      >
        {regionCodes.map(code => {
          const d = prefecturePaths[code];
          const statusClass = getStatusClass(code);
          const pos = prefectureLabelPos[code];
          const isSolved = solvedCodes.has(code);
          const isWrong = statuses[code] === 'wrong';

          return (
            <g
              key={code}
              onClick={() => { if (!disabled) onTap(code); }}
              onPointerDown={e => { e.preventDefault(); if (!disabled) onTap(code); }}
              style={{ cursor: disabled ? 'default' : 'pointer' }}
            >
              <path
                d={d}
                data-code={code}
                className={`prefecture-path ${statusClass}`}
              />
              {/* 解答済みは★、それ以外はchallengeMode以外で名前を薄く表示 */}
              {pos && isSolved && (
                <text
                  x={pos.x} y={pos.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={fontSize} fill="#fef08a" fontWeight="bold"
                  style={{ pointerEvents: 'none', fontFamily: 'sans-serif' }}
                >★</text>
              )}
              {pos && !isSolved && !challengeMode && !isWrong && (
                <text
                  x={pos.x} y={pos.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={fontSize * 0.85} fill="rgba(255,255,255,0.25)"
                  style={{ pointerEvents: 'none', fontFamily: 'sans-serif' }}
                >?</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
