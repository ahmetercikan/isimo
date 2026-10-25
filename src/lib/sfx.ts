/**
 * Ses motoru — dosya yok, her şey Web Audio ile cihazda üretilir.
 *
 * Zincir (stüdyo düzeni):
 *   efektler ─┐
 *             ├─► ana kanal ─► kompresör ─► limitleyici ─► hoparlör
 *   müzik ─► kısma (efekt çalınca müzik kısılır) ─┘
 *   her ses bir miktar ─► stereo oda yankısı (üretilmiş dürtü yanıtı) ─► ana kanal
 *
 * Çalgılar: çan (uyumsuz kısmi tonlar), telli "pluck" (süzgeç zarflı), bakır nefesli (akortsuz testere dalgalar),
 * davul seti (kick, trampet, zil), elektrikli piyano (FM). Efektler bu çalgıların katmanlanmasıyla yapılır.
 * Müzik: src/lib/music.ts (kayıtlı parçalar + harf rulosu için aynı çalgılar, ayrı kanal).
 */
let ctx: AudioContext | null = null;
let master: GainNode;
let sfxBus: GainNode;
let musicBus: GainNode;
let musicDuck: GainNode;
let reverbIn: GainNode;
let noiseBuf: AudioBuffer;
let enabled = true;

export function setSfxEnabled(v: boolean) {
  enabled = v;
}

/** Ses bağlamı (ilk kullanımda kurulur; uygulama arka plandayken askıya alınır). */
export function audio(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC({ latencyHint: 'interactive' });
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.knee.value = 10;
      comp.ratio.value = 3;
      comp.attack.value = 0.004;
      comp.release.value = 0.16;
      const limit = ctx.createDynamicsCompressor();
      limit.threshold.value = -2;
      limit.knee.value = 0;
      limit.ratio.value = 20;
      limit.attack.value = 0.001;
      limit.release.value = 0.08;
      master = ctx.createGain();
      master.gain.value = 0.85;
      master.connect(comp).connect(limit).connect(ctx.destination);

      sfxBus = ctx.createGain();
      sfxBus.connect(master);
      musicDuck = ctx.createGain();
      musicDuck.connect(master);
      musicBus = ctx.createGain();
      musicBus.gain.value = 0;
      musicBus.connect(musicDuck);

      const conv = ctx.createConvolver();
      conv.buffer = roomImpulse(ctx, 2.2);
      reverbIn = ctx.createGain();
      reverbIn.gain.value = 0.55;
      const revOut = ctx.createGain();
      revOut.gain.value = 0.32;
      reverbIn.connect(conv).connect(revOut).connect(master);

      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

      document.addEventListener('visibilitychange', () => {
        if (!ctx) return;
        if (document.hidden) void ctx.suspend();
        else void ctx.resume();
      });
    }
    if (ctx.state === 'suspended' && !document.hidden) void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Stereo oda yankısı: kısa ön gecikme, erken yansımalar, gittikçe kararan kuyruk. */
function roomImpulse(a: AudioContext, seconds: number): AudioBuffer {
  const rate = a.sampleRate;
  const len = Math.floor(rate * seconds);
  const pre = Math.floor(rate * 0.014);
  const buf = a.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = pre; i < len; i++) {
      const t = (i - pre) / (len - pre);
      const k = 0.55 - 0.45 * t; // zamanla daha karanlık
      lp += k * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.pow(1 - t, 2.6) * 0.9;
    }
    // erken yansımalar
    for (const [ms, g] of [[11, 0.5], [19, 0.35], [27, 0.28], [41, 0.2], [53, 0.14]]) {
      const i = pre + Math.floor(((ms + ch * 3.7) * rate) / 1000);
      if (i < len) d[i] += g * (ch ? -1 : 1);
    }
  }
  return buf;
}

export const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

type Dest = 'sfx' | 'music';
export interface Out {
  pan?: number;
  send?: number;
  dest?: Dest;
}

const muted = (o: Out) => !enabled && o.dest !== 'music';

/** Bir sesi çıkışa bağlar: stereo konum + yankı payı. */
function route(a: AudioContext, node: AudioNode, o: Out) {
  let n: AudioNode = node;
  if (o.pan) {
    const p = a.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, o.pan));
    n = node.connect(p);
  }
  n.connect(o.dest === 'music' ? musicBus : sfxBus);
  if (o.send) {
    const s = a.createGain();
    s.gain.value = o.send;
    n.connect(s).connect(reverbIn);
  }
}

