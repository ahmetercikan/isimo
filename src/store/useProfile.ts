/** Cihazdaki oyuncu: ad, avatar, renk, ayarlar ve istatistikler (localStorage'da saklanır). */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AVATAR_IDS } from '../art/icons';
import { DEFAULT_CATS, catById, type Category } from '../engine/categories';
import type { Settings } from '../engine/types';

export const AVATARS = AVATAR_IDS;

/** Oyuncu renkleri: listelerde ve avatar halkalarında. */
export const COLORS = ['#ff6b4a', '#14a89a', '#ffb703', '#e9487d', '#7c5cff', '#3ea6f0', '#2bb673', '#f2711c', '#d6336c', '#5b6cff'];

export const DEFAULT_SETTINGS: Settings = {
  cats: DEFAULT_CATS.map((id) => catById(id)!) as Category[],
  rounds: 5,
  time: 90,
  stop: true,
  grace: 10,
  hard: false,
  // Harfi oyuncular durdursun: varsayılan kapalı, isteyen açar (kullanıcı isteği, 25 Eki 2026).
  manualStop: false,
};

/** Sıra Sende varsayılanları. Firebase kuralları settings'te cats/rounds/time ister: cats tek göstermelik. */
export const DEFAULT_CHAIN: Settings = {
  cats: [{ id: 'kelime', label: 'Kelime', emoji: '' }],
  rounds: 1,
  time: 30,
  stop: false,
  grace: 0,
  hard: false,
  manualStop: false,
  game: 'siram',
  len: 4,
  lives: 3,
  free: false,
};

/** Sinema Bilmecesi varsayılanları (rounds: film sayısı, time: ipuçları arası saniye; cats yine göstermelik). */
export const DEFAULT_FILM: Settings = {
  cats: [{ id: 'film', label: 'Film', emoji: '' }],
  rounds: 5,
  time: 10,
  stop: false,
  grace: 0,
  hard: false,
  manualStop: false,
  game: 'film',
  pool: 'hepsi',
};

export interface Stats {
  games: number;
  wins: number;
  best: number;
  points: number;
}

interface ProfileState {
  name: string;
  avatar: string;
  color: string;
  sfx: boolean;
  music: boolean;
  voice: boolean;
  haptics: boolean;
  /** Son oyun ayarları (bir sonraki odada aynısıyla başlar). */
  settings: Settings;
  /** Sıra Sende'nin son ayarları. */
  chain?: Settings;
  /** Sinema Bilmecesi'nin son ayarları. */
  film?: Settings;
  bots: { count: number; level: 1 | 2 | 3 };
  stats: Stats;
  /** Uygulama kapanınca geri dönülebilsin: son çevrimiçi oda. */
  lastRoom: { code: string; at: number } | null;
  /** Oyun daveti ve arkadaş isteği bildirimleri (varsayılan açık). */
  notifyInvite: boolean;
  /** "Arkadaşın çevrimiçi oldu" bildirimi (varsayılan kapalı: sık gelir, rahatsız eder). */
  notifyOnline: boolean;
  /** Bildirim izni bir kez soruldu mu (aynı ekranda tekrar tekrar sormamak için). */
  notifyAsked?: boolean;
  set: (p: Partial<Omit<ProfileState, 'set' | 'addGame'>>) => void;
  addGame: (points: number, won: boolean) => void;
}

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      name: '',
      avatar: AVATARS[0],
      color: COLORS[0],
      sfx: true,
      music: true,
      voice: true,
      haptics: true,
      settings: DEFAULT_SETTINGS,
      chain: DEFAULT_CHAIN,
      bots: { count: 3, level: 2 },
      stats: { games: 0, wins: 0, best: 0, points: 0 },
      lastRoom: null,
      notifyInvite: true,
      notifyOnline: false,
      set: (p) => set(p),
      addGame: (points, won) =>
        set((s) => ({
          stats: { games: s.stats.games + 1, wins: s.stats.wins + (won ? 1 : 0), best: Math.max(s.stats.best, points), points: s.stats.points + points },
        })),
    }),
    {
      name: 'isimsehir-v1',
      version: 2,
      // 2: "Harfi oyuncular durdursun" artık varsayılan kapalı; eski varsayılanla kaydedilmiş ayarlar bir kez kapatılır.
      migrate: (state, from) => {
        const st = state as Partial<ProfileState>;
        if (from < 2 && st.settings) st.settings = { ...st.settings, manualStop: false };
        return st as ProfileState;
      },
    },
  ),
);
