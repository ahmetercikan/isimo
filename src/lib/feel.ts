/**
 * Dokunsal geri bildirim (titreşim) ve sesli anons (harf, STOP).
 * Android'de cihazın metin okuma motoru ve titreşimi; web'de Web Speech ve navigator.vibrate.
 */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

const native = Capacitor.isNativePlatform();
let hapticsOn = true;
let voiceOn = true;

export function setFeel(o: { haptics?: boolean; voice?: boolean }) {
  if (o.haptics !== undefined) hapticsOn = o.haptics;
  if (o.voice !== undefined) voiceOn = o.voice;
}

export const buzz = {
  light: () => hapticsOn && (native ? void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}) : navigator.vibrate?.(8)),
  heavy: () => hapticsOn && (native ? void Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}) : navigator.vibrate?.(30)),
  success: () => hapticsOn && (native ? void Haptics.notification({ type: NotificationType.Success }).catch(() => {}) : navigator.vibrate?.([20, 60, 20])),
  warn: () => hapticsOn && (native ? void Haptics.notification({ type: NotificationType.Warning }).catch(() => {}) : navigator.vibrate?.([40, 80, 40])),
};

/** Harflerin Türkçe okunuşu (metin okuma motoru tek harfi bazen İngilizce okur). */
const SAY: Record<string, string> = {
  A: 'a', B: 'be', C: 'ce', Ç: 'çe', D: 'de', E: 'e', F: 'fe', G: 'ge', H: 'he', I: 'ı', İ: 'i', J: 'je', K: 'ke', L: 'le', M: 'me',
  N: 'ne', O: 'o', Ö: 'ö', P: 'pe', R: 're', S: 'se', Ş: 'şe', T: 'te', U: 'u', Ü: 'ü', V: 've', Y: 'ye', Z: 'ze',
};
export const sayLetter = (l: string) => SAY[l] ?? l;

let trVoice: SpeechSynthesisVoice | undefined;
function pickVoice() {
  if (trVoice || native || !('speechSynthesis' in window)) return trVoice;
  const vs = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('tr'));
  trVoice = vs.find((v) => /natural|google/i.test(v.name)) ?? vs[0];
  return trVoice;
}

export function speak(text: string) {
  if (!voiceOn) return;
  if (native) {
    void TextToSpeech.speak({ text, lang: 'tr-TR', rate: 1.0, pitch: 1.05, volume: 1, category: 'ambient' }).catch(() => {});
    return;
  }
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'tr-TR';
  const v = pickVoice();
  if (v) u.voice = v;
  u.rate = 1.0;
  speechSynthesis.speak(u);
}
