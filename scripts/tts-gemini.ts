/**
 * Google Gemini TTS ile tek bir cümleyi MP3'e çevirir (yalnızca geliştirme sırasında; Çizio'dan alındı).
 *
 * API anahtarı .env.local dosyasındaki GEMINI_API_KEY'den (ya da ortam değişkeninden) okunur.
 * Anahtar depoya ya da uygulamaya girmez: .env.local git'te yok sayılır, Vite yalnızca VITE_ önekli
 * değişkenleri istemciye verir.
 */
import { Mp3Encoder } from '@breezystack/lamejs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export const GEMINI_VOICES = ['Sulafat', 'Achernar', 'Leda', 'Laomedeia', 'Despina', 'Aoede', 'Autonoe', 'Kore'];

/** Kayıt etiketinde kullanılan üslup kimliği: değişirse tüm cümleler yeniden üretilir. */
export const STYLE_ID = 'isimsehir-sunucu-v1';

/** İsim Şehir'in sunucusu: Çizio ile aynı sıcak ses (Sulafat), yarışma programı enerjisiyle. */
export const STYLE =
  'Read the following Turkish sentence aloud in natural, fluent Turkish with perfect Turkish pronunciation. ' +
  'You are the friendly host of a lively family word game show: warm, smiling, energetic and playful, with clear articulation ' +
  'and a natural, upbeat pace — exciting but never shouting. Say only the sentence, nothing else.';

/**
 * English Club cümleleri: yavaş, net Amerikan İngilizcesi (İngilizceye yeni başlayan çocuk için).
 * v1'de talimat da İngilizce olduğu için model bazen talimatı seslendirdi; v2 talimatı "yönetmen notları",
 * okunacak metni ayrı bir TRANSCRIPT başlığı altında verir.
 */
export const STYLE_EN_ID = 'cizio-en-v2';
const EN_NOTES =
  "### DIRECTOR'S NOTES (never read these notes aloud)\n" +
  'Speaker: Chizio, a warm, cheerful and patient teacher talking to a 6-year-old child who is just starting to learn English.\n' +
  'Accent: clear, natural American English.\n' +
  'Pace: slow, very clear articulation, short natural pauses.\n' +
  'Tone: smiling, encouraging.\n';
const EN_BATCH_RULES =
  'The transcript contains several sentences separated by "—". Read them in order, exactly as written. After EACH sentence ' +
  'stay completely silent for two full seconds. Do not read the separators; do not add, skip or repeat anything.\n';
const enPrompt = (transcript: string, batch = false) =>
  `${EN_NOTES}${batch ? EN_BATCH_RULES : 'Read only the transcript below, nothing else.\n'}\n#### TRANSCRIPT\n${transcript}`;

/**
 * Türkçe cümle istemi: talimat "yönetmen notları" başlığı altında, okunacak metin ayrı bir TRANSCRIPT başlığında
 * (kısa cümlelerde model talimatı da seslendirebiliyordu; İngilizce için Çizio'da da böyle çözüldü).
 */
const trPrompt = (text: string, tone?: string) =>
  "### DIRECTOR'S NOTES (never read these notes aloud)\n" +
  'Language: Turkish, perfect native Turkish pronunciation.\n' +
  'Speaker: the friendly host of a lively family word game show.\n' +
  'Tone: warm, smiling, energetic and playful; exciting but never shouting.\n' +
  'Pace: natural, upbeat, clear articulation.\n' +
  (tone ? `For this line: ${tone}\n` : '') +
  'Read only the transcript below, exactly as written, nothing else.\n\n#### TRANSCRIPT\n' +
  text;

const API = 'https://generativelanguage.googleapis.com/v1beta';

export function apiKey(): string {
  let key = process.env.GEMINI_API_KEY;
  if (!key && existsSync('.env.local')) {
    const m = readFileSync('.env.local', 'utf8').match(/^\s*GEMINI_API_KEY\s*=\s*"?([^"\r\n]+)"?/m);
    key = m?.[1]?.trim();
  }
  if (!key) throw new Error('GEMINI_API_KEY bulunamadı. Proje kökündeki .env.local dosyasına GEMINI_API_KEY=... yazın.');
  return key;
}

