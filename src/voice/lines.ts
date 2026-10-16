/**
 * Sunucunun sabit cümleleri. Her biri için `npx tsx scripts/generate-voice.mts` doğal sesli bir MP3 üretir
 * (public/voice/<anahtar>.mp3, Çizio ile aynı Gemini sesi). Listede olmayan cümleler cihazın metin okuma sesiyle okunur.
 */
import { ALPHABET } from '../engine/tr';

/** Harflerin Türkçe okunuşu ("Harfimiz ke!"). */
export const LETTER_NAMES: Record<string, string> = {
  A: 'a', B: 'be', C: 'ce', Ç: 'çe', D: 'de', E: 'e', F: 'fe', G: 'ge', H: 'he', I: 'ı', İ: 'i', J: 'je', K: 'ke', L: 'le', M: 'me',
  N: 'ne', O: 'o', Ö: 'ö', P: 'pe', R: 're', S: 'se', Ş: 'şe', T: 'te', U: 'u', Ü: 'ü', V: 've', Y: 'ye', Z: 'ze',
};

export const VOICE = {
  welcome: 'Merhaba! İsim Şehir’e hoş geldin!',
  gameStart: 'Oyun başlıyor! İlk harfi seçelim.',
  myTurn: 'Sıra sende! Harfi durdur!',
  lastRound: 'Son tur! Haydi bakalım!',
  letter: (l: string) => `Harfimiz ${LETTER_NAMES[l] ?? l}!`,
  go: 'Başla!',
  tenLeft: 'Son on saniye!',
  stop: 'Stop! Son on saniye!',
  timeUp: 'Süre doldu! Kalemler bırakılsın.',
  review: 'Haydi cevaplara bakalım!',
  scores: 'İşte puan tablosu!',
  win: 'Tebrikler, kazandın! Harika oyundu!',
  end: 'Oyun bitti! İşte kazananlar!',
  join: 'Yeni bir oyuncu katıldı!',
} as const;

/** Üretilecek bütün cümleler. */
export const VOICE_LINES: string[] = [
  ...(Object.values(VOICE) as unknown[]).filter((v): v is string => typeof v === 'string'),
  ...ALPHABET.map((l) => VOICE.letter(l)),
];
