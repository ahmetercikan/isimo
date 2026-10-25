/**
 * Mağaza için ham ekran görüntüleri: gerçek bir oyun oynatılır, her ekran yakalanır.
 *   1) npm run dev   2) npx tsx scripts/store-shots.mts [phone|tablet|iphone|ipad] [ek]
 * Çıktı:
 *   Google Play: store/screenshots/{phone|tablet}-*.png (telefon 1080×1920, tablet 1920×1200)
 *   App Store:   store/screenshots/ios/{iphone|ipad}-*.png (iPhone 1206×2622, iPad 2064×2752 — Apple'ın istediği boyutlar)
 * Tarayıcı: Chrome ya da Edge. Bulunamazsa CHROME_PATH ile yolunu ver.
 * El yazısı: Hershey tek çizgili el yazısı fontu (hersheytext) parmak hareketine çevrilip yazı defterine çizilir.
 */
import { chromium, type Page } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import hershey from 'hersheytext';

const URL = 'http://localhost:5290/';
const KIND = (process.argv[2] ?? 'phone') as keyof typeof VIEWS;
/** Her mağaza boyutu: CSS ölçüsü × deviceScaleFactor = istenen piksel. */
const VIEWS = {
  phone: { width: 405, height: 720, deviceScaleFactor: 1080 / 405 },   // Play telefon 1080×1920
  tablet: { width: 1280, height: 800, deviceScaleFactor: 1.5 },        // Play tablet 1920×1200
  iphone: { width: 402, height: 874, deviceScaleFactor: 3 },           // App Store iPhone 1206×2622
  ipad: { width: 1032, height: 1376, deviceScaleFactor: 2 },           // App Store iPad 13" 2064×2752
} as const;
const VIEW = VIEWS[KIND] ?? VIEWS.phone;
const OUT = KIND === 'iphone' || KIND === 'ipad' ? 'store/screenshots/ios' : 'store/screenshots';
mkdirSync(OUT, { recursive: true });

/** Chrome/Edge yolu: önce CHROME_PATH, sonra işletim sisteminin bilinen yerleri. */
function browserPath(): string {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const guesses = process.platform === 'darwin'
    ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
    : ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'];
  const found = guesses.find((g) => existsSync(g));
  if (!found) throw new Error('Chrome ya da Edge bulunamadı; CHROME_PATH ile yolunu ver.');
  return found;
}
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

const b = await chromium.launch({ executablePath: browserPath() });
const p = await (await b.newContext({ viewport: { width: VIEW.width, height: VIEW.height }, deviceScaleFactor: VIEW.deviceScaleFactor, hasTouch: true, isMobile: true })).newPage();
const shot = async (n: string) => p.screenshot({ path: `${OUT}/${KIND}-${n}.png` });
const game = (js: string) => p.evaluate(`import('/src/store/useGame.ts').then(async (m) => { const g = m.useGame.getState(); const t = g.t, s = g.s; ${js} })`);

await p.goto(URL);
await p.evaluate(() =>
  localStorage.setItem('isimsehir-v1', JSON.stringify({
    state: {
      name: 'Elif', avatar: 'tilki', color: '#ff6b4a', sfx: false, music: false, voice: false, haptics: false,
      settings: { cats: [['isim', 'İsim', '🧒'], ['sehir', 'Şehir', '🏙️'], ['hayvan', 'Hayvan', '🦁'], ['bitki', 'Bitki', '🌿'], ['esya', 'Eşya', '🪑'], ['ulke', 'Ülke', '🌍']].map(([id, label, emoji]) => ({ id, label, emoji })), rounds: 5, time: 120, stop: true, grace: 10, hard: false, manualStop: true },
      bots: { count: 9, level: 3 }, stats: { games: 12, wins: 7, best: 190, points: 1460 }, lastRoom: null,
    },
    version: 1,
  })),
);
await p.goto(URL + '?r=1#/');
await sleep(2200);
// 3. argüman 'ek' ise yalnız Sıra Sende ve Sinema Bilmecesi çekilir (İsim Şehir oyunu atlanır)
if (process.argv[3] !== 'ek') {
await shot('01-ana-sayfa');
await p.click('.game-card--isim .play-btn');
await sleep(700);
await shot('11-oyna');
await p.click('.play-sheet__bot');
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
}

/** Ana sayfadan bir bölümü botlarla başlatır (kurulum → lobi → oyun). */
async function startBots(game: 'siram' | 'film', screen: string, bots: number) {
  await p.evaluate((n) => {
    const v = JSON.parse(localStorage.getItem('isimsehir-v1') ?? '{}');
    v.state.bots = { count: n, level: 3 };
    localStorage.setItem('isimsehir-v1', JSON.stringify(v));
  }, bots);
  await p.goto(URL + '?r=' + Date.now() + '#/');
  await sleep(1500);
  await p.click(`.game-card--${game} .play-btn`);
  await sleep(600);
  await p.click('.play-sheet__bot');
  await sleep(1200);
  await p.click('.page__cta .pill', { force: true });
  await p.waitForSelector('.lobby');
  await sleep(800);
  await p.click('.page__cta .pill', { force: true });
  await p.waitForSelector(screen, { timeout: 30000 });
}
// Sıra Sende: birkaç hamle oynansın, zincir görünsün
await startBots('siram', '.turn', 4);
/** Sıra bendeyse geçerli bir kelimeyi klavyeyle yazar (oynamaz). */
const typeMove = async () => {
  await p.waitForSelector('.turn__play', { timeout: 150000 });
  const w = await p.evaluate(`Promise.all([import('/src/store/useGame.ts'), import('/src/engine/chain.ts')]).then(([g, ch]) => { const c = g.useGame.getState().s.ctl; return ch.show(ch.botMove(c.word, ch.chainList(c.chain), 'degis', 3) ?? ''); })`);
  if (!(await p.$('.kb-box'))) await p.click('.turn .tool[aria-label="Klavye"]');
  await p.fill('.turn .input--answer', String(w));
  await sleep(500);
};
await sleep(1500);
for (let i = 0; i < 2; i++) {
  await typeMove();
  await p.click('.turn__play', { force: true });
  await sleep(2500);
}
await typeMove();
await sleep(600);
await shot('12-sira-sende');
// Sinema Bilmecesi: birkaç ipucu açılsın, klavyeden ilk harfler yazılınca öneriler çıksın
await startBots('film', '.film', 9);
await sleep(16000);
await p.click('.film .tool[aria-label="Klavye"]').catch(() => {});
await p.fill('.film .input--answer', 'Ba').catch(() => {});
await sleep(900);
await shot('13-film-avi');
await b.close();
console.log('hazır:', KIND);
