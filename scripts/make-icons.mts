/**
 * Uygulama ikonu (Çizio'nun tekniğiyle: kodla çizilen katmanlı SVG, tarayıcıda PNG'ye çevrilir):
 * turkuaz-mavi zemin, eğik çizgili defter yaprağı, mercan renkli kaligrafik el yazısı "A",
 * gerçekçi sarı kurşun kalem (Çizio'dan) ve köşede kırmızı STOP tabelası.
 *   npx tsx scripts/make-icons.mts && npx capacitor-assets generate --android --iconBackgroundColor '#16a6c4' --splashBackgroundColor '#cfeee6'
 * Çıktılar:
 *   public/icons/icon-192.png, icon-512.png   yuvarlatılmış kare (web / ana ekrana ekle)
 *   public/icons/icon-maskable-512.png        tam dolu, güvenli alanda (Android ana ekran)
 *   public/icons/apple-touch-icon.png (180)   tam dolu
 *   public/favicon.png (64)
 *   assets/icon-only.png, icon-foreground.png, icon-background.png, splash.png, splash-dark.png (Capacitor)
 *   store/icon-512.png (Google Play: tam kare, Play köşeleri kendisi yuvarlar)
 *   .render/icon-preview.png (gerçek boyutlarda önizleme)
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const S = 1024;
const font = readFileSync('src/assets/fonts/fredoka-tr-700.woff2').toString('base64');

type Pt = [number, number];
/** Kübik Bézier zincirini noktalara çevirir. */
function bezier(start: Pt, segs: [Pt, Pt, Pt][], step = 0.02): Pt[] {
  const out: Pt[] = [start];
  let p0 = start;
  for (const [c1, c2, p1] of segs) {
    for (let t = step; t <= 1.0001; t += step) {
      const u = 1 - t;
      out.push([
        u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0],
        u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1],
      ]);
    }
    p0 = p1;
  }
  return out;
}

/** Kaligrafik şerit (Çizio): merkez çizgi boyunca kalınlık başta incelir, sonda dolgun kalır. */
function ribbon(pts: Pt[], width: number, taperStart = 0.3): string {
  const n = pts.length;
  const left: Pt[] = [], right: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    const t = i / (n - 1);
    const ease = Math.min(1, t / taperStart);
    const w = (width / 2) * (0.25 + 0.75 * (1 - (1 - ease) ** 2.2));
    left.push([pts[i][0] - ty * w, pts[i][1] + tx * w]);
    right.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
  }
  const ring = [...left, ...right.reverse()];
  const P = (i: number) => ring[(i + ring.length) % ring.length];
  let d = `M${ring[0][0].toFixed(1)},${ring[0][1].toFixed(1)}`;
  for (let i = 0; i < ring.length; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}

/** Çizio'nun gerçekçi kurşun kalemi: uç (0,0), gövde +x yönünde. */
function pencil(L = 440, hw = 46): string {
  const wood = 128, ferr = L - 104, eras = L - 52;
  return `
    <g transform="translate(22 28)" opacity="0.35" filter="url(#blur18)">
      <path d="M0,0 L${wood},${-hw} L${L - 20},${-hw} Q${L},${-hw} ${L},${-hw + 20} L${L},${hw - 20} Q${L},${hw} ${L - 20},${hw} L${wood},${hw} Z" fill="#0b3a52"/>
    </g>
    <path d="M0,0 L${wood + 4},${-hw} L${wood + 4},${hw} Z" fill="url(#wood)"/>
    <path d="M0,0 L${wood + 4},${-hw} L${wood + 4},${-hw / 3} Z" fill="#fbe2bd" opacity="0.8"/>
    <path d="M0,0 L44,-16 Q38,0 44,16 Z" fill="url(#lead)"/>
    <path d="M${wood},${-hw} L${ferr},${-hw} L${ferr},${-hw / 3} L${wood},${-hw / 3} Q${wood - 10},${-hw * 0.66} ${wood},${-hw} Z" fill="url(#faceTop)"/>
    <path d="M${wood},${-hw / 3} L${ferr},${-hw / 3} L${ferr},${hw / 3} L${wood},${hw / 3} Q${wood - 10},0 ${wood},${-hw / 3} Z" fill="url(#faceMid)"/>
    <path d="M${wood},${hw / 3} L${ferr},${hw / 3} L${ferr},${hw} L${wood},${hw} Q${wood - 10},${hw * 0.66} ${wood},${hw / 3} Z" fill="url(#faceBot)"/>
    <path d="M${wood + 6},${-hw / 3} H${ferr} M${wood + 6},${hw / 3} H${ferr}" stroke="#c9770a" stroke-width="2.5" opacity="0.55"/>
    <path d="M${wood + 10},${-hw + 8} H${ferr - 10}" stroke="#fff6d6" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
    <rect x="${ferr}" y="${-hw - 3}" width="${eras - ferr}" height="${2 * hw + 6}" rx="6" fill="url(#metal)"/>
    <path d="M${ferr + 13},${-hw - 3} V${hw + 3} M${ferr + 26},${-hw - 3} V${hw + 3} M${ferr + 39},${-hw - 3} V${hw + 3}" stroke="#8d93a3" stroke-width="3.5" opacity="0.8"/>
    <path d="M${eras},${-hw} H${L - 22} Q${L},${-hw} ${L},${-hw + 22} V${hw - 22} Q${L},${hw} ${L - 22},${hw} H${eras} Z" fill="url(#eraser)"/>
    <path d="M${eras + 8},${-hw + 11} H${L - 20}" stroke="#ffd9de" stroke-width="7" stroke-linecap="round" opacity="0.8"/>`;
}

