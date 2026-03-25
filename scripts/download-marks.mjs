import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'marks');
mkdirSync(outDir, { recursive: true });

const MARKS = {
  hokkaido:  'hokkaido/hokkaido_dousho.png',
  aomori:    'aomori/aomori_kensho.png',
  iwate:     'iwate/iwate_kensho.png',
  miyagi:    'miyagi/miyagi_kensho.png',
  akita:     'akita/akita_kensho.png',
  yamagata:  'yamagata/yamagata_kensho.png',
  fukushima: 'fukushima/fukushima_kensho.png',
  ibaraki:   'ibaraki/ibaraki_kensho.png',
  tochigi:   'tochigi/tochigi_kensho.png',
  gunma:     'gunma/gunma_monsho.png',
  saitama:   'saitama/saitama_kensho.png',
  chiba:     'chiba/chiba_kensho.png',
  tokyo:     'tokyo/tokyo_symbol.png',
  kanagawa:  'kanagawa/kanagawa_kensho.png',
  niigata:   'niigata/niigata_symbol.png',
  toyama:    'toyama/toyama_kensho.png',
  ishikawa:  'ishikawa/ishikawa_kenki.png',
  fukui:     'fukui/fukui_kensho.png',
  yamanashi: 'yamanashi/yamanashi_kensho.png',
  nagano:    'nagano/nagano_kensho.png',
  gifu:      'gifu/gifu_kensho.png',
  shizuoka:  'shizuoka/shizuoka_kensho.png',
  aichi:     'aichi/aichi_kensho.png',
  mie:       'mie/mie_kensho.png',
  shiga:     'shiga/shiga_kensho.png',
  kyoto:     'kyoto/kyoto_fusho.png',
  osaka:     'osaka/osaka_fusho.png',
  hyogo:     'hyogo/hyogo_kenki.png',
  nara:      'nara/nara_kensho.png',
  wakayama:  'wakayama/wakayama_kensho.png',
  tottori:   'tottori/tottori_kensho.png',
  shimane:   'shimane/shimane_kensho.png',
  okayama:   'okayama/okayama_kensho.png',
  hiroshima: 'hiroshima/hiroshima_kensho.png',
  yamaguchi: 'yamaguchi/yamaguchi_kensho.png',
  tokushima: 'tokushima/tokushima_kensho.png',
  kagawa:    'kagawa/kagawa_kensho.png',
  ehime:     'ehime/ehime_kenki.png',
  kochi:     'kochi/kochi_kensho.png',
  fukuoka:   'fukuoka/fukuoka_kensho.png',
  saga:      'saga/saga_symbol.png',
  nagasaki:  'nagasaki/nagasaki_kensho.png',
  kumamoto:  'kumamoto/kumamoto_kensho.png',
  oita:      'oita/oita_kisho.png',
  miyazaki:  'miyazaki/miyazaki_kensho.png',
  kagoshima: 'kagoshima/kagoshima_symbol.png',
  okinawa:   'okinawa/okinawa_kensho.png',
};

for (const [code, path] of Object.entries(MARKS)) {
  const url = `https://uub.jp/47/${path}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(join(outDir, `${code}.png`), buf);
    console.log(`✓ ${code}`);
  } catch (e) {
    console.error(`✗ ${code}: ${e.message}`);
  }
}
console.log('完了');
