/**
 * Arkadaşlar: arkadaş kodu, çevrimiçi durumu, istekler ve oyun davetleri.
 * Giriş ekranı yoktur — her cihaz zaten anonim bir Firebase hesabı (uid) kullanır;
 * oyuncular birbirini 6 haneli **arkadaş kodu** ile bulur.
 *
 * Yapı (ROOT = "isimsehir"):
 *   /{ROOT}/users/{uid}/pub            herkese açık kart: kod, ad, avatar, renk, çevrimiçi mi, oda
 *   /{ROOT}/users/{uid}/f/{other}      "ben onu ekledim" (yalnız sahibi yazar)
 *   /{ROOT}/users/{uid}/in/{other}     gelen istek / kabul bildirimi (karşı taraf yazar)
 *   /{ROOT}/users/{uid}/inv/{other}    oyun daveti: oda kodu (yalnız eklediğim biri yazabilir)
 *   /{ROOT}/codes/{KOD}                kod → uid (arkadaş kodundan oyuncuyu bulmak için)
 * Arkadaşlık **karşılıklıdır**: iki tarafın da f listesinde diğeri varsa arkadaşsınız.
 * Kurallar: database.rules.json.
 */
import { get, onDisconnect, onValue, ref, remove, runTransaction, serverTimestamp, set, update } from 'firebase/database';
import { database, signIn } from './firebase';
import { ROOT } from './config';

/** Herkese açık oyuncu kartı. */
export interface Pub {
  code: string;
  name: string;
  avatar: string;
  color: string;
  /** Uygulama açık mı (bağlantı kopunca Firebase false yapar). */
  on?: boolean;
  /** Son görülme (sunucu saati). */
  seen?: number;
  /** Şu an bulunduğu oda kodu (lobide/oyunda ise). */
  room?: string;
}

/** Arkadaş listesindeki bir satır. */
export interface Friend extends Pub {
  uid: string;
  /** Karşı taraf da beni eklediyse arkadaşız; eklemediyse isteğim bekliyor. */
  mutual: boolean;
}

/** Gelen kayıt: arkadaş isteği ('req') ya da "isteğini kabul etti" ('ok'). */
export interface Incoming {
  uid: string;
  k: 'req' | 'ok';
  name: string;
  avatar: string;
  color: string;
  at?: number;
}

/** Gelen oyun daveti. */
export interface Invite {
  uid: string;
  code: string;
  name: string;
  avatar: string;
  color: string;
  at?: number;
}

/** Karışan harf yok (O/0, I/1, Q, W, X): oda kodlarıyla aynı alfabe. */
const ALPHABET = 'ABCDEFGHJKLMNPRSTUVYZ23456789';
export const CODE_LEN = 6;

const userRef = (uid: string, path = '') => ref(database(), `${ROOT}/users/${uid}${path ? '/' + path : ''}`);
const codeRef = (code: string) => ref(database(), `${ROOT}/codes/${code}`);

const randomCode = () => Array.from({ length: CODE_LEN }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

/** Yazılan kodu biçime sokar: büyük harf, boşluk/çizgi atılır. */
export const normCode = (s: string) => (s ?? '').toLocaleUpperCase('tr-TR').replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN);

/**
 * Bu cihazın arkadaş kodunu verir; yoksa boşta bir kod bulup sahiplenir.
 * Kod bir kez alınır ve `pub.code` içinde durur.
 */
export async function myCode(): Promise<string> {
  const uid = await signIn();
  const have = await get(userRef(uid, 'pub/code'));
  if (have.exists() && typeof have.val() === 'string') return have.val() as string;
  for (let i = 0; i < 12; i++) {
    const code = randomCode();
    // Kod boştaysa sahiplen (aynı anda iki cihaz aynı kodu almasın).
    const r = await runTransaction(codeRef(code), (cur) => (cur === null || cur === uid ? uid : undefined));
    if (r.committed && r.snapshot.val() === uid) {
      await set(userRef(uid, 'pub/code'), code);
      return code;
    }
  }
  throw new Error('kod-bulunamadi');
}

/**
 * Oyuncu kartını yazar ve "çevrimiçi" işaretler. Bağlantı kopunca Firebase
 * kendisi `on: false` yapar (onDisconnect) — uygulama çökse bile doğru görünür.
 */
export async function goOnline(me: { name: string; avatar: string; color: string }): Promise<string> {
  const uid = await signIn();
  const code = await myCode();
  await update(userRef(uid, 'pub'), { code, name: me.name, avatar: me.avatar, color: me.color, on: true, seen: serverTimestamp() });
  await onDisconnect(userRef(uid, 'pub/on')).set(false);
  await onDisconnect(userRef(uid, 'pub/seen')).set(serverTimestamp());
  return uid;
}

/** Şu an bulunulan odayı kartta duyurur (arkadaşlar "Katıl" diyebilsin); null ise temizler. */
export async function setRoom(code: string | null) {
  const uid = await signIn();
  await set(userRef(uid, 'pub/room'), code ?? null);
}

/** Uygulama kapanırken/arka plana geçerken çevrimdışı işaretle. */
export async function goOffline() {
  const uid = await signIn();
  await update(userRef(uid, 'pub'), { on: false, seen: serverTimestamp() });
}

/** Arkadaş koduna karşılık gelen oyuncu (yoksa null). */
export async function findByCode(code: string): Promise<{ uid: string; pub: Pub } | null> {
  await signIn();
  const c = normCode(code);
  if (c.length !== CODE_LEN) return null;
  const snap = await get(codeRef(c));
  const uid = snap.val();
  if (typeof uid !== 'string') return null;
  const p = await get(userRef(uid, 'pub'));
  return p.exists() ? { uid, pub: p.val() as Pub } : null;
}

