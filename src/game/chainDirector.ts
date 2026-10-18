/**
 * "Sıra Sende" oyun akışı (lobi → sıra → final).
 * Bütün oyun durumu ctl içinde durur (kelime, sıra, canlar, puanlar): her hamle tek bir
 * atomik işlemdir, iki cihaz aynı anda oynayamaz. Zamanı dolan sırayı "yöneten" oyuncu kapatır.
 */
import { canGo, chainList, check, DEFAULT_LEN, ruleOf, startWord } from '../engine/chain';
import { newCtl, type Ctl, type RoomState } from '../engine/types';
import type { Transport } from '../online/transport';

/** Bir kelime kaç puan. */
export const PTS_WORD = 10;
/** İlk sıraya ek düşünme payı. */
export const FIRST_EXTRA_MS = 2500;
/** Süre dolduktan sonra son bir hamle için pay (saat farkı da buna girer). */
export const MISS_GRACE_MS = 700;

export const turnMs = (s: RoomState) => Math.max(5, s.settings.time) * 1000;
const rule = (s: RoomState) => ruleOf(s.settings.free);
const len = (s: RoomState) => s.settings.len ?? DEFAULT_LEN;
const outList = (c: Ctl) => (c.out ? c.out.split(',').filter(Boolean) : []);

/** Masada oturan oyuncular (ayrılmayanlar), katılma sırasına göre. */
export const seated = (s: RoomState) =>
  Object.keys(s.players)
    .filter((p) => !s.players[p].left)
    .sort((a, b) => s.players[a].joined - s.players[b].joined);

/** Canı duran oyuncular. */
export const alive = (s: RoomState, c: Ctl = s.ctl) => seated(s).filter((p) => (c.lives?.[p] ?? 0) > 0);

/** Sıradaki canlı oyuncu (kendisi hariç; kimse kalmadıysa kendisi). */
export function nextTurn(s: RoomState, c: Ctl, from: string): string {
  const list = alive(s, c);
  if (!list.length) return from;
  const i = list.indexOf(from);
  if (i < 0) return list[0];
  return list[(i + 1) % list.length];
}

/** Oyuncunun canı var mı (oyunda mı). */
export const inGame = (c: Ctl, pid: string) => (c.lives?.[pid] ?? 0) > 0;

/** Lobiden oyunu başlat: ilk kelime, canlar ve sıra. */
export async function startChain(t: Transport, s: RoomState) {
  const now = t.now();
  const pids = seated(s);
  if (!pids.length) return false;
  const word = startWord(len(s), rule(s));
  if (!word) return false;
  const lives: Record<string, number> = {};
  const pts: Record<string, number> = {};
  for (const p of pids) {
    lives[p] = Math.max(1, s.settings.lives ?? 3);
    pts[p] = 0;
  }
  return t.transactCtl((c) =>
    c.phase === 'lobby' || c.phase === 'final'
      ? {
          ...newCtl(),
          phase: 'turn',
          round: 1,
          word,
          chain: word,
          turn: pids[0],
          lives,
          pts,
          out: '',
          startAt: now,
          endAt: now + turnMs(s) + FIRST_EXTRA_MS,
          seq: c.seq + 1,
        }
      : undefined,
  );
}

/**
 * Sıradaki oyuncunun hamlesi. Kurallar işlemin içinde bir daha kontrol edilir
 * (sıra geçmiş ya da kelime değişmiş olabilir). Döner: kabul edildi mi.
 */
