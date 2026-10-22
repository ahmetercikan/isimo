/**
 * "Film Avı" motoru: ipuçları, puan, cevap eşleştirme ve öneri listesi.
 * Her turda gizli bir film var; ipuçları belli aralıkla birer birer açılır, erken bilen çok puan alır.
 * Film listesi src/data/films.ts (yalnız bu oyun açılınca iner).
 * Hepsi saf: ağ, zaman ya da ekran bilmez (testler: __tests__/film.test.ts).
 */
import type { Film } from '../data/films';
import { editDistance, fold, trUpper } from './tr';

export type { Film };

/** İpucu sayısı ve o ipucundayken bilene verilen puan. */
export const CLUES = 6;
export const CLUE_PTS = [100, 80, 60, 45, 30, 15] as const;

/** Hangi filmler sorulsun. */
export type FilmPool = 'hepsi' | 'yerli' | 'yabanci';
export const POOLS: { id: FilmPool; label: string }[] = [
  { id: 'hepsi', label: 'Karışık' },
  { id: 'yerli', label: 'Yerli' },
  { id: 'yabanci', label: 'Yabancı' },
];

interface Data {
  films: Film[];
  byId: Map<string, Film>;
  /** Eşleştirme listesi: her ad (asıl ad ve öbür adlar) sadeleştirilmiş hâliyle. */
  names: { key: string; title: string; id: string | null }[];
}
let data: Data | null = null;

function build(films: Film[], decoys: string[]): Data {
  const names: Data['names'] = [];
  for (const f of films) for (const n of [f.t, ...(f.alt ?? [])]) names.push({ key: fold(n), title: f.t, id: f.id });
  for (const d of decoys) names.push({ key: fold(d), title: d, id: null });
  return { films, byId: new Map(films.map((f) => [f.id, f])), names };
}

export const filmsReady = () => !!data;

/** Film listesini yükler (bir kez; oyun başlamadan çağrılır). */
export async function loadFilms(): Promise<boolean> {
  if (data) return true;
  try {
    const m = await import('../data/films');
    data = build(m.FILMS, m.DECOYS);
    return true;
  } catch {
    return false;
  }
}

/** Yalnızca testler için: listeyi elle kur. */
export function setFilms(films: Film[], decoys: string[] = []) {
  data = build(films, decoys);
}

export const filmById = (id?: string) => (id ? data?.byId.get(id) : undefined);
export const isYerli = (f: Film) => f.c === 'Türkiye';

/** Bu ayarla sorulabilecek filmler. */
export function poolFilms(pool: FilmPool = 'hepsi'): Film[] {
  const all = data?.films ?? [];
  if (pool === 'yerli') return all.filter(isYerli);
  if (pool === 'yabanci') return all.filter((f) => !isYerli(f));
  return all;
}

/** Sıradaki film: bu oyunda sorulmamışlardan rastgele (hepsi sorulduysa baştan). */
export function pickFilm(pool: FilmPool, used: Iterable<string> = []): string {
  const u = new Set(used);
  const all = poolFilms(pool);
  const fresh = all.filter((f) => !u.has(f.id));
  const list = fresh.length ? fresh : all;
  return list.length ? list[Math.floor(Math.random() * list.length)].id : '';
}

/** Oyunda en fazla kaç film sorulabilir (listede yeterince film yoksa tur sayısı kısalır). */
export const maxRounds = (pool: FilmPool) => poolFilms(pool).length;

/**
 * Adın iskeleti: her kelimenin ilk harfi açık, gerisi çizgi; noktalama yerinde kalır.
 * "Esaretin Bedeli" → ["E_______", "B_____"].
 */
export function skeleton(title: string): string[] {
  return trUpper(title)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      let first = true;
      return [...w]
        .map((ch) => {
          if (!/[\p{L}\p{N}]/u.test(ch)) return ch;
          if (first) {
            first = false;
            return ch;
          }
          return '_';
        })
        .join('');
    });
}

export interface Clue {
  label: string;
  text: string;
  /** Altıncı ipucu: ekranda harf kutuları olarak çizilir. */
  words?: string[];
}

