/**
 * "Sıra Sende" (harf değiştir) motoru.
 * Genel Türkçe kelime havuzu: src/data/dict/kelime.json (kaynak: scripts/dict-src/kelime.txt).
 * Kural: masadaki kelimede tek bir harf değiştirilir (ayar açıksa harf eklemek/çıkarmak da serbest),
 * yeni kelime sözlükte olmalı ve o oyunda daha önce kullanılmamış olmalı.
 * Hepsi saf: ağ, zaman ya da ekran bilmez (testler: __tests__/chain.test.ts).
 */
import { loadDict } from './dict';
import { fold, norm, trLower, trUpper } from './tr';

/** Kelimelerde geçebilen harfler (kelime havuzu bu harflerle yazılır). */
export const LETTERS = 'abcçdefgğhıijklmnoöprsştuüvyz'.split('');

/** Oynanabilir kelime uzunlukları ve varsayılanı. */
export const LENGTHS = [3, 4, 5] as const;
export const DEFAULT_LEN = 4;

/** Hamle kuralı: yalnızca değiştir, ya da ekle/çıkar da serbest. */
export type Rule = 'degis' | 'serbest';
export const ruleOf = (free?: boolean): Rule => (free ? 'serbest' : 'degis');

interface Pool {
  set: Set<string>;
  byLen: Map<number, string[]>;
  /** Noktası/çengeli kaçmış yazımı eşlemek için ("cilek" → "çilek"). */
  byFold: Map<string, string>;
}
let pool: Pool | null = null;

const ok = (w: string) => /^[a-zçğıöşüâîû]+$/.test(w);

function build(words: string[]): Pool {
  const p: Pool = { set: new Set(), byLen: new Map(), byFold: new Map() };
  for (const raw of words) {
    const w = trLower(raw.trim());
    if (!ok(w) || w.length < 3 || w.length > 7 || p.set.has(w)) continue;
    p.set.add(w);
    const list = p.byLen.get(w.length) ?? [];
    list.push(w);
    p.byLen.set(w.length, list);
    if (!p.byFold.has(fold(w))) p.byFold.set(fold(w), w);
  }
  return p;
}

/** Kelime havuzu yüklendi mi. */
export const wordsReady = () => !!pool;

/** Kelime havuzunu yükler (bir kez; oyun başlamadan çağrılır). */
export async function loadWords(): Promise<boolean> {
  if (pool) return true;
  const d = await loadDict('kelime');
  if (!d) return false;
  pool = build(d.words);
  return true;
}

/** Yalnızca testler için: havuzu elle kur. */
export function setWords(words: string[]) {
  pool = build(words);
}

/** Bu uzunlukta kaç kelime var. */
export const poolSize = (len: number) => pool?.byLen.get(len)?.length ?? 0;

/**
 * Yazılanı sözlükteki kelimeye çevirir: önce tam, sonra Türkçe karakter farkını
 * yok sayarak ("cilek" → "çilek"; el yazısı tanıma noktaları kaçırabilir).
 * Döner: küçük harfli sözlük kelimesi ya da null.
 */
export function resolve(input: string): string | null {
  if (!pool) return null;
  const n = norm(input);
  if (!n) return null;
  if (pool.set.has(n)) return n;
  return pool.byFold.get(fold(n)) ?? null;
}

/** Kelimede tek bir harf mi değişmiş (uzunluk aynı)? */
export function isSwap(a: string, b: string): boolean {
  if (a.length !== b.length || a === b) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d === 1;
}

/** Tek bir harf mi eklenmiş/çıkarılmış? */
export function isAddDrop(a: string, b: string): boolean {
  const [s, l] = a.length < b.length ? [a, b] : [b, a];
  if (l.length - s.length !== 1) return false;
  let i = 0;
  let j = 0;
  let skipped = false;
  while (i < s.length && j < l.length) {
    if (s[i] === l[j]) {
      i++;
      j++;
    } else {
      if (skipped) return false;
      skipped = true;
      j++;
    }
  }
  return true;
}

/** Bu hamle kurala uygun mu? */
export function isMove(from: string, to: string, rule: Rule): boolean {
  if (from === to) return false;
  return isSwap(from, to) || (rule === 'serbest' && isAddDrop(from, to));
}

/** Bu kelimeden gidilebilecek bütün sözlük kelimeleri. */
export function moves(word: string, rule: Rule): string[] {
  if (!pool) return [];
  const out = new Set<string>();
  const add = (w: string) => {
    if (w !== word && pool!.set.has(w)) out.add(w);
  };
  for (let i = 0; i < word.length; i++) {
    for (const c of LETTERS) if (c !== word[i]) add(word.slice(0, i) + c + word.slice(i + 1));
    if (rule === 'serbest' && word.length > 3) add(word.slice(0, i) + word.slice(i + 1));
  }
  if (rule === 'serbest' && word.length < 7) {
    for (let i = 0; i <= word.length; i++) for (const c of LETTERS) add(word.slice(0, i) + c + word.slice(i));
  }
  return [...out];
}

