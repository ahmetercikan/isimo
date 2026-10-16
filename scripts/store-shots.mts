/**
 * Mağaza için ham ekran görüntüleri: gerçek bir oyun oynatılır, her ekran yakalanır.
 *   1) npm run dev   2) npx tsx scripts/store-shots.mts [phone|tablet]
 * Çıktı: store/screenshots/{phone|tablet}-*.png (telefon 1080×1920, tablet 1920×1200)
 * El yazısı: Hershey tek çizgili el yazısı fontu (hersheytext) parmak hareketine çevrilip yazı defterine çizilir.
 */
import { chromium, type Page } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import hershey from 'hersheytext';

const URL = 'http://localhost:5290/';
const KIND = (process.argv[2] ?? 'phone') as 'phone' | 'tablet';
const VIEW = KIND === 'phone' ? { width: 405, height: 720, deviceScaleFactor: 1080 / 405 } : { width: 1280, height: 800, deviceScaleFactor: 1.5 };
const OUT = 'store/screenshots';
mkdirSync(OUT, { recursive: true });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Kelimeyi el yazısı çizgilerine çevirir (0..1 aralığında, y aşağı). */
function wordStrokes(word: string): { strokes: [number, number][][]; w: number } {
  const font = hershey.getFontData('hershey_script_1');
  let x = 0;
  const strokes: [number, number][][] = [];
  for (const ch of word) {
    const g = font.getChar(ch);
    if (!g) continue;
    for (const part of g.d.split('M').map((s: string) => s.trim()).filter(Boolean)) {
      const nums = part.replace(/L/g, ' ').trim().split(/\s+/).map(Number);
      const pts: [number, number][] = [];
      for (let i = 0; i < nums.length; i += 2) pts.push([x + nums[i], -nums[i + 1]]);
      strokes.push(pts);
    }
    x += g.width;
  }
  return { strokes, w: x };
}

/** Yazı defterine kelimeyi el yazısıyla yazar (fare/parmak hareketi). */
async function handwrite(p: Page, word: string) {
  const box = (await (await p.$('.inkpad__canvas'))!.boundingBox())!;
  const { strokes, w } = wordStrokes(word);
  const capH = 700;
  const k = Math.min((box.height * 0.42) / capH, (box.width - 90) / w);
  const ox = box.x + (box.width - w * k) / 2;
  const oy = box.y + box.height * 0.68;
  for (const s of strokes) {
    const pts = s.map(([x, y]) => [ox + x * k, oy + y * k] as const);
    await p.mouse.move(pts[0][0], pts[0][1]);
    await p.mouse.down();
    for (let i = 1; i < pts.length; i++) await p.mouse.move(pts[i][0], pts[i][1], { steps: 3 });
    await p.mouse.up();
  }
  await sleep(2600); // tanıma
}

const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const p = await (await b.newContext({ viewport: { width: VIEW.width, height: VIEW.height }, deviceScaleFactor: VIEW.deviceScaleFactor, hasTouch: true, isMobile: true })).newPage();
const shot = async (n: string) => p.screenshot({ path: `${OUT}/${KIND}-${n}.png` });
const game = (js: string) => p.evaluate(`import('/src/store/useGame.ts').then(async (m) => { const g = m.useGame.getState(); const t = g.t, s = g.s; ${js} })`);

await p.goto(URL);
await p.evaluate(() =>
  localStorage.setItem('isimsehir-v1', JSON.stringify({
    state: {
      name: 'Elif', avatar: '🦊', color: '#ff6b4a', sfx: false, music: false, voice: false, haptics: false,
      settings: { cats: [['isim', 'İsim', '🧒'], ['sehir', 'Şehir', '🏙️'], ['hayvan', 'Hayvan', '🦁'], ['bitki', 'Bitki', '🌿'], ['esya', 'Eşya', '🪑'], ['ulke', 'Ülke', '🌍']].map(([id, label, emoji]) => ({ id, label, emoji })), rounds: 5, time: 120, stop: true, grace: 10, hard: false, manualStop: true },
      bots: { count: 9, level: 3 }, stats: { games: 12, wins: 7, best: 190, points: 1460 }, lastRoom: null,
    },
    version: 1,
  })),
);
await p.goto(URL + '?r=1#/');
await sleep(2200);
await shot('01-ana-sayfa');
await p.click('.mode-card--bots');
await sleep(1200);
await shot('02-ayarlar');
await p.click('.page__cta .pill', { force: true });
await p.waitForSelector('.lobby');
// Mağaza görseli için lobiyi çevrimiçi oda gibi göster (kod + 10 oyuncu)
await game(`t.kind = 'online'; await t.update({ code: 'KR7ZM' });`);
await p.addStyleTag({ content: '.player-slot__kick { display: none !important; }' });
await sleep(1500);
await shot('03-lobi');
await p.click('.page__cta .pill', { force: true });
await p.waitForSelector('.dur-btn');
await sleep(2200);
await p.evaluate(`new Promise((res) => { const f = () => { const t = document.querySelector('.letter-tile--spin'); if (t && t.textContent === 'H') res(1); else requestAnimationFrame(f); }; f(); })`);
await shot('04-harf');
await p.evaluate(`new Promise((res) => { const f = () => { const t = document.querySelector('.letter-tile--spin'); const b = document.querySelector('.dur-btn'); if (t && b && t.textContent === 'K') { b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); res(1); } else requestAnimationFrame(f); }; f(); })`);
await sleep(1100);
await shot('05-harf-cikti');
await p.waitForSelector('.inkpad__canvas', { timeout: 20000 });
const writeStart = Date.now();
await sleep(400);
await handwrite(p, 'Kemal');
await p.click('.tool--next');
await sleep(500);
await handwrite(p, 'Kars');
await p.click('.tool--next');
await sleep(500);
await handwrite(p, 'Kartal');
await shot('06-el-yazisi');
// Kalanlar klavyeyle
await p.click('.tool[aria-label="Klavye"]');
for (const [i, w] of [[3, 'Karanfil'], [4, 'Kalem'], [5, 'Kanada']] as const) {
  await (await p.$$('.cat-tab'))[i].click();
  await p.fill('.input--answer', w);
}
await p.click('.tool[aria-label="El yazısı"]');
await (await p.$$('.cat-tab'))[2].click();
await sleep(600);
// Botlar cevaplarını yazsın, sonra bir bot STOP desin
await sleep(Math.max(0, 42000 - (Date.now() - writeStart)));
await game(`await t.transactCtl((c) => ({ ...c, stopBy: 'bot2', endAt: Math.min(c.endAt, t.now() + 10000), seq: c.seq + 1 }));`);
await sleep(1600);
await shot('07-stop');
await p.waitForSelector('.review', { timeout: 30000 });
await sleep(2500);
// Bir cevaba itiraz + tepki
const rows = await p.$$('.answer-row .vote');
if (rows[1]) await rows[1].click();
await p.click('.react-btn');
await sleep(250);
await p.click('.react-btn:nth-child(2)');
await sleep(700);
await shot('08-degerlendirme');
for (let i = 0; i < 14 && !(await p.$('.scores')); i++) {
  await p.click('.review__foot .pill', { force: true }).catch(() => {});
  await sleep(1400);
}
await p.waitForSelector('.scores', { timeout: 30000 });
await sleep(2400);
await shot('09-puanlar');
await game(`await t.transactCtl((c) => ({ ...c, phase: 'final', seq: c.seq + 1 }));`);
await p.waitForSelector('.final');
await sleep(5200);
await shot('10-kazanan');
await b.close();
console.log('hazır:', KIND);
