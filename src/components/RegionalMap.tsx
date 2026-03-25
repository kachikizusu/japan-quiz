import { useMemo } from 'react';
import { prefecturePaths, prefectureLabelPos, OKINAWA_PATH } from '../data/prefecturePaths.generated';
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

// OKINAWA_PATH の自然な座標範囲
const OKINAWA_NATURAL = { minX: 42, maxX: 56, minY: 12, maxY: 28 };

export default function RegionalMap({ region, statuses, solvedCodes, onTap, disabled, challengeMode }: Props) {
  const showOkinawa = region === '九州・沖縄' || region === '全国';

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
    const b = computeBBox(paths);
    // 沖縄インセット用に下部に余白を追加
    if (showOkinawa) {
      const insetH = Math.max(40, b.h * 0.22);
      b.h += insetH + 8;
    }
    return b;
  }, [regionCodes, showOkinawa]);

  const getStatusClass = (code: string) => {
    const s = statuses[code];
    if (s && s !== 'idle') return s;
    return challengeMode ? 'challenge-idle' : 'idle';
  };

  const fontSize = Math.max(4, Math.min(10, bbox.w / regionCodes.length / 2));

  // 沖縄インセットの寸法と位置（bboxの左下コーナー）
  const insetW = Math.max(50, bbox.w * 0.28);
  const insetH = Math.max(40, bbox.h * 0.18);
  const insetX = bbox.x + bbox.w - insetW - 4;
  const insetY = bbox.y + bbox.h - insetH - 4;
  const okinawaPad = 6;
  const okinawaScale = Math.min(
    (insetW - okinawaPad * 2) / (OKINAWA_NATURAL.maxX - OKINAWA_NATURAL.minX),
    (insetH - okinawaPad * 2 - 8) / (OKINAWA_NATURAL.maxY - OKINAWA_NATURAL.minY)
  );
  const okinawaTx = insetX + okinawaPad - OKINAWA_NATURAL.minX * okinawaScale;
  const okinawaTy = insetY + okinawaPad + 8 - OKINAWA_NATURAL.minY * okinawaScale;
  // 沖縄パス中心（star/? 表示用）
  const okinawaCx = (OKINAWA_NATURAL.minX + OKINAWA_NATURAL.maxX) / 2;
  const okinawaCy = (OKINAWA_NATURAL.minY + OKINAWA_NATURAL.maxY) / 2;

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
        {/* 通常の都道府県 */}
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

        {/* 沖縄インセット */}
        {showOkinawa && (() => {
          const statusClass = getStatusClass('okinawa');
          const isSolved = solvedCodes.has('okinawa');
          const isWrong = statuses['okinawa'] === 'wrong';
          const starSize = fontSize / okinawaScale;
          return (
            <g key="okinawa-inset">
              {/* インセット枠 */}
              <rect
                x={insetX} y={insetY} width={insetW} height={insetH}
                fill="#0e2a4d" stroke="#1e4a7a" strokeWidth="1" rx="3"
              />
              <text
                x={insetX + 4} y={insetY + 7}
                fontSize={Math.max(4, insetW * 0.1)} fill="#3b6a9e"
                fontFamily="sans-serif"
                style={{ pointerEvents: 'none' }}
              >沖縄</text>
              {/* 沖縄パス（タップ可能） */}
              <g
                transform={`translate(${okinawaTx}, ${okinawaTy}) scale(${okinawaScale})`}
                onClick={() => { if (!disabled) onTap('okinawa'); }}
                onPointerDown={e => { e.preventDefault(); if (!disabled) onTap('okinawa'); }}
                style={{ cursor: disabled ? 'default' : 'pointer' }}
              >
                <path
                  d={OKINAWA_PATH}
                  data-code="okinawa"
                  className={`prefecture-path ${statusClass}`}
                />
                {isSolved && (
                  <text
                    x={okinawaCx} y={okinawaCy}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={starSize} fill="#fef08a" fontWeight="bold"
                    style={{ pointerEvents: 'none', fontFamily: 'sans-serif' }}
                  >★</text>
                )}
                {!isSolved && !challengeMode && !isWrong && (
                  <text
                    x={okinawaCx} y={okinawaCy}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={starSize * 0.85} fill="rgba(255,255,255,0.25)"
                    style={{ pointerEvents: 'none', fontFamily: 'sans-serif' }}
                  >?</text>
                )}
              </g>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
