// scripts/generate-paths.mjs
// Reads public/japan.geojson and generates src/data/prefecturePaths.generated.ts
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// --- Projection constants (main map) ---
const SCALE = 40;
const ORIGIN_LNG = 129.5;
const ORIGIN_LAT = 45.5;
const PAD = 20;

function projectMain(lng, lat) {
  return [
    (lng - ORIGIN_LNG) * SCALE + PAD,
    (ORIGIN_LAT - lat) * SCALE + PAD,
  ];
}

// --- Okinawa inset projection (local coords inside inset box) ---
const SCALE_OK = 20;
const ORIGIN_LNG_OK = 125.5;
const ORIGIN_LAT_OK = 27.5;

function projectOkinawa(lng, lat) {
  return [
    (lng - ORIGIN_LNG_OK) * SCALE_OK,
    (ORIGIN_LAT_OK - lat) * SCALE_OK,
  ];
}

// --- RDP simplification ---
function ptLineDist([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

function rdp(pts, eps) {
  if (pts.length <= 2) return pts;
  let maxD = 0, maxI = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = ptLineDist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > maxD) { maxD = d; maxI = i; }
  }
  if (maxD > eps) {
    const l = rdp(pts.slice(0, maxI + 1), eps);
    const r = rdp(pts.slice(maxI), eps);
    return [...l.slice(0, -1), ...r];
  }
  return [pts[0], pts[pts.length - 1]];
}

// --- Get largest ring from Polygon or MultiPolygon ---
function getLargestRing(geometry) {
  if (geometry.type === 'Polygon') return geometry.coordinates[0];
  let best = geometry.coordinates[0][0];
  for (const poly of geometry.coordinates) {
    if (poly[0].length > best.length) best = poly[0];
  }
  return best;
}

// --- Ring to SVG path string ---
function ringToPath(ring, projectFn, eps = 1.5) {
  const raw = ring.map(([lng, lat]) => projectFn(lng, lat));
  const simplified = rdp(raw, eps);
  return simplified.map(([x, y], i) =>
    `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  ).join(' ') + ' Z';
}

// --- nam_ja → prefecture code mapping (JIS order) ---
const NAM_JA_TO_CODE = {
  '北海道': 'hokkaido',
  '青森県': 'aomori',
  '岩手県': 'iwate',
  '宮城県': 'miyagi',
  '秋田県': 'akita',
  '山形県': 'yamagata',
  '福島県': 'fukushima',
  '茨城県': 'ibaraki',
  '栃木県': 'tochigi',
  '群馬県': 'gunma',
  '埼玉県': 'saitama',
  '千葉県': 'chiba',
  '東京都': 'tokyo',
  '神奈川県': 'kanagawa',
  '新潟県': 'niigata',
  '富山県': 'toyama',
  '石川県': 'ishikawa',
  '福井県': 'fukui',
  '山梨県': 'yamanashi',
  '長野県': 'nagano',
  '岐阜県': 'gifu',
  '静岡県': 'shizuoka',
  '愛知県': 'aichi',
  '三重県': 'mie',
  '滋賀県': 'shiga',
  '京都府': 'kyoto',
  '大阪府': 'osaka',
  '兵庫県': 'hyogo',
  '奈良県': 'nara',
  '和歌山県': 'wakayama',
  '鳥取県': 'tottori',
  '島根県': 'shimane',
  '岡山県': 'okayama',
  '広島県': 'hiroshima',
  '山口県': 'yamaguchi',
  '徳島県': 'tokushima',
  '香川県': 'kagawa',
  '愛媛県': 'ehime',
  '高知県': 'kochi',
  '福岡県': 'fukuoka',
  '佐賀県': 'saga',
  '長崎県': 'nagasaki',
  '熊本県': 'kumamoto',
  '大分県': 'oita',
  '宮崎県': 'miyazaki',
  '鹿児島県': 'kagoshima',
  '沖縄県': 'okinawa',
};

// --- Main ---
console.log('Reading GeoJSON...');
const geojson = JSON.parse(readFileSync(join(root, 'public/japan.geojson'), 'utf8'));

const mainPaths = {};
let okinawaPath = '';
// Also compute bounding box of Okinawa in local coords for centering
let okMinX = Infinity, okMinY = Infinity, okMaxX = -Infinity, okMaxY = -Infinity;

for (const feature of geojson.features) {
  const namJa = feature.properties.nam_ja;
  const code = NAM_JA_TO_CODE[namJa];
  if (!code) {
    console.warn('Unknown prefecture:', namJa);
    continue;
  }

  const ring = getLargestRing(feature.geometry);

  if (code === 'okinawa') {
    // Project with Okinawa-specific transform
    const raw = ring.map(([lng, lat]) => projectOkinawa(lng, lat));
    for (const [x, y] of raw) {
      if (x < okMinX) okMinX = x;
      if (y < okMinY) okMinY = y;
      if (x > okMaxX) okMaxX = x;
      if (y > okMaxY) okMaxY = y;
    }
    const simplified = rdp(raw, 0.2);
    okinawaPath = simplified.map(([x, y], i) =>
      `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    ).join(' ') + ' Z';
  } else {
    mainPaths[code] = ringToPath(ring, projectMain, 0.3);
  }
}

console.log(`Okinawa inset bounds: x ${okMinX.toFixed(1)}-${okMaxX.toFixed(1)}, y ${okMinY.toFixed(1)}-${okMaxY.toFixed(1)}`);

// Compute approximate label positions (centroid of bounding box for each prefecture)
const labelPositions = {};
for (const [code, path] of Object.entries(mainPaths)) {
  const nums = path.match(/[-\d.]+,[-\d.]+/g) || [];
  let sumX = 0, sumY = 0;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const pair of nums) {
    const [x, y] = pair.split(',').map(Number);
    sumX += x; sumY += y;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  labelPositions[code] = {
    x: ((minX + maxX) / 2).toFixed(1),
    y: ((minY + maxY) / 2).toFixed(1),
  };
}

// --- Output ---
const lines = [
  '// AUTO-GENERATED by scripts/generate-paths.mjs — do not edit',
  '// Projection: x = (lng - 129.5) * 40 + 20,  y = (45.5 - lat) * 40 + 20',
  '',
  'export const VIEWBOX = "0 0 680 620";',
  '',
  '// Okinawa inset: placed at SVG (10, 630), size 240x130',
  '// Path coords use: x = (lng - 125.5) * 20,  y = (27.5 - lat) * 20',
  `export const OKINAWA_PATH = "${okinawaPath}";`,
  '',
  'export const prefecturePaths: Record<string, string> = {',
];

for (const [code, path] of Object.entries(mainPaths)) {
  lines.push(`  ${code}: "${path}",`);
}
lines.push('};');
lines.push('');
lines.push('export const prefectureLabelPos: Record<string, { x: number; y: number }> = {');
for (const [code, pos] of Object.entries(labelPositions)) {
  lines.push(`  ${code}: { x: ${pos.x}, y: ${pos.y} },`);
}
// Okinawa inset label pos (approx center of inset box)
lines.push(`  okinawa: { x: 130, y: 695 },`);
lines.push('};');

const outPath = join(root, 'src/data/prefecturePaths.generated.ts');
writeFileSync(outPath, lines.join('\n'));
console.log(`Written: ${outPath}`);
console.log(`Main prefectures: ${Object.keys(mainPaths).length}`);
console.log('Done!');
