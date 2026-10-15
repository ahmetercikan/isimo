/**
 * Firebase projesi ayarları (Firebase konsolu → Proje ayarları → Uygulamalarınız → Web uygulaması).
 * Bu değerler gizli değildir (uygulamanın içinde zaten görünür); güvenliği database.rules.json sağlar.
 * null iken çevrimiçi oyun kapalıdır (botlu oyun çalışır). Geliştirmede VITE_FIREBASE_EMULATOR=1 ile yerel emulator kullanılır.
 */
import type { FirebaseOptions } from 'firebase/app';

export const FIREBASE_CONFIG = null as FirebaseOptions | null;

export const USE_EMULATOR = import.meta.env.VITE_FIREBASE_EMULATOR === '1';

/** Çevrimiçi oyun kullanılabilir mi? */
export const ONLINE_AVAILABLE = USE_EMULATOR || !!FIREBASE_CONFIG?.databaseURL;

/** Veritabanında bu oyunun kök düğümü (başka uygulamalarla aynı veritabanını paylaşabilsin). */
export const ROOT = 'isimsehir';
