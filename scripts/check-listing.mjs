// Mağaza metinlerinin karakter sınırlarını kontrol eder: node scripts/check-listing.mjs
import { readFileSync } from 'node:fs';

const md = readFileSync('store/listing-tr.md', 'utf8').replace(/\r/g, '');
const sections = Object.fromEntries(
  md.split('\n## ').slice(1).map((s) => {
    const nl = s.indexOf('\n');
    return [s.slice(0, nl).trim(), s.slice(nl + 1).trim()];
  }),
);
let ok = true;
for (const [title, text] of Object.entries(sections)) {
  const m = title.match(/en fazla (\d+) karakter/);
  if (!m) continue;
  const max = Number(m[1]);
  // Sürüm geçmişi aynı bölümde tutulur; Play'e yalnız en üstteki güncel not gönderilir.
  const current = title.startsWith('Sürüm notları')
    ? text.replace(/^### [^\n]+\n+/, '').split(/\n### /)[0].trim()
    : text;
  const n = [...current].length;
  if (n > max) ok = false;
  console.log(`${n > max ? 'AŞIYOR' : 'tamam '}  ${title.replace(/ \(.*/, '')}: ${n}/${max}`);
}
process.exit(ok ? 0 : 1);
