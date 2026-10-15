/**
 * Açık oyun oturumu: bağlantı (botlu ya da çevrimiçi), anlık oda durumu ve yönetici döngüsü.
 * Ekranlar durumu buradan okur; geçişler src/game/director.ts'teki fonksiyonlarla yapılır.
 */
import { create } from 'zustand';
import { loadDicts } from '../engine/dict';
import { newCtl, type RoomState, type Settings } from '../engine/types';
import { BOT_PROFILES, runBots } from '../game/bots';
import { direct } from '../game/director';
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
    const p = useProfile.getState();
    const now = Date.now();
    const players: RoomState['players'] = { me: { name: p.name || 'Ben', avatar: p.avatar, color: p.color, joined: now, on: true } };
    for (let i = 0; i < count; i++) players[`bot${i}`] = { ...BOT_PROFILES[i % BOT_PROFILES.length], joined: now + i + 1, on: true, bot: level };
    const t = new LocalTransport({ code: 'BOT', host: 'me', created: now, settings, players, ctl: newCtl() }, 'me');
    get().attach(t);
    stop.push(runBots(t));
  },

  attach(t) {
    stop.forEach((f) => f());
    stop = [];
    set({ t, s: null, lost: false });
    let seen = false;
    const off = t.subscribe((s) => {
      if (s) seen = true;
      set({ s, lost: seen && !s });
      if (s) void direct(t, s);
    });
    // Zamanlı geçişler için (durum değişmese de süre dolar)
    const iv = window.setInterval(() => {
      const s = get().s;
      if (s) void direct(t, s);
    }, 300);
    stop.push(off, () => clearInterval(iv));
  },

  async leave() {
    const t = get().t;
    stop.forEach((f) => f());
    stop = [];
    set({ t: null, s: null, lost: false });
    if (t?.kind === 'online') useProfile.getState().set({ lastRoom: null });
    await t?.leave();
  },
}));

/** Kategorilerin sözlüklerini önceden yükle (yazma başlamadan). */
export const preloadDicts = (s: RoomState) => void loadDicts(s.settings.cats.map((c) => c.id));
