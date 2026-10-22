/**
 * "Film Avı" oyun akışı (lobi → ipucu turu → film açıklanır → … → final).
 * Sıra Sende gibi bütün durum ctl içinde: film, sorulanlar, bu turda bilenler ve puanlar
 * tek atomik işlemde değişir (Firebase kurallarına dokunmak gerekmedi).
 * Tur kapanınca (herkes bildi ya da süre doldu) film REVEAL_MS boyunca açıklanır (ctl.nextAt),
 * sonra "yöneten" oyuncu sıradaki filme geçer.
 */
import { CLUES, clueAt, filmById, isRight, loadFilms, maxRounds, pickFilm, ptsAt, type FilmPool } from '../engine/film';
import { newCtl, type Ctl, type RoomState } from '../engine/types';
import type { Transport } from '../online/transport';

/** İlk ipucundan önce "1. film geliyor" payı. */
export const LEAD_MS = 3000;
/** Film açıklandıktan sonra sıradaki filme geçiş. */
export const REVEAL_MS = 6500;
/** Süre dolduktan sonra son tahminler için pay (saat farkı da buna girer). */
export const GRACE_MS = 700;

export const stepMs = (s: RoomState) => Math.max(5, s.settings.time) * 1000;
const pool = (s: RoomState): FilmPool => s.settings.pool ?? 'hepsi';
const usedList = (c: Ctl) => (c.films ? c.films.split(',').filter(Boolean) : []);
/** Bu oyunda kaç film sorulacak (listede yeterince film yoksa kısalır). */
export const totalRounds = (s: RoomState) => Math.max(1, Math.min(s.settings.rounds, maxRounds(pool(s)) || s.settings.rounds));

/** Masadaki oyuncular (ayrılmayanlar), katılma sırasına göre. */
export const filmPlayers = (s: RoomState) =>
  Object.keys(s.players)
    .filter((p) => !s.players[p].left)
    .sort((a, b) => s.players[a].joined - s.players[b].joined);

/** Turu bekletenler: bağlı insanlar ve botlar (bağlantısı kopan oyuncu turu kilitlemesin). */
const waitingFor = (s: RoomState) => filmPlayers(s).filter((p) => s.players[p].on || s.players[p].bot);

/** Turun açılışı: yeni film, ipucu zamanları, bu turun bilenleri sıfır. */
function roundCtl(s: RoomState, c: Ctl, round: number, film: string, now: number): Ctl {
  const startAt = now + LEAD_MS;
  const used = round === 1 ? [] : usedList(c);
  return { ...c, phase: 'clue', round, film, films: [...used, film].join(','), got: {}, startAt, endAt: startAt + CLUES * stepMs(s), nextAt: 0, seq: c.seq + 1 };
}

/** Lobiden oyunu başlat. */
export async function startFilm(t: Transport, s: RoomState) {
  if (!(await loadFilms())) return false;
  const pids = filmPlayers(s);
  if (!pids.length) return false;
  const film = pickFilm(pool(s));
  if (!film) return false;
  const pts = Object.fromEntries(pids.map((p) => [p, 0]));
  return t.transactCtl((c) => (c.phase === 'lobby' || c.phase === 'final' ? { ...roundCtl(s, { ...newCtl(), seq: c.seq }, 1, film, t.now()), pts } : undefined));
}

export type Guess = 'ok' | 'wrong' | 'late';

/**
 * Tahmin. Doğruysa o anki ipucunun puanı yazılır; işlemin içinde tur bir daha kontrol edilir
 * (film değişmiş, tur kapanmış ya da aynı oyuncu ikinci kez bilmiş olabilir).
 */
export async function guessFilm(t: Transport, s: RoomState, input: string, as: string = t.me): Promise<Guess> {
  const film = s.ctl.film;
  if (!isRight(filmById(film), input)) return 'wrong';
  const now = t.now();
  const ok = await t.transactCtl((c) => {
    if (c.phase !== 'clue' || c.film !== film || c.nextAt || c.got?.[as]) return undefined;
    if (now < c.startAt || now >= c.endAt + GRACE_MS) return undefined;
    const p = ptsAt(clueAt(c.startAt, stepMs(s), Math.min(now, c.endAt - 1)));
    return { ...c, got: { ...(c.got ?? {}), [as]: p }, pts: { ...(c.pts ?? {}), [as]: (c.pts?.[as] ?? 0) + p }, seq: c.seq + 1 };
  });
  return ok ? 'ok' : 'late';
}

/** Yönetenin zamanlı işi: turu kapatır (film açıklanır), sonra sıradaki filme ya da finale geçer. */
export async function filmStep(t: Transport, s: RoomState) {
  const c = s.ctl;
  if (c.phase !== 'clue') return;
  const now = t.now();
  if (!c.nextAt) {
    const everyone = waitingFor(s);
    const allGot = everyone.length > 0 && everyone.every((p) => c.got?.[p]);
    if (allGot || now >= c.endAt + GRACE_MS)
      await t.transactCtl((x) => (x.phase === 'clue' && x.seq === c.seq && !x.nextAt ? { ...x, nextAt: now + REVEAL_MS, seq: x.seq + 1 } : undefined));
    return;
  }
  if (now < c.nextAt) return;
  if (c.round >= totalRounds(s)) {
    await t.transactCtl((x) => (x.phase === 'clue' && x.seq === c.seq ? { ...x, phase: 'final', seq: x.seq + 1 } : undefined));
    return;
  }
  const film = pickFilm(pool(s), usedList(c));
  await t.transactCtl((x) => (x.phase === 'clue' && x.seq === c.seq ? roundCtl(s, x, x.round + 1, film, now) : undefined));
}

/** Sıralama: puana göre (eşitlikte önce katılan). */
export function filmRank(s: RoomState): { pid: string; pts: number; rank: number }[] {
  const pts = (p: string) => s.ctl.pts?.[p] ?? 0;
  const list = filmPlayers(s)
    .concat(Object.keys(s.players).filter((p) => s.players[p].left && pts(p) > 0))
    .sort((a, b) => pts(b) - pts(a) || s.players[a].joined - s.players[b].joined)
    .map((pid) => ({ pid, pts: pts(pid), rank: 0 }));
  list.forEach((x, i) => (x.rank = i > 0 && x.pts === list[i - 1].pts ? list[i - 1].rank : i + 1));
  return list;
}

/** Bu oyunda sorulan filmler (final ekranı için). */
export const playedFilms = (s: RoomState) => usedList(s.ctl).map((id) => filmById(id)).filter((f) => !!f);
