/**
 * Kategori sözlükleri (src/data/dict/{id}.json): cevap "sözlükte var" mı ve botların cevapları.
 * Sözlük yalnızca yardımcıdır: geçerliliğe son kararı oyuncuların oyu verir.
 * Dosyalar ilk kullanımda yüklenir (uygulama açılışını yavaşlatmaz).
 */
import { editDistance, firstLetter, fold, norm } from './tr';

interface Dict {
  words: string[];
  byNorm: Map<string, string>;
  byFold: Map<string, string>;
  byLetter: Map<string, string[]>;
}

const loaders = import.meta.glob<{ default: string[] }>('../data/dict/*.json');
const cache = new Map<string, Dict>();
const pending = new Map<string, Promise<Dict | null>>();

function build(words: string[]): Dict {
  const d: Dict = { words, byNorm: new Map(), byFold: new Map(), byLetter: new Map() };
  for (const w of words) {
    d.byNorm.set(norm(w), w);
    if (!d.byFold.has(fold(w))) d.byFold.set(fold(w), w);
    const l = firstLetter(w);
    const list = d.byLetter.get(l) ?? [];
    list.push(w);
    d.byLetter.set(l, list);
  }
  return d;
}

export function loadDict(id: string): Promise<Dict | null> {
  const hit = cache.get(id);
  if (hit) return Promise.resolve(hit);
  const load = loaders[`../data/dict/${id}.json`];
  if (!load) return Promise.resolve(null);
  let p = pending.get(id);
  if (!p) {
    p = load()
      .then((m) => {
        const d = build(m.default);
        cache.set(id, d);
        return d;
      })
      .catch(() => null)
      .finally(() => pending.delete(id));
    pending.set(id, p);
  }
  return p;
}

export const loadDicts = (ids: string[]) => Promise.all(ids.map(loadDict));

/** Yüklenmiş sözlük (yoksa undefined). */
export const dictOf = (id: string) => cache.get(id);

/** Uzun adlarda baştan eşleşme kabul edilen kategoriler ("Harry Potter" → "Harry Potter ve Felsefe Taşı"). */
const PREFIX_OK = new Set(['unlu', 'dizi', 'marka']);

/**
 * Cevap sözlükte var mı? Önce tam, sonra Türkçe karaktersiz, sonra tek harf hatalı (5+ harfli kelimelerde).
 * Döner: sözlükteki karşılığı ya da null. Sözlük yüklenmemişse undefined.
 */
export function lookup(catId: string, answer: string): string | null | undefined {
  const d = cache.get(catId);
  if (!d) return undefined;
  const n = norm(answer);
  if (!n) return null;
  const exact = d.byNorm.get(n);
  if (exact) return exact;
  const f = fold(answer);
  const loose = d.byFold.get(f);
  if (loose) return loose;
  const l = firstLetter(answer);
  const same = d.byLetter.get(l) ?? [];
  if (PREFIX_OK.has(catId) && f.length >= 5) {
    const pre = same.find((w) => fold(w).startsWith(f));
    if (pre) return pre;
  }
  if (f.length >= 5) {
    for (const w of same) if (editDistance(fold(w), f, 1) <= 1) return w;
  }
  return null;
}

/** Sözlükteki yazımı (yalnızca Türkçe karakter ve büyük/küçük harf farkıyla eşleşirse): "ALI" → "Ali". */
export function canonical(catId: string, answer: string): string | null {
  return cache.get(catId)?.byFold.get(fold(answer)) ?? null;
}

/** Bu harfle başlayan sözlük kelimeleri. */
export function wordsFor(catId: string, letter: string): string[] {
  return cache.get(catId)?.byLetter.get(letter) ?? [];
}
