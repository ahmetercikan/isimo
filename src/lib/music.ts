/**
 * Fon müziği: oyunun aşamasına göre değişen, cihazda üretilen kısa döngüler (dosya yok).
 *   lobby   — sakin, caz akorlu bekleme müziği
 *   roll    — harf seçilirken artan trampet rulosu
 *   write   — yazarken tempolu, enerjik ritim
 *   tension — son 10 saniye: hızlı, gerilimli
 *   chill   — değerlendirme ve puanlar: yumuşak
 * Zamanlama: ileriye bakan planlayıcı ("A Tale of Two Clocks"); ölçü başında mod değişir.
 * Çalgılar ve kanal: src/lib/sfx.ts.
 */
import { audio, epiano, hat, kick, mtof, musicLevel, pluck, snare, tone, type Out } from './sfx';

export type Mood = 'off' | 'lobby' | 'roll' | 'write' | 'tension' | 'chill';

const M: Out = { dest: 'music' };

interface Style {
  bpm: number;
  level: number;
  /** Ölçü başına akorlar (MIDI kök + akor tonları). */
  chords: number[][];
  step: (s: number, chord: number[], t: number, bar: number) => void;
}

// Akorlar: [bas kökü, akor tonları...]
const JAZZ = [[48, 64, 67, 71, 74], [45, 64, 67, 72, 76], [50, 65, 69, 72, 76], [43, 65, 67, 71, 74]]; // Cmaj9 Am7 Dm9 G13
const POP = [[45, 69, 72, 76], [41, 69, 72, 77], [48, 67, 72, 76], [43, 67, 71, 74]]; // Am F C G
const DARK = [[45, 69, 72, 76], [45, 69, 72, 76], [41, 69, 72, 77], [40, 68, 71, 76]]; // Am Am F E

const bass = (m: number, t: number, d: number, g: number) => {
  tone({ type: 'triangle', f: mtof(m), t, a: 0.006, d, g, lp: 700, ...M });
  tone({ f: mtof(m - 12), t, a: 0.006, d, g: g * 0.6, ...M });
};

const STYLES: Record<Exclude<Mood, 'off'>, Style> = {
  lobby: {
    bpm: 90,
    level: 0.55,
    chords: JAZZ,
    step(s, c, t) {
      if (s === 0 || s === 10) kick(t, 0.32, M);
      if (s === 4 || s === 12) snare(t, 0.07, M);
      if (s % 2 === 0) hat(t, s % 4 === 2 ? 0.05 : 0.025, false, M);
      if (s === 0) bass(c[0], t, 0.9, 0.16);
      if (s === 7) bass(c[0] + 7, t, 0.3, 0.12);
      if (s === 10) bass(c[0] + 12, t, 0.4, 0.12);
      if (s === 2 || s === 9) c.slice(1).forEach((m, i) => epiano(mtof(m), t + i * 0.008, s === 2 ? 1.2 : 0.5, 0.035, M));
    },
  },
  chill: {
    bpm: 80,
    level: 0.45,
    chords: JAZZ,
    step(s, c, t) {
      if (s === 0) kick(t, 0.2, M);
      if (s % 4 === 2) hat(t, 0.025, false, M);
      if (s === 12) snare(t, 0.035, M);
      if (s === 0) bass(c[0], t, 1.6, 0.14);
      if (s === 0 || s === 11) c.slice(1).forEach((m, i) => epiano(mtof(m), t + i * 0.012, s === 0 ? 1.8 : 0.8, 0.03, M));
    },
  },
  write: {
    bpm: 112,
    level: 0.38,
    chords: POP,
    step(s, c, t) {
      if (s === 0 || s === 6 || s === 8 || s === 11) kick(t, 0.45, M);
      if (s === 4 || s === 12) snare(t, 0.12, M);
      if (s % 2 === 0) hat(t, s === 14 ? 0.06 : 0.04, s === 14, M);
      if ([0, 3, 6, 8, 11, 14].includes(s)) bass(c[0] + (s === 14 ? 7 : 0), t, 0.18, 0.14);
      // 16'lık arpej (akor tonları sırayla)
      if (s % 2 === 1) pluck(mtof(c[1 + (s >> 1) % (c.length - 1)] + 12), t, 0.18, 0.022, { ...M, pan: s % 4 === 1 ? -0.3 : 0.3, bright: 6 });
    },
  },
  tension: {
    bpm: 138,
    level: 0.48,
    chords: DARK,
    step(s, c, t, bar) {
      if (s % 4 === 0) kick(t, 0.5, M);
      if (s === 4 || s === 12) snare(t, 0.14, M);
      if (bar % 2 === 1 && s >= 13) snare(t, 0.06 + (s - 13) * 0.03, M);
      hat(t, s % 2 ? 0.025 : 0.045, false, M);
      if (s % 2 === 0) bass(c[0], t, 0.12, 0.15);
      if (s % 4 === 2) pluck(mtof(c[1 + (s >> 2) % (c.length - 1)] + 12), t, 0.12, 0.03, { ...M, bright: 12 });
    },
  },
  roll: {
    bpm: 120,
    level: 0.6,
    chords: POP,
    step(s, _c, t, bar) {
      // 32'lik trampet rulosu, her ölçüde biraz daha güçlü
      const k = Math.min(1, (bar * 16 + s) / 48);
      const half = 60 / 120 / 8;
      snare(t, 0.03 + k * 0.08, M);
      snare(t + half, 0.025 + k * 0.07, M);
      if (s === 0) tone({ f: 55, t, d: 0.5, g: 0.1 + k * 0.1, ...M });
    },
  },
};

let enabled = true;
let mood: Mood = 'off';
let style: Style | null = null;
let pending: Style | null = null;
let timer = 0;
let nextTime = 0;
let stepIdx = 0;
let bar = 0;

export function setMusicEnabled(v: boolean) {
  enabled = v;
  if (!v) stop();
  else if (mood !== 'off') {
    const m = mood;
    mood = 'off';
    setMood(m);
  }
}

function stop() {
  clearInterval(timer);
  timer = 0;
  style = null;
  pending = null;
  musicLevel(0, 0.4);
}

/** Müziği değiştir (aynıysa bir şey yapmaz). */
export function setMood(m: Mood) {
  if (m === mood) return;
  mood = m;
  if (!enabled) return;
  if (m === 'off') {
    stop();
    return;
  }
  const a = audio();
  if (!a) return;
  const next = STYLES[m];
  if (!style || !timer) {
    style = next;
    nextTime = a.currentTime + 0.08;
    stepIdx = 0;
    bar = 0;
    clearInterval(timer);
    timer = window.setInterval(schedule, 25);
  } else pending = next; // ölçü başında geçilir
  musicLevel(next.level, m === 'roll' ? 0.2 : 1.2);
  if (m === 'roll') {
    // Rulo hemen başlasın
    style = next;
    pending = null;
    stepIdx = 0;
    bar = 0;
  }
}

function schedule() {
  const a = audio();
  if (!a || !style) return;
  if (a.state !== 'running') {
    nextTime = a.currentTime + 0.05;
    return;
  }
  while (nextTime < a.currentTime + 0.12) {
    if (stepIdx === 0 && pending) {
      style = pending;
      pending = null;
      bar = 0;
    }
    const chord = style.chords[bar % style.chords.length];
    style.step(stepIdx, chord, nextTime - a.currentTime, bar);
    nextTime += 60 / style.bpm / 4;
    stepIdx = (stepIdx + 1) % 16;
    if (stepIdx === 0) bar++;
  }
}
