/**
 * Ses efektleri — dosya yok, Web Audio ile sentezlenir (Çizio ile aynı ses motoru).
 *
 * Zincir: sesler → ana kazanç → kompresör → hoparlör, ayrıca hafif bir yankı (üretilmiş dürtü yanıtlı
 * konvolüsyon). Tonlar FM sentezi: marimba (yumuşak, tahta) ve çan (parlak, uzun). Seçim sesleri
 * pentatonik gamda sırayla ilerler; art arda seçim yapmak kulağa bir melodi gibi gelir.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let reverb: GainNode | null = null;
let enabled = true;

export function setSfxEnabled(v: boolean) {
  enabled = v;
}

function ac(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(comp).connect(ctx.destination);
      // Kısa, parlak bir oda yankısı
      const conv = ctx.createConvolver();
      const len = Math.floor(ctx.sampleRate * 1.1);
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
      }
      conv.buffer = ir;
      reverb = ctx.createGain();
      reverb.gain.value = 0.18;
      reverb.connect(conv).connect(master);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Çıkış: kuru sinyal ana kanala, bir kısmı yankıya. */
function out(a: AudioContext, node: AudioNode, wet = 1) {
  node.connect(master!);
  if (wet > 0) {
    const s = a.createGain();
    s.gain.value = wet;
    node.connect(s).connect(reverb!);
  }
}

/** FM tonu. ratio: modülatör/taşıyıcı frekans oranı (4 → marimba, 3.5 → çan), index: parlaklık. */
function fm(freq: number, at: number, dur: number, gain: number, ratio: number, index: number, wet = 1) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + at;
  const car = a.createOscillator();
  const mod = a.createOscillator();
  const modGain = a.createGain();
  const amp = a.createGain();
  car.frequency.setValueAtTime(freq, t);
  mod.frequency.setValueAtTime(freq * ratio, t);
  modGain.gain.setValueAtTime(freq * index, t);
  modGain.gain.exponentialRampToValueAtTime(freq * 0.02, t + Math.min(dur, 0.12));
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.006);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  mod.connect(modGain).connect(car.frequency);
  car.connect(amp);
  out(a, amp, wet);
  car.start(t);
  mod.start(t);
  car.stop(t + dur + 0.05);
  mod.stop(t + dur + 0.05);
}

/** Filtrelenmiş gürültü: tık (kısa) ya da vuuş (süpürmeli). */
function noise(at: number, dur: number, gain: number, f0: number, f1 = f0, q = 1.2, wet = 0) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + at;
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  const bp = a.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = q;
  bp.frequency.setValueAtTime(f0, t);
  bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.02, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(g);
  out(a, g, wet);
  src.start(t);
  src.stop(t + dur + 0.02);
}

/** Tatlı bir su damlası "pop"u: perdesi hızla yükselen sinüs. */
function bubble(at: number, from: number, to: number, gain: number) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + 0.07);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
  o.connect(g);
  out(a, g, 0.6);
  o.start(t);
  o.stop(t + 0.16);
}