export async function playWord(t: Transport, s: RoomState, input: string, as: string = t.me): Promise<boolean> {
  const now = t.now();
  const r = rule(s);
  return t.transactCtl((c) => {
    if (c.phase !== 'turn' || c.turn !== as || !c.word) return undefined;
    const used = chainList(c.chain);
    const v = check(c.word, input, used, r);
    if (v.why !== 'ok') return undefined;
    const pts = { ...(c.pts ?? {}), [as]: (c.pts?.[as] ?? 0) + PTS_WORD };
    let word = v.word;
    const chain = [...used, v.word];
    let last: Ctl['last'] = { p: as, k: 'ok', w: v.word };
    // Bu kelimeden gidilecek yer kalmadıysa masaya yeni kelime gelir.
    if (!canGo(word, chain, r)) {
      const fresh = startWord(len(s), r, chain);
      if (fresh) {
        word = fresh;
        chain.push(fresh);
        last = { p: as, k: 'fresh', w: fresh };
      }
    }
    return {
      ...c,
      word,
      chain: chain.join(','),
      pts,
      turn: nextTurn(s, c, as),
      round: c.round + 1,
      endAt: now + turnMs(s),
      last,
      seq: c.seq + 1,
    };
  });
}

/**
 * Sıra kaçtı: süre doldu ('time') ya da oyuncu pas geçti ('pass'). Bir can gider;
 * canı bitenler elenir, tek kişi kalınca oyun biter.
 */
export async function missTurn(t: Transport, s: RoomState, pid: string, kind: 'time' | 'pass'): Promise<boolean> {
  const now = t.now();
  const r = rule(s);
  return t.transactCtl((c) => {
    if (c.phase !== 'turn' || c.turn !== pid || !c.word) return undefined;
    if (kind === 'time' && now < c.endAt + MISS_GRACE_MS) return undefined;
    const lives = { ...(c.lives ?? {}) };
    lives[pid] = Math.max(0, (lives[pid] ?? 1) - 1);
    const dead = lives[pid] === 0;
    const next: Ctl = { ...c, lives, out: dead ? [...outList(c), pid].join(',') : c.out };
    const left = alive(s, next);
    const last: Ctl['last'] = { p: pid, k: dead ? 'out' : kind };
    if (left.length <= 1) return { ...next, phase: 'final', last, seq: c.seq + 1 };
    let word = c.word;
    const chain = chainList(c.chain);
    if (!canGo(word, chain, r)) {
      const fresh = startWord(len(s), r, chain);
      if (fresh) {
        word = fresh;
        chain.push(fresh);
      }
    }
    return { ...next, word, chain: chain.join(','), turn: nextTurn(s, next, pid), endAt: now + turnMs(s), last, seq: c.seq + 1 };
  });
}

/** Yönetenin zamanlı işi: süresi dolan ya da odadan ayrılan oyuncunun sırasını kapatır. */
export async function chainStep(t: Transport, s: RoomState) {
  const c = s.ctl;
  if (c.phase !== 'turn') return;
  const pid = c.turn ?? '';
  const player = s.players[pid];
  // Oyuncu odadan ayrıldıysa ya da canı kalmadıysa sıra beklemez.
  if (!player || player.left || !inGame(c, pid)) {
    await t.transactCtl((x) => {
      if (x.phase !== 'turn' || x.turn !== pid) return undefined;
      const left = alive(s, x);
      if (left.length <= 1) return { ...x, phase: 'final', seq: x.seq + 1 };
      return { ...x, turn: nextTurn(s, x, pid), endAt: t.now() + turnMs(s), seq: x.seq + 1 };
    });
    return;
  }
  if (t.now() >= c.endAt + MISS_GRACE_MS) await missTurn(t, s, pid, 'time');
}

/** Sıralama: önce ayakta kalanlar (puana göre), sonra elenenler (sondan başa). */
export function chainRank(s: RoomState): { pid: string; pts: number; lives: number; rank: number }[] {
  const c = s.ctl;
  const pts = (p: string) => c.pts?.[p] ?? 0;
  const lives = (p: string) => c.lives?.[p] ?? 0;
  const out = outList(c);
  const standing = seated(s)
    .filter((p) => lives(p) > 0)
    .sort((a, b) => pts(b) - pts(a) || s.players[a].joined - s.players[b].joined);
  const beaten = [...out].reverse().filter((p) => s.players[p]);
  const list = [...standing, ...beaten].map((pid) => ({ pid, pts: pts(pid), lives: lives(pid), rank: 0 }));
  list.forEach((x, i) => (x.rank = i + 1));
  return list;
}