/** Hesapta kullanılabilen TTS modelleri (en yenisi önce). */
export async function ttsModels(key: string): Promise<string[]> {
  const r = await fetch(`${API}/models?pageSize=1000`, { headers: { 'x-goog-api-key': key } });
  if (!r.ok) throw new Error(`Model listesi alınamadı: ${r.status} ${(await r.text()).slice(0, 200)}`);
  const j = (await r.json()) as { models: { name: string; supportedGenerationMethods?: string[] }[] };
  const names = j.models.map((m) => m.name.replace('models/', '')).filter((n) => /tts/i.test(n));
  // Pro < Flash tercih: flash hızlı ve ucuz; "preview" olmayanlar önce.
  const score = (n: string) => (n.includes('flash') ? 0 : 1) + (n.includes('preview') ? 0.5 : 0);
  return names.sort((a, b) => score(a) - score(b) || b.localeCompare(a));
}

/** Günlük kota bitti: beklemek anlamsız (ücretsiz katmanda model başına günde ~10 istek). */
export class DailyQuotaError extends Error {}
/** Hesap ücretsiz katmanda: kota kimliği "FreeTier" içeriyor. */
export class FreeTierError extends DailyQuotaError {}

export class RateLimitError extends Error {
  constructor(public retryAfterMs: number, msg: string) {
    super(msg);
  }
}

/** 16 bit mono PCM → MP3 (varsayılan 24 kHz, 64 kbps). */
export function pcmToMp3(pcm: Buffer, sampleRate = 24000, kbps = 64): Buffer {
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
  const enc = new Mp3Encoder(1, sampleRate, kbps);
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < samples.length; i += 1152) {
    const out = enc.encodeBuffer(samples.subarray(i, i + 1152));
    if (out.length) chunks.push(out);
  }
  const end = enc.flush();
  if (end.length) chunks.push(end);
  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

/**
 * Gemini TTS bazen kaydın sonuna, kısa bir sessizlikten sonra yüksek sesli bir gürültü patlaması
 * ("bozuk radyo" cızırtısı, ~0.1–0.4 sn) ekler. Sondaki parça kısa, önünde sessizlik var, yüksek sesli ve
 * gürültü gibi (sıfır geçiş oranı yüksek) ise kesilir. Birden fazla patlama olursa tekrarlanır.
 * Kesilen milisaniyeyi de döner (onarım betiği raporlamak için kullanır).
 */
export function cutTailArtifact(pcm: Buffer, sampleRate = 24000): { pcm: Buffer; cutMs: number } {
  const s = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
  const fr = Math.round(sampleRate * 0.02);
  const n = Math.floor(s.length / fr);
  const rms: number[] = [];
  const zcr: number[] = [];
  for (let f = 0; f < n; f++) {
    let e = 0, z = 0;
    for (let i = f * fr + 1; i < (f + 1) * fr; i++) {
      e += (s[i] / 32768) ** 2;
      if (s[i] >= 0 !== s[i - 1] >= 0) z++;
    }
    rms.push(Math.sqrt(e / fr));
    zcr.push(z / fr);
  }
  const LOUD = 0.012;
  let end = n - 1;
  while (end > 0 && rms[end] < LOUD) end--;
  let ts = end;
  while (ts > 0 && rms[ts - 1] >= LOUD) ts--;
  let gs = ts;
  while (gs > 0 && rms[gs - 1] < LOUD) gs--;
  const tailFrames = end - ts + 1;
  if (gs === 0 || tailFrames > 20 || ts - gs < 4) return { pcm, cutMs: 0 };
  let maxR = 0, zSum = 0;
  for (let f = ts; f <= end; f++) {
    maxR = Math.max(maxR, rms[f]);
    zSum += zcr[f];
  }
  // Konuşmanın en yüksek kareleri (95. yüzdelik): patlama bundan belirgin biçimde yüksek olmalı.
  // Böylece duraklamadan sonra gelen son sözcük ("... çiz.") kesilmez.
  const speech = rms.slice(0, gs).filter((r) => r >= LOUD).sort((x, y) => x - y);
  const p95 = speech[Math.floor(speech.length * 0.95)] ?? 1;
  if (!(maxR >= 0.3 && maxR >= p95 * 1.35 && zSum / tailFrames >= 0.12)) return { pcm, cutMs: 0 };
  const cutTo = gs * fr;
  if (cutTo >= s.length) return { pcm, cutMs: 0 };
  return { pcm: Buffer.from(s.slice(0, cutTo).buffer), cutMs: Math.round(((s.length - cutTo) / sampleRate) * 1000) };
}

