export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** SVGパス文字列から座標のバウンディングボックスを計算する */
export function getPathBBox(d: string): BBox {
  const pairs = d.match(/-?\d+\.?\d*,-?\d+\.?\d*/g) ?? [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pair of pairs) {
    const [x, y] = pair.split(',').map(Number);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  if (!isFinite(minX)) return { x: 0, y: 0, width: 100, height: 100 };
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