/** Vurmalı zarf: hızlı atak, üstel sönüm. */
function perc(g: AudioParam, t: number, peak: number, attack: number, decay: number) {
  g.setValueAtTime(0.0001, t);
  g.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

interface ToneOpts extends Out {
  type?: OscillatorType;
  f: number;
  /** Perde kayması: f → to, `glide` saniyede. */
  to?: number;
  glide?: number;
  t?: number;
  a?: number;
  d: number;
  g: number;
  lp?: number;
  q?: number;
  detune?: number;
  vib?: number;
  vibRate?: number;
}

/** Tek osilatörlü ton (isteğe bağlı süzgeç, perde kayması, titreşim). */
export function tone(o: ToneOpts) {
  const a = audio();
  if (!a || muted(o)) return;
  const t = a.currentTime + (o.t ?? 0);
  const end = t + (o.a ?? 0.005) + o.d + 0.05;
  const osc = a.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.f, t);
  if (o.detune) osc.detune.value = o.detune;
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide ?? o.d));
  if (o.vib) {
    const l = a.createOscillator();
    const lg = a.createGain();
    l.frequency.value = o.vibRate ?? 5.5;
    lg.gain.value = o.vib;
    l.connect(lg).connect(osc.frequency);
    l.start(t);
    l.stop(end);
  }
  const g = a.createGain();
  perc(g.gain, t, o.g, o.a ?? 0.005, o.d);
  let n: AudioNode = osc;
  if (o.lp) {
    const f = a.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = o.lp;
    f.Q.value = o.q ?? 0.7;
    n = osc.connect(f);
  }
  n.connect(g);
  route(a, g, o);
  osc.start(t);
  osc.stop(end);
}

interface NoiseOpts extends Out {
  t?: number;
  a?: number;
  d: number;
  g: number;
  filter?: BiquadFilterType;
  f: number;
  to?: number;
  q?: number;
  /** Stereo konum kayması (pan → panTo). */
  panTo?: number;
}

/** Süzgeçli gürültü: tık, vuuş, zil, nefes. */
export function noise(o: NoiseOpts) {
  const a = audio();
  if (!a || muted(o)) return;
  const t = a.currentTime + (o.t ?? 0);
  const len = (o.a ?? 0.003) + o.d;
  const src = a.createBufferSource();
  src.buffer = noiseBuf;
  const f = a.createBiquadFilter();
  f.type = o.filter ?? 'bandpass';
  f.Q.value = o.q ?? 1;
  f.frequency.setValueAtTime(o.f, t);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + len);
  const g = a.createGain();
  perc(g.gain, t, o.g, o.a ?? 0.003, o.d);
  src.connect(f).connect(g);
  if (o.panTo !== undefined) {
    const p = a.createStereoPanner();
    p.pan.setValueAtTime(o.pan ?? 0, t);
    p.pan.linearRampToValueAtTime(o.panTo, t + len);
    g.connect(p);
    route(a, p, { ...o, pan: 0 });
  } else route(a, g, o);
  src.start(t, Math.random() * 0.8, len + 0.05);
}

// ------------------------------------------------------------------------------------------------
// Çalgılar (efektler ve müzik ortak kullanır)
// ------------------------------------------------------------------------------------------------

/** Çan / zil: uyumsuz kısmi tonlar (glockenspiel). */
export function bell(f: number, t: number, d: number, g: number, o: Out = {}) {
  for (const [r, k, dk] of [[1, 1, 1], [2.756, 0.42, 0.55], [5.404, 0.2, 0.35], [8.933, 0.08, 0.22]])
    tone({ f: f * r, t, a: 0.002, d: d * dk, g: g * k, send: 0.35, ...o });
}