export type AddResult = 'ok' | 'yok' | 'kendim' | 'zaten';

/** Arkadaş ekler: kendi listeme yazar, karşı tarafa istek bırakır. */
export async function addFriend(code: string, me: { name: string; avatar: string; color: string }): Promise<AddResult> {
  const uid = await signIn();
  const found = await findByCode(code);
  if (!found) return 'yok';
  if (found.uid === uid) return 'kendim';
  const already = await get(userRef(uid, `f/${found.uid}`));
  if (already.exists()) return 'zaten';
  await set(userRef(uid, `f/${found.uid}`), true);
  await set(userRef(found.uid, `in/${uid}`), { k: 'req', name: me.name, avatar: me.avatar, color: me.color, at: serverTimestamp() });
  return 'ok';
}

/** Gelen isteği kabul eder: karşılıklı arkadaş olunur, karşı tarafa haber verilir. */
export async function acceptFriend(other: string, me: { name: string; avatar: string; color: string }) {
  const uid = await signIn();
  await set(userRef(uid, `f/${other}`), true);
  await remove(userRef(uid, `in/${other}`));
  await set(userRef(other, `in/${uid}`), { k: 'ok', name: me.name, avatar: me.avatar, color: me.color, at: serverTimestamp() });
}

/** Gelen kaydı siler (isteği reddetmek ya da "kabul etti" bildirimini kapatmak). */
export async function dismissIncoming(other: string) {
  const uid = await signIn();
  await remove(userRef(uid, `in/${other}`));
}

/** Arkadaşlıktan çıkarır (yalnız kendi listemden; karşı tarafta kalır ama artık karşılıklı değildir). */
export async function removeFriend(other: string) {
  const uid = await signIn();
  await remove(userRef(uid, `f/${other}`));
  await remove(userRef(uid, `inv/${other}`));
}

/** Arkadaşı odaya çağırır. Karşı taraf beni eklememişse kurallar yazmayı reddeder. */
export async function invite(other: string, room: string, me: { name: string; avatar: string; color: string }) {
  const uid = await signIn();
  await set(userRef(other, `inv/${uid}`), { code: room, name: me.name, avatar: me.avatar, color: me.color, at: serverTimestamp() });
}

/** Daveti kapatır. */
export async function dismissInvite(other: string) {
  const uid = await signIn();
  await remove(userRef(uid, `inv/${other}`));
}

/**
 * Karşı taraf beni de ekledi mi (arkadaşlık karşılıklı mı) — canlı dinlenir, çünkü
 * o kişi isteği sonradan kabul edince liste kendiliğinden güncellenmeli.
 * Kurallar yalnız bu tek çocuğu okumama izin verir, listesinin tamamını değil.
 */
const watchMutual = (other: string, uid: string, cb: (m: boolean) => void) =>
  onValue(userRef(other, `f/${uid}`), (s) => cb(s.exists()), () => cb(false));

/**
 * Arkadaş listesini ve her birinin çevrimiçi durumunu izler.
 * Döner: dinlemeyi bırakma fonksiyonu.
 */
export async function watchFriends(cb: (list: Friend[]) => void): Promise<() => void> {
  const uid = await signIn();
  const pubs = new Map<string, Pub>();
  const mutual = new Map<string, boolean>();
  let offPubs: Record<string, () => void> = {};
  let offMutual: Record<string, () => void> = {};

  const emit = () =>
    cb(
      [...pubs.entries()]
        .map(([u, p]) => ({ uid: u, ...p, mutual: mutual.get(u) ?? false }))
        .sort((a, b) => Number(!!b.on) - Number(!!a.on) || (a.name ?? '').localeCompare(b.name ?? '', 'tr')),
    );

  const offList = onValue(userRef(uid, 'f'), (snap) => {
    const ids: string[] = snap.exists() ? Object.keys(snap.val() as Record<string, true>) : [];
    // Listeden çıkanların dinleyicisini kapat.
    for (const u of Object.keys(offPubs)) {
      if (!ids.includes(u)) {
        offPubs[u]();
        offMutual[u]?.();
        delete offPubs[u];
        delete offMutual[u];
        pubs.delete(u);
        mutual.delete(u);
      }
    }
    for (const u of ids) {
      if (offPubs[u]) continue;
      offPubs[u] = onValue(userRef(u, 'pub'), (s) => {
        if (s.exists()) pubs.set(u, s.val() as Pub);
        else pubs.delete(u);
        emit();
      });
      offMutual[u] = watchMutual(u, uid, (m) => {
        mutual.set(u, m);
        emit();
      });
    }
    emit();
  });

  return () => {
    offList();
    Object.values(offPubs).forEach((f) => f());
    Object.values(offMutual).forEach((f) => f());
    offPubs = {};
    offMutual = {};
  };
}

/** Gelen arkadaş isteklerini izler. */
export async function watchIncoming(cb: (list: Incoming[]) => void): Promise<() => void> {
  const uid = await signIn();
  return onValue(userRef(uid, 'in'), (snap) => {
    const v = (snap.val() ?? {}) as Record<string, Omit<Incoming, 'uid'>>;
    cb(Object.entries(v).map(([u, x]) => ({ uid: u, ...x })).sort((a, b) => (b.at ?? 0) - (a.at ?? 0)));
  });
}

/** Gelen oyun davetlerini izler. */
export async function watchInvites(cb: (list: Invite[]) => void): Promise<() => void> {
  const uid = await signIn();
  return onValue(userRef(uid, 'inv'), (snap) => {
    const v = (snap.val() ?? {}) as Record<string, Omit<Invite, 'uid'>>;
    cb(Object.entries(v).map(([u, x]) => ({ uid: u, ...x })).sort((a, b) => (b.at ?? 0) - (a.at ?? 0)));
  });
}
