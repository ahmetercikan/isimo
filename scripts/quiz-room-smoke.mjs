/** Üç ayrı tarayıcı oturumu: oda, ortak sorular, ev sahibi devri, seyirci ve tekrar oynama.
 * Önce npm run emulators; sonra VITE_FIREBASE_EMULATOR=1 npx vite --host 127.0.0.1 --port 5291
 * Çalıştır: node scripts/quiz-room-smoke.mjs (Google Chrome kurulu olmalı).
 * Üretim Firebase projesinde çalışmayı reddeder. */
import { chromium } from 'playwright-core';
const b=await chromium.launch({ channel: 'chrome', headless: true });
const errors=[];const contexts=[];
async function page(name){const c=await b.newContext({viewport:{width:390,height:844}});contexts.push(c);await c.addInitScript(name=>localStorage.setItem('isimsehir-v1',JSON.stringify({state:{name,avatar:'kaplan',color:'#ff6b4a',sfx:false,music:false,voice:false},version:2})),name);const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));return p;}
const a=await page('Alice'),bp=await page('Bora'),c=await page('Ceren');
try{
 await a.goto('http://127.0.0.1:5291/#/sinema');await a.waitForSelector('.show-card--hero');
 if (!await a.evaluate(async () => (await import('/src/online/config.ts')).USE_EMULATOR)) throw Error('This test requires VITE_FIREBASE_EMULATOR=1; refusing to write to production.');
 if(await a.locator('.show-card--hero button').count()!==2)throw Error('Expected only two room actions');
 await a.locator('.show-card--hero button').first().click();await a.waitForSelector('.ticket');
 if(await a.locator('button.ticket').count()!==19)throw Error('Expected 19 universes');
 if(await a.getByText('Yakında salonda').count())throw Error('Coming soon remains');
 await a.getByRole('button').filter({hasText:'Sen ne kadar uyanıksın?'}).click();
 await a.waitForSelector('#quiz-universe');
 if(await a.locator('#quiz-universe').inputValue()!=='matrix')throw Error('Selected universe lost');
 await a.getByRole('button',{name:'Odayı Kur',exact:true}).click();
 await a.waitForSelector('.code-card__code');
 const code=(await a.locator('.code-tile').allTextContents()).join('');console.log('ROOM',code);
 if(await a.getByRole('button',{name:'Bot ekle',exact:true}).count())throw Error('Bot UI present');
 await bp.goto('http://127.0.0.1:5291/#/katil?oyun=quiz');await bp.getByLabel('Oda kodu').fill(code);await bp.waitForSelector('.lobby');
 await a.getByRole('button',{name:'Oyunu Başlat',exact:true}).click({force:true});await a.waitForSelector('.quiz-room .quiz-q__text, .quiz-room .quiz-q__pair');await bp.waitForSelector('.quiz-room .quiz-q__text, .quiz-room .quiz-q__pair');
 if(await a.locator('.quiz-q__text, .quiz-q__pair').innerText()!==await bp.locator('.quiz-q__text, .quiz-q__pair').innerText())throw Error('Question mismatch');
 if(JSON.stringify(await a.locator('.quiz-opt__text').allTextContents())!==JSON.stringify(await bp.locator('.quiz-opt__text').allTextContents()))throw Error('Option mismatch');
 await a.waitForFunction(()=>document.querySelector('.quiz-opt')?.disabled === false);
 const right=await a.evaluate(async()=>{const s=(await import('/src/store/useGame.ts')).useGame.getState().s;return s.ctl.quiz.questions[0].right;});
 await a.locator('.quiz-opt').nth(right).click();await a.getByText(/Cevabın alındı/).waitFor();
 if(await bp.locator('.is-right').count())throw Error('Answer exposed before all players submit');
 await bp.locator('.quiz-opt').nth(right).click();await bp.waitForSelector('.quiz-opt.is-right');
 const firstKeys = await bp.evaluate(async () => (await import('/src/store/useGame.ts')).useGame.getState().s.ctl.quiz.questions.map(q => q.key));
 const saved = await bp.evaluate(() => JSON.parse(localStorage.getItem('isimsehir-v1')).state.quizSeen.matrix);
 if (firstKeys.some(k => !saved.includes(k))) throw Error('Question history was not saved at start');
 console.log('Shared questions, hidden feedback, scoring and persistent history OK');
 await a.waitForFunction(()=>document.querySelector('.round-label')?.textContent.includes('Soru 2'));
 await c.goto('http://127.0.0.1:5291/#/katil?oyun=quiz');await c.getByLabel('Oda kodu').fill(code);await c.getByText(/Bu turu izleyebilir/).waitFor();
 if(await c.locator('.quiz-opt:enabled').count())throw Error('Spectator can answer');
 await a.getByRole('button',{name:'Oyundan çık',exact:true}).click();await a.getByRole('button',{name:'Çık',exact:true}).click();
 await bp.waitForFunction(async()=>{const g=(await import('/src/store/useGame.ts')).useGame.getState();return g.s.host===g.t.me;});
 console.log('Late spectator and host transfer OK');
 for(let round=2;round<=10;round++){
  await bp.waitForFunction(r=>document.querySelector('.round-label')?.textContent.includes(`Soru ${r} /`),round);
  await bp.waitForFunction(()=>document.querySelector('.quiz-opt')?.disabled === false);
  const r=await bp.evaluate(async()=>{const s=(await import('/src/store/useGame.ts')).useGame.getState().s;return s.ctl.quiz.questions[s.ctl.round-1].right;});
  await bp.locator('.quiz-opt').nth(r).click();await bp.waitForSelector('.quiz-opt.is-right');
 }
 await bp.waitForSelector('.quiz-room__ranking',{timeout:15000});await c.waitForSelector('.quiz-room__ranking');
 const result=await bp.locator('.quiz-room__ranking').innerText();console.log('FINAL',result);
 if(!result.includes('Bora')||!result.includes('10 doğru'))throw Error('Final score incorrect');
 await bp.screenshot({path:'/tmp/isimo-quiz-online-final.png'});
 await bp.getByRole('button',{name:'Tekrar Oyna',exact:true}).click();await bp.waitForSelector('.lobby');await c.waitForSelector('.lobby');
 if(await bp.getByRole('button',{name:'Bot ekle',exact:true}).count())throw Error('Replay lobby has bot');
 await bp.getByRole('button',{name:'Oyunu Başlat',exact:true}).click({force:true});await c.waitForSelector('.quiz-opt');await c.waitForFunction(()=>document.querySelector('.quiz-opt')?.disabled === false);
 const nextKeys = await bp.evaluate(async () => (await import('/src/store/useGame.ts')).useGame.getState().s.ctl.quiz.questions.map(q => q.key));
 if (nextKeys.some(k => firstKeys.includes(k))) throw Error('Replay repeated questions despite unseen pool');
 console.log('Replay includes former spectator; all questions fresh');
 await bp.getByRole('button',{name:'Oyundan çık',exact:true}).click();await bp.getByRole('button',{name:'Çık',exact:true}).click();
 await c.getByRole('button',{name:'Oyundan çık',exact:true}).click();await c.getByRole('button',{name:'Çık',exact:true}).click();
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS: online room flow');
}finally{await b.close();}