/**
 * 3B harf kutusu: gölge, kalınlık (alt yüz), parlak ön yüz, kenar ışığı, cam parlaması ve kabartma harf.
 * cx, cy merkez; s kenar; rot derece. Renkler gradyan kimlikleri (defs içinde).
 */
function tile3d(o: { cx: number; cy: number; s: number; rot: number; face: string; side: string; letter: string; ink: string; inkSide: string; fs?: number }): string {
  const { cx, cy, s, rot } = o;
  const h = s / 2;
  const r = s * 0.22;
  const d = s * 0.085;
  const fs = o.fs ?? s * 0.74;
  return `
    <g transform="translate(${cx} ${cy}) rotate(${rot})">
      <rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${r}" fill="#04243f" opacity="0.38" filter="url(#blur18)" transform="translate(${s * 0.05} ${s * 0.13})"/>
      <rect x="${-h}" y="${-h + d}" width="${s}" height="${s}" rx="${r}" fill="url(#${o.side})"/>
      <rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="${r}" fill="url(#${o.face})"/>
      <rect x="${-h + 5}" y="${-h + 5}" width="${s - 10}" height="${s - 10}" rx="${r - 5}" fill="none" stroke="url(#rim)" stroke-width="7"/>
      <path d="M${-h + r} ${-h + 10} H${h - r} Q${h - 12} ${-h + 10} ${h - 14} ${-h + r * 0.9} Q${h * 0.2} ${-h * 0.18} ${-h + 14} ${-h * 0.05} V${-h + r} Q${-h + 10} ${-h + 10} ${-h + r} ${-h + 10} Z" fill="url(#gloss)"/>
      <text x="0" y="${fs * 0.36 + s * 0.035}" text-anchor="middle" font-family="F" font-weight="700" font-size="${fs}" fill="url(#${o.inkSide})">${o.letter}</text>
      <text x="0" y="${fs * 0.36}" text-anchor="middle" font-family="F" font-weight="700" font-size="${fs}" fill="url(#${o.ink})">${o.letter}</text>
    </g>`;
}

/** Sarı parıltı (dört köşeli yıldız) ve ışık çizgisi. */
const sparkle = (x: number, y: number, k: number) =>
  `<path transform="translate(${x} ${y}) scale(${k})" d="M0,-40 C5,-12 12,-5 40,0 C12,5 5,12 0,40 C-5,12 -12,5 -40,0 C-12,-5 -5,-12 0,-40 Z" fill="url(#gold)" stroke="#f3a500" stroke-width="2"/>`;
const ray = (x: number, y: number, rot: number, len: number) =>
  `<rect x="${x - 13}" y="${y - len}" width="26" height="${len}" rx="13" fill="url(#gold)" transform="rotate(${rot} ${x} ${y})"/>`;

/**
 * İkonun iç çizimi (1024'lük alanda): arkada beyaz "C" kutusu, önde kırmızı "A", sağ üstte STOP tabelası.
 * `tight`: Android uyarlanabilir ikonu ve maskable için sıkı yerleşim — ışık çizgileri yok, C ve STOP A'ya yakın,
 * A daha büyük. Telefon ikonu daire/damla maskesiyle kestiği için geniş yerleşim orada küçük kalıyordu (25 Eki 2026).
 */