/**
 * Baştaki tık: Gemini bazı isteklerde konuşmadan önce tek, çok kısa ve yüksek bir sıçrama üretir; kulakta
 * "çıt" diye duyulur (her dosyada ~45 ms'de, ardından 200+ ms sessizlik). İlk ses 25 ms'den kısa sürüp
 * ardından en az 100 ms sessizlik geliyorsa tıktır: atlanır. Döner: gerçek konuşmanın başı ve tıkın sonu.
 */
export function skipHeadClick(s: Int16Array, start: number, sampleRate: number, thr: number): { start: number; floor: number } {
  let a = start;
  let floor = 0;
  for (let tries = 0; tries < 3 && a < s.length; tries++) {
    const burstEnd = Math.min(s.length, a + Math.round(sampleRate * 0.025));
    let last = a;
    for (let i = a; i < burstEnd; i++) if (Math.abs(s[i]) >= thr) last = i;
    const gapEnd = Math.min(s.length, last + 1 + Math.round(sampleRate * 0.1));
    let quiet = true;
    for (let i = last + 1; i < gapEnd; i++) {
      if (Math.abs(s[i]) >= thr) {
        quiet = false;
        break;
      }
    }
    if (!quiet || gapEnd >= s.length) break;
    let next = gapEnd;
    while (next < s.length && Math.abs(s[next]) < thr) next++;
    if (next >= s.length) break;
    floor = last + Math.round(sampleRate * 0.01); // tıkın biraz ötesi
    a = next;
  }
  return { start: a, floor };
}

/** Baştaki/sondaki sessizliği kırpar (Gemini bazen uzun boşluk bırakır), 120 ms pay bırakır. */
function trimSilence(raw: Buffer, sampleRate = 24000): Buffer {
  const pcm = cutTailArtifact(raw, sampleRate).pcm;
  const s = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
  const thr = 500;
  let a = 0, b = s.length - 1;
  while (a < s.length && Math.abs(s[a]) < thr) a++;
  while (b > a && Math.abs(s[b]) < thr) b--;
  const head = skipHeadClick(s, a, sampleRate, thr);
  const pad = Math.round(sampleRate * 0.12);
  a = Math.max(0, head.floor, head.start - pad);
  b = Math.min(s.length - 1, b + pad);
  return Buffer.from(s.slice(a, b + 1).buffer);
}