/** Telli "pluck": testere + kare, kapanan süzgeç. */
export function pluck(f: number, t: number, d: number, g: number, o: Out & { bright?: number } = {}) {
  const a = audio();
  if (!a || muted(o)) return;
  const s = a.currentTime + t;
  const g0 = a.createGain();
  perc(g0.gain, s, g, 0.003, d);
  const flt = a.createBiquadFilter();
  flt.type = 'lowpass';
  flt.Q.value = 2;
  flt.frequency.setValueAtTime(Math.min(16000, f * (o.bright ?? 8)), s);
  flt.frequency.exponentialRampToValueAtTime(Math.max(200, f * 1.2), s + d * 0.6);
  for (const [type, k, det] of [['sawtooth', 0.6, -6], ['square', 0.35, 6]] as const) {
    const osc = a.createOscillator();
    osc.type = type;
    osc.frequency.value = f;
    osc.detune.value = det;
    const og = a.createGain();
    og.gain.value = k;
    osc.connect(og).connect(flt);
    osc.start(s);
    osc.stop(s + d + 0.05);
  }
  flt.connect(g0);
  route(a, g0, { send: 0.2, ...o });
}

/** Bakır nefesli: üç akortsuz testere, açılıp kapanan süzgeç (şişen bir "taa"). */
export function brass(f: number, t: number, d: number, g: number, o: Out & { vib?: number } = {}) {
  const a = audio();
  if (!a || muted(o)) return;
  const s = a.currentTime + t;
  const amp = a.createGain();
  amp.gain.setValueAtTime(0.0001, s);
  amp.gain.exponentialRampToValueAtTime(g, s + 0.05);
  amp.gain.setTargetAtTime(g * 0.75, s + 0.06, 0.12);
  amp.gain.setTargetAtTime(0.0001, s + d, 0.07);
  const flt = a.createBiquadFilter();
  flt.type = 'lowpass';
  flt.Q.value = 1.2;
  flt.frequency.setValueAtTime(f * 1.5, s);
  flt.frequency.exponentialRampToValueAtTime(f * 7, s + 0.07);
  flt.frequency.setTargetAtTime(f * 3.5, s + 0.08, 0.15);
  for (const det of [-9, 0, 8]) {
    const osc = a.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = f;
    osc.detune.value = det;
    if (o.vib) {
      const l = a.createOscillator();
      const lg = a.createGain();
      l.frequency.value = 5.2;
      lg.gain.setValueAtTime(0, s);
      lg.gain.linearRampToValueAtTime(o.vib, s + Math.min(d, 0.5));
      l.connect(lg).connect(osc.frequency);
      l.start(s);
      l.stop(s + d + 0.4);
    }
    osc.connect(flt);
    osc.start(s);
    osc.stop(s + d + 0.4);
  }
  flt.connect(amp);
  route(a, amp, { send: 0.3, ...o });
}

/** Elektrikli piyano (FM, yumuşak). */
export function epiano(f: number, t: number, d: number, g: number, o: Out = {}) {
  const a = audio();
  if (!a || muted(o)) return;
  const s = a.currentTime + t;
  const car = a.createOscillator();
  const mod = a.createOscillator();
  const mg = a.createGain();
  car.frequency.value = f;
  mod.frequency.value = f;
  mg.gain.setValueAtTime(f * 1.6, s);
  mg.gain.exponentialRampToValueAtTime(f * 0.15, s + 0.4);
  mod.connect(mg).connect(car.frequency);
  const amp = a.createGain();
  perc(amp.gain, s, g, 0.006, d);
  car.connect(amp);
  route(a, amp, { send: 0.25, ...o });
  car.start(s);
  mod.start(s);
  car.stop(s + d + 0.05);
  mod.stop(s + d + 0.05);
}

export function kick(t: number, g: number, o: Out = {}) {
  tone({ f: 155, to: 42, glide: 0.13, t, a: 0.002, d: 0.38, g, ...o });
  noise({ t, d: 0.012, g: g * 0.25, filter: 'highpass', f: 3500, ...o });
}

export function snare(t: number, g: number, o: Out = {}) {
  tone({ type: 'triangle', f: 210, to: 160, glide: 0.08, t, d: 0.09, g: g * 0.5, ...o });
  noise({ t, d: 0.17, g, filter: 'highpass', f: 1400, send: 0.12, ...o });
}

export function hat(t: number, g: number, open = false, o: Out = {}) {
  noise({ t, d: open ? 0.22 : 0.035, g, filter: 'highpass', f: 7500, q: 0.7, ...o });
}

export function crash(t: number, g: number, o: Out = {}) {
  noise({ t, a: 0.002, d: 1.6, g, filter: 'highpass', f: 5200, q: 0.5, send: 0.4, ...o });
  noise({ t, a: 0.002, d: 0.5, g: g * 0.6, filter: 'bandpass', f: 3200, q: 0.8, ...o });
}