function art(tight = false): string {
  const oct = (k: number) => {
    const a = 58 * k, b = 146 * k;
    return `M${-a},${-b} L${a},${-b} L${b},${-a} L${b},${a} L${a},${b} L${-a},${b} L${-b},${a} L${-b},${-a} Z`;
  };
  const stopAt = tight ? 'translate(772 318) rotate(12) scale(0.8)' : 'translate(790 262) rotate(12)';
  return `
    ${tight
      ? tile3d({ cx: 318, cy: 330, s: 246, rot: -14, face: 'wFace', side: 'wSide', letter: 'C', ink: 'blueInk', inkSide: 'blueSide' })
      : tile3d({ cx: 286, cy: 300, s: 280, rot: -14, face: 'wFace', side: 'wSide', letter: 'C', ink: 'blueInk', inkSide: 'blueSide' })}
    ${tight
      ? tile3d({ cx: 566, cy: 616, s: 500, rot: -7, face: 'rFace', side: 'rSide', letter: 'A', ink: 'wInk', inkSide: 'rInkSide' })
      : tile3d({ cx: 548, cy: 614, s: 452, rot: -7, face: 'rFace', side: 'rSide', letter: 'A', ink: 'wInk', inkSide: 'rInkSide' })}
    <g transform="${stopAt}">
      <path d="${oct(1)}" fill="#04243f" opacity="0.38" filter="url(#blur12)" transform="translate(10 30)"/>
      <path d="${oct(1)}" fill="url(#stopSide)" transform="translate(0 16)"/>
      <path d="${oct(1)}" fill="url(#stop)"/>
      <path d="${oct(0.85)}" fill="none" stroke="#fff" stroke-width="13"/>
      <path d="M-120,-40 L-50,-120 L50,-120 L96,-74 Q20,-50 -120,8 Z" fill="url(#gloss)"/>
      <text x="0" y="40" text-anchor="middle" font-family="F" font-weight="700" font-size="98" fill="#a3161f" opacity="0.5" transform="translate(0 6)">STOP</text>
      <text x="0" y="40" text-anchor="middle" font-family="F" font-weight="700" font-size="98" fill="#fff" letter-spacing="1">STOP</text>
    </g>
    ${tight ? sparkle(860, 760, 0.8) : `${ray(196, 640, -62, 96)} ${ray(214, 720, -88, 74)}
    ${ray(858, 560, 58, 90)} ${ray(842, 640, 84, 66)}
    ${sparkle(842, 830, 1.15)} ${sparkle(520, 150, 0.7)} ${sparkle(160, 860, 0.55)}`}`;
}

function defs(): string {
  return `<defs>
    <style>@font-face { font-family: F; font-weight: 700; src: url(data:font/woff2;base64,${font}); }</style>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#36dcc0"/><stop offset="0.45" stop-color="#14a9cc"/><stop offset="1" stop-color="#1a5fd0"/></linearGradient>
    <linearGradient id="bgGloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="rFace" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#ff8a6c"/><stop offset="0.45" stop-color="#f6473f"/><stop offset="1" stop-color="#d9262e"/></linearGradient>
    <linearGradient id="rSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b3141f"/><stop offset="1" stop-color="#7d0b16"/></linearGradient>
    <linearGradient id="wFace" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe8f3"/></linearGradient>
    <linearGradient id="wSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9bad0"/><stop offset="1" stop-color="#7f93b0"/></linearGradient>
    <linearGradient id="wInk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffe9e4"/></linearGradient>
    <linearGradient id="rInkSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a3121c"/><stop offset="1" stop-color="#8a0d18"/></linearGradient>
    <linearGradient id="blueInk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fa0ff"/><stop offset="1" stop-color="#1b62e0"/></linearGradient>
    <linearGradient id="blueSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f3f9e"/><stop offset="1" stop-color="#0b2f78"/></linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.7"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0.04"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a6"/><stop offset="0.5" stop-color="#ffd23f"/><stop offset="1" stop-color="#ffb000"/></linearGradient>
    <linearGradient id="stopSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8121d"/><stop offset="1" stop-color="#760a14"/></linearGradient>
    <radialGradient id="glow" cx="0.25" cy="0.18" r="0.8"><stop offset="0" stop-color="#ffffff" stop-opacity="0.32"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.78"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#062a4a" stop-opacity="0.3"/></radialGradient>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#fff6e3"/></linearGradient>
    <linearGradient id="ink" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a52"/><stop offset="1" stop-color="#ef4b5a"/></linearGradient>
    <linearGradient id="stop" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#ff7a6e"/><stop offset="0.5" stop-color="#f03f45"/><stop offset="1" stop-color="#cf2333"/></linearGradient>
    <linearGradient id="faceTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe083"/><stop offset="1" stop-color="#ffc93b"/></linearGradient>
    <linearGradient id="faceMid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffbd2a"/><stop offset="1" stop-color="#f6a311"/></linearGradient>
    <linearGradient id="faceBot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8920c"/><stop offset="1" stop-color="#c97506"/></linearGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e2ad72"/><stop offset="1" stop-color="#f3cf9e"/></linearGradient>
    <linearGradient id="lead" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#23232b"/><stop offset="1" stop-color="#4a4a57"/></linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f5f8"/><stop offset="0.35" stop-color="#cfd3dc"/><stop offset="0.7" stop-color="#a9afbd"/><stop offset="1" stop-color="#8d93a3"/></linearGradient>
    <linearGradient id="eraser" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb3bd"/><stop offset="1" stop-color="#ee7f8f"/></linearGradient>
    <filter id="blur18" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
    <filter id="blur12" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12"/></filter>
    <filter id="blur6" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
    <clipPath id="round"><rect width="${S}" height="${S}" rx="${S * 0.225}"/></clipPath>
  </defs>`;
}

