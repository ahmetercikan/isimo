/**
 * Puanlama (klasik İsim Şehir kuralları):
 *   - boş, tek harflik ya da yanlış harfle başlayan cevap: 0
 *   - oyuncuların çoğunluğu "geçersiz" dediyse: 0 (sözlükte olan cevap için en az 2 oy gerekir)
 *   - geçerli ve tek: 10, başkasıyla aynı: 5
 *   - o kategoride geçerli cevabı olan tek kişiysen: 20
 *
 * "Aynı cevap" yazımına değil kelimeye bakar: "oranguta" ile "orangutan" aynı cevaptır
 * (bkz. sameKeys) — yoksa yanlış yazan tek kişi sayılıp herkesten fazla puan alırdı.
 */
import { lookup } from './dict';
import { editDistance, fold, norm, startsWithLetter } from './tr';
import { rKey, type RoomState, type RoundResult } from './types';

export type Reason = 'ok' | 'empty' | 'short' | 'letter' | 'voted';

export interface Verdict {
  text: string;
  valid: boolean;
  reason: Reason;
  /** Sözlükte var mı (undefined: bu kategoride sözlük yok). */
  inDict: boolean | undefined;
  /** Aynı cevabı veren toplam kişi (kendisi dahil). */
  same: number;
  /** Geçersiz oyu sayısı ve iptal için gereken oy. */
  rejects: number;
  needed: number;
  pts: number;
}

export const PTS = { unique: 10, shared: 5, alone: 20 } as const;

/**
 * Bir kategorinin bütün cevaplarını değerlendirir.
 * voters: oy verebilen oyuncular; kendi cevabına oy verilmez.
 */
export function judgeCategory(o: {
  catId: string;
  letter: string;
  pids: string[];
  answers: Record<string, string | undefined>;
  votes?: Record<string, Record<string, true> | undefined>;
  voters: string[];
}): Record<string, Verdict> {
  const out: Record<string, Verdict> = {};
  for (const pid of o.pids) {
    const text = (o.answers[pid] ?? '').trim();
    const found = text ? lookup(o.catId, text) : null;
    const inDict = found === undefined ? undefined : !!found;
    const eligible = o.voters.filter((v) => v !== pid);
    const rejects = Object.keys(o.votes?.[pid] ?? {}).filter((v) => v !== pid && eligible.includes(v)).length;
    const needed = Math.max(Math.floor(eligible.length / 2) + 1, inDict ? 2 : 1);
    let reason: Reason = 'ok';
    if (!text) reason = 'empty';
    else if (!startsWithLetter(text, o.letter)) reason = 'letter';
    else if (norm(text).length < 2) reason = 'short';
    else if (eligible.length >= needed && rejects >= needed) reason = 'voted';
    out[pid] = { text, valid: reason === 'ok', reason, inDict, same: 0, rejects, needed, pts: 0 };
  }
  const valid = o.pids.filter((p) => out[p].valid);
  const keys = sameKeys(o.catId, valid.map((p) => out[p].text));
  const groups = new Map<string, number>();
  for (const k of keys) groups.set(k, (groups.get(k) ?? 0) + 1);
  valid.forEach((p, i) => {
    const v = out[p];
    v.same = groups.get(keys[i]) ?? 1;
    v.pts = valid.length === 1 ? PTS.alone : v.same > 1 ? PTS.shared : PTS.unique;
  });
  return out;
}

/** Bir harf hatasının "aynı cevap" sayılması için gereken en kısa boy. */
const SAME_MIN = 5;

/**
 * Cevapları "aynı kelime mi" diye eşleştirmek için anahtarlar üretir (sırası girdiyle aynıdır).
 * Önce sözlükteki karşılığına bakar ("oranguta" → "Orangutan"), sözlükte bulunmayan uzun
 * cevapları da aralarında tek harf fark varsa kalabalık olana bağlar ("mandalena" → "mandalina").
 * Sözlükte olan iki ayrı kelime birleştirilmez (kedi/keçi ayrı cevaptır).
 */