/** Perdesi kayan osilatör (titreşim ve filtre isteğe bağlı): kaydırak düdüğü, siren, yay sesi… */
function sweep(type: OscillatorType, f0: number, f1: number, at: number, dur: number, gain: number, o: { vib?: number; vibRate?: number; lp?: number; mid?: number; wet?: number } = {}) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + at;
  const osc = a.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  if (o.mid) {
    osc.frequency.exponentialRampToValueAtTime(o.mid, t + dur * 0.45);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  } else osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  if (o.vib) {
    const lfo = a.createOscillator();
    const lg = a.createGain();
    lfo.frequency.value = o.vibRate ?? 6;
    lg.gain.value = o.vib;
    lfo.connect(lg).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + dur + 0.05);
  }
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.03, dur / 4));
  g.gain.setValueAtTime(gain, t + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node: AudioNode = osc;
  if (o.lp) {
    const f = a.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = o.lp;
    node = osc.connect(f);
  }
  node.connect(g);
  out(a, g, o.wet ?? 0.3);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// C majör pentatonik: art arda dokunuşlar melodi gibi ilerler
const PENTA = [1046.5, 1174.7, 1318.5, 1568.0, 1760.0, 2093.0];
let step = 0;
let lastTap = 0;
const nextNote = () => {
  const now = performance.now();
  if (now - lastTap > 1500) step = 0;
  lastTap = now;
  const f = PENTA[step % PENTA.length];
  step = (step + 1) % PENTA.length;
  return f;
};

export const sfx = {
  /** Genel dokunuş: yumuşak marimba notası + tahta tık. */
  tap: () => {
    const f = nextNote();
    noise(0, 0.012, 0.05, 3200, 3200, 0.8);
    fm(f / 2, 0, 0.22, 0.16, 4, 1.4, 0.4);
  },
  /** Harf sayacının tık sesi (i: kaçıncı harf; perde hafifçe değişir). */
  tick: (i = 0) => {
    noise(0, 0.01, 0.07, 3000 + (i % 4) * 300, 3000, 2);
    fm(880 + (i % 4) * 110, 0, 0.05, 0.05, 4, 0.8, 0);
  },
  /** DUR! düğmesi: tok bir vuruş. */
  stop: () => {
    fm(196, 0, 0.35, 0.3, 1, 3, 0.2);
    noise(0, 0.12, 0.2, 900, 300, 0.8);
  },
  /** Harf ortaya çıkınca: yükselen parıltı. */
  reveal: () => {
    noise(0, 0.5, 0.08, 600, 5000, 1.2, 0.3);
    [0, 4, 7, 12].forEach((s, i) => fm(523.25 * 2 ** (s / 12), 0.1 + i * 0.07, 0.6, 0.11, 3.5, 2, 1));
  },
  /** 3-2-1 sayımı (son: yüksek "başla"). */
  count: (last = false) => fm(last ? 1568 : 784, 0, last ? 0.6 : 0.25, 0.16, 3.5, 1.8, 0.5),
  /** Kalan son saniyeler: saat tıkırtısı. */
  clock: () => {
    noise(0, 0.02, 0.12, 2500, 2500, 3);
    fm(1200, 0, 0.05, 0.05, 2, 1, 0);
  },
  /** Süre bitti: alçalan iki nota + gong. */
  timeUp: () => {
    [784, 523.25, 392].forEach((f, i) => fm(f, i * 0.14, 0.5, 0.15, 3.5, 2.2, 0.8));
    fm(98, 0.4, 1.4, 0.18, 1.4, 4, 1);
  },
  /** STOP! sireni (kısa). */
  siren: () => {
    sweep('triangle', 700, 1200, 0, 0.35, 0.09, { lp: 3000, wet: 0.2 });
    sweep('triangle', 1200, 700, 0.35, 0.35, 0.09, { lp: 3000, wet: 0.2 });
  },
  /** Cevap tanındı. */
  write: () => {
    bubble(0, 500, 1300, 0.14);
    fm(nextNote(), 0.04, 0.3, 0.07, 3.5, 1.4, 0.8);
  },
  /** Oy: geçersiz. */
  boo: () => sweep('sawtooth', 300, 140, 0, 0.32, 0.05, { lp: 900, wet: 0.1 }),
  pop: () => {
    bubble(0, 380, 1100, 0.2);
    fm(1568, 0.05, 0.35, 0.06, 3.5, 1.5, 1);
  },
  /** Oyuncu katıldı. */
  join: () => [0, 7].forEach((s, i) => fm(659.3 * 2 ** (s / 12), i * 0.1, 0.4, 0.1, 3.5, 1.6, 0.8)),
  /** Puan sayımı (i: sıra). */
  coin: (i = 0) => fm(1318.5 * 2 ** ((i % 8) / 12), 0, 0.25, 0.08, 3.5, 2.2, 0.6),
  whoosh: () => noise(0, 0.5, 0.12, 300, 2400, 1.1, 0.3),
  success: () => [1046.5, 1318.5, 1568, 2093].forEach((f, i) => fm(f, i * 0.08, 0.7, 0.12, 3.5, 2, 1)),
  fanfare: () =>
    [523.25, 659.3, 784, 659.3, 784, 1046.5].forEach((f, i) => {
      fm(f, i * 0.11, i === 5 ? 1.2 : 0.35, 0.13, 4, 1.8, 0.8);
      fm(f * 2, i * 0.11 + 0.01, i === 5 ? 1 : 0.25, 0.05, 3.5, 1.5, 1);
    }),
};