export function tom(f: number, t: number, g: number, o: Out = {}) {
  tone({ f: f * 1.5, to: f, glide: 0.06, t, a: 0.002, d: 0.35, g, send: 0.2, ...o });
  noise({ t, d: 0.03, g: g * 0.2, filter: 'bandpass', f: 1200, ...o });
}

/** Müziği kısa süre kıs (büyük efektlerde). */
function duck(depth = 0.35, hold = 0.4) {
  const a = audio();
  if (!a || !enabled) return;
  const g = musicDuck.gain;
  const t = a.currentTime;
  g.cancelScheduledValues(t);
  g.setTargetAtTime(depth, t, 0.02);
  g.setTargetAtTime(1, t + hold, 0.35);
}

/** Sunucu sesi kanalı: konuşurken müzik kısılır (voice.ts). */
let voiceBus: GainNode | null = null;
export function voiceOut(seconds: number): AudioNode {
  const a = audio()!;
  if (!voiceBus) {
    voiceBus = a.createGain();
    voiceBus.gain.value = 1.15;
    voiceBus.connect(master);
  }
  const g = musicDuck.gain;
  const t = a.currentTime;
  g.cancelScheduledValues(t);
  g.setTargetAtTime(0.3, t, 0.03);
  g.setTargetAtTime(1, t + seconds, 0.3);
  return voiceBus;
}

/** Müzik kanalının ses seviyesi (music.ts geçişleri için). */
/** Müzik kanalının girişi (dosyadan çalınan fon müziği buraya bağlanır; kısma ve seviye ortak). */
export function musicOut(): AudioNode | null {
  return audio() ? musicBus : null;
}

export function musicLevel(v: number, time = 0.6) {
  const a = audio();
  if (!a) return;
  musicBus.gain.cancelScheduledValues(a.currentTime);
  musicBus.gain.setTargetAtTime(v, a.currentTime, time / 3);
}

// ------------------------------------------------------------------------------------------------
// Kalem hışırtısı (yazarken, hıza göre)
// ------------------------------------------------------------------------------------------------
let scr: { g: GainNode; f: BiquadFilterNode } | null = null;
let scrIdle = 0;
function scribble(speed: number) {
  const a = audio();
  if (!a || (!enabled && speed > 0)) return;
  if (!scr) {
    const src = a.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const hp = a.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1400;
    const f = a.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 3200;
    f.Q.value = 0.9;
    const g = a.createGain();
    g.gain.value = 0;
    src.connect(hp).connect(f).connect(g).connect(sfxBus);
    src.start();
    scr = { g, f };
  }
  const t = a.currentTime;
  const v = Math.min(1, speed / 1.6);
  scr.g.gain.setTargetAtTime(speed > 0 ? 0.012 + v * 0.05 : 0, t, speed > 0 ? 0.015 : 0.04);
  scr.f.frequency.setTargetAtTime(2400 + v * 2600, t, 0.03);
  // Kalem durunca ses kendiliğinden kısılsın: parmak kalktı bilgisi gelmezse (defter kapandı,
  // süre bitti, uygulama arka plana gitti) hışırtı yoksa sonsuza kadar çalıyordu.
  clearTimeout(scrIdle);
  if (speed > 0) scrIdle = window.setTimeout(() => scribble(0), 200);
}

// ------------------------------------------------------------------------------------------------
// Oyun efektleri
// ------------------------------------------------------------------------------------------------

const rnd = (k = 0.15) => (Math.random() * 2 - 1) * k;

