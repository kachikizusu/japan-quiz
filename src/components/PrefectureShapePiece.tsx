import { prefecturePaths } from '../data/prefecturePaths.generated';
import { OKINAWA_PATH } from '../data/prefecturePaths.generated';
import { getPathBBox } from '../utils/pathBBox';

// 地方コードから塗りつぶし色へのマッピング
const REGION_FILL: Record<string, string> = {
  '北海道': '#bfdbfe', // blue-200
  '東北':   '#ddd6fe', // violet-200
  '関東':   '#fbcfe8', // pink-200
  '中部':   '#fef08a', // yellow-200
  '近畿':   '#fed7aa', // orange-200
  '中国':   '#d9f99d', // lime-200
  '四国':   '#a5f3fc', // cyan-200
  '九州':   '#bbf7d0', // green-200
};

interface Props {
  code: string;
  region: string;
  /** ピース全体のサイズ（px）。省略時は親要素に合わせる */
  size?: number;
  /** ドラッグ中に使う薄い表示 */
  ghost?: boolean;
}

const PAD = 8; // パスの周囲に付けるパディング（SVG単位）

export default function PrefectureShapePiece({ code, region, size, ghost }: Props) {
  const isOkinawa = code === 'okinawa';
  const d = isOkinawa ? OKINAWA_PATH : prefecturePaths[code];
  if (!d) return null;

  const bbox = getPathBBox(d);
  const vbX = bbox.x - PAD;
  const vbY = bbox.y - PAD;
  const vbW = bbox.width  + PAD * 2;
  const vbH = bbox.height + PAD * 2;

  const fill = REGION_FILL[region] ?? '#e2e8f0';

  const svgStyle: React.CSSProperties = size
    ? { width: size, height: size }
    : { width: '100%', height: '100%' };

  return (
    <svg
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      style={svgStyle}
      overflow="visible"
    >
      <path
        d={d}
        fill={ghost ? '#93c5fd' : fill}
        stroke={ghost ? '#3b82f6' : '#475569'}
        strokeWidth={ghost ? 1.5 : 1}
        opacity={ghost ? 0.7 : 1}
      />
    </svg>
  );
}
