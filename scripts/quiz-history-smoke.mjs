/** İki cihaz, yarıda çıkış, yeniden açılış ve yeni ev sahibi/oda arasında soru geçmişi.
 * demo emülatörü + VITE_FIREBASE_EMULATOR=1 dev sunucusu (5291) gerektirir. */
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
async function device(name, seen = []) {
  const context = await browser.newContext({viewport:{width:390,height:844}});
  const p = await context.newPage();
  await p.goto('http://127.0.0.1:5291/');
  if (!await p.evaluate(async () => (await import('/src/online/config.ts')).USE_EMULATOR)) throw Error('Refusing production writes');
  await p.evaluate(({name, seen}) => localStorage.setItem('isimsehir-v1', JSON.stringify({version:2,state:{name,avatar:'kaplan',color:'#ff6b4a',sfx:false,music:false,voice:false,quizSeen:{matrix:seen}}})), {name, seen});
  await p.reload(); p.on('pageerror', e => errors.push(e.message)); return p;
}
const keys = p => p.evaluate(async () => (await import('/src/store/useGame.ts')).useGame.getState().s.ctl.quiz.questions.map(q => q.key));
const history = p => p.evaluate(() => JSON.parse(localStorage.getItem('isimsehir-v1')).state.quizSeen.matrix);
async function room(host, guest) {
  await host.goto('http://127.0.0.1:5291/#/kur/online?oyun=quiz&evren=matrix');
  await host.getByRole('button',{name:'Odayı Kur',exact:true}).click(); await host.waitForSelector('.code-card__code');
  const code=(await host.locator('.code-tile').allTextContents()).join('');
  await guest.goto('http://127.0.0.1:5291/#/katil?oyun=quiz'); await guest.getByLabel('Oda kodu').fill(code); await guest.waitForSelector('.lobby');
  await host.getByRole('button',{name:'Oyunu Başlat',exact:true}).click({force:true});
  await host.waitForSelector('.quiz-q__text'); await guest.waitForSelector('.quiz-q__text');
  return keys(host);
}
async function exit(p) {
  await p.getByRole('button',{name:'Oyundan çık',exact:true}).click(); await p.getByRole('button',{name:'Çık',exact:true}).click();
  await p.waitForURL('**/#/');
}
try {
  const a=await device('History A'), b=await device('History B',Array.from({length:10},(_,i)=>i));
  const first=await room(a,b);
  if(first.some(k=>k<10)) throw Error('Guest history ignored');
  await exit(a); await exit(b);
  const before=await history(b); await b.reload();
  if(JSON.stringify(before)!==JSON.stringify(await history(b))) throw Error('History lost on reload');
  const second=await room(b,a);
  if(second.some(k=>k<10||first.includes(k))) throw Error('Aborted-game questions repeated in new room');
  const savedA=await history(a), savedB=await history(b);
  if([...first,...second].some(k=>!savedA.includes(k)||!savedB.includes(k))) throw Error('Run was not recorded at start');
  await exit(a); await exit(b);
  if(errors.length) throw Error(errors.join('\n'));
  console.log('PASS: guest history, abort, reload, new room, host change; zero repeated questions');
} finally { await browser.close(); }