/** Ham istek: metni (talimatla birlikte) sese çevirir, 16 bit PCM döner. */
async function requestPcm(prompt: string, opts: { key: string; model: string; voice: string }): Promise<{ pcm: Buffer; rate: number }> {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: opts.voice } } },
    },
  };
  const r = await fetch(`${API}/models/${opts.model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': opts.key },
    body: JSON.stringify(body),
  });
  if (r.status === 429) {
    const t = await r.text();
    // Hangi kota aşıldı? Yanıttaki ihlal kimlikleri: "...PerMinute..." (birazdan yeniden dene) ya da "...PerDay..."
    // (bugünlük bitti). Önceden her ücretsiz katman 429'u günlük sayılıyordu: dakikalık sınıra takılan model o gün
    // tamamen bırakılıyor, üretim birkaç dakikada "tüm modellerin kotası doldu" diye duruyordu.
    const ids = [...t.matchAll(/"quotaId":\s*"([^"]+)"/g)].map((m) => m[1]);
    const delay = t.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/);
    const delayMs = delay ? Number(delay[1]) * 1000 + 500 : 30_000;
    if (ids.some((id) => /PerDay/i.test(id)) || delayMs > 3_600_000) {
      if (ids.some((id) => /FreeTier/i.test(id))) throw new FreeTierError(`${opts.model}: ücretsiz katman günlük kotası doldu (${ids.join(", ")}; ${Math.round(delayMs / 60000)} dk)`);
      throw new DailyQuotaError(`${opts.model}: günlük kota doldu (${ids.join(", ")}; ${Math.round(delayMs / 60000)} dk)`);
    }
    throw new RateLimitError(delayMs, `429 kota (${ids.join(', ') || 'dakikalık'})`);
  }
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = (await r.json()) as { candidates?: { content?: { parts?: { inlineData?: { data: string; mimeType: string } }[] } }[] };
  const part = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part?.inlineData) throw new Error('Gemini ses döndürmedi');
  const rate = Number(part.inlineData.mimeType.match(/rate=(d+)/)?.[1] ?? 24000);
  return { pcm: Buffer.from(part.inlineData.data, 'base64'), rate };
}

/**
 * Toplu üretilen sesi n cümleye böler.
 *
 * Eski yöntem "en uzun n-1 sessizlikten kes" idi; "Muhteşem! ..." gibi ünlemden sonraki duraklama cümleler
 * arası boşluk kadar uzun olunca kesim cümle içine düşüyor ve dosyalar bir cümle kayıyordu. Şimdi:
 *  1) >= 0.3 sn'lik bütün sessizlikler aday kesim,
 *  2) dinamik programlama ile parça süreleri metin uzunluklarına en iyi uyan n-1 kesim seçilir,
 *  3) her parça beklenen sürenin 0.62–1.6 katı olmalı, seçilen kesimler >= 0.45 sn olmalı, parça içinde
 *     kalan (seçilmemiş) sessizlik >= 0.9 sn ise ya da seçilen en kısa kesimden uzunsa reddedilir.
 * Uymazsa null döner (çağıran grubu bölüp yeniden dener). Aynı uzunluktaki cümlelerin yer değiştirmesini
 * süre yakalayamaz; onun için üretimden sonra `--verify` (Whisper ile yazıya dökme) kullanılır.
 */
export function splitBySilence(pcm: Buffer, rate: number, texts: string[]): Buffer[] | null {
  const s = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
  const frame = Math.round(rate * 0.02);
  const quiet: boolean[] = [];
  for (let i = 0; i < s.length; i += frame) {
    let peak = 0;
    for (let k = i; k < Math.min(s.length, i + frame); k++) peak = Math.max(peak, Math.abs(s[k]));
    quiet.push(peak < 700);
  }
  // Konuşmanın başı ve sonu (kare cinsinden)
  const first = quiet.findIndex((q) => !q);
  const last = quiet.length - 1 - [...quiet].reverse().findIndex((q) => !q);
  if (first < 0) return null;
  const n = texts.length;
  const slice = (a: number, b: number) => Buffer.from(s.slice(a * frame, b * frame).buffer);
  if (n === 1) return [slice(first, last + 1)];

  // Sessizlik koşuları
  const runs: { a: number; b: number; len: number }[] = [];
  for (let i = first; i <= last; i++) {
    if (!quiet[i]) continue;
    let j = i;
    while (j + 1 <= last && quiet[j + 1]) j++;
    runs.push({ a: i, b: j, len: j - i + 1 });
    i = j;
  }
  const secs = (frames: number) => frames * 0.02;
  const cands = runs.filter((r) => secs(r.len) >= 0.3);
  if (cands.length < n - 1) return null;
  const mids = cands.map((c) => Math.round((c.a + c.b) / 2));
  // Sessiz kare önek toplamı: speech(a, b) = [a, b) aralığındaki konuşma kareleri (sessizlikler hariç)
  const qs = new Int32Array(quiet.length + 1);
  for (let i = 0; i < quiet.length; i++) qs[i + 1] = qs[i] + (quiet[i] ? 1 : 0);
  const speech = (a: number, b: number) => b - a - (qs[b] - qs[a]);

  // Beklenen konuşma süreleri: karakter sayısıyla orantılı
  const weights = texts.map((t) => Math.max(4, t.length));
  const wsum = weights.reduce((a, b) => a + b, 0);
  const total = speech(first, last + 1);
  const expected = weights.map((w) => (total * w) / wsum);

  // En güvenilir işaret: modelden her cümleden sonra 2 sn susması istenir. Tam n-1 tane uzun (>= 1 sn) sessizlik
  // varsa kesimler onlardır. Kısa sözcüklerde ("Red.", "Cat.") süre harf sayısıyla orantılı olmadığından aşağıdaki
  // oran kontrolü doğru bölmeleri de reddediyordu; burada yalnızca kaba bir sınır uygulanır (kaymayı Whisper yakalar).
  const long = cands.filter((r) => secs(r.len) >= 1.0);
  if (long.length === n - 1) {
    const b = [first, ...long.map((r) => Math.round((r.a + r.b) / 2)), last + 1];
    const ok = texts.every((_, i) => {
      const ratio = speech(b[i], b[i + 1]) / expected[i];
      return ratio > 0.25 && ratio < 4;
    });
    if (ok) return b.slice(0, -1).map((a, i) => slice(a, b[i + 1]));
  }
  const INF = 1e9;
  const cost = (i: number, a: number, b: number) => (speech(a, b) <= 0 ? INF : Math.abs(Math.log(speech(a, b) / expected[i])));

  // dp[i][j]: ilk i+1 parça, i. parça j. adayda bitiyor
  const m = cands.length;
  const dp = Array.from({ length: n - 1 }, () => new Float64Array(m).fill(INF));
  const back = Array.from({ length: n - 1 }, () => new Int32Array(m).fill(-1));
  for (let j = 0; j < m; j++) dp[0][j] = cost(0, first, mids[j]);
  for (let i = 1; i < n - 1; i++) {
    for (let j = i; j < m; j++) {
      let best = INF, bk = -1;
      for (let k = i - 1; k < j; k++) {
        const c = dp[i - 1][k] + cost(i, mids[k], mids[j]);
        if (c < best) { best = c; bk = k; }
      }
      dp[i][j] = best;
      back[i][j] = bk;
    }
  }
  let bestJ = -1, best = INF;
  for (let j = n - 2; j < m; j++) {
    const c = dp[n - 2][j] + cost(n - 1, mids[j], last + 1);
    if (c < best) { best = c; bestJ = j; }
  }
  if (bestJ < 0) return null;
  const chosen: number[] = [];
  for (let i = n - 2, j = bestJ; i >= 0; i--) { chosen.unshift(j); j = back[i][j]; }

  // Kontroller
  const chosenSet = new Set(chosen);
  const minCut = Math.min(...chosen.map((j) => cands[j].len));
  if (secs(minCut) < 0.45) return null;
  const bounds = [first, ...chosen.map((j) => mids[j]), last + 1];
  for (let i = 0; i < n; i++) {
    const ratio = speech(bounds[i], bounds[i + 1]) / expected[i];
    if (ratio < 0.62 || ratio > 1.6) return null;
    // Parça içinde kalan sessizlikler kesimlerden kısa olmalı
    for (let j = 0; j < m; j++) {
      if (chosenSet.has(j) || mids[j] <= bounds[i] || mids[j] >= bounds[i + 1]) continue;
      if (secs(cands[j].len) >= 0.9 || cands[j].len >= minCut) return null;
    }
  }
  return bounds.slice(0, -1).map((a, i) => slice(a, bounds[i + 1]));
}

export const BATCH_RULES =
  'Read each of the following Turkish sentences in order, exactly as written. After EACH sentence stay completely silent ' +
  'for two full seconds before the next one. Do not read the separators, do not add, skip or repeat anything.';

/** Birden çok cümleyi tek istekte üretir ve dosyalara böler. Bölme tutmazsa false döner. */
export async function geminiTtsBatch(
  items: { text: string; file: string }[],
  opts: { key: string; model: string; voice: string; lang?: 'en' },
): Promise<boolean> {
  const transcript = items.map((it) => it.text).join('\n\n—\n\n');
  const style = STYLE.replace('the following Turkish sentence', 'Turkish sentences').replace('Say only the sentence, nothing else.', '');
  const prompt = opts.lang === 'en' ? enPrompt(transcript, true) : `${style}\n${BATCH_RULES}\n\n${transcript}`;
  const { pcm, rate } = await requestPcm(prompt, opts);
  const pieces = splitBySilence(pcm, rate, items.map((i) => i.text));
  if (!pieces) return false;
  pieces.forEach((p, i) => writeFileSync(items[i].file, pcmToMp3(trimSilence(p, rate), rate)));
  return true;
}

/**
 * Tek cümle üretir. `tone` verilirse o cümleye özel okuma tarzı eklenir
 * (ör. "düşünceli bir 'hımm' ile başla, yavaş ve meraklı sor").
 */
export async function geminiTts(
  text: string,
  file: string,
  opts: { key: string; model: string; voice: string; tone?: string; lang?: 'en' },
): Promise<void> {
  const prompt =
    opts.lang === 'en'
      ? enPrompt(text)
      : trPrompt(text, opts.tone);
  const { pcm, rate } = await requestPcm(prompt, opts);
  const trimmed = trimSilence(pcm, rate);
  if (trimmed.length < rate * 0.3) throw new Error('Ses çok kısa (boş yanıt?)');
  writeFileSync(file, pcmToMp3(trimmed, rate));
}
