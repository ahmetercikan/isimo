/**
 * database.rules.json'daki **arkadaş** ve **oda botu** kurallarını emülatörde dener (üç oyuncu: A, B, C).
 * Hem izin verilmesi gerekenleri hem de reddedilmesi gerekenleri sınar.
 *
 * Çalıştırma (iki ayrı terminal):
 *   npm run emulators
 *   node scripts/kural-deneme.mjs
 *
 * Not: kural dosyasında **yorum satırı olamaz** ("//" bir çocuk adı sayılır ve
 * değerinin kural nesnesi olması beklenir); emülatör dosyayı hiç yüklemez.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator, ref, set, get, remove, runTransaction } from 'firebase/database';

const CFG = { projectId: 'demo-isimsehir', apiKey: 'demo-key', authDomain: 'localhost', databaseURL: 'http://127.0.0.1:9000?ns=demo-isimsehir-default-rtdb' };
const ROOT = 'isimsehir';

async function player(name) {
  const app = initializeApp(CFG, name);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getDatabase(app);
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
  const { user } = await signInAnonymously(auth);
  return { uid: user.uid, r: (p) => ref(db, `${ROOT}/${p}`) };
}

let pass = 0, fail = 0;
async function ok(label, fn) {
  try { await fn(); console.log('  ✓', label); pass++; }
  catch (e) { console.log('  ✗', label, '→', String(e.message || e).slice(0, 90)); fail++; }
}
async function denied(label, fn) {
  try { await fn(); console.log('  ✗', label, '→ İZİN VERİLDİ (verilmemeliydi!)'); fail++; }
  catch (e) {
    const msg = String(e.message || e).toUpperCase();
    const permission = msg.includes('PERMISSION_DENIED') || msg.includes('PERMISSION DENIED');
    console.log(permission ? '  ✓' : '  ✗', label, permission ? '(reddedildi, doğru)' : '→ beklenmedik hata: ' + e.message);
    permission ? pass++ : fail++;
  }
}

const A = await player('a'), B = await player('b'), C = await player('c');
const run = Math.random().toString(36).slice(2, 5).toUpperCase();
const CODE = { A: `A${run}11`, B: `B${run}22`, C: `C${run}33` };
const pub = (n) => ({ code: n, name: n, avatar: 'tilki', color: '#ff6b4a', on: true, seen: Date.now() });

console.log('\n1) Kart yazma ve kod sahiplenme');
await ok('A kendi kartını yazar', () => set(A.r(`users/${A.uid}/pub`), pub(CODE.A)));
await ok('B kendi kartını yazar', () => set(B.r(`users/${B.uid}/pub`), pub(CODE.B)));
await ok('C kendi kartını yazar', () => set(C.r(`users/${C.uid}/pub`), pub(CODE.C)));
await ok('A kodunu sahiplenir', () => runTransaction(A.r(`codes/${CODE.A}`), (c) => (c === null || c === A.uid ? A.uid : undefined)));
await ok('B kodunu sahiplenir', () => runTransaction(B.r(`codes/${CODE.B}`), (c) => (c === null || c === B.uid ? B.uid : undefined)));
await denied('B, A\'nın kodunu çalamaz', () => set(B.r(`codes/${CODE.A}`), B.uid));
await denied('B, A\'nın kartını değiştiremez', () => set(B.r(`users/${A.uid}/pub/name`), 'Sahte'));
await denied('B, kartına tanımsız alan ekleyemez', () => set(B.r(`users/${B.uid}/pub/gizli`), 'x'));

console.log('\n2) Arkadaş kodundan bulma');
await ok('B, kod tablosundan A\'yı bulur', async () => { const s = await get(B.r(`codes/${CODE.A}`)); if (s.val() !== A.uid) throw new Error('uid eşleşmedi'); });
await ok('B, A\'nın açık kartını okur', async () => { const s = await get(B.r(`users/${A.uid}/pub`)); if (!s.exists()) throw new Error('kart yok'); });

console.log('\n3) Arkadaş isteği');
await ok('B, A\'yı kendi listesine ekler', () => set(B.r(`users/${B.uid}/f/${A.uid}`), true));
await ok('B, A\'ya istek bırakır', () => set(B.r(`users/${A.uid}/in/${B.uid}`), { k: 'req', name: 'B', avatar: 'panda', color: '#14a89a', at: Date.now() }));
await denied('B, A\'nın listesine kendini yazamaz', () => set(B.r(`users/${A.uid}/f/${B.uid}`), true));
await denied('B, A\'nın arkadaş listesinin tamamını okuyamaz', () => get(B.r(`users/${A.uid}/f`)));
await ok('A, gelen isteklerini okur', async () => { const s = await get(A.r(`users/${A.uid}/in`)); if (!s.exists()) throw new Error('istek yok'); });
await denied('B, A\'nın gelen isteklerini okuyamaz', () => get(B.r(`users/${A.uid}/in`)));
await denied('B, bozuk biçimde istek yazamaz', () => set(B.r(`users/${A.uid}/in/${B.uid}`), { k: 'hatali', name: 'B' }));
await denied('C, A\'ya ait olmayan alana istek yazamaz', () => set(C.r(`users/${A.uid}/in/${B.uid}`), { k: 'req', name: 'Sahte', avatar: 'kedi', color: '#000000' }));

console.log('\n4) Kabul ve karşılıklılık');
await ok('A kabul eder (kendi listesine yazar)', () => set(A.r(`users/${A.uid}/f/${B.uid}`), true));
await ok('A isteği siler', () => remove(A.r(`users/${A.uid}/in/${B.uid}`)));
await ok('A, B\'ye "kabul edildi" yazar', () => set(A.r(`users/${B.uid}/in/${A.uid}`), { k: 'ok', name: 'A', avatar: 'tilki', color: '#ff6b4a', at: Date.now() }));
await ok('B, "A beni ekledi mi" sorusunu sorabilir', async () => { const s = await get(B.r(`users/${A.uid}/f/${B.uid}`)); if (s.val() !== true) throw new Error('karşılıklı görünmedi'); });
await denied('C, "A B\'yi ekledi mi" diye bakamaz', () => get(C.r(`users/${A.uid}/f/${B.uid}`)));

console.log('\n5) Oyun daveti');
await ok('B, arkadaşı A\'yı odaya çağırır', () => set(B.r(`users/${A.uid}/inv/${B.uid}`), { code: 'KDX7P', name: 'B', avatar: 'panda', color: '#14a89a', at: Date.now() }));
await denied('C (yabancı) A\'yı çağıramaz', () => set(C.r(`users/${A.uid}/inv/${C.uid}`), { code: 'KDX7P', name: 'C', avatar: 'kedi', color: '#000000', at: Date.now() }));
await ok('A daveti okur', async () => { const s = await get(A.r(`users/${A.uid}/inv`)); if (!s.exists()) throw new Error('davet yok'); });
await ok('A daveti kapatır', () => remove(A.r(`users/${A.uid}/inv/${B.uid}`)));

console.log('\n6) Arkadaşlıktan çıkarma');
// Daveti yetkilendiren şey ALICININ listesidir: "beni ekleyen biri beni çağırabilir".
// B kendi listesinden A'yı atsa bile A hâlâ B'yi arkadaş saydığı için B çağırabilir (beklenen).
await ok('B, A\'yı listesinden çıkarır', () => remove(B.r(`users/${B.uid}/f/${A.uid}`)));
await ok('A hâlâ B\'yi arkadaş saydığı için B çağırabilir', () =>
  set(B.r(`users/${A.uid}/inv/${B.uid}`), { code: 'ZZZ99', name: 'B', avatar: 'panda', color: '#14a89a' }));
// Asıl koruma: A, B'yi listesinden atınca B artık A'yı çağıramaz.
await ok('A, B\'yi listesinden çıkarır', () => remove(A.r(`users/${A.uid}/f/${B.uid}`)));
await denied('A çıkarınca B artık A\'yı çağıramaz', () =>
  set(B.r(`users/${A.uid}/inv/${B.uid}`), { code: 'ZZZ99', name: 'B', avatar: 'panda', color: '#14a89a' }));

console.log('\n7) Odaya bot ekleme (çevrimiçi oda)');
const ROOM = `R${run}77`;
const bot = (lv) => ({ name: 'Robo Ramiz', avatar: 'robot', color: '#5b6cff', joined: Date.now(), on: true, bot: lv });
const me = (n) => ({ name: n, avatar: 'tilki', color: '#ff6b4a', joined: Date.now(), on: true });
const ctl = { phase: 'lobby', round: 0, letter: '', used: '', stopper: '', spinAt: 0, startAt: 0, endAt: 0, stopBy: '', cat: 0, catEndAt: 0, nextAt: 0, seq: 0 };
const settings = { cats: [{ id: 'isim', label: 'İsim' }], rounds: 3, time: 60, stop: true, grace: 5, hard: false, manualStop: true };

await ok('A odayı kurar', () =>
  set(A.r(`rooms/${ROOM}`), { code: ROOM, host: A.uid, created: Date.now(), settings, players: { [A.uid]: me('A') }, ctl }));
await ok('B odaya katılır', () => set(B.r(`rooms/${ROOM}/players/${B.uid}`), me('B')));
await ok('A odaya bot ekler', () => set(A.r(`rooms/${ROOM}/players/bot-0`), bot(2)));
await ok('B de bot ekleyebilir (yöneten değişebilir)', () => set(B.r(`rooms/${ROOM}/players/bot-1`), bot(3)));
await ok('A, botun cevabını yazar', () => set(A.r(`rooms/${ROOM}/answers/r1/bot-0/isim`), 'Ayşe'));
await ok('B kendi cevabını yazar', () => set(B.r(`rooms/${ROOM}/answers/r1/${B.uid}/isim`), 'Zzz'));
await ok('A, botun itirazını yazar', () => set(A.r(`rooms/${ROOM}/votes/r1/isim/${B.uid}/bot-0`), true));
await ok('A, botun "bitirdim"ini yazar', () => set(A.r(`rooms/${ROOM}/ready/r1/bot-0`), 0));
await ok('A botu çıkarır', () => remove(A.r(`rooms/${ROOM}/players/bot-1`)));

await denied('Bot kaydı "bot" alanı olmadan yazılamaz', () =>
  set(A.r(`rooms/${ROOM}/players/bot-2`), { name: 'Sahte', avatar: 'robot', color: '#000', joined: Date.now(), on: true }));
await denied('C (odada değil) bot ekleyemez', () => set(C.r(`rooms/${ROOM}/players/bot-3`), bot(1)));
await denied('C (odada değil) bot cevabı yazamaz', () => set(C.r(`rooms/${ROOM}/answers/r1/bot-0/isim`), 'Hile'));
await denied('A, başka bir insanın cevabını yazamaz', () => set(A.r(`rooms/${ROOM}/answers/r1/${B.uid}/isim`), 'Hile'));
await denied('A, B adına "bitirdim" yazamaz', () => set(A.r(`rooms/${ROOM}/ready/r1/${B.uid}`), 0));
await denied('A, B adına oy veremez', () => set(A.r(`rooms/${ROOM}/votes/r1/isim/${A.uid}/${B.uid}`), true));
await denied('A, B\'nin kaydını değiştiremez', () => set(A.r(`rooms/${ROOM}/players/${B.uid}/name`), 'Sahte'));
await ok('oda temizlenir', () => remove(A.r(`rooms/${ROOM}`)));

console.log(`\nSONUÇ: ${pass} geçti, ${fail} kaldı`);
process.exit(fail ? 1 : 0);
