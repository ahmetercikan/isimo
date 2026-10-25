/**
 * Fon müziği: oyunun aşamasına göre değişir.
 *   lobby   — lobi: modern caz
 *   roll    — harf seçilirken artan trampet rulosu (cihazda üretilir, dosya yok)
 *   write   — yazarken / sırada: neşeli bilgi yarışması müziği
 *   tension — son saniyeler: düşünme sayacı döngüsü
 *   chill   — değerlendirme ve puanlar: lo-fi
 *   film    — Sinema Bilmecesi: yavaşlatılmış, yumuşatılmış sözsüz yarışma döngüsü
 *
 * Kayıtlı parçalar (25 Eki 2026): public/music/*.m4a, Pixabay (lisans: public/music/LISANS.txt). Hepsi YouTube Content ID'ye
 * **kayıtsız** seçildi: influencer oyunun ekran kaydını paylaşınca telif uyarısı çıkmasın. Eskiden bütün müzik
 * osilatörlerle üretiliyordu ve "yapay" duyuluyordu; o çalgılar artık yalnız rulo ve dosya yüklenemezse yedek olarak kalır.
 *
 * Parçalar belleğe açılmaz (decode parça başına ~35 MB tutardı), <audio> ile akış olarak çalınıp Web Audio müzik kanalına
 * bağlanır; döngü dikişi iki öğe arasında çapraz geçişle saklanır (gerilim parçası zaten dikişsiz döngüdür).
 * Sentez zamanlaması: ileriye bakan planlayıcı ("A Tale of Two Clocks"); ölçü başında mod değişir. Kanal: src/lib/sfx.ts.
 */
import { audio, epiano, hat, kick, mtof, musicLevel, musicOut, pluck, snare, tone, type Out } from './sfx';

export type Mood = 'off' | 'lobby' | 'roll' | 'write' | 'tension' | 'chill' | 'film';

/** Kayıtlı parçalar: dosya, ses seviyesi, dikişsiz döngü mü. */
const TRACKS: Partial<Record<Mood, { src: string; level: number; seamless?: boolean }>> = {
  lobby: { src: 'music/lobby.m4a', level: 0.42 },
  write: { src: 'music/game.m4a', level: 0.36 },
  tension: { src: 'music/tension.m4a', level: 0.4, seamless: true },
  chill: { src: 'music/chill.m4a', level: 0.4 },
  film: { src: 'music/film-quiz.m4a', level: 0.28, seamless: true },
};
/** Döngüde iki kopya arasındaki çapraz geçiş (sn). */
const XF = 2.5;

interface Playing {
  mood: Mood;
  out: GainNode;
  els: HTMLAudioElement[];
  timer: number;
}
let playing: Playing | null = null;

/** Parçanın bir kopyasını başlatır; dikişsiz değilse bitmesine XF kala bir sonrakini çapraz geçişle açar. */
function startCopy(p: Playing, src: string, seamless: boolean, fadeIn: number) {
  const a = audio();
  if (!a) return;
  const el = new Audio(src);
  el.preload = 'auto';
  el.loop = seamless;
  const g = a.createGain();
  g.gain.value = fadeIn ? 0 : 1;
  a.createMediaElementSource(el).connect(g).connect(p.out);
  if (fadeIn) g.gain.setTargetAtTime(1, a.currentTime, fadeIn / 3);
  p.els.push(el);
  el.play().catch(() => {
    // çalınamadı (dosya yok / izin yok): yedek sentez
    if (playing === p) fallback(p.mood);
  });
  if (seamless) return;
  const check = () => {
    if (playing !== p) return;
    if (el.duration && el.currentTime >= el.duration - XF) {
      g.gain.setTargetAtTime(0, a.currentTime, XF / 4);
      setTimeout(() => {
        el.pause();
        p.els = p.els.filter((x) => x !== el);
      }, XF * 1000 + 300);
      startCopy(p, src, false, XF);
    } else p.timer = window.setTimeout(check, 250);
  };
  p.timer = window.setTimeout(check, 1000);
}

function stopFile(fade = 1) {
  const p = playing;
  if (!p) return;
  playing = null;
  clearTimeout(p.timer);
  const a = audio();
  if (a) p.out.gain.setTargetAtTime(0, a.currentTime, fade / 3);
  setTimeout(() => {
    p.els.forEach((el) => el.pause());
    p.out.disconnect();
  }, fade * 1000 + 200);
}

function playFile(m: Mood): boolean {
  const tr = TRACKS[m];
  const a = audio();
  const out = musicOut();
  if (!tr || !a || !out) return false;
  stopFile(1.2);
  stopSynth();
  musicLevel(1, 0.3);
  const g = a.createGain();
  g.gain.value = 0;
  g.connect(out);
  g.gain.setTargetAtTime(tr.level, a.currentTime, 0.35);
  playing = { mood: m, out: g, els: [], timer: 0 };
  startCopy(playing, tr.src, !!tr.seamless, 0);
  return true;
}

// Uygulama arka plana geçince parçalar dursun (ses bağlamı askıya alınsa da <audio> ilerlemeye devam eder).
if (typeof document !== 'undefined')
  document.addEventListener('visibilitychange', () => {
    playing?.els.forEach((el) => (document.hidden ? el.pause() : void el.play().catch(() => {})));
  });

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

const STYLES: Record<Exclude<Mood, 'off' | 'film'>, Style> = {
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

function stopSynth() {
  clearInterval(timer);
  timer = 0;
  style = null;
  pending = null;
}

function stop() {
  stopSynth();
  stopFile(0.4);
  musicLevel(0, 0.4);
}

/** Dosya çalınamazsa aynı ruh hâlinin sentez sürümü (film için yazarken sürümü). */
function fallback(m: Mood) {
  stopFile(0.3);
  startSynth(m === 'film' ? 'write' : m);
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
  if (playFile(m)) return;
  startSynth(m);
}

function startSynth(m: Mood) {
  const a = audio();
  if (!a || m === 'off' || m === 'film') return;
  stopFile(0.8);
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
