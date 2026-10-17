/**
 * iOS el yazısı tanımayı denemek için sahte "parmak yazısı" çizgileri üretir.
 * Hershey tek çizgili el yazısı fontunu (store-shots.mts ile aynı) çizgilere çevirir.
 *   npx tsx scripts/ink-ios/strokes.mts > /tmp/strokes.json
 * Sonra: scripts/ink-ios/dene.sh (çizgileri Apple Vision'a verir, okuduğunu yazar)
 * Not: Hershey fontunda Türkçe harfler (ç ş ğ ı ö ü) yok; bu yüzden deneme kelimeleri sade harflerden.
 */
import hershey from 'hersheytext';

const WORDS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['Kemal', 'Ankara', 'elma', 'kalem', 'aslan', 'Bursa', 'limon', 'masa', 'deve', 'Merve'];

/** Kelimeyi çizgilere çevirir: [{ x: [...], y: [...] }] (y aşağı, oyunun canvas'ı gibi). */
function wordStrokes(word: string) {
  const font = hershey.getFontData('hershey_script_1');
  let x = 0;
  const strokes: { x: number[]; y: number[]; t: number[] }[] = [];
  let t = 0;
  for (const ch of word) {
    const g = font.getChar(ch);
    if (!g) continue;
    for (const part of g.d.split('M').map((s: string) => s.trim()).filter(Boolean)) {
      const nums = part.replace(/L/g, ' ').trim().split(/\s+/).map(Number);
      const xs: number[] = [], ys: number[] = [], ts: number[] = [];
      for (let i = 0; i < nums.length; i += 2) {
        xs.push(x + nums[i]);
        ys.push(-nums[i + 1]);
        ts.push((t += 12));
      }
      strokes.push({ x: xs, y: ys, t: ts });
    }
    x += g.width;
  }
  return strokes;
}

console.log(JSON.stringify(WORDS.map((w) => ({ word: w, strokes: wordStrokes(w) }))));
