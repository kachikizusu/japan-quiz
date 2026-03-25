import { prefecturePaths, OKINAWA_PATH, prefectureLabelPos } from '../data/prefecturePaths.generated';
import { prefectureByCode } from '../data/prefectures';
import type { PrefectureStatus } from '../types';

interface JapanMapProps {
  statuses: Record<string, PrefectureStatus>;
  solvedCodes: Set<string>;
  isDragging: boolean;
  highlightRegion?: string;
  challengeMode?: boolean;
}

export default function JapanMap({ statuses, solvedCodes, isDragging, highlightRegion, challengeMode }: JapanMapProps) {
  const getStatusClass = (code: string): string => {
    const status = statuses[code];
    if (status && status !== 'idle') return status;
    if (highlightRegion) {
      const pref = prefectureByCode[code];
      const regionMatch =
        pref?.region === highlightRegion ||
        (highlightRegion === '九州・沖縄' && pref?.region === '九州');
      if (!regionMatch) return challengeMode ? 'challenge-dim' : 'dim';
    }
    return challengeMode ? 'challenge-idle' : 'idle';
  };

  const renderPrefPath = (code: string, d: string) => {
    const statusClass = getStatusClass(code);
    const pos = prefectureLabelPos[code];
    const isSolved = solvedCodes.has(code);

    return (
      <g key={code}>
        <path
          d={d}
          data-code={code}
          className={`prefecture-path ${statusClass}`}
          style={{ cursor: isDragging ? 'crosshair' : 'default' }}
        />
        {isSolved && pos && (
          <text
            x={pos.x} y={pos.y}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="8" fill="#fef08a" fontWeight="black"
            style={{ pointerEvents: 'none', fontFamily: 'sans-serif' }}
          >
            ★
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0"
      style={{ background: '#071028', touchAction: 'none' }}>
      <svg
        id="japan-map-svg"
        viewBox="0 0 680 760"
        className="w-full h-full max-h-full"
        style={{ touchAction: 'none', maxWidth: '100%' }}
      >
        {/* 海 */}
        <rect x="0" y="0" width="680" height="760" fill="#0e2a4d" rx="8" />

        {/* 47都道府県 */}
        {Object.entries(prefecturePaths).map(([code, d]) => renderPrefPath(code, d))}

        {/* 沖縄インセット */}
        <g transform="translate(8, 632)">
          <rect x="0" y="0" width="220" height="115" fill="#0e2a4d" stroke="#1e4a7a" strokeWidth="1.5" rx="6" />
          <text x="8" y="12" fontSize="7.5" fill="#3b6a9e" fontFamily="sans-serif" fontWeight="bold">
            沖縄（インセット）
          </text>
          <g transform="translate(12, 18) scale(3.5)">
            <path
              d={OKINAWA_PATH}
              data-code="okinawa"
              className={`prefecture-path ${getStatusClass('okinawa')}`}
              style={{ cursor: isDragging ? 'crosshair' : 'default' }}
            />
            {solvedCodes.has('okinawa') && (
              <text x="50" y="12" textAnchor="middle" dominantBaseline="middle"
                fontSize="5" fill="#fef08a" fontWeight="black"
                style={{ pointerEvents: 'none', fontFamily: 'sans-serif' }}>
                ★
              </text>
            )}
          </g>
          <line x1="220" y1="55" x2="250" y2="0" stroke="#1e4a7a" strokeWidth="1" strokeDasharray="3,2" />
        </g>
      </svg>
    </div>
  );
}