export const sfx = {
  /**
   * Dokunuş / ekran geçişi: yumuşak, sıcak, kısa bir "tık" (premium arayüz sesi).
   * Gövde: hafifçe aşağı kayan sinüs + bir oktav üstte çok kısa parıltı; tepede incecik bir hava tıkı.
   * Eskiden her dokunuşta perdesi değişen cam zil notasıydı; oyuncak gibi bulundu (25 Eki 2026).
   */
  tap: () => {
    const p = rnd(0.08);
    tone({ f: 1040, to: 720, glide: 0.045, a: 0.002, d: 0.075, g: 0.075, lp: 2600, pan: p, send: 0.06 });
    tone({ type: 'triangle', f: 2080, to: 1500, glide: 0.03, a: 0.001, d: 0.03, g: 0.012, pan: p });
    noise({ d: 0.008, g: 0.018, filter: 'bandpass', f: 4800, q: 1.5, pan: p });
  },
  /** Harf sayacı: tahta çark tıkırtısı (tik-tak). */
  tick: (i = 0) => {
    noise({ d: 0.022, g: 0.2, filter: 'bandpass', f: i % 2 ? 2300 : 2900, q: 8, pan: i % 2 ? -0.15 : 0.15 });
    tone({ f: i % 2 ? 1500 : 1800, d: 0.02, g: 0.025 });
  },
  /** DUR!: tok bir darbe + metal çınlama. */
  stop: () => {
    duck(0.2, 0.6);
    kick(0, 0.9);
    noise({ d: 0.2, g: 0.35, filter: 'lowpass', f: 900, to: 300 });
    tone({ type: 'square', f: 98, to: 55, glide: 0.25, d: 0.28, g: 0.08, lp: 500 });
    crash(0.01, 0.12);
    bell(mtof(72), 0.02, 1.4, 0.05, { send: 0.5 });
  },
  /** Harf ortaya çıkıyor: yükselen vuuş, sonra büyük akor + parıltı. */
  reveal: () => {
    duck(0.15, 1.2);
    noise({ a: 0.5, d: 0.08, g: 0.16, filter: 'bandpass', f: 300, to: 7000, q: 1.4, pan: -0.5, panTo: 0.5 });
    tone({ type: 'sawtooth', f: 220, to: 880, glide: 0.55, a: 0.5, d: 0.06, g: 0.025, lp: 2500 });
    const hit = 0.55;
    kick(hit, 0.75);
    crash(hit, 0.2);
    [48, 55, 60, 64, 67, 72].forEach((m, i) => pluck(mtof(m), hit + i * 0.012, 1.1, 0.07, { pan: (i - 2.5) * 0.12, bright: 10 }));
    [60, 64, 67].forEach((m) => brass(mtof(m), hit, 0.45, 0.035));
    [84, 88, 91, 96, 100].forEach((m, i) => bell(mtof(m), hit + 0.12 + i * 0.06, 1.2, 0.045, { pan: -0.4 + i * 0.2 }));
  },
  /** 3-2-1 (son: yüksek "başla"). */
  count: (last = false) => {
    if (last) {
      duck(0.4, 0.5);
      tone({ f: mtof(88), d: 0.6, g: 0.16, send: 0.3 });
      tone({ type: 'triangle', f: mtof(100), d: 0.45, g: 0.05 });
      crash(0, 0.08);
      kick(0, 0.5);
    } else {
      tone({ f: mtof(81), d: 0.16, g: 0.16, send: 0.15 });
      tone({ type: 'triangle', f: mtof(93), d: 0.1, g: 0.04 });
    }
  },
  /** Son saniyeler: tahta blok + kalp atışı. */
  clock: () => {
    tone({ f: 1250, d: 0.05, g: 0.08 });
    noise({ d: 0.03, g: 0.12, filter: 'bandpass', f: 3000, q: 5 });
    tone({ f: 62, d: 0.16, g: 0.28 });
    tone({ f: 55, t: 0.17, d: 0.18, g: 0.2 });
  },
  /** Süre bitti: yarışma programı zili + derin gong. */
  timeUp: () => {
    duck(0.15, 1.2);
    for (const [f, det] of [[110, -7], [110, 7], [220, 0]] as const)
      tone({ type: f === 220 ? 'square' : 'sawtooth', f, detune: det, a: 0.01, d: 0.75, g: 0.07, lp: 1500, q: 2 });
    kick(0, 0.6);
    bell(98, 0.05, 2.2, 0.09, { send: 0.6 });
  },
  /** STOP!: hakem düdüğü (kısa + uzun). */
  siren: () => {
    duck(0.25, 1);
    for (const [t, d] of [[0, 0.2], [0.27, 0.55]]) {
      tone({ f: 2950, t, a: 0.01, d, g: 0.11, vib: 150, vibRate: 30, send: 0.25 });
      noise({ t, a: 0.01, d, g: 0.035, filter: 'bandpass', f: 3000, q: 1.5 });
    }
  },
  /** El yazısı okundu: kabarcık + iki nota parıltı. */
  write: () => {
    tone({ f: 500, to: 1300, glide: 0.06, d: 0.12, g: 0.1 });
    pluck(mtof(88), 0.03, 0.4, 0.05, { pan: 0.2 });
    bell(mtof(95), 0.08, 0.6, 0.035, { pan: 0.3 });
  },
  /** Geçersiz oyu: hüzünlü trombon "vah vah vaaah". */
  boo: () => {
    [[55, 0, 0.26], [54, 0.3, 0.26], [53, 0.6, 0.26], [52, 0.9, 0.85]].forEach(([m, t, d], i) =>
      brass(mtof(m), t, d, 0.06, { vib: i === 3 ? 7 : 0, pan: -0.1 }),
    );
  },
  /** Onay (Oyunu Başlat, kaydet): yumuşak iki notalı çan, büyük üçlü yukarı; sıcak ve kısa. */
  pop: () => {
    tone({ f: mtof(76), a: 0.004, d: 0.22, g: 0.07, lp: 3200, send: 0.18 });
    tone({ f: mtof(80), t: 0.07, a: 0.004, d: 0.32, g: 0.065, lp: 3600, send: 0.22 });
    tone({ type: 'triangle', f: mtof(92), t: 0.07, a: 0.002, d: 0.12, g: 0.01 });
    noise({ d: 0.01, g: 0.015, filter: 'bandpass', f: 5200, q: 1.5 });
  },
  /** Oyuncu katıldı: kapı zili "ding-dong". */
  join: () => {
    bell(mtof(76), 0, 1.3, 0.1, { pan: -0.2, send: 0.45 });
    bell(mtof(72), 0.36, 1.8, 0.1, { pan: 0.2, send: 0.45 });
  },
  /** Puan sayımı: klasik altın sesi. */
  coin: (i = 0) => {
    const k = (i % 5) * 2;
    tone({ type: 'square', f: mtof(83 + k), d: 0.06, g: 0.035, lp: 5000 });
    tone({ type: 'square', f: mtof(88 + k), t: 0.06, d: 0.35, g: 0.035, lp: 5000, send: 0.2 });
  },
  /** Klaket: kuru tahta şaklaması + kısa oda yankısı (Sinema Bilmecesi'nde her film başlarken). */
  clap: () => {
    noise({ d: 0.05, g: 0.5, filter: 'bandpass', f: 1800, q: 1.2, send: 0.25 });
    noise({ d: 0.02, g: 0.35, filter: 'highpass', f: 4000 });
    tone({ f: 220, to: 120, glide: 0.04, d: 0.06, g: 0.12 });
  },
  /** Geçiş: yumuşak, havalı bir süzülme (soldan sağa) + altta belli belirsiz bir nota. */
  whoosh: () => {
    noise({ a: 0.09, d: 0.26, g: 0.09, filter: 'lowpass', f: 900, to: 4200, q: 0.8, pan: -0.5, panTo: 0.5, send: 0.2 });
    tone({ f: mtof(79), t: 0.1, a: 0.01, d: 0.3, g: 0.025, lp: 2400, send: 0.3 });
  },
  success: () => [72, 76, 79, 83, 84].forEach((m, i) => pluck(mtof(m), i * 0.07, 0.7, 0.07, { pan: -0.3 + i * 0.15, bright: 9 })),
  /** Final: bakır fanfar + timpani + zil. */
  fanfare: () => {
    duck(0.1, 3.5);
    for (let i = 0; i < 10; i++) tom(55, i * 0.045, 0.06 + i * 0.025);
    const mel: [number, number, number][] = [[67, 0.5, 0.14], [67, 0.66, 0.14], [67, 0.82, 0.14], [72, 0.98, 1.3]];
    mel.forEach(([m, t, d]) => brass(mtof(m), t, d, 0.075, { vib: d > 1 ? 6 : 0 }));
    [48, 55, 60, 64].forEach((m) => brass(mtof(m), 0.98, 1.3, 0.04, { pan: (m - 56) / 20 }));
    kick(0.98, 0.9);
    crash(0.98, 0.22);
    [84, 88, 91, 96, 100, 103].forEach((m, i) => bell(mtof(m), 1.3 + i * 0.07, 1.4, 0.04, { pan: -0.5 + i * 0.2 }));
  },
  /** Yazarken kalem hışırtısı (hız: piksel/ms; 0: durdur). */
  scribble,
};
