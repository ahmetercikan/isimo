/**
 * "Sen Ne Kadar…?" (Sinema Bilmecesi evreni): bir filme/seriye özel bilgi yarışması.
 * Tur 10 soru: kolaydan zora (4 kolay, 3 orta, 3 zor); son oynanan sorular bir süre tekrar gelmez.
 * Şıklar her turda karışır (dosyada ilk şık doğrudur). Sonuçta doğru sayısına göre 6 basamaklı unvan.
 * Sorular: src/data/quiz/*.json (biçim: src/data/quiz/README.md).
 */
export interface QuizQuestion {
  /** Zorluk: 1 kolay, 2 orta, 3 zor. */
  d: 1 | 2 | 3;
  q: string;
  /** Şıklar; ilki doğru. */
  a: string[];
  tf?: boolean;
  /** Yanlış cevapta çıkan kısa espri. */
  oops?: string;
  src?: string;
}

export interface QuizTier {
  name: string;
  line: string;
}

export interface Quiz {
  id: string;
  title: string;
  ask: string;
  scope?: string;
  tiers: QuizTier[];
  questions: QuizQuestion[];
}

/** Turda sorulan soru: şıklar karışık, `right` doğru şıkkın yeri. */
export interface RoundQuestion extends QuizQuestion {
  key: number;
  options: string[];
  right: number;
}

export const ROUND = 10;
export const QUESTION_MS = 20_000;
const MIX: [1 | 2 | 3, number][] = [[1, 4], [2, 3], [3, 3]];

const shuffle = <T,>(xs: T[], rnd = Math.random): T[] => {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Tur soruları: her zorluktan belirli sayıda, `seen` (son sorulanlar) olabildiğince dışarıda.
 * Bir zorlukta yeterince soru yoksa komşu zorluktan tamamlanır.
 */
export function pickRound(quiz: Quiz, seen: Iterable<number> = [], rnd = Math.random): RoundQuestion[] {
  const old = new Set(seen);
  const all = quiz.questions.map((q, key) => ({ ...q, key }));
  const used = new Set<number>();
  const out: (QuizQuestion & { key: number })[] = [];
  const take = (d: number, n: number) => {
    const fresh = shuffle(all.filter((q) => q.d === d && !used.has(q.key) && !old.has(q.key)), rnd);
    const stale = shuffle(all.filter((q) => q.d === d && !used.has(q.key) && old.has(q.key)), rnd);
    const got = [...fresh, ...stale].slice(0, n);
    got.forEach((q) => used.add(q.key));
    out.push(...got);
    return n - got.length;
  };
  let short = 0;
  for (const [d, n] of MIX) short += take(d, n);
  if (short > 0) {
    const rest = shuffle(all.filter((q) => !used.has(q.key)), rnd).slice(0, short);
    rest.forEach((q) => used.add(q.key));
    out.push(...rest);
  }
  out.sort((a, b) => a.d - b.d);
  return out.slice(0, ROUND).map((q) => {
    if (q.tf) return { ...q, options: ['Doğru', 'Yanlış'], right: q.a[0] === 'Doğru' ? 0 : 1 };
    const order = shuffle(q.a.map((_, i) => i), rnd);
    return { ...q, options: order.map((i) => q.a[i]), right: order.indexOf(0) };
  });
}

/** Doğru sayısından unvan basamağı (0-5): 0-1, 2-3, 4-5, 6-7, 8-9, 10. */
export function tierIndex(correct: number, total = ROUND): number {
  const r = correct / Math.max(1, total);
  if (r >= 1) return 5;
  if (r >= 0.8) return 4;
  if (r >= 0.6) return 3;
  if (r >= 0.4) return 2;
  if (r >= 0.2) return 1;
  return 0;
}

/** Puan: doğru başına 100 + kalan süreye göre en fazla 50. */
export const questionPoints = (ok: boolean, leftMs: number) => (ok ? 100 + Math.round((Math.min(QUESTION_MS, Math.max(0, leftMs)) / QUESTION_MS) * 50) : 0);
