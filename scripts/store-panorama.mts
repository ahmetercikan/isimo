/**
 * Google Play mağaza görselleri — geçişli (panoramik) düzen, Gas Story'deki gibi:
 * sekiz görsel tek bir uzun şeritten kesilir; arka plan rengi, kesik çizgili yol, harf kutuları ve
 * resimler bir görselden ötekine akar. Her görselde başlık + eğik telefon (tablette eğik tablet).
 *   1) npm run dev  2) npx tsx scripts/store-shots.mts phone  (ve tablet)  3) npx tsx scripts/store-panorama.mts
 * Girdi: store/screenshots/{phone,tablet}-*.png, src/assets/home/*.webp (maskot ve oyun resimleri)
 * Çıktı: store/promo/play-phone-01…08.png (1080×1920), play-tablet-01…08.png (1920×1200),
 *        store/promo/play-{phone,tablet}-panorama.png (bütün şerit, önizleme), play-feature.png (1024×500 öne çıkan görsel;
 *        yalnız onu üretmek için: `npx tsx scripts/store-panorama.mts feature`)
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { iconSvg } from '../src/art/icons';

const OUT = resolve('store/promo');
mkdirSync(OUT, { recursive: true });
const data = (p: string, type: string) => `data:${type};base64,${readFileSync(resolve(p)).toString('base64')}`;
const shot = (kind: string, n: string) => data(`store/screenshots/${kind}-${n}.png`, 'image/png');
const art = (n: string) => data(`src/assets/home/${n}.webp`, 'image/webp');

interface Panel { kicker: string; title: string; sub: string; shot: string; tabShot?: string; tint: string; accent: string; deco?: string }
// title içinde <em>…</em> vurgulu renkte yazılır
const PANELS: Panel[] = [
  { kicker: '3 oyun bir arada', title: 'İsim <em>Şehir</em>', sub: 'Arkadaşlarınla ya da botlara karşı, ücretsiz kelime oyunları', shot: '01-ana-sayfa', tabShot: '04-harf', tint: '#ffe3d9', accent: '#f0553c', deco: 'tiger' },
  { kicker: 'Çevrimiçi oda', title: 'Arkadaşlarınla <em>oyna!</em>', sub: '10 kişiye kadar · herkes kendi telefonundan, oda koduyla', shot: '03-lobi', tint: '#fff0c4', accent: '#e39a00' },
  { kicker: 'İsim Şehir', title: 'Harfi çevir, <em>DUR</em> de!', sub: 'A’dan Z’ye sayar · aynı harf iki kez çıkmaz', shot: '05-harf-cikti', tint: '#d5f3ec', accent: '#109584', deco: 'isim' },
  { kicker: 'El yazısı tanıma', title: 'Parmağınla yaz, <em>o okusun!</em>', sub: 'Türkçe el yazısını tanır · istersen klavye de var', shot: '06-el-yazisi', tint: '#ffe0e6', accent: '#e33d62' },
  { kicker: 'Hakem sizsiniz', title: 'Cevaplar <em>herkesin</em> önünde', sub: 'Uydurma cevaba oy ver, emojiyle tepki göster', shot: '08-degerlendirme', tint: '#e6e0ff', accent: '#6a4fe0' },
  { kicker: 'Sıra Sende', title: 'Bir harf değiştir, <em>yeni kelime!</em>', sub: '14 bin kelimelik sözlük · süreyi kaçıran can kaybeder', shot: '12-sira-sende', tint: '#d2f1f6', accent: '#1593c9', deco: 'siram' },
  { kicker: 'Sinema Bilmecesi', title: 'İpuçlarından <em>filmi bil!</em>', sub: 'Tür, yönetmen, oyuncular… erken bilen çok puan alır', shot: '13-film-avi', tint: '#ece0ff', accent: '#7d58ee', deco: 'film' },
  { kicker: 'Kürsüye çık', title: 'Kazanan <em>sen ol!</em>', sub: 'Puanları uygulama tutar · konfeti ve rövanş', shot: '10-kazanan', tint: '#ffe8c2', accent: '#f08a12', deco: 'cards' },
];

const LETTERS = 'AKSMTEBDLRHİÇNYO';
const TILE = ['#ff6b4a', '#14a89a', '#e8a200', '#e9487d', '#7c5cff', '#3ea6f0', '#2bb673', '#ff9f1c'];

function page(kind: 'phone' | 'tablet') {
  const phone = kind === 'phone';
  const PW = phone ? 1080 : 1920;
  const PH = phone ? 1920 : 1200;
  const W = PW * PANELS.length;
  const f = (p: string) => data(p, 'font/woff2');
  // Arka plan: her görselin kendi açık tonu, ortalarda tam, sınırlarda yumuşak geçiş
  const stops = PANELS.map((p, i) => `${p.tint} ${((i + 0.5) / PANELS.length) * 100}%`).join(', ');
  // Kesik çizgili dalgalı yol: bütün şeridi boydan boya geçer
  const yBase = phone ? 1500 : 1020;
  const amp = phone ? 170 : 90;
  let d = `M -100 ${yBase}`;
  for (let i = 0; i < PANELS.length * 2 + 1; i++) {
    const x0 = (i * PW) / 2;
    d += ` C ${x0 + PW / 6} ${yBase + (i % 2 ? amp : -amp)}, ${x0 + PW / 3} ${yBase + (i % 2 ? amp : -amp)}, ${x0 + PW / 2} ${yBase}`;
  }
  // Harf kutuları: çoğu iki görselin sınırına denk gelir (geçişi taşırlar)
  const tiles = Array.from({ length: PANELS.length * 2 }, (_, i) => {
    const onEdge = i % 2 === 1;
    const x = onEdge ? ((i + 1) / 2) * PW - 70 : (i / 2) * PW + PW * (phone ? 0.08 : 0.04);
    const y = phone ? (onEdge ? 300 + ((i * 97) % 380) : 1720 - ((i * 53) % 120)) : (onEdge ? 120 + ((i * 61) % 200) : 1060);
    const s = phone ? (onEdge ? 128 : 96) : (onEdge ? 104 : 80);
    return `<div class="tile" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;font-size:${s * 0.6}px;background:${TILE[i % TILE.length]};transform:rotate(${[-12, 9, -6, 14][i % 4]}deg)">${LETTERS[i % LETTERS.length]}</div>`;
  }).join('');

  const panels = PANELS.map((p, i) => {
    const x = i * PW;
    const tilt = i % 2 ? 6 : -6;
    const yaw = i % 2 ? 14 : -14;
    const dev = phone
      ? `<div class="dev phone" style="left:${x + (p.deco === 'tiger' ? 330 : 190)}px;top:${p.deco === 'cards' ? 1010 : 700}px;width:700px;transform:perspective(2600px) rotateY(${yaw}deg) rotateZ(${tilt}deg)">
           <div class="frame"><img src="${shot(kind, p.shot)}"><div class="island"></div></div></div>`
      : `<div class="dev tablet" style="left:${x + 830}px;top:250px;width:1000px;transform:perspective(3000px) rotateY(${-Math.abs(yaw)}deg) rotateZ(${tilt * 0.6}deg)">
           <div class="frame"><img src="${shot(kind, p.tabShot ?? p.shot)}"></div></div>`;
    const text = phone
      ? `<div class="txt" style="left:${x + 90}px;top:150px;width:${PW - 180}px">`
      : `<div class="txt" style="left:${x + 110}px;top:220px;width:680px">`;
    let deco = '';
    if (p.deco === 'tiger') deco = phone
      ? `<img class="art" src="${art('tiger')}" style="left:${x - 40}px;top:1420px;width:600px;z-index:3">`
      : `<img class="art" src="${art('tiger')}" style="left:${x + 120}px;top:800px;width:470px;z-index:3">`;
    if (p.deco === 'isim' || p.deco === 'siram' || p.deco === 'film') deco = phone
      ? `<img class="art" src="${art(p.deco)}" style="left:${x + (i % 2 ? -40 : 760)}px;top:${i % 2 ? 1340 : 1260}px;width:340px;z-index:3;transform:rotate(${i % 2 ? -8 : 8}deg)">`
      : `<img class="art" src="${art(p.deco)}" style="left:${x + 540}px;top:760px;width:300px;z-index:3;transform:rotate(8deg)">`;
    if (p.deco === 'cards') deco = `<div class="chips" style="left:${x + (phone ? 90 : 110)}px;top:${phone ? 560 : 640}px">
        <span><b>${iconSvg('robot', 76)}</b>Botlara karşı, internetsiz</span>
        <span><b>${iconSvg('haha', 76)}</b>Arkadaş ekle, davet et</span>
        <span><b>${iconSvg('kupa', 76)}</b>Tamamen ücretsiz</span></div>`;
    return `${text}
        <div class="kicker" style="color:${p.accent}">${p.kicker}</div>
        <h1 style="--em:${p.accent}">${p.title}</h1>
        <p>${p.sub}</p></div>${dev}${deco}`;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: F; font-weight: 700; src: url(${f('src/assets/fonts/fredoka-tr-700.woff2')}); }
@font-face { font-family: N; font-weight: 800; src: url(${f('node_modules/@fontsource/nunito/files/nunito-latin-ext-800-normal.woff2')}); unicode-range: U+0100-024F; }
@font-face { font-family: N; font-weight: 800; src: url(${f('node_modules/@fontsource/nunito/files/nunito-latin-800-normal.woff2')}); }
* { margin: 0; box-sizing: border-box; }
html, body { width: ${W}px; height: ${PH}px; overflow: hidden; }
body { position: relative; background: linear-gradient(90deg, ${stops}); color: #3a2b27; }
body > * { position: absolute; }
.blob { border-radius: 50%; background: rgba(255,255,255,.5); }
.dots { inset: 0; background-image: radial-gradient(rgba(255,255,255,.55) 3px, transparent 3.5px); background-size: 46px 46px; opacity: .6; }
.path { left: 0; top: 0; }
.tile { display: grid; place-items: center; border-radius: 26%; font-family: F; font-weight: 700; color: #fff; box-shadow: 0 8px 0 rgba(0,0,0,.14), 0 18px 30px rgba(80,50,30,.18); z-index: 1; }
.txt { display: flex; flex-direction: column; gap: ${phone ? 22 : 20}px; z-index: 4; }
.kicker { font-family: N; font-weight: 800; font-size: ${phone ? 44 : 38}px; letter-spacing: .5px; }
h1 { font-family: F; font-weight: 700; font-size: ${phone ? 112 : 92}px; line-height: 1.02; letter-spacing: -1px; }
h1 em { font-style: normal; color: var(--em); }
.txt p { font-family: N; font-weight: 800; font-size: ${phone ? 44 : 38}px; line-height: 1.3; color: #6b5850; }
.dev { z-index: 2; transform-origin: 50% 40%; }
.frame { position: relative; padding: ${phone ? 24 : 22}px; border-radius: ${phone ? 110 : 60}px; background: linear-gradient(145deg, #2c2a36, #111016);
  box-shadow: 0 0 0 7px #e4e1ea, 0 0 0 11px #a19cab, 40px 60px 90px rgba(80,40,20,.35); }
.frame img { display: block; width: 100%; border-radius: ${phone ? 88 : 40}px; }
.island { position: absolute; left: 50%; top: 46px; width: 170px; height: 48px; margin-left: -85px; background: #07070a; border-radius: 26px; }
.art { filter: drop-shadow(0 24px 30px rgba(80,40,20,.28)); }
.chips { display: flex; flex-direction: column; gap: 20px; z-index: 4; }
.chips span { display: flex; align-items: center; gap: 22px; padding: 18px 34px 18px 18px; border-radius: 999px; background: rgba(255,255,255,.85);
  font-family: N; font-weight: 800; font-size: ${phone ? 40 : 34}px; box-shadow: 0 12px 28px rgba(80,40,20,.14); width: fit-content; }
.chips b { width: ${phone ? 76 : 64}px; height: ${phone ? 76 : 64}px; display: grid; place-items: center; }
.chips b svg { width: 100%; height: 100%; }
</style></head><body>
<div class="dots"></div>
${PANELS.map((_, i) => `<div class="blob" style="left:${i * PW + (i % 2 ? PW * 0.55 : -PW * 0.2)}px;top:${i % 2 ? PH * 0.55 : -PH * 0.12}px;width:${PW * 0.7}px;height:${PW * 0.6}px"></div>`).join('')}
<svg class="path" width="${W}" height="${PH}"><path d="${d}" fill="none" stroke="#ff6b4a" stroke-opacity=".45" stroke-width="${phone ? 14 : 11}" stroke-dasharray="${phone ? '36 30' : '28 24'}" stroke-linecap="round"/></svg>
${tiles}
${panels}
<script>document.fonts.ready.then(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {})))).then(() => setTimeout(() => (window.done = true), 300));</script>
</body></html>`;
}

/** Öne çıkan görsel (1024×500): solda ikon + ad + slogan, ortada eğik telefon, sağda kaplan ve oyun resimleri. */
function featurePage() {
  const f = (p: string) => data(p, 'font/woff2');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: F; font-weight: 700; src: url(${f('src/assets/fonts/fredoka-tr-700.woff2')}); }