export function sameKeys(catId: string, texts: string[]): string[] {
  const keys = texts.map((t) => {
    const hit = lookup(catId, t);
    return { key: hit ? fold(hit) : fold(t), dict: !!hit };
  });
  const info = new Map<string, { dict: boolean; n: number }>();
  for (const k of keys) {
    const x = info.get(k.key) ?? { dict: k.dict, n: 0 };
    x.n++;
    x.dict = x.dict || k.dict;
    info.set(k.key, x);
  }
  // Sözlükte bulunmayan yazımlar, tek harf farkla benzeyen "daha güçlü" anahtara bağlanır.
  const birlesme = new Map<string, string>();
  for (const [k, x] of [...info].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (x.dict || k.length < SAME_MIN) continue;
    let hedef = '';
    let en = { dict: false, n: 0, key: '' };
    for (const [o, y] of info) {
      if (o === k || o.length < SAME_MIN || editDistance(k, o, 1) > 1) continue;
      const daha = y.dict !== en.dict ? y.dict : y.n !== en.n ? y.n > en.n : o < en.key;
      const guclu = y.dict || y.n > x.n || (y.n === x.n && o < k);
      if (guclu && (!hedef || daha)) {
        hedef = o;
        en = { dict: y.dict, n: y.n, key: o };
      }
    }
    if (hedef) birlesme.set(k, hedef);
  }
  // A→B, B→C olabilir: zincirin sonuna kadar çöz.
  const coz = (k: string) => {
    let x = k;
    for (let i = 0; i < 4 && birlesme.has(x); i++) x = birlesme.get(x)!;
    return x;
  };
  return keys.map((k) => coz(k.key));
}

/** Turda puanlanacak oyuncular: cevap yazanlar ve ayrılmamış olanlar. */
export function roundPids(s: RoomState, round: number): string[] {
  const ans = s.answers?.[rKey(round)] ?? {};
  return Object.keys(s.players)
    .filter((p) => !s.players[p].left || ans[p])
    .sort((a, b) => s.players[a].joined - s.players[b].joined);
}

/** Oy verebilenler: ayrılmamış oyuncular (botlu oyunda botlar da hakemdir). */
export function voterPids(s: RoomState): string[] {
  return Object.keys(s.players).filter((p) => !s.players[p].left);
}

export function judgeRound(s: RoomState, round: number, letter = s.results?.[rKey(round)]?.letter || s.ctl.letter): Record<string, Record<string, Verdict>> {
  const k = rKey(round);
  const pids = roundPids(s, round);
  const voters = voterPids(s);
  const out: Record<string, Record<string, Verdict>> = {};
  for (const c of s.settings.cats) {
    const answers: Record<string, string | undefined> = {};
    for (const p of pids) answers[p] = s.answers?.[k]?.[p]?.[c.id];
    out[c.id] = judgeCategory({ catId: c.id, letter, pids, answers, votes: s.votes?.[k]?.[c.id], voters });
  }
  return out;
}

export function scoreRound(s: RoomState, round: number): RoundResult {
  const judged = judgeRound(s, round);
  const pts: Record<string, Record<string, number>> = {};
  const sum: Record<string, number> = {};
  for (const p of roundPids(s, round)) {
    pts[p] = {};
    sum[p] = 0;
    for (const c of s.settings.cats) {
      const v = judged[c.id][p]?.pts ?? 0;
      pts[p][c.id] = v;
      sum[p] += v;
    }
  }
  return { letter: s.ctl.letter, stopBy: s.ctl.stopBy, pts, sum };
}

/** Oyun boyunca toplam puanlar. */
export function totals(s: RoomState): Record<string, number> {
  const t: Record<string, number> = {};
  for (const p of Object.keys(s.players)) t[p] = 0;
  for (const r of Object.values(s.results ?? {})) for (const [p, v] of Object.entries(r.sum ?? {})) t[p] = (t[p] ?? 0) + v;
  return t;
}

/** Sıralama: puana göre, eşitlikte katılma sırası. */
export function ranking(s: RoomState): { pid: string; total: number; rank: number }[] {
  const t = totals(s);
  const list = Object.keys(s.players)
    .filter((p) => !s.players[p].left || t[p] > 0)
    .sort((a, b) => t[b] - t[a] || s.players[a].joined - s.players[b].joined)
    .map((pid) => ({ pid, total: t[pid] ?? 0, rank: 0 }));
  list.forEach((x, i) => (x.rank = i > 0 && list[i - 1].total === x.total ? list[i - 1].rank : i + 1));
  return list;
}