const BG = `<rect width="${S}" height="${S}" fill="url(#bg)"/><rect width="${S}" height="${S}" fill="url(#glow)"/><rect width="${S}" height="${S}" fill="url(#vignette)"/><path d="M0 0 H${S} V330 C${S * 0.7} 430 ${S * 0.3} 440 0 380 Z" fill="url(#bgGloss)"/>`;
/** rounded: şeffaf köşeli · full: tam kare · maskable: tam kare, içerik güvenli alanda · fg: yalnız içerik · bg: yalnız zemin */
function svg(kind: 'rounded' | 'full' | 'maskable' | 'fg' | 'bg'): string {
  // fg (Android uyarlanabilir ön plan) ve maskable: sıkı yerleşim, içeriğin ortası (540, 552) merkeze gelir.
  // Ön plan 108 dp'dir, telefon ortadaki ~72 dp'yi daire/damla maskesiyle gösterir: içerik yarıçapı ≈ 0.36 × kenar.
  const tight = kind === 'fg' || kind === 'maskable';
  const scale = kind === 'maskable' ? 0.84 : kind === 'fg' ? 0.74 : 0.98;
  const [ox, oy] = tight ? [S / 2 - 540 * scale, S / 2 - 552 * scale] : [(S * (1 - scale)) / 2, (S * (1 - scale)) / 2];
  const content = `<g transform="translate(${ox} ${oy}) scale(${scale})">${art(tight)}</g>`;
  const body = kind === 'rounded' ? `<g clip-path="url(#round)">${BG}${content}</g>` : kind === 'fg' ? content : kind === 'bg' ? BG : `${BG}${content}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${defs()}${body}</svg>`;
}

const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe') });
const page = await b.newPage({ viewport: { width: S, height: S } });
const render = async (kind: Parameters<typeof svg>[0]) => {
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(kind)}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: S, height: S } });
};
const rounded = await render('rounded');
const full = await render('full');
const maskable = await render('maskable');
const fg = await render('fg');
const bg = await render('bg');
await b.close();

for (const d of ['public/icons', 'assets', 'store', '.render']) mkdirSync(d, { recursive: true });
await sharp(rounded).resize(512).png().toFile('public/icons/icon-512.png');
await sharp(rounded).resize(192).png().toFile('public/icons/icon-192.png');
await sharp(maskable).resize(512).png().toFile('public/icons/icon-maskable-512.png');
await sharp(full).resize(180).png().toFile('public/icons/apple-touch-icon.png');
await sharp(rounded).resize(64).png().toFile('public/favicon.png');
await sharp(full).resize(512).png().toFile('store/icon-512.png');
await sharp(full).png().toFile('assets/icon-only.png');
await sharp(fg).png().toFile('assets/icon-foreground.png');
await sharp(bg).png().toFile('assets/icon-background.png');
// Açılış ekranı: nane zemin ortasında yuvarlatılmış ikon
const SP = 2732;
const logo = await sharp(rounded).resize(820).png().toBuffer();
for (const f of ['splash.png', 'splash-dark.png'])
  await sharp({ create: { width: SP, height: SP, channels: 4, background: '#cfeee6' } }).composite([{ input: logo, gravity: 'center' }]).png().toFile(`assets/${f}`);

// Önizleme: gerçek boyutlarda + Android dairesel maske
const sizes = [512, 192, 96, 48];
const tiles = await Promise.all(sizes.map((s) => sharp(rounded).resize(s).png().toBuffer()));
const circle = Buffer.from(`<svg width="300" height="300"><circle cx="150" cy="150" r="150"/></svg>`);
const androidRound = await sharp(maskable).resize(300).composite([{ input: circle, blend: 'dest-in' }]).png().toBuffer();
let x = 20;
const comps = tiles.map((t, i) => {
  const c = { input: t, left: x, top: 20 + (512 - sizes[i]) / 2 };
  x += sizes[i] + 30;
  return c;
});
comps.push({ input: androidRound, left: x, top: 126 });
await sharp({ create: { width: x + 320, height: 552, channels: 4, background: '#f2f2f7' } }).composite(comps).png().toFile('.render/icon-preview.png');
console.log('ikonlar üretildi');
