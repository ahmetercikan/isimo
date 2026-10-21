/**
 * Arkadaş listesi, gelen istekler ve oyun davetleri (canlı).
 * Uygulama açıkken Firebase'i dinler; yeni bir davet/istek gelince ya da bir arkadaş
 * çevrimiçi olunca telefona bildirim düşürür (src/lib/notify.ts).
 * Çevrimiçi oyun kapalıysa (FIREBASE_CONFIG yok) hiç başlamaz.
 */
import { create } from 'zustand';
import { notify } from '../lib/notify';
import { ONLINE_AVAILABLE } from '../online/config';
import type { Friend, Incoming, Invite } from '../online/friends';
import { useProfile } from './useProfile';

interface FriendsState {
  /** Bu cihazın arkadaş kodu (boşsa henüz alınmadı). */
  code: string;
  friends: Friend[];
  incoming: Incoming[];
  invites: Invite[];
  /** Dinleme başladı mı. */
  live: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

let offs: (() => void)[] = [];
let starting = false;

/** Daha önce bildirimi gösterilenler: aynı şey iki kez bildirilmesin. */
const told = { inv: new Set<string>(), req: new Set<string>(), on: new Set<string>() };

export const useFriends = create<FriendsState>()((set, get) => ({
  code: '',
  friends: [],
  incoming: [],
  invites: [],
  live: false,

  async start() {
    if (!ONLINE_AVAILABLE || get().live || starting) return;
    starting = true;
    try {
      const p = useProfile.getState();
      if (!p.name) return;
      const f = await import('../online/friends');
      await f.goOnline({ name: p.name, avatar: p.avatar, color: p.color });
      set({ code: await f.myCode(), live: true });

      offs.push(
        await f.watchFriends((list) => {
          const before = get().friends;
          set({ friends: list });
          // "Arkadaşın çevrimiçi" bildirimi: ayar açıksa ve o arkadaş yeni geldiyse.
          if (useProfile.getState().notifyOnline) {
            for (const x of list) {
              if (!x.mutual || !x.on) {
                if (!x.on) told.on.delete(x.uid);
                continue;
              }
              const wasOn = before.find((y) => y.uid === x.uid)?.on;
              if (!wasOn && !told.on.has(x.uid)) {
                told.on.add(x.uid);
                void notify('Arkadaşın çevrimiçi', `${x.name} şimdi oyunda`, 'cevrimici');
              }
            }
          }
        }),
      );

      offs.push(
        await f.watchIncoming((list) => {
          set({ incoming: list });
          if (!useProfile.getState().notifyInvite) return;
          for (const x of list) {
            if (told.req.has(x.uid + x.k)) continue;
            told.req.add(x.uid + x.k);
            if (x.k === 'req') void notify('Arkadaş isteği', `${x.name} seni arkadaş olarak ekledi`, 'istek');
            else void notify('Arkadaş eklendi', `${x.name} isteğini kabul etti`, 'istek');
          }
        }),
      );

      offs.push(
        await f.watchInvites((list) => {
          set({ invites: list });
          if (!useProfile.getState().notifyInvite) return;
          for (const x of list) {
            if (told.inv.has(x.uid + x.code)) continue;
            told.inv.add(x.uid + x.code);
            void notify('Oyun daveti', `${x.name} seni oyuna çağırdı (oda ${x.code})`, 'davet');
          }
        }),
      );
    } catch {
      // Bağlantı yoksa arkadaş listesi açılmaz; oyunun geri kalanı etkilenmez.
    } finally {
      starting = false;
    }
  },

  stop() {
    offs.forEach((f) => f());
    offs = [];
    told.inv.clear();
    told.req.clear();
    told.on.clear();
    set({ friends: [], incoming: [], invites: [], live: false });
  },
}));

/** Karşılıklı arkadaşlar (listede gösterilen asıl liste). */
export const mutualFriends = (list: Friend[]) => list.filter((x) => x.mutual);
/** Henüz kabul etmemiş olanlar ("istek gönderildi" diye gösterilir). */
export const pendingFriends = (list: Friend[]) => list.filter((x) => !x.mutual);