/** Filmin altı ipucu, açılış sırasıyla (her biri bir öncekinden daha kolay). */
export function clues(f: Film): Clue[] {
  const who = f.anim ? 'Seslendiren' : 'Oyuncu';
  const words = skeleton(f.t);
  return [
    { label: 'Tür ve yıl', text: `${f.g} · ${f.y} · ${isYerli(f) ? 'Yerli film' : f.c}` },
    { label: 'Yönetmen', text: f.d },
    { label: who, text: f.a[0] },
    { label: f.anim ? 'Seslendiren' : 'Başrol', text: f.a[1] },
    { label: 'Konu', text: f.k },
    { label: 'Adı', text: words.join(' '), words },
  ];
}

/** Şu an kaçıncı ipucu açık (0: tur daha başlamadı). */
export function clueAt(startAt: number, stepMs: number, now: number): number {
  if (now < startAt) return 0;
  return Math.min(CLUES, Math.floor((now - startAt) / stepMs) + 1);
}

/** Bu ipucundayken bilene kaç puan. */
export const ptsAt = (clue: number) => (clue >= 1 ? CLUE_PTS[Math.min(CLUES, clue) - 1] : 0);

/** Ad uzunluğuna göre kabul edilen yazım hatası: kısa adda hiç, uzun adda birkaç harf. */
const slack = (n: number) => (n <= 4 ? 0 : n <= 8 ? 1 : n <= 14 ? 2 : 3);

/**
 * Yazılan hangi filme (ya da öneri listesindeki hangi ada) denk geliyor: önce tam eşleşme
 * (Türkçe karakter, boşluk ve noktalama farkı yok sayılır), sonra en yakın yazım.
 * Başka bir filmin adı tam yazıldıysa o filmdir: "Baba" ile "Babam ve Oğlum" karışmaz.
 */
export function matchFilm(input: string): { id: string | null; title: string; exact: boolean } | null {
  if (!data) return null;
  const k = fold(input);
  if (k.length < 2) return null;
  const exact = data.names.find((n) => n.key === k);
  if (exact) return { id: exact.id, title: exact.title, exact: true };
  let best: Data['names'][number] | null = null;
  let bestD = Infinity;
  for (const n of data.names) {
    const max = slack(n.key.length);
    if (!max) continue;
    const d = editDistance(k, n.key, max);
    if (d <= max && d < bestD) {
      best = n;
      bestD = d;
    }
  }
  return best ? { id: best.id, title: best.title, exact: false } : null;
}

/** Doğru cevap mı. */
export const isRight = (f: Film | undefined, input: string) => !!f && matchFilm(input)?.id === f.id;

/**
 * Öneri listesi: yazılanla başlayan (ya da bir kelimesi onunla başlayan) film adları.
 * Sorulan filmlerle birlikte yalnız adı olan filmler de çıkar, liste cevabı ele vermesin.
 */
export function suggest(input: string, n = 4): string[] {
  if (!data) return [];
  const k = fold(input);
  if (k.length < 2) return [];
  const out: string[] = [];
  const add = (title: string) => {
    if (!out.includes(title)) out.push(title);
  };
  // Önce baştan uyanlar, sonra herhangi bir kelimesi uyanlar.
  for (const x of data.names) if (x.key.startsWith(k)) add(x.title);
  for (const x of data.names) {
    if (out.length >= n) break;
    if (x.title.split(/[\s:]+/).some((w) => fold(w).startsWith(k))) add(x.title);
  }
  return out.slice(0, n);
}

/**
 * El yazısı adaylarından en uygununu seçer: önce bir film adını tam tutanı, sonra yazım hatasıyla
 * tutanı (doğru film olsun olmasın — doğru cevabı tercih etmek cevabı ele verirdi), sonra öneri çıkaranı.
 */
export function pickCandidate(cands: string[]): { text: string; alts: string[] } {
  const list = [...new Set(cands.map((c) => c.trim()).filter(Boolean))];
  if (!list.length) return { text: '', alts: [] };
  const best = list.find((c) => matchFilm(c)?.exact) ?? list.find((c) => matchFilm(c)) ?? list.find((c) => suggest(c).length) ?? list[0];
  return { text: best, alts: list.filter((x) => x !== best).slice(0, 3) };
}
