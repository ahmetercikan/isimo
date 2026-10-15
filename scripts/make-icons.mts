/**
 * Uygulama ikonu ve açılış ekranı: Fredoka harfli renkli kutular (tarayıcıda çizilip PNG alınır).
 *   npx tsx scripts/make-icons.mts && npx capacitor-assets generate --android
 * Çıktılar: assets/icon-only.png, icon-foreground.png, icon-background.png, splash.png, splash-dark.png,
 *           store/icon-512.png, public/icons/icon-512.png
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const font = readFileSync('src/assets/fonts/fredoka-tr-700.woff2').toString('base64');
const css = `@font-face { font-family: F; src: url(data:font/woff2;base64,${font}) format('woff2'); }
* { margin: 0; box-sizing: border-box; } body { width: 1024px; height: 1024px; font-family: F; }
.bg { position: absolute; inset: 0; background: radial-gradient(circle at 30% 20%, #ff9a6b, #ff6b4a 45%, #f0436a); }
.tile { position: absolute; width: 380px; height: 380px; border-radius: 96px; display: grid; place-items: center; font-size: 270px; color: #fff;
  box-shadow: 0 26px 0 rgba(0,0,0,0.2), 0 40px 60px rgba(80,20,10,0.35); text-shadow: 0 12px 0 rgba(0,0,0,0.15); line-height: 1; padding-top: 18px; }
.a { left: 190px; top: 230px; background: linear-gradient(160deg, #2fd3b8, #14a89a 55%, #0f8fb0); transform: rotate(-9deg); }
.b { left: 460px; top: 370px; background: linear-gradient(160deg, #ffd84d, #ffb703); color: #3a2b27; transform: rotate(8deg); text-shadow: none; }
.stop { position: absolute; left: 610px; top: 150px; width: 210px; height: 210px; background: #ef4b4b; color: #fff; display: grid; place-items: center; font-size: 62px;
  clip-path: polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%); transform: rotate(12deg); letter-spacing: 1px; }
.stop::before { content: ''; position: absolute; inset: 12px; border: 8px solid #fff; clip-path: inherit; }
.fg .bg { display: none; } .fg .wrap { transform: scale(0.72); transform-origin: 50% 50%; position: absolute; inset: 0; }
.nobg .bg { display: none; }`;
const html = (cls: string) => `<html><head><style>${css}</style></head><body class="${cls}"><div class="bg"></div><div class="wrap"><div class="tile a">İ</div><div class="tile b">Ş</div><div class="stop">STOP</div></div></body></html>`;

const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const p = await b.newPage({ viewport: { width: 1024, height: 1024 } });
const snap = async (cls: string, path: string, transparent = false) => {
  await p.setContent(html(cls));
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path, omitBackground: transparent });
};
mkdirSync('assets', { recursive: true });
mkdirSync('store', { recursive: true });
mkdirSync('public/icons', { recursive: true });
await snap('', 'assets/icon-only.png');
await snap('fg', 'assets/icon-foreground.png', true);
await p.setContent(`<html><body style="margin:0;width:1024px;height:1024px;background:radial-gradient(circle at 30% 20%, #ff9a6b, #ff6b4a 45%, #f0436a)"></body></html>`);
await p.screenshot({ path: 'assets/icon-background.png' });
await snap('nobg', '.render/logo-transparent.png', true);
await b.close();

const logo = await sharp('.render/logo-transparent.png').resize(900).png().toBuffer();
for (const [name, bg] of [['splash.png', '#cfeee6'], ['splash-dark.png', '#cfeee6']] as const)
  await sharp({ create: { width: 2732, height: 2732, channels: 4, background: bg } }).composite([{ input: logo, gravity: 'center' }]).png().toFile(`assets/${name}`);
await sharp('assets/icon-only.png').resize(512).png().toFile('store/icon-512.png');
await sharp('assets/icon-only.png').resize(512).png().toFile('public/icons/icon-512.png');
console.log('ikonlar hazır');
