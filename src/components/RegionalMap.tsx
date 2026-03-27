import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
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
  zoomable?: boolean;
}

interface ViewBox { x: number; y: number; w: number; h: number; }

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

export default function RegionalMap({ region, statuses, solvedCodes, onTap, disabled, challengeMode, zoomable }: Props) {
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

  // baseBbox（沖縄なし）を先に計算し、インセット寸法を確定してから bbox を拡張
  const baseBbox = useMemo(() => {
    const paths = regionCodes.map(c => prefecturePaths[c]);
    return computeBBox(paths);
  }, [regionCodes]);

  const insetW = Math.max(40, baseBbox.w * 0.18);
  const insetH = Math.max(32, baseBbox.h * 0.13);

  const bbox = useMemo(() => {
    if (!showOkinawa) return baseBbox;
    const extra = Math.max(0, insetH - 16);
    return { ...baseBbox, h: baseBbox.h + extra };
  }, [baseBbox, showOkinawa, insetH]);

  // ── ズーム / パン 用 ViewBox 状態 ──────────────────────
  const [vb, setVb] = useState<ViewBox>(() => ({ ...bbox }));

  // イベントハンドラ内で同期的に最新値を参照するためのref
  // vbRef（レンダー後に更新）とは違い、setVb と同時に即座に更新する
  const liveVbRef = useRef<ViewBox>({ ...bbox });

  // region が変わったら viewBox をリセット
  useEffect(() => {
    const next = { ...bbox };
    liveVbRef.current = next;
    setVb(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  const containerRef = useRef<HTMLDivElement>(null);
  const minViewW = bbox.w * 0.15; // 最大約6.7倍ズーム
  const maxViewW = bbox.w * 1.05;

  const resetZoom = useCallback(() => {
    const next = { ...bbox };
    liveVbRef.current = next;
    setVb(next);
  }, [bbox]);
  const isZoomed = vb.w < bbox.w * 0.98 || Math.abs(vb.x - bbox.x) > 1 || Math.abs(vb.y - bbox.y) > 1;

  // ── タッチ操作（パン & ピンチズーム） ────────────────────
  useEffect(() => {
    if (!zoomable) return;
    const el = containerRef.current;
    if (!el) return;

    let startX = 0, startY = 0;
    let startVb: ViewBox | null = null;
    let startDist = 0, startCx = 0, startCy = 0;
    let isPanning = false;

    // setVb と同時に liveVbRef も同期更新するヘルパー
    const applyVb = (newVb: ViewBox) => {
      liveVbRef.current = newVb;
      setVb(newVb);
    };

    const onTouchStart = (e: TouchEvent) => {
      isPanning = false;
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startVb = { ...liveVbRef.current };
      } else if (e.touches.length === 2) {
        startDist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        );
        startCx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        startCy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        startVb = { ...liveVbRef.current };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!startVb) return;
      const rect = el.getBoundingClientRect();

      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        // パン開始しきい値（10px）を超えたら preventDefault でクリックを抑制
        if (!isPanning && Math.hypot(dx, dy) < 10) return;
        isPanning = true;
        e.preventDefault();
        applyVb({
          x: startVb.x - dx * startVb.w / rect.width,
          y: startVb.y - dy * startVb.h / rect.height,
          w: startVb.w,
          h: startVb.h,
        });
      } else if (e.touches.length === 2) {
        isPanning = true;
        e.preventDefault();

        const dist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        );
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        // 新しい viewBox サイズ（ピンチ距離に反比例）
        const zoomRatio = startDist / dist;
        const newW = Math.max(minViewW, Math.min(maxViewW, startVb.w * zoomRatio));
        const newH = startVb.h * newW / startVb.w;

        // ピンチ開始時の中心点を SVG 座標で固定
        const fx0 = (startCx - rect.left) / rect.width;
        const fy0 = (startCy - rect.top) / rect.height;
        const svgCx = startVb.x + fx0 * startVb.w;
        const svgCy = startVb.y + fy0 * startVb.h;

        // その SVG 点が現在の指の中心に来るよう配置
        const fx = (cx - rect.left) / rect.width;
        const fy = (cy - rect.top) / rect.height;

        applyVb({
          x: svgCx - fx * newW,
          y: svgCy - fy * newH,
          w: newW,
          h: newH,
        });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // 2本指 → 1本指：残った指の位置と現在のズーム状態を基準に更新
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        // liveVbRef は setVb と同時に同期更新済みなので常に最新値を持つ
        startVb = { ...liveVbRef.current };
        isPanning = false;
      } else if (e.touches.length === 0) {
        startVb = null;
        isPanning = false;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [zoomable, minViewW, maxViewW]);

  // ── ホイールズーム（PC） ──────────────────────────────
  useEffect(() => {
    if (!zoomable) return;
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cur = liveVbRef.current;
      const factor = e.deltaY > 0 ? 1.15 : 0.87;
      const newW = Math.max(minViewW, Math.min(maxViewW, cur.w * factor));
      const newH = cur.h * newW / cur.w;
      const fx = (e.clientX - rect.left) / rect.width;
      const fy = (e.clientY - rect.top) / rect.height;
      const svgCx = cur.x + fx * cur.w;
      const svgCy = cur.y + fy * cur.h;
      const next = { x: svgCx - fx * newW, y: svgCy - fy * newH, w: newW, h: newH };
      liveVbRef.current = next;
      setVb(next);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomable, minViewW, maxViewW]);

  // ── ステータス計算 ────────────────────────────────────
  const getStatusClass = (code: string) => {
    const s = statuses[code];
    if (s && s !== 'idle') return s;
    return challengeMode ? 'challenge-idle' : 'idle';
  };

  const fontSize = Math.max(4, Math.min(10, bbox.w / regionCodes.length / 2));

  // 沖縄インセットの位置（baseBbox の下端 + 小さなギャップ）
  const insetX = bbox.x + bbox.w - insetW - 4;
  const insetY = baseBbox.y + baseBbox.h - 8;
  const okinawaPad = 8;
  const okinawaScale = Math.min(
    (insetW - okinawaPad * 2) / (OKINAWA_NATURAL.maxX - OKINAWA_NATURAL.minX),
    (insetH - okinawaPad * 2) / (OKINAWA_NATURAL.maxY - OKINAWA_NATURAL.minY)
  );
  const okinawaTx = insetX + okinawaPad - OKINAWA_NATURAL.minX * okinawaScale;
  const okinawaTy = insetY + okinawaPad - OKINAWA_NATURAL.minY * okinawaScale;
  const okinawaCx = (OKINAWA_NATURAL.minX + OKINAWA_NATURAL.maxX) / 2;
  const okinawaCy = (OKINAWA_NATURAL.minY + OKINAWA_NATURAL.maxY) / 2;

  // ズーム率（リセットボタン表示用）
  const zoomLevel = Math.round(bbox.w / vb.w * 10) / 10;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center overflow-hidden min-h-0 relative"
      style={{ background: '#071028', touchAction: 'none' }}
    >
      <svg
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
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
              onPointerDown={zoomable ? undefined : (e => { e.preventDefault(); if (!disabled) onTap(code); })}
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
              {/* 沖縄パス（タップ可能） */}
              <g
                transform={`translate(${okinawaTx}, ${okinawaTy}) scale(${okinawaScale})`}
                onClick={() => { if (!disabled) onTap('okinawa'); }}
                onPointerDown={zoomable ? undefined : (e => { e.preventDefault(); if (!disabled) onTap('okinawa'); })}
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

      {/* ズームコントロール */}
      {zoomable && (
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 items-end">
          {/* ズームレベル表示 & リセットボタン */}
          {isZoomed && (
            <button
              onClick={resetZoom}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black border border-blue-500 hover:brightness-110 active:scale-95 transition-transform"
              style={{ background: '#1e3a8a', color: '#93c5fd' }}
            >
              🔍 {zoomLevel}× → 全体
            </button>
          )}
          {/* ヒント（初期状態のみ） */}
          {!isZoomed && (
            <div className="px-2 py-1 rounded-lg text-xs font-bold border border-blue-800"
              style={{ background: 'rgba(14,42,77,0.85)', color: '#60a5fa' }}>
              ピンチで拡大できるよ 🔍
            </div>
          )}
        </div>
      )}
    </div>
  );
}
