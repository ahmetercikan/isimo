/**
 * Oyunun akışı (lobi → harf → yazma → değerlendirme → puanlar → … → final).
 * Her cihazda çalışır ama geçişleri yalnızca "yöneten" oyuncu yapar: ev sahibi, o yoksa en eski bağlı oyuncu.
 * Her geçiş ctl.seq ile korunur: aynı geçiş iki kez yapılmaz.
 */
import { scoreRound } from '../engine/scoring';
import { chainStep } from './chainDirector';
import { availableLetters } from '../engine/tr';
import { newCtl, rKey, type Ctl, type RoomState } from '../engine/types';
import type { Transport } from '../online/transport';

/** Harf sayacı hızı (ms/harf). */
export const TICK_MS = 110;
/** Harf durduktan sonra: harfin gösterilmesi ve 3-2-1. */
export const REVEAL_MS = 4200;
/** Süre bitince son cevapların gelmesi için bekleme. */
export const FLUSH_MS = 1600;
/** Durdurucu bu sürede basmazsa sayaç kendi durur. */
export const AUTO_STOP_MS = 9000;
/** Puan tablosundan sonraki tura otomatik geçiş. */
export const SCORES_MS = 25000;

export const reviewMs = (players: number) => Math.min(26000, 9000 + players * 1500);

/** Şu an yöneten oyuncu. */
export function actingHost(s: RoomState): string {
  const h = s.players[s.host];
  if (h && h.on && !h.left) return s.host;
  const alive = Object.entries(s.players)
    .filter(([, p]) => p.on && !p.left && !p.bot)
    .sort((a, b) => a[1].joined - b[1].joined);
  return alive[0]?.[0] ?? s.host;
}

/** Bağlı, ayrılmamış, insan oyuncular. */
export const activeHumans = (s: RoomState) => Object.keys(s.players).filter((p) => s.players[p].on && !s.players[p].left && !s.players[p].bot);

/** Turun durdurucusu: sırayla (botlar dahil, ayrılanlar hariç). */
export function pickStopper(s: RoomState, round: number): string {
  const list = Object.keys(s.players)
    .filter((p) => !s.players[p].left && (s.players[p].on || s.players[p].bot))
    .sort((a, b) => s.players[a].joined - s.players[b].joined);
  return list.length ? list[(round - 1) % list.length] : s.host;
}

/** Sayaçta şu an görünen harf (herkesin ekranında aynı: sunucu saatinden hesaplanır). */
export function letterAt(ctl: Ctl, hard: boolean, now: number): string {
  const avail = availableLetters(ctl.used, hard);
  const i = Math.max(0, Math.floor((now - ctl.spinAt) / TICK_MS));
  return avail[i % avail.length];
}

// ------------------------------------------------------------------------------------------------
// Oyuncuların tetiklediği geçişler
// ------------------------------------------------------------------------------------------------

export async function startGame(t: Transport, s: RoomState) {
  await Promise.all([t.update({ answers: null, votes: null, ready: null, results: null, reactions: null }), t.clearInk()]);
  await t.transactCtl((c) =>
    c.phase === 'lobby' || c.phase === 'final' ? { ...newCtl(), phase: 'spin', round: 1, stopper: pickStopper(s, 1), spinAt: t.now(), seq: c.seq + 1 } : undefined,
  );
}

/** Harfi durdur: o anda sayaçta görünen harf seçilir. */
export async function stopLetter(t: Transport, s: RoomState, letter?: string) {
  const now = t.now();
  return t.transactCtl((c) => {
    if (c.phase !== 'spin' || c.letter || c.round !== s.ctl.round) return undefined;
    const l = letter ?? letterAt(c, s.settings.hard, now);
    const startAt = now + REVEAL_MS;
    return { ...c, phase: 'write', letter: l, used: c.used + l, startAt, endAt: startAt + s.settings.time * 1000, stopBy: '', seq: c.seq + 1 };
  });
}

/** STOP: bütün kategorileri dolduran oyuncu basar; diğerlerine `grace` saniye kalır. */
export async function pressStop(t: Transport, s: RoomState) {
  const now = t.now();
  return t.transactCtl((c) => {
    if (c.phase !== 'write' || c.stopBy || now >= c.endAt || now < c.startAt) return undefined;
    return { ...c, stopBy: t.me, endAt: Math.min(c.endAt, now + s.settings.grace * 1000), seq: c.seq + 1 };
  });
}

