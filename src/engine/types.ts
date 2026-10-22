/**
 * Oda durumu: hem çevrimiçi (Firebase Realtime Database) hem botlu oyunda (bellekte) aynı ağaç.
 * Tur anahtarları "r1", "r2"… (sayısal anahtarlar Realtime Database'de diziye dönüşür).
 */
import type { Category } from './categories';

export type Phase = 'lobby' | 'spin' | 'write' | 'review' | 'scores' | 'final' | 'turn' | 'clue';

/** Hangi oyun: 'isim' İsim Şehir (STOP), 'siram' Sıra Sende (harf değiştir), 'film' Film Avı. Yoksa İsim Şehir. */
export type GameKind = 'isim' | 'siram' | 'film';

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
  /** Oyun türü (yoksa İsim Şehir). */
  game?: GameKind;
  // ---- Yalnızca Sıra Sende ----
  /** Kelime uzunluğu (3, 4 ya da 5 harf). */
  len?: number;
  /** Her oyuncunun canı. */
  lives?: number;
  /** Harf eklemek/çıkarmak da serbest mi (kapalıysa yalnızca değiştirme). */
  free?: boolean;
  // ---- Yalnızca Film Avı (rounds: film sayısı, time: ipuçları arası saniye) ----
  /** Hangi filmler sorulsun. */
  pool?: 'hepsi' | 'yerli' | 'yabanci';
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
  // ---- Yalnızca Sıra Sende (hepsi ctl içinde: tek işlemde atomik değişir) ----
  /** Masadaki kelime (küçük harf). */
  word?: string;
  /** Sırası gelen oyuncu. */
  turn?: string;
  /** Oynanmış kelimeler, virgülle ("kedi,kadı,kadın"). */
  chain?: string;
  /** Kalan canlar ve puanlar (oyuncu kimliğine göre). */
  lives?: Record<string, number>;
  pts?: Record<string, number>;
  /** Elenme sırası, virgülle (sonda elenen en sonda). */
  out?: string;
  /** Son olay (ekranda duyurulur); f: bu olayla masaya gelen yeni kelime (yol kalmadı). */
  last?: { p: string; k: 'ok' | 'time' | 'pass' | 'out'; w?: string; f?: string };
  // ---- Yalnızca Film Avı (pts yukarıdaki ile ortak: toplam puan) ----
  /** Bu turun filmi (kimlik). İpuçları startAt'ten itibaren settings.time saniyede bir açılır, endAt'te tur kapanır. */
  film?: string;
  /** Bu oyunda sorulan filmler, virgülle. */
  films?: string;
  /** Bu turda bilenler ve aldıkları puan. */
  got?: Record<string, number>;
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
