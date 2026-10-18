/**
 * El yazısı tanıma.
 *   Android: Google ML Kit Digital Ink (Türkçe model ilk açılışta bir kez iner, sonra internetsiz çalışır).
 *            Yerel eklenti: android/app/src/main/java/com/ahmetercikan/isimsehir/InkPlugin.java
 *   iOS:     Apple Vision (cihazda çalışır, indirilecek model yok, internetsiz çalışır).
 *            Yerel eklenti: ios/App/App/InkPlugin.swift (motor: InkVision.swift)
 *   Web:     Google'ın el yazısı giriş servisi (geliştirme ve tarayıcıda oynamak için).
 * Yerel tanıyıcı bir şey okuyamazsa web servisine düşülür.
 * Tanıyıcı birkaç aday döner; oyun turun harfi ve sözlüğe göre en uygununu seçer (chooseCandidate).
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { canonical, lookup } from '../engine/dict';
import { fixFirstLetter, norm, startsWithLetter, trLower, trUpper } from '../engine/tr';

export interface Stroke {
  x: number[];
  y: number[];
  t: number[];
}

interface InkPlugin {
  prepare(o: { lang: string }): Promise<{ ready: boolean }>;
  recognize(o: { strokes: Stroke[]; width: number; height: number; lang: string }): Promise<{ candidates: string[] }>;
}

const Ink = registerPlugin<InkPlugin>('Ink');
/** Yerel tanıyıcı: Android'de ML Kit, iOS'ta Vision. */
const native = () => Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios';

export type InkStatus = 'idle' | 'downloading' | 'ready' | 'error';
let status: InkStatus = 'idle';
let preparing: Promise<boolean> | null = null;
const listeners = new Set<(s: InkStatus) => void>();
const setStatus = (s: InkStatus) => {
  status = s;
  listeners.forEach((l) => l(s));
};

export const inkStatus = () => status;
export function onInkStatus(cb: (s: InkStatus) => void) {
  listeners.add(cb);
  return () => void listeners.delete(cb);
}

/** Türkçe el yazısı tanıyıcıyı hazırla (Android'de ilk seferde ~20 MB model indirir; iOS'ta indirme yok). */
export function prepareInk(): Promise<boolean> {
  if (!native()) {
    setStatus('ready');
    return Promise.resolve(true);
  }
  if (status === 'ready') return Promise.resolve(true);
  if (!preparing) {
    if (Capacitor.getPlatform() === 'android') setStatus('downloading');
    preparing = Ink.prepare({ lang: 'tr' })
      .then((r) => {
        setStatus(r.ready ? 'ready' : 'error');
        return r.ready;
      })
      .catch(() => {
        setStatus('error');
        return false;
      })
      .finally(() => (preparing = null));
  }
  return preparing;
}

/** Çizgileri tanır; döner: adaylar (en olası önce). */
export async function recognize(strokes: Stroke[], width: number, height: number): Promise<string[]> {
  if (!strokes.length) return [];
  if (import.meta.env.DEV || (window as { __inkDebug?: boolean }).__inkDebug) (window as { __lastInk?: unknown }).__lastInk = { strokes, width, height };
  if (native()) {
    if (status !== 'ready') await prepareInk();
    try {
      const r = await Ink.recognize({ strokes, width, height, lang: 'tr' });
      if (r.candidates?.length) return r.candidates;
    } catch {
      /* yerel tanıyıcı çalışmadıysa web servisine düş */
    }
  }
  return recognizeWeb(strokes, width, height);
}

async function recognizeWeb(strokes: Stroke[], width: number, height: number): Promise<string[]> {
  const t0 = strokes[0].t[0] ?? 0;
  const body = {
    options: 'enable_pre_space',
    requests: [
      {
        writing_guide: { writing_area_width: Math.round(width), writing_area_height: Math.round(height) },
        ink: strokes.map((s) => [s.x.map(Math.round), s.y.map(Math.round), s.t.map((v) => Math.round(v - t0))]),
        language: 'tr',
      },
    ],
  };
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 6000);
    const res = await fetch('https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    clearTimeout(to);
    const j = await res.json();
    if (j?.[0] !== 'SUCCESS') return [];
    return (j[1]?.[0]?.[1] ?? []) as string[];
  } catch {
    return [];
  }
}

/**
 * Adaylardan oyuna en uygununu seçer: önce sözlükte olan ve turun harfiyle başlayan, sonra harfi tutan, sonra ilk aday.
 * İlk harfin noktası/çengeli kaçtıysa düzeltir (cilek → çilek). Tek harflik adaylar (çizgi, nokta) atılır.
 * Döner: seçilen ve diğer (farklı) adaylar.
 */
export function chooseCandidate(cands: string[], letter: string, catId: string): { text: string; alts: string[] } {
  const seen = new Set<string>();
  const list: { text: string; score: number }[] = [];
  cands.forEach((raw, i) => {
    let text = fixFirstLetter(raw.replace(/[^\p{L}\s'’-]/gu, '').replace(/\s+/g, ' ').trim(), letter);
    // Büyük harfle yazılanlar: sözlükteki yazımı, yoksa yalnızca ilk harf büyük ("KEMAL" → "Kemal")
    const canon = canonical(catId, text);
    if (canon && startsWithLetter(canon, letter)) text = canon;
    else if (text.length > 1 && text === trUpper(text)) text = trUpper(text[0]) + trLower(text.slice(1));
    // Tek harf cevap olmaz: düz bir çizgi "l", "i", "1" okunuyor — böyle adaylar atılır.
    if (norm(text).length < 2 || seen.has(norm(text))) return;
    seen.add(norm(text));
    let score = -i * 0.15;
    if (startsWithLetter(text, letter)) score += 2;
    if (lookup(catId, text)) score += 3;
    list.push({ text, score });
  });
  if (!list.length) return { text: '', alts: [] };
  const best = [...list].sort((a, b) => b.score - a.score)[0];
  return { text: best.text, alts: list.filter((x) => x !== best).slice(0, 4).map((x) => x.text) };
}

/**
 * Çizgileri küçük bir SVG yoluna çevirir (herkese gösterilir): yükseklik 100'e ölçeklenir,
 * noktalar sadeleştirilir. Döner: "genişlik|yol".
 */
export function inkToPath(strokes: Stroke[]): string {
  const xs = strokes.flatMap((s) => s.x), ys = strokes.flatMap((s) => s.y);
  if (!xs.length) return '';
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const k = 84 / Math.max(maxY - minY, 40);
  const w = Math.round((maxX - minX) * k + 16);
  const parts: string[] = [];
  for (const s of strokes) {
    const pts = simplify(s.x.map((x, i) => [(x - minX) * k + 8, (s.y[i] - minY) * k + 8] as [number, number]), 1.1);
    if (!pts.length) continue;
    const r = (v: number) => Math.round(v);
    parts.push(`M${r(pts[0][0])} ${r(pts[0][1])}` + (pts.length === 1 ? 'l0 0' : pts.slice(1).map((p) => `L${r(p[0])} ${r(p[1])}`).join('')));
  }
  return `${w}|${parts.join('')}`.slice(0, 3800);
}

/** Ramer–Douglas–Peucker sadeleştirme. */
function simplify(pts: [number, number][], eps: number): [number, number][] {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let idx = 0, max = 0;
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / len;
    if (d > max) {
      max = d;
      idx = i;
    }
  }
  if (max <= eps) return [a, b];
  return [...simplify(pts.slice(0, idx + 1), eps).slice(0, -1), ...simplify(pts.slice(idx), eps)];
}
