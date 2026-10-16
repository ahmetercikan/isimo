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

/** İkonun iç çizimi (1024'lük alanda). */
function art(): string {
  // El yazısı "A": iki bacak tek hamlede, sonra çapraz çizgi (kalem çapraz çizginin sonunda)
  const legs = bezier([318, 760], [
    [[350, 640], [420, 420], [468, 318]],
    [[480, 300], [492, 300], [500, 322]],
    [[548, 440], [598, 640], [628, 752]],
  ]);
  const bar = bezier([360, 596], [[[430, 580], [520, 572], [590, 582]]]);
  const tip = bar[bar.length - 1];
  const ruled = Array.from({ length: 7 }, (_, i) => `<path d="M228 ${330 + i * 76}H736" stroke="#bfe0f2" stroke-width="7" stroke-linecap="round"/>`).join('');
  return `
    <g transform="rotate(-7 480 540)">
      <rect x="196" y="214" width="572" height="652" rx="54" fill="#08324a" opacity="0.32" filter="url(#blur18)" transform="translate(14 26)"/>
      <rect x="196" y="214" width="572" height="652" rx="54" fill="url(#paper)"/>
      ${ruled}
      <path d="M290 236V844" stroke="#ff9d9d" stroke-width="7"/>
      <path d="${ribbon(legs, 64)}" fill="#c43a22" opacity="0.25" transform="translate(6 10)" filter="url(#blur6)"/>
      <path d="${ribbon(legs, 64)}" fill="url(#ink)"/>
      <path d="${ribbon(bar, 56, 0.4)}" fill="url(#ink)"/>
      <circle cx="${tip[0]}" cy="${tip[1]}" r="27" fill="url(#ink)"/>
      <g transform="translate(${tip[0]} ${tip[1]}) rotate(38)">${pencil()}</g>
    </g>
    <g transform="translate(792 246) rotate(13)">
      <path d="M-58,-146 L58,-146 L146,-58 L146,58 L58,146 L-58,146 L-146,58 L-146,-58 Z" fill="#08324a" opacity="0.35" filter="url(#blur12)" transform="translate(10 18)"/>
      <path d="M-58,-146 L58,-146 L146,-58 L146,58 L58,146 L-58,146 L-146,58 L-146,-58 Z" fill="url(#stop)"/>
      <path d="M-50,-124 L50,-124 L124,-50 L124,50 L50,124 L-50,124 L-124,50 L-124,-50 Z" fill="none" stroke="#fff" stroke-width="13"/>
      <text x="0" y="36" text-anchor="middle" font-family="F" font-weight="700" font-size="98" fill="#fff" letter-spacing="1">STOP</text>
      <path d="M-104,-62 Q-70,-108 -20,-112" stroke="#fff" stroke-width="12" stroke-linecap="round" fill="none" opacity="0.35"/>
    </g>
    <path d="M172 214 q9 30 39 39 q-30 9 -39 39 q-9 -30 -39 -39 q30 -9 39 -39 Z" fill="#fffbea"/>
    <path d="M846 520 q7 22 29 29 q-22 7 -29 29 q-7 -22 -29 -29 q22 -7 29 -29 Z" fill="#ffffff" opacity="0.9"/>
    <circle cx="152" cy="820" r="12" fill="#ffffff" opacity="0.7"/>`;
}

function defs(): string {
  return `<defs>
    <style>@font-face { font-family: F; font-weight: 700; src: url(data:font/woff2;base64,${font}); }</style>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2fd6b4"/><stop offset="0.5" stop-color="#16a6c4"/><stop offset="1" stop-color="#1767c9"/></linearGradient>
    <radialGradient id="glow" cx="0.25" cy="0.18" r="0.8"><stop offset="0" stop-color="#ffffff" stop-opacity="0.32"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.78"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#062a4a" stop-opacity="0.3"/></radialGradient>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#fff6e3"/></linearGradient>
    <linearGradient id="ink" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a52"/><stop offset="1" stop-color="#ef4b5a"/></linearGradient>
    <linearGradient id="stop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="1" stop-color="#d92b3a"/></linearGradient>
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

const BG = `<rect width="${S}" height="${S}" fill="url(#bg)"/><rect width="${S}" height="${S}" fill="url(#glow)"/><rect width="${S}" height="${S}" fill="url(#vignette)"/>`;
/** rounded: şeffaf köşeli · full: tam kare · maskable: tam kare, içerik güvenli alanda · fg: yalnız içerik · bg: yalnız zemin */
function svg(kind: 'rounded' | 'full' | 'maskable' | 'fg' | 'bg'): string {
  const scale = kind === 'maskable' ? 0.78 : kind === 'fg' ? 0.64 : 0.98;
  const off = (S * (1 - scale)) / 2;
  const content = `<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g>`;
  const body = kind === 'rounded' ? `<g clip-path="url(#round)">${BG}${content}</g>` : kind === 'fg' ? content : kind === 'bg' ? BG : `${BG}${content}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${defs()}${body}</svg>`;
}

const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
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
