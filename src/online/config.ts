/**
 * Firebase projesi ayarları (Firebase konsolu → Proje ayarları → Uygulamalarınız → Web uygulaması).
 * Bu değerler gizli değildir (uygulamanın içinde zaten görünür); güvenliği database.rules.json sağlar.
 * null iken çevrimiçi oyun kapalıdır (botlu oyun çalışır). Geliştirmede VITE_FIREBASE_EMULATOR=1 ile yerel emulator kullanılır.
 */
import type { FirebaseOptions } from 'firebase/app';

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDiHSSxdXuLz9okp-tD4OXPUPCYppmhUlo',
  authDomain: 'isimo-1ce98.firebaseapp.com',
  databaseURL: 'https://isimo-1ce98-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'isimo-1ce98',
  storageBucket: 'isimo-1ce98.firebasestorage.app',
  messagingSenderId: '405199982366',
  appId: '1:405199982366:web:d2e3ff1254a8e5c268830f',
} as FirebaseOptions | null;

export const USE_EMULATOR = import.meta.env.VITE_FIREBASE_EMULATOR === '1';

/** Çevrimiçi oyun kullanılabilir mi? */
export const ONLINE_AVAILABLE = USE_EMULATOR || !!FIREBASE_CONFIG?.databaseURL;

/** Veritabanında bu oyunun kök düğümü (başka uygulamalarla aynı veritabanını paylaşabilsin). */
export const ROOT = 'isimsehir';