/** Kullanılmamış hamleler. */
export const freeMoves = (word: string, used: Iterable<string>, rule: Rule): string[] => {
  const u = new Set(used);
  return moves(word, rule).filter((w) => !u.has(w));
};

/** Bu kelimeden devam edilebilir mi? */
export const canGo = (word: string, used: Iterable<string>, rule: Rule) => freeMoves(word, used, rule).length > 0;

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

/**
 * Oyuna başlangıç kelimesi seçer: bu uzunlukta, kullanılmamış ve en az birkaç
 * yolu olan bir kelime (oyun ilk hamlede tıkanmasın).
 */
export function startWord(len: number, rule: Rule, used: Iterable<string> = []): string {
  const u = new Set(used);
  const all = (pool?.byLen.get(len) ?? []).filter((w) => !u.has(w));
  if (!all.length) return pool?.byLen.get(len)?.[0] ?? '';
  for (const need of [4, 2, 1]) {
    const good = all.filter((w) => freeMoves(w, u, rule).length >= need);
    if (good.length) return pick(good);
  }
  return pick(all);
}

/** Zorluğa göre bir hamle: kolay bot ilk bulduğunu, zor bot en çok yolu açık kalanı oynar. */
export function botMove(word: string, used: Iterable<string>, rule: Rule, level: 1 | 2 | 3): string | null {
  const u = new Set(used);
  const list = freeMoves(word, u, rule);
  if (!list.length) return null;
  if (level === 1) return pick(list);
  if (level === 2) return pick(list.slice(0, Math.max(1, Math.ceil(list.length / 2))));
  // Zor bot: rakibe en az yol bırakan kelimeyi seçer.
  let best = list[0];
  let bestN = Infinity;
  for (const w of list) {
    const n = freeMoves(w, [...u, w], rule).length;
    if (n < bestN) {
      bestN = n;
      best = w;
    }
  }
  return best;
}

export type Why = 'ok' | 'bos' | 'yok' | 'ayni' | 'kullanildi' | 'kural';

/** Hamlenin neden kabul edilmediğini de söyleyen kontrol. */
export function check(from: string, input: string, used: Iterable<string>, rule: Rule): { why: Why; word: string } {
  const text = (input ?? '').trim();
  if (!text) return { why: 'bos', word: '' };
  const w = resolve(text);
  if (!w) return { why: 'yok', word: norm(text) };
  if (w === from) return { why: 'ayni', word: w };
  if (!isMove(from, w, rule)) return { why: 'kural', word: w };
  if (new Set(used).has(w)) return { why: 'kullanildi', word: w };
  return { why: 'ok', word: w };
}

/** Kural metni (ekranda gösterilir). */
export const whyText = (why: Why, rule: Rule): string =>
  ({
    ok: '',
    bos: 'Bir kelime yaz',
    yok: 'Bu kelime sözlükte yok',
    ayni: 'Aynı kelime olmaz',
    kullanildi: 'Bu kelime bu oyunda kullanıldı',
    kural: rule === 'serbest' ? 'Tek bir harf değiştir, ekle ya da çıkar' : 'Yalnızca tek bir harf değiştirebilirsin',
  })[why];

/**
 * El yazısı adaylarından en uygununu seçer: önce kurala uyan, sonra sözlükte olan,
 * sonra uzunluğu tutan. Döner: seçilen (sözlükteki yazımıyla) ve diğer adaylar.
 */
export function pickCandidate(cands: string[], from: string, used: Iterable<string>, rule: Rule): { text: string; alts: string[] } {
  const u = new Set(used);
  const seen = new Set<string>();
  const list: { text: string; score: number }[] = [];
  cands.forEach((raw, i) => {
    const clean = norm(raw);
    if (!clean) return;
    const w = resolve(clean);
    const text = w ?? clean;
    if (seen.has(text)) return;
    seen.add(text);
    let score = -i * 0.2;
    if (w) score += 2;
    if (w && isMove(from, w, rule) && !u.has(w)) score += 5;
    if (text.length === from.length) score += 1;
    list.push({ text, score });
  });
  if (!list.length) return { text: '', alts: [] };
  const best = [...list].sort((a, b) => b.score - a.score)[0];
  return { text: best.text, alts: list.filter((x) => x !== best).slice(0, 4).map((x) => x.text) };
}

/** Ekranda gösterim: kelime büyük harfle. */
export const show = (w: string) => trUpper(w);

/** Oynanmış kelimeler: ctl.chain → dizi. */
export const chainList = (chain?: string) => (chain ? chain.split(',').filter(Boolean) : []);
