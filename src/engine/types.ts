/**
 * Oda durumu: hem çevrimiçi (Firebase Realtime Database) hem botlu oyunda (bellekte) aynı ağaç.
 * Tur anahtarları "r1", "r2"… (sayısal anahtarlar Realtime Database'de diziye dönüşür).
 */
import type { Category } from './categories';

export type Phase = 'lobby' | 'spin' | 'write' | 'review' | 'scores' | 'final';

export interface Settings {
  cats: Category[];
  /** Tur sayısı. */
  rounds: number;
  /** Yazma süresi (saniye). */
  time: number;
  /** Herkes bitirince STOP diyebilir: diğerlerine `grace` saniye kalır. */
  stop: boolean;
  grace: number;
  /** Zor harfler (I, J, Ö, Ü, V, Ç, Ş, Z) de çıkabilir. */
  hard: boolean;
  /** Harf sayacını oyuncu durdurur (kapalıysa sayaç kendi durur). */
  manualStop: boolean;
}

export interface Player {
  name: string;
  avatar: string;
  color: string;
  joined: number;
  /** Şu an bağlı mı. */
  on: boolean;
  /** Oyundan ayrıldı (puanı tabloda kalır). */
  left?: boolean;
  /** Bot zorluğu (yalnızca botlu oyunda). */
  bot?: 1 | 2 | 3;
}

export interface Ctl {
  phase: Phase;
  /** 1'den başlar; lobide 0. */
  round: number;
  letter: string;
  /** Bu oyunda çıkmış harfler ("AKM"). */
  used: string;
  /** Bu tur harfi durduracak oyuncu. */
  stopper: string;
  spinAt: number;
  startAt: number;
  endAt: number;
  /** STOP diyen oyuncu ('' yok). */
  stopBy: string;
  /** Değerlendirmede gösterilen kategori sırası ve otomatik geçiş zamanı. */
  cat: number;
  catEndAt: number;
  /** Puan tablosundan sonraki tura otomatik geçiş zamanı. */
  nextAt: number;
  /** Her geçişte artar: aynı geçiş iki kez yapılmaz. */
  seq: number;
}

/** answers[rKey][pid][catId] = metin */
export type Answers = Record<string, Record<string, Record<string, string>>>;
/** votes[rKey][catId][hedefPid][oylayanPid] = true (geçersiz oyu) */
export type Votes = Record<string, Record<string, Record<string, Record<string, true>>>>;

export interface RoundResult {
  letter: string;
  stopBy: string;
  /** pts[pid][catId] */
  pts: Record<string, Record<string, number>>;
  sum: Record<string, number>;
}

export interface Reaction {
  p: string;
  e: string;
  t: number;
}

export interface RoomState {
  code: string;
  host: string;
  created: number;
  settings: Settings;
  players: Record<string, Player>;
  ctl: Ctl;
  answers?: Answers;
  votes?: Votes;
  /** ready[rKey][pid] = değerlendirmede bitirdiği son kategori sırası */
  ready?: Record<string, Record<string, number>>;
  results?: Record<string, RoundResult>;
  reactions?: Record<string, Reaction>;
}

export const rKey = (round: number) => `r${round}`;

export const MAX_PLAYERS = 10;

export function newCtl(): Ctl {
  return { phase: 'lobby', round: 0, letter: '', used: '', stopper: '', spinAt: 0, startAt: 0, endAt: 0, stopBy: '', cat: 0, catEndAt: 0, nextAt: 0, seq: 0 };
}
