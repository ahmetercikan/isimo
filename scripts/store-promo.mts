/**
 * Mağaza tanıtım görselleri: ham ekran görüntülerini başlıklı, renkli kartlara çevirir.
 *   npx tsx scripts/store-promo.mts
 * Girdi: store/screenshots/ (scripts/store-shots.mts). Çıktı: store/promo/
 *   - phone-01…08.png  (1080×1920, Google Play telefon)
 *   - tablet-01…08.png (1920×1200, Google Play 7" ve 10" tablet)
 *   - feature-graphic.png (1024×500, öne çıkan görsel)
 *   - ios/<boyut>-01…08.png (App Store; boyutlar IOS_SIZES içinde)
 * App Store kartları **geçişli (panoramik)**: sekiz görüntü tek bir geniş şeritten kesilir,
 * böylece arka plan, lekeler, harf karoları ve kalem çizgisi bir görüntüden diğerine akar.
 * Tarayıcı: CHROME_PATH ya da işletim sistemine göre Chrome/Edge.
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = resolve('store/promo');
mkdirSync(OUT, { recursive: true });
const b64 = (p: string) => readFileSync(resolve(p)).toString('base64');
const font = (p: string) => `data:font/woff2;base64,${b64(p)}`;
const img = (p: string) => `data:image/png;base64,${b64(`store/screenshots/${p}`)}`;

interface Slide { title: string; sub: string; bg: [string, string]; ink: string; shot: string; badge?: string }
const SLIDES: Slide[] = [
  { title: 'Arkadaşlarınla<br>İsim Şehir!', sub: '10 kişiye kadar · herkes kendi telefonundan', bg: ['#ffd3c4', '#ff8a6a'], ink: '#5a1e10', shot: '03-lobi', badge: 'Ücretsiz' },
  { title: 'Harfi çevir,<br>DUR de!', sub: 'A’dan Z’ye sayar · aynı harf iki kez çıkmaz', bg: ['#fff1bf', '#ffc83d'], ink: '#4d3500', shot: '04-harf' },
  { title: 'Parmağınla yaz,<br>o okusun!', sub: 'Türkçe el yazısı tanıma · klavye de var', bg: ['#c9f4ec', '#3cc7b3'], ink: '#073f38', shot: '06-el-yazisi', badge: 'Yeni' },
  { title: 'İlk bitiren<br>STOP der!', sub: 'Diğerlerine yalnızca 10 saniye kalır', bg: ['#ffd0d6', '#ff6680'], ink: '#5c0d1c', shot: '07-stop' },
  { title: 'Cevaplar<br>herkesin önünde', sub: 'El yazısıyla gelir · uydurmaya 👎 oy ver', bg: ['#e3dcff', '#9d86ff'], ink: '#2b1a6b', shot: '08-degerlendirme' },
  { title: 'Puanları<br>uygulama tutar', sub: 'Tek cevap 10 · aynı 5 · tek başına 20 puan', bg: ['#cfe9ff', '#5fb0f5'], ink: '#0b3358', shot: '09-puanlar' },
  { title: 'Kürsüye çık,<br>kazanan sen ol!', sub: 'Ödüller, konfeti ve rövanş', bg: ['#ffe6b8', '#ffa94d'], ink: '#4f2a00', shot: '10-kazanan' },
  { title: 'İnternet yok mu?<br>Botlara karşı!', sub: '14 kategori · kendi kategorini ekle', bg: ['#d9f5d0', '#6fd18a'], ink: '#123f1c', shot: '02-ayarlar', badge: 'İnternetsiz' },
];

const css = `
@font-face { font-family: F; font-weight: 700; src: url(${font('src/assets/fonts/fredoka-tr-700.woff2')}); }
@font-face { font-family: N; font-weight: 800; src: url(${font('node_modules/@fontsource/nunito/files/nunito-latin-ext-800-normal.woff2')}); unicode-range: U+0100-024F; }
@font-face { font-family: N; font-weight: 800; src: url(${font('node_modules/@fontsource/nunito/files/nunito-latin-800-normal.woff2')}); }
* { margin: 0; box-sizing: border-box; }
body { width: var(--w); height: var(--h); overflow: hidden; }
.card { position: relative; width: 100%; height: 100%; overflow: hidden; background: linear-gradient(160deg, var(--a), var(--b)); color: var(--ink); }
.dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,.45) 2px, transparent 2.5px); background-size: 34px 34px; opacity: .55; }
.blob { position: absolute; border-radius: 50%; background: rgba(255,255,255,.28); }
.tiles { position: absolute; display: flex; gap: 10px; opacity: .9; }
.tile { display: grid; place-items: center; border-radius: 18px; font-family: F; font-weight: 700; color: #fff; box-shadow: 0 6px 0 rgba(0,0,0,.15); }
h1 { font-family: F; font-weight: 700; line-height: 1.02; letter-spacing: -0.5px; text-shadow: 0 3px 0 rgba(255,255,255,.55); }
p { font-family: N; font-weight: 800; opacity: .85; }
.dev { position: absolute; border-radius: 46px; background: #1d1b26; padding: 14px; box-shadow: 0 30px 60px rgba(0,0,0,.28), 0 0 0 3px rgba(255,255,255,.35); }
.dev img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top; border-radius: 34px; }
.txt { position: absolute; display: flex; flex-direction: column; gap: 22px; align-items: flex-start; }
.badge { position: absolute; font-family: F; font-weight: 700; background: #fff; color: var(--ink); border-radius: 999px; box-shadow: 0 8px 20px rgba(0,0,0,.15); transform: rotate(-6deg); }
.badge::before { content: '★ '; color: #ffb703; }
.txt .badge { position: static; }
`;

const LETTERS = ['A', 'K', 'S', 'M', 'T', 'E', 'B', 'D'];
const TILE_COLORS = ['#ff6b4a', '#14a89a', '#e8a200', '#e9487d', '#7c5cff', '#3ea6f0', '#2bb673', '#ff9f1c'];
const deco = (i: number, size: number, style: string) =>
  `<div class="tiles" style="${style}">${[0, 1, 2].map((k) => `<div class="tile" style="width:${size}px;height:${size}px;font-size:${size * 0.62}px;background:${TILE_COLORS[(i + k * 3) % 8]};transform:rotate(${[-10, 6, -4][k]}deg)">${LETTERS[(i + k) % 8]}</div>`).join('')}</div>`;

function phone(s: Slide, i: number) {
  return `<div class="card" style="--a:${s.bg[0]};--b:${s.bg[1]};--ink:${s.ink}">
    <div class="dots"></div><div class="blob" style="width:700px;height:700px;right:-260px;top:-300px"></div><div class="blob" style="width:420px;height:420px;left:-180px;bottom:180px"></div>
    ${deco(i, 64, 'right:60px;top:70px')}
    <div class="txt" style="left:70px;right:60px;top:150px"><h1 style="font-size:100px">${s.title}</h1><p style="font-size:38px;margin-left:4px">${s.sub}</p></div>
    <div class="dev" style="left:150px;top:560px;width:780px;height:1460px;transform:rotate(${i % 2 ? 3 : -3}deg)"><img src="${img(`phone-${s.shot}.png`)}"></div>
    ${s.badge ? `<div class="badge" style="right:56px;top:500px;font-size:40px;padding:14px 30px">${s.badge}</div>` : ''}
  </div>`;
}
function tablet(s: Slide, i: number) {
  return `<div class="card" style="--a:${s.bg[0]};--b:${s.bg[1]};--ink:${s.ink}">
    <div class="dots"></div><div class="blob" style="width:760px;height:760px;left:-300px;top:-320px"></div><div class="blob" style="width:500px;height:500px;right:-160px;bottom:-200px"></div>
    ${deco(i, 60, 'left:96px;top:120px')}
    <div class="txt" style="left:96px;width:640px;top:50%;transform:translateY(-44%)"><h1 style="font-size:86px">${s.title}</h1><p style="font-size:34px;margin-left:4px">${s.sub}</p>${s.badge ? `<div class="badge" style="font-size:34px;padding:12px 28px">${s.badge}</div>` : ''}</div>
    <div class="dev" style="left:780px;top:190px;width:1080px;height:705px;border-radius:40px;transform:rotate(${i % 2 ? 2 : -2}deg)"><img src="${img(`tablet-${s.shot}.png`)}" style="border-radius:28px"></div>
  </div>`;
}
function feature() {
  const shots = ['04-harf', '06-el-yazisi', '09-puanlar'];
  const word = (w: string, colors: number[], size: number) =>
    `<div style="display:flex;gap:7px">${w.split('').map((ch, k) => `<div class="tile" style="width:${size}px;height:${size}px;font-size:${size * 0.62}px;background:${TILE_COLORS[colors[k % colors.length]]};transform:rotate(${((k * 7) % 5) - 2}deg)">${ch}</div>`).join('')}</div>`;
  return `<div class="card" style="--a:#ffe7d6;--b:#c9f1ea;--ink:#3a1d12">
    <div class="dots"></div><div class="blob" style="width:520px;height:520px;left:-200px;top:-260px"></div>
    <div style="position:absolute;left:52px;top:62px;display:flex;flex-direction:column;gap:8px">${word('İSİM', [0, 1, 2, 3], 66)}${word('ŞEHİR', [4, 5, 6, 7, 0], 66)}</div>
    <div style="position:absolute;left:378px;top:172px;font-family:F;font-weight:700;font-size:24px;padding:7px 14px;border-radius:12px;background:#ef4b4b;color:#fff;transform:rotate(-12deg);box-shadow:0 5px 0 #b02a2a">STOP!</div>
    <p style="position:absolute;left:56px;top:248px;width:440px;font-size:28px;line-height:1.22">Arkadaşlarınla online oyna, elinle yaz, ilk sen STOP de!</p>
    <p style="position:absolute;left:58px;top:362px;font-size:19px;opacity:.7">10 kişiye kadar · el yazısı · otomatik puan</p>
    ${shots.map((sh, k) => `<div class="dev" style="left:${520 + k * 162}px;top:${k === 1 ? 40 : 80}px;width:196px;height:390px;border-radius:26px;padding:7px;transform:rotate(${[-7, 0, 7][k]}deg);z-index:${k === 1 ? 2 : 1}"><img src="${img(`phone-${sh}.png`)}" style="border-radius:20px"></div>`).join('')}
  </div>`;
}

const CANDIDATES = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].filter(Boolean) as string[];
const exe = CANDIDATES.find((c) => existsSync(c));
if (!exe) throw new Error('Chrome/Edge bulunamadı: CHROME_PATH verin.');
const b = await chromium.launch({ executablePath: exe });
const render = async (html: string, w: number, h: number, out: string) => {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage();
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="--w:${w}px;--h:${h}px">${html}</body></html>`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: out });
  await p.close();
};
for (const [i, s] of SLIDES.entries()) {
  const n = String(i + 1).padStart(2, '0');
  await render(phone(s, i), 1080, 1920, `${OUT}/phone-${n}.png`);
  await render(tablet(s, i), 1920, 1200, `${OUT}/tablet-${n}.png`);
}
await render(feature(), 1024, 500, `${OUT}/feature-graphic.png`);

// ——— App Store: geçişli (panoramik) kartlar ———
// Sekiz görüntü tek bir geniş şeritten kesilir; arka plan, lekeler, harf karoları ve kalem
// çizgisi slayt sınırlarını aşar, mağazada yan yana bakıldığında tek bir resim gibi akar.
// Boyutlar: App Store Connect → "screenshot specifications".
interface IosSize { id: string; w: number; h: number; shot: (s: Slide) => string; ar: number }
const IOS_SIZES: IosSize[] = [
  { id: 'iphone-6-3', w: 1206, h: 2622, shot: (s) => `ios/iphone-${s.shot}.png`, ar: 2622 / 1206 }, // zorunlu
  { id: 'iphone-6-9', w: 1290, h: 2796, shot: (s) => `ios/iphone-${s.shot}.png`, ar: 2622 / 1206 },
  { id: 'ipad-13', w: 2064, h: 2752, shot: (s) => `ios/ipad-${s.shot}.png`, ar: 2752 / 2064 }, // iPad'de çalışıyorsa zorunlu
];

/** Şeridin tamamı: genişlik = slayt sayısı × tek görüntü genişliği. */
function serit(boyut: IosSize) {
  const { w: W, h: H, ar } = boyut;
  const dar = W / H < 0.6; // telefon mu tablet mi
  const N = SLIDES.length;
  const TW = W * N;
  const u = W / (dar ? 1206 : 2064); // ölçek
  const duraklar = SLIDES.map((s, i) => `${s.bg[0]} ${(((i + 0.18) / N) * 100).toFixed(2)}%, ${s.bg[1]} ${(((i + 0.74) / N) * 100).toFixed(2)}%`).join(', ');
  // kalem çizgisi: şeridi baştan sona yumuşak bir dalgayla geçer
  const dalga = SLIDES.map((_, i) => {
    const x0 = i * W, y0 = (i % 2 ? 0.248 : 0.272) * H, y1 = (i % 2 ? 0.272 : 0.248) * H;
    return `${i === 0 ? `M ${x0} ${y0}` : ''} C ${x0 + W * 0.3} ${y0 - H * 0.022}, ${x0 + W * 0.7} ${y1 + H * 0.022}, ${x0 + W} ${y1}`;
  }).join(' ');
  const lekeler = [0.1, 0.35, 0.6, 0.85].map((f, k) => {
    const r = (k % 2 ? 0.95 : 1.3) * W;
    return `<div class="blob" style="width:${r}px;height:${r}px;left:${TW * f - r / 2}px;top:${(k % 2 ? 0.55 : -0.2) * H}px"></div>`;
  }).join('');
  // harf karoları: slayt sınırlarını aşacak şekilde şeride eşit aralıklarla serpilir
  const grup = Math.round(N * 1.3);
  const karolar = Array.from({ length: grup }, (_, k) => {
    const size = (dar ? 66 : 88) * u;
    const x = (k + 0.3) * (TW / grup);
    const y = (k % 2 ? 0.016 : 0.026) * H;
    return deco(k, size, `left:${x}px;top:${y}px;gap:${10 * u}px`);
  }).join('');
  const kartlar = SLIDES.map((s, i) => {
    const x = i * W;
    const dw = (dar ? 0.66 : 0.64) * W;
    const dh = dw * ar;
    const kay = dar ? (i % 2 ? 0.04 : -0.04) * W : 0; // sırayla sağa/sola kayar
    const dx = x + (W - dw) / 2 + kay;
    const dy = 0.305 * H;
    return `<div class="txt" style="left:${x + 72 * u}px;width:${W - 144 * u}px;top:${0.055 * H}px;gap:${18 * u}px;--ink:${s.ink}">
      <h1 style="font-size:${(dar ? 104 : 132) * u}px">${s.title}</h1>
      <p style="font-size:${(dar ? 40 : 50) * u}px">${s.sub}</p>
      ${s.badge ? `<div class="badge" style="font-size:${(dar ? 38 : 48) * u}px;padding:${13 * u}px ${30 * u}px;--ink:${s.ink}">${s.badge}</div>` : ''}
    </div>
    <div class="dev" style="left:${dx}px;top:${dy}px;width:${dw}px;height:${dh}px;border-radius:${(dar ? 48 : 56) * u}px;padding:${(dar ? 14 : 18) * u}px;transform:rotate(${i % 2 ? 2.2 : -2.2}deg)"><img src="${img(boyut.shot(s))}" style="border-radius:${(dar ? 36 : 40) * u}px"></div>`;
  }).join('');
  return `<div class="serit" style="width:${TW}px;height:${H}px;background:linear-gradient(100deg, ${duraklar})">
    <div class="dots"></div>${lekeler}
    <svg width="${TW}" height="${H}" style="position:absolute;inset:0"><path d="${dalga}" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="${8 * u}" stroke-linecap="round" stroke-dasharray="${28 * u} ${32 * u}"/></svg>
    ${karolar}${kartlar}
  </div>`;
}

const IOS_OUT = resolve('store/promo/ios');
mkdirSync(IOS_OUT, { recursive: true });
for (const boyut of IOS_SIZES) {
  const { w: W, h: H } = boyut;
  const sayfa = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
  await sayfa.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}
    body { width: ${W}px; height: ${H}px; overflow: hidden; }
    .pencere { position: absolute; inset: 0; overflow: hidden; }
    .serit { position: absolute; left: 0; top: 0; }
    .txt { color: var(--ink); }
    .txt h1, .txt p { color: var(--ink); }
  </style></head><body><div class="pencere">${serit(boyut)}</div></body></html>`);
  await sayfa.evaluate(() => document.fonts.ready);
  await sayfa.waitForTimeout(600);
  for (let i = 0; i < SLIDES.length; i++) {
    await sayfa.evaluate((dx) => { (document.querySelector('.serit') as HTMLElement).style.transform = `translateX(${dx}px)`; }, -i * W);
    await sayfa.waitForTimeout(150);
    await sayfa.screenshot({ path: `${IOS_OUT}/${boyut.id}-${String(i + 1).padStart(2, '0')}.png` });
  }
  await sayfa.close();
}
await b.close();
console.log('hazır:', OUT, 've', IOS_OUT);
