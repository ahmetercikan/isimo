/**
 * Çevrimiçi oda: Firebase Realtime Database (yalnızca çevrimiçi oyun açılınca dinamik yüklenir).
 *
 * Yapı (ROOT = "isimsehir"):
 *   /{ROOT}/rooms/{KOD}                 oda durumu (RoomState): oyuncular, ctl, cevaplar, oylar, sonuçlar
 *   /{ROOT}/ink/{KOD}/{rN}/{uid}/{cat}  el yazısı izleri (ayrı: yalnızca değerlendirmede indirilir)
 * Her cihaz anonim bir hesap; oyuncu kimliği = uid. Kurallar: database.rules.json.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { browserLocalPersistence, connectAuthEmulator, indexedDBLocalPersistence, initializeAuth, onAuthStateChanged, signInAnonymously, type Auth } from 'firebase/auth';
import {
  connectDatabaseEmulator, get, getDatabase, onDisconnect, onValue, ref, remove, runTransaction, serverTimestamp, set, update,
  type Database, type DatabaseReference,
} from 'firebase/database';
import type { Ctl, Player, RoomState, Settings } from '../engine/types';
import { MAX_PLAYERS, newCtl } from '../engine/types';
import { FIREBASE_CONFIG, ROOT, USE_EMULATOR } from './config';
import type { Transport } from './transport';

let app: FirebaseApp;
let auth: Auth;
let db: Database;
let ready: Promise<string> | null = null;

function init() {
  if (app) return;
  app = initializeApp(
    USE_EMULATOR
      ? { projectId: 'demo-isimsehir', apiKey: 'demo-key', authDomain: 'localhost', databaseURL: 'http://127.0.0.1:9000?ns=demo-isimsehir-default-rtdb' }
      : FIREBASE_CONFIG!,
  );
  auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  db = getDatabase(app);
  if (USE_EMULATOR) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectDatabaseEmulator(db, '127.0.0.1', 9000);
  }
}

/** Anonim oturum (cihaz başına bir kez; sonra hatırlanır). Döner: uid. */
function signIn(): Promise<string> {
  init();
  if (!ready) {
    ready = new Promise<string>((resolve, reject) => {
      const off = onAuthStateChanged(auth, (u) => {
        if (u) {
          off();
          resolve(u.uid);
        }
      });
      if (!auth.currentUser) signInAnonymously(auth).catch((e) => { off(); ready = null; reject(e); });
    });
  }
  return ready;
}

const roomRef = (code: string, path = '') => ref(db, `${ROOT}/rooms/${code}${path ? '/' + path : ''}`);
const inkRef = (code: string, path = '') => ref(db, `${ROOT}/ink/${code}${path ? '/' + path : ''}`);

// Karışan harfler yok (O/0, I/1, Q, W, X)
const CODE_ABC = 'ABCDEFGHJKLMNPRSTUVYZ23456789';
const randomCode = () => Array.from({ length: 5 }, () => CODE_ABC[Math.floor(Math.random() * CODE_ABC.length)]).join('');
export const cleanCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);

export type Profile = Pick<Player, 'name' | 'avatar' | 'color'>;

/** Oda kurar; döner: bağlantı. */
export async function createRoom(profile: Profile, settings: Settings): Promise<FirebaseTransport> {
  const uid = await signIn();
  for (let tries = 0; tries < 8; tries++) {
    const code = randomCode();
    const room: RoomState = {
      code,
      host: uid,
      created: Date.now(),
      settings,
      players: { [uid]: { ...profile, joined: Date.now(), on: true } },
      ctl: newCtl(),
    };
    try {
      // Kurallar: oda yoksa yazılabilir (aynı kod varsa reddedilir → yeni kod).
      await set(roomRef(code), room);
      const t = new FirebaseTransport(code, uid);
      await t.connect(profile);
      return t;
    } catch {
      /* kod dolu: yeniden dene */
    }
  }
  throw new Error('Oda kurulamadı');
}

export type JoinError = 'notfound' | 'full' | 'network';

/** Koda göre odaya katılır. */
export async function joinRoom(code: string, profile: Profile): Promise<FirebaseTransport | JoinError> {
  let uid: string;
  try {
    uid = await signIn();
  } catch {
    return 'network';
  }
  const c = cleanCode(code);
  let players: Record<string, Player> | null;
  try {
    const snap = await get(roomRef(c, 'ctl'));
    if (!snap.exists()) return 'notfound';
    players = (await get(roomRef(c, 'players'))).val();
  } catch {
    return 'network';
  }
  const others = Object.entries(players ?? {}).filter(([p, v]) => p !== uid && !v.left);
  if (!players?.[uid] && others.length >= MAX_PLAYERS) return 'full';
  const t = new FirebaseTransport(c, uid);
  await t.connect(profile);
  return t;
}

