/** Cihazdaki oyuncu: ad, avatar, renk, ayarlar ve istatistikler (localStorage'da saklanır). */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_CATS, catById, type Category } from '../engine/categories';
import type { Settings } from '../engine/types';

export const AVATARS = ['🦊', '🐼', '🐸', '🐯', '🐙', '🦄', '🐵', '🐨', '🐰', '🐧', '🦁', '🐶', '🐱', '🐻', '🐷', '🐳', '🦖', '🐝', '🦋', '🐞', '🦜', '🐬', '🦔', '🐮'];

/** Oyuncu renkleri: listelerde ve avatar halkalarında. */
export const COLORS = ['#ff6b4a', '#14a89a', '#ffb703', '#e9487d', '#7c5cff', '#3ea6f0', '#2bb673', '#f2711c', '#d6336c', '#5b6cff'];

export const DEFAULT_SETTINGS: Settings = {
  cats: DEFAULT_CATS.map((id) => catById(id)!) as Category[],
  rounds: 5,
  time: 90,
  stop: true,
  grace: 10,
  hard: false,
  manualStop: true,
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
  voice: boolean;
  haptics: boolean;
  /** Son oyun ayarları (bir sonraki odada aynısıyla başlar). */
  settings: Settings;
  bots: { count: number; level: 1 | 2 | 3 };
  stats: Stats;
  /** Uygulama kapanınca geri dönülebilsin: son çevrimiçi oda. */
  lastRoom: { code: string; at: number } | null;
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
      voice: true,
      haptics: true,
      settings: DEFAULT_SETTINGS,
      bots: { count: 3, level: 2 },
      stats: { games: 0, wins: 0, best: 0, points: 0 },
      lastRoom: null,
      set: (p) => set(p),
      addGame: (points, won) =>
        set((s) => ({
          stats: { games: s.stats.games + 1, wins: s.stats.wins + (won ? 1 : 0), best: Math.max(s.stats.best, points), points: s.stats.points + points },
        })),
    }),
    { name: 'isimsehir-v1', version: 1 },
  ),
);