/** Değerlendirmede bu kategoriyi bitirdim. */
export function markReady(t: Transport, s: RoomState) {
  return t.update({ [`ready/${rKey(s.ctl.round)}/${t.me}`]: s.ctl.cat });
}

export async function nextRound(t: Transport, s: RoomState) {
  const now = t.now();
  await t.transactCtl((c) => {
    if (c.phase !== 'scores' || c.seq !== s.ctl.seq) return undefined;
    if (c.round >= s.settings.rounds) return { ...c, phase: 'final', seq: c.seq + 1 };
    const round = c.round + 1;
    return { ...c, phase: 'spin', round, letter: '', stopper: pickStopper(s, round), spinAt: now, stopBy: '', cat: 0, catEndAt: 0, nextAt: 0, seq: c.seq + 1 };
  });
}

export async function backToLobby(t: Transport) {
  await t.transactCtl((c) => (c.phase === 'final' || c.phase === 'scores' ? { ...newCtl(), seq: c.seq + 1 } : undefined));
}

// ------------------------------------------------------------------------------------------------
// Yöneticinin zamanlı geçişleri (her ~300 ms ve her durum değişikliğinde çağrılır)
// ------------------------------------------------------------------------------------------------

let busy = false;

export async function direct(t: Transport, s: RoomState) {
  if (busy || actingHost(s) !== t.me) return;
  busy = true;
  try {
    await step(t, s);
  } finally {
    busy = false;
  }
}

async function step(t: Transport, s: RoomState) {
  const c = s.ctl;
  const now = t.now();
  // Ev sahibi ayrıldıysa yöneten oyuncu ev sahibi olur.
  if (s.host !== t.me && !(s.players[s.host]?.on && !s.players[s.host]?.left)) await t.update({ host: t.me });

  // Eski tepkileri temizle
  const old = Object.entries(s.reactions ?? {}).filter(([, r]) => now - r.t > 12000);
  if (old.length) await t.update(Object.fromEntries(old.map(([k]) => [`reactions/${k}`, null])));

  // Sıra Sende'nin akışı ayrı (src/game/chainDirector.ts).
  if (s.settings.game === 'siram') return chainStep(t, s);

  switch (c.phase) {
    case 'spin': {
      const stopper = s.players[c.stopper];
      const stopperGone = !stopper || stopper.left || (!stopper.on && !stopper.bot);
      if (!c.letter && (!s.settings.manualStop || stopperGone ? now - c.spinAt > autoStopDelay(c) : now - c.spinAt > AUTO_STOP_MS)) await stopLetter(t, s);
      break;
    }
    case 'write':
      if (now >= c.endAt + FLUSH_MS)
        await t.transactCtl((x) => (x.phase === 'write' && x.seq === c.seq ? { ...x, phase: 'review', cat: 0, catEndAt: now + reviewMs(Object.keys(s.players).length), seq: x.seq + 1 } : undefined));
      break;
    case 'review': {
      const ready = s.ready?.[rKey(c.round)] ?? {};
      const humans = activeHumans(s);
      const allReady = humans.length > 0 && humans.every((p) => (ready[p] ?? -1) >= c.cat);
      if (now < c.catEndAt && !allReady) break;
      if (c.cat < s.settings.cats.length - 1) {
        await t.transactCtl((x) => (x.phase === 'review' && x.seq === c.seq ? { ...x, cat: x.cat + 1, catEndAt: now + reviewMs(Object.keys(s.players).length), seq: x.seq + 1 } : undefined));
      } else {
        const result = scoreRound(s, c.round);
        const ok = await t.transactCtl((x) => (x.phase === 'review' && x.seq === c.seq ? { ...x, phase: 'scores', nextAt: now + SCORES_MS, seq: x.seq + 1 } : undefined));
        if (ok) await t.update({ [`results/${rKey(c.round)}`]: result });
      }
      break;
    }
    case 'scores':
      if (c.nextAt && now >= c.nextAt) await nextRound(t, s);
      break;
  }
}

/** Otomatik durdurmada 2,5–4,5 sn arası (tura göre değişen ama herkeste aynı süre). */
function autoStopDelay(c: Ctl) {
  return 2500 + ((c.spinAt * 7 + c.round * 13) % 2000);
}
