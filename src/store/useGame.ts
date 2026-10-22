/**
 * Açık oyun oturumu: bağlantı (botlu ya da çevrimiçi), anlık oda durumu ve yönetici döngüsü.
 * Ekranlar durumu buradan okur; geçişler src/game/director.ts'teki fonksiyonlarla yapılır.
 */
import { create } from 'zustand';
import { loadWords } from '../engine/chain';
import { loadFilms } from '../engine/film';
import { loadDicts } from '../engine/dict';
import { newCtl, type RoomState, type Settings } from '../engine/types';
import { botId, BOT_PROFILES, hasBots, runBots } from '../game/bots';
import { actingHost, direct } from '../game/director';
import { LocalTransport } from '../online/local';
import type { Transport } from '../online/transport';
import { useProfile } from './useProfile';

interface GameState {
  t: Transport | null;
  s: RoomState | null;
  /** Oda silindi ya da bağlantı koptu. */
  lost: boolean;
  startBots: (settings: Settings, count: number, level: 1 | 2 | 3) => void;
  attach: (t: Transport) => void;
  leave: () => Promise<void>;
}

let stop: (() => void)[] = [];

export const useGame = create<GameState>()((set, get) => ({
  t: null,
  s: null,
  lost: false,

  startBots(settings, count, level) {
    if (settings.game === 'siram') void loadWords();
    if (settings.game === 'film') void loadFilms();
    const p = useProfile.getState();
    const now = Date.now();
    const players: RoomState['players'] = { me: { name: p.name || 'Ben', avatar: p.avatar, color: p.color, joined: now, on: true } };
    for (let i = 0; i < count; i++) players[botId(i)] = { ...BOT_PROFILES[i % BOT_PROFILES.length], joined: now + i + 1, on: true, bot: level };
    const t = new LocalTransport({ code: 'BOT', host: 'me', created: now, settings, players, ctl: newCtl() }, 'me');
    // Botları attach başlatır (çevrimiçi odada da aynı yol): burada ikinci kez başlatılmaz.
    get().attach(t);
  },

  attach(t) {
    stop.forEach((f) => f());
    stop = [];
    set({ t, s: null, lost: false });
    // Arkadaşlar "Katıl" diyebilsin diye bulunduğumuz oda kartta duyurulur (yalnız çevrimiçi oda).
    if (t.kind === 'online') void import('../online/friends').then((f) => f.setRoom(t.code)).catch(() => {});
    let seen = false;
    // Botlar: odada bot varsa ve bu cihaz yönetiyorsa oynatılır. Çevrimiçi odada ev sahibi
    // ayrılıp yöneten değişince botlar kendiliğinden öteki cihaza geçer (iki cihaz aynı botu oynatmaz).
    let bots: (() => void) | null = null;
    const off = t.subscribe((s) => {
      if (s) seen = true;
      set({ s, lost: seen && !s });
      if (!s) return;
      void direct(t, s);
      const mine = hasBots(s) && actingHost(s) === t.me;
      if (mine && !bots) bots = runBots(t);
      else if (!mine && bots) {
        bots();
        bots = null;
      }
    });
    // Zamanlı geçişler için (durum değişmese de süre dolar)
    const iv = window.setInterval(() => {
      const s = get().s;
      if (s) void direct(t, s);
    }, 300);
    stop.push(off, () => clearInterval(iv), () => bots?.());
  },

  async leave() {
    const t = get().t;
    stop.forEach((f) => f());
    stop = [];
    set({ t: null, s: null, lost: false });
    if (t?.kind === 'online') {
      useProfile.getState().set({ lastRoom: null });
      void import('../online/friends').then((f) => f.setRoom(null)).catch(() => {});
    }
    await t?.leave();
  },
}));

/** Kategorilerin sözlüklerini önceden yükle (yazma başlamadan). */
export const preloadDicts = (s: RoomState) => void loadDicts(s.settings.cats.map((c) => c.id));
