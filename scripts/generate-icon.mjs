import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svg = readFileSync(join(__dirname, 'icon-source.svg'), 'utf-8');

const sizes = [
  { size: 180, filename: 'apple-touch-icon.png' },
  { size: 192, filename: 'icon-192.png' },
  { size: 512, filename: 'icon-512.png' },
];

for (const { size, filename } of sizes) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const png = resvg.render().asPng();
  writeFileSync(join(root, 'public', filename), png);
  console.log(`✓ public/${filename} (${size}x${size})`);
}