@font-face { font-family: N; font-weight: 800; src: url(${f('node_modules/@fontsource/nunito/files/nunito-latin-ext-800-normal.woff2')}); unicode-range: U+0100-024F; }
@font-face { font-family: N; font-weight: 800; src: url(${f('node_modules/@fontsource/nunito/files/nunito-latin-800-normal.woff2')}); }
* { margin: 0; box-sizing: border-box; }
html, body { width: 1024px; height: 500px; overflow: hidden; }
body { position: relative; color: #3a2b27; background:
  radial-gradient(520px 300px at 18% 30%, rgba(255,255,255,.75), transparent 70%),
  linear-gradient(100deg, #ffe3d9 0%, #fff0c4 30%, #d5f3ec 62%, #e6e0ff 100%); }
body > * { position: absolute; }
.dots { inset: 0; background-image: radial-gradient(rgba(255,255,255,.6) 2px, transparent 2.5px); background-size: 26px 26px; opacity: .6; }
.path { left: 0; top: 0; }
.icon { left: 48px; top: 58px; width: 104px; height: 104px; border-radius: 26px; box-shadow: 0 12px 24px rgba(20,80,120,.28); }
.kick { left: 52px; top: 186px; font-family: N; font-weight: 800; font-size: 22px; color: #f0553c; letter-spacing: .3px; }
h1 { left: 46px; top: 214px; font-family: F; font-weight: 700; font-size: 74px; line-height: 1; letter-spacing: -1px; }
h1 em { font-style: normal; color: #f0553c; }
.sub { left: 50px; top: 300px; width: 380px; font-family: N; font-weight: 800; font-size: 21px; line-height: 1.35; color: #6b5850; }
.chips { left: 48px; top: 380px; display: flex; gap: 10px; }
.chips span { padding: 8px 14px; border-radius: 999px; color: #fff; font-family: F; font-weight: 700; font-size: 17px; box-shadow: 0 4px 0 rgba(0,0,0,.12); }
.dev { left: 470px; top: 46px; width: 250px; transform: perspective(1400px) rotateY(-14deg) rotateZ(6deg); z-index: 2; }
.frame { position: relative; padding: 10px; border-radius: 42px; background: linear-gradient(145deg, #2c2a36, #111016); box-shadow: 0 0 0 3px #e4e1ea, 0 0 0 5px #a19cab, 18px 26px 40px rgba(80,40,20,.35); }
.frame img { display: block; width: 100%; border-radius: 33px; }
.island { position: absolute; left: 50%; top: 20px; width: 64px; height: 18px; margin-left: -32px; background: #07070a; border-radius: 10px; }
.art { filter: drop-shadow(0 14px 16px rgba(80,40,20,.25)); z-index: 3; }
.tile { display: grid; place-items: center; border-radius: 26%; font-family: F; font-weight: 700; color: #fff; box-shadow: 0 5px 0 rgba(0,0,0,.14), 0 10px 18px rgba(80,50,30,.18); }
</style></head><body>
<div class="dots"></div>
<svg class="path" width="1024" height="500"><path d="M -20 470 C 200 400, 330 500, 520 450 S 860 380, 1050 440" fill="none" stroke="#ff6b4a" stroke-opacity=".45" stroke-width="6" stroke-dasharray="16 13" stroke-linecap="round"/></svg>
<div class="tile" style="left:400px;top:40px;width:54px;height:54px;font-size:32px;background:#14a89a;transform:rotate(-12deg)">K</div>
<div class="tile" style="left:420px;top:410px;width:46px;height:46px;font-size:28px;background:#e8a200;transform:rotate(9deg)">E</div>
<img class="icon" src="${data('store/icon-512.png', 'image/png')}">
<div class="kick">3 oyun bir arada</div>
<h1>İsim <em>Şehir</em></h1>
<div class="sub">Arkadaşlarınla ya da botlara karşı, ücretsiz kelime oyunları</div>
<div class="chips"><span style="background:#f24d40">İsim Şehir</span><span style="background:#1fa9cf">Sıra Sende</span><span style="background:#7d58ee">Sinema Bilmecesi</span></div>
<div class="dev"><div class="frame"><img src="${shot('phone', '01-ana-sayfa')}"><div class="island"></div></div></div>
<img class="art" src="${art('tiger')}" style="left:724px;top:236px;width:320px">
<img class="art" src="${art('film')}" style="left:800px;top:40px;width:170px;transform:rotate(8deg)">
<script>document.fonts.ready.then(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {})))).then(() => setTimeout(() => (window.done = true), 300));</script>
</body></html>`;
}

function browserPath(): string {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const guesses = process.platform === 'darwin'
    ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
    : ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'];
  const found = guesses.find((g) => existsSync(g));
  if (!found) throw new Error('Chrome ya da Edge bulunamadı; CHROME_PATH ile yolunu ver.');
  return found;
}

const arg = process.argv[2];
const kinds = (arg === 'feature' ? [] : arg ? [arg] : ['phone', 'tablet']) as ('phone' | 'tablet')[];
const browser = await chromium.launch({ executablePath: browserPath() });
if (!arg || arg === 'feature') {
  // 2 kat çözünürlükte çizip 1024×500'e küçült (yazılar keskin kalsın)
  const p = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 2 });
  p.on('pageerror', (e) => console.error('hata:', e.message));
  await p.setContent(featurePage());
  await p.waitForFunction(() => (window as unknown as { done?: boolean }).done === true, null, { timeout: 60000 });
  const big = await p.screenshot();
  await p.close();
  await sharp(big).resize(1024, 500).png({ compressionLevel: 9 }).toFile(`${OUT}/play-feature.png`);
  console.log('✓ öne çıkan görsel');
}
for (const kind of kinds) {
  const PW = kind === 'phone' ? 1080 : 1920;
  const PH = kind === 'phone' ? 1920 : 1200;
  const p = await browser.newPage({ viewport: { width: PW * PANELS.length, height: PH } });
  p.on('pageerror', (e) => console.error('hata:', e.message));
  await p.setContent(page(kind));
  await p.waitForFunction(() => (window as unknown as { done?: boolean }).done === true, null, { timeout: 60000 });
  const wide = `${OUT}/play-${kind}-panorama.png`;
  await p.screenshot({ path: wide });
  await p.close();
  for (let i = 0; i < PANELS.length; i++) {
    await sharp(wide).extract({ left: i * PW, top: 0, width: PW, height: PH }).png({ compressionLevel: 9 }).toFile(`${OUT}/play-${kind}-0${i + 1}.png`);
  }
  console.log('✓', kind);
}
await browser.close();