export class FirebaseTransport implements Transport {
  readonly kind = 'online' as const;
  private offset = 0;
  private offs: (() => void)[] = [];
  private meRef: DatabaseReference;
  /** Son gelen durum: botlar (src/game/bots.ts) aradaki anı buradan okur. */
  private last: RoomState | null = null;

  constructor(readonly code: string, readonly me: string) {
    this.meRef = roomRef(code, `players/${me}`);
  }

  /** Oyuncu kaydı + bağlantı kopunca "çevrimdışı" işareti + sunucu saati farkı. */
  async connect(profile: Profile) {
    const cur = (await get(this.meRef)).val() as Player | null;
    await update(this.meRef, { ...profile, joined: cur?.joined ?? Date.now(), on: true, left: null });
    this.offs.push(
      onValue(ref(db, '.info/serverTimeOffset'), (s) => (this.offset = (s.val() as number) ?? 0)),
      onValue(ref(db, '.info/connected'), (s) => {
        if (s.val() !== true) return;
        // Yeniden bağlanınca: oyuncu hâlâ odadaysa (çıkarılmadıysa) "bağlı" işaretlenir.
        void get(roomRef(this.code, `players/${this.me}/name`))
          .then((n) => (n.exists() ? onDisconnect(roomRef(this.code, `players/${this.me}/on`)).set(false).then(() => set(roomRef(this.code, `players/${this.me}/on`), true)) : undefined))
          .catch(() => {});
      }),
    );
  }

  subscribe(cb: (s: RoomState | null) => void) {
    const off = onValue(
      roomRef(this.code),
      (s) => {
        const room = s.val() as RoomState | null;
        // Çıkarılan oyuncunun bağlantı kopunca yazılan yarım kaydı ("on": false) oyuncu sayılmaz.
        if (room?.players) for (const [p, v] of Object.entries(room.players)) if (!v?.name) delete room.players[p];
        this.last = room && room.ctl && room.settings ? { ...room, players: room.players ?? {} } : null;
        cb(this.last);
      },
      () => cb(null),
    );
    this.offs.push(off);
    return off;
  }

  peek() {
    return this.last;
  }

  now() {
    return Date.now() + this.offset;
  }

  async update(patch: Record<string, unknown>) {
    await update(roomRef(this.code), patch);
  }

  async transactCtl(fn: (ctl: Ctl) => Ctl | undefined) {
    const r = await runTransaction(roomRef(this.code, 'ctl'), (cur: Ctl | null) => (cur ? fn(cur) : cur), { applyLocally: true }).catch(() => null);
    return !!r?.committed;
  }

  async setInk(round: number, catId: string, path: string | null) {
    await set(inkRef(this.code, `r${round}/${this.me}/${catId}`), path).catch(() => {});
  }

  async getInk(round: number) {
    try {
      return ((await get(inkRef(this.code, `r${round}`))).val() ?? {}) as Record<string, Record<string, string>>;
    } catch {
      return {};
    }
  }

  async clearInk() {
    await remove(inkRef(this.code)).catch(() => {});
  }

  async leave() {
    this.offs.forEach((o) => o());
    this.offs = [];
    try {
      await onDisconnect(roomRef(this.code, `players/${this.me}/on`)).cancel();
      const room = (await get(roomRef(this.code))).val() as RoomState | null;
      if (!room) return;
      // Botlar oyuncu sayılmaz: son insan çıkınca oda botlarla birlikte silinir.
      const others = Object.entries(room.players ?? {}).filter(([p, v]) => p !== this.me && v.on && !v.left && !v.bot);
      if (!others.length) {
        // Son kişi çıkınca oda ve izleri silinir.
        await remove(inkRef(this.code));
        await remove(roomRef(this.code));
      } else if (room.ctl.phase === 'lobby') await remove(this.meRef);
      else await update(this.meRef, { on: false, left: true });
    } catch {
      /* çevrimdışı: onDisconnect zaten işaretler */
    }
  }
}

/** Sunucuya erişilebiliyor mu (ilk ekranda "çevrimiçi" rozeti için). */
export async function ping(): Promise<boolean> {
  try {
    await signIn();
    return true;
  } catch {
    return false;
  }
}

export { serverTimestamp };

// ---- Arkadaşlar modülü (src/online/friends.ts) aynı bağlantıyı ve aynı anonim oturumu kullanır:
// iki kez giriş yapılmaz, ikinci bir Firebase uygulaması açılmaz. ----
export { signIn };
/** Veritabanı (gerekirse bağlantıyı kurar). */
export const database = (): Database => (init(), db);
