/**
 * Sunucunun doğal sesini önceden üretir: src/voice/lines.ts'teki her cümle için bir MP3 (Çizio ile aynı yöntem).
 *   npx tsx scripts/generate-voice.mts [--force] [--voice Sulafat]
 * Google Gemini TTS; .env.local içinde GEMINI_API_KEY gerekir. Çıktı: public/voice/<anahtar>.mp3 + manifest.json
 * Var olan dosyalar yeniden üretilmez (--force hepsini yeniler). Bir modelin kotası biterse sıradakine geçilir.
 */
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lineKey, normalizeLine } from '../src/voice/hash';
import { VOICE_LINES } from '../src/voice/lines';
import { apiKey, DailyQuotaError, geminiTts, RateLimitError, STYLE_ID, ttsModels } from './tts-gemini';

const OUT = join('public', 'voice');
mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
const force = args.includes('--force');
const voice = args.includes('--voice') ? args[args.indexOf('--voice') + 1] : 'Sulafat';

const key = apiKey();
const pref = (m: string) => (/flash-tts$/.test(m) ? 0 : /flash-tts/.test(m) ? 1 : /flash-lite-tts/.test(m) ? 2 : /flash/.test(m) ? 3 : 4);
const models = [...(await ttsModels(key))].sort((a, b) => pref(a) - pref(b));
if (!models.length) throw new Error('Hesapta TTS modeli bulunamadı.');
console.log('modeller:', models.join(', '));

const lines = [...new Set(VOICE_LINES.map(normalizeLine))];
const todo = lines.filter((t) => force || !existsSync(join(OUT, `${lineKey(t)}.mp3`)));
console.log(`${lines.length} cümle, ${todo.length} üretilecek (ses: ${voice})`);

let mi = 0;
let exhausted = false;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function one(text: string) {
  const file = join(OUT, `${lineKey(text)}.mp3`);
  for (let attempt = 0; attempt < 6; attempt++) {
    if (mi >= models.length) {
      if (!exhausted) console.log('Bütün modellerin günlük kotası bitti; kalanlar yarın üretilir (aynı komutu tekrar çalıştırın).');
      exhausted = true;
      return;
    }
    try {
      await geminiTts(text, file, { key, model: models[mi], voice });
      // Talimatı da okuduysa kayıt çok uzun olur (cümlelerin hepsi 6 saniyeden kısa): reddet, tekrar dene
      const secs = statSync(file).size / 8000;
      if (secs > 6) {
        unlinkSync(file);
        console.log(`  çok uzun (${secs.toFixed(1)} sn), tekrar:`, text);
        continue;
      }
      console.log('✓', text);
      return;
    } catch (e) {
      if (e instanceof DailyQuotaError) {
        console.log(`  ${models[mi]} kotası bitti → sıradaki model`);
        mi++;
      } else if (e instanceof RateLimitError) {
        await sleep(Math.min(60_000, e.retryAfterMs + 500));
      } else {
        console.log(`  tekrar (${attempt + 1}):`, String(e).slice(0, 120));
        await sleep(1500);
      }
    }
  }
  console.log('✗', text);
}

// İki eşzamanlı istek
const queue = [...todo];
await Promise.all([0, 1].map(async () => {
  for (let t = queue.shift(); t; t = queue.shift()) await one(t);
}));

// Listede olmayan eski dosyaları sil, manifest'i yaz
const keep = new Set(lines.map((t) => `${lineKey(t)}.mp3`));
for (const f of readdirSync(OUT)) if (f.endsWith('.mp3') && !keep.has(f)) unlinkSync(join(OUT, f));
const manifest: Record<string, string> = {};
for (const t of lines) if (existsSync(join(OUT, `${lineKey(t)}.mp3`))) manifest[lineKey(t)] = t;
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({ provider: 'gemini', voice, style: STYLE_ID, lines: manifest }, null, 1));
console.log(`manifest: ${Object.keys(manifest).length}/${lines.length} cümle`);
