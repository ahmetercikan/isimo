/**
 * Arkadaşlar: kendi arkadaş kodun, kod ile arkadaş ekleme, gelen istekler,
 * arkadaş listesi (çevrimiçi/çevrimdışı) ve oyuna davet.
 * Giriş ekranı yok: oyuncular birbirini 6 haneli arkadaş koduyla bulur.
 */
import { Share } from '@capacitor/share';
import { Bell, BellOff, Check, Copy, LogIn, Send, Share2, Trash2, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, useToast } from '../components/ui';
import { Toggle } from './Profile';
import { Icon } from '../components/Icon';
import { askNotify, notifyAllowed } from '../lib/notify';
import { sfx } from '../lib/sfx';
import { ONLINE_AVAILABLE } from '../online/config';
import { CODE_LEN, normCode } from '../online/friends';
import { mutualFriends, pendingFriends, useFriends } from '../store/useFriends';
import { useGame } from '../store/useGame';
import { useProfile } from '../store/useProfile';

/** "3 dakika önce" gibi kısa süre metni. */
function since(at?: number): string {
  if (!at) return 'bir süre önce';
  const m = Math.floor((Date.now() - at) / 60000);
  if (m < 1) return 'az önce';
  if (m < 60) return `${m} dakika önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

export default function Friends() {
  const nav = useNavigate();
  const p = useProfile();
  const { code, friends, incoming, invites, start } = useFriends();
  const room = useGame((s) => s.s?.code ?? null);
  const [toast, show] = useToast();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    void start();
    void notifyAllowed().then(setAllowed);
  }, []);

  // Bildirim izni: ekrana ilk girişte bir kez, neden istendiği belliyken sorulur.
  useEffect(() => {
    if (p.notifyAsked || !p.notifyInvite) return;
    p.set({ notifyAsked: true });
    void askNotify().then(setAllowed);
  }, [p.notifyAsked]);

  const mine = mutualFriends(friends);
  const waiting = pendingFriends(friends);

  const copy = async () => {
    sfx.tap();
    try {
      await navigator.clipboard.writeText(code);
      show('Kod kopyalandı');
    } catch {
      show(code);
    }
  };

  const shareCode = async () => {
    sfx.tap();
    const text = `İsim Şehir'de arkadaşım ol! Arkadaş kodum: ${code}`;
    try {
      await Share.share({ title: 'Arkadaş kodum', text });
    } catch {
      await copy();
    }
  };

  const add = async () => {
    const c = normCode(input);
    if (c.length !== CODE_LEN || busy) return;
    setBusy(true);
    try {
      const { addFriend } = await import('../online/friends');
      const r = await addFriend(c, { name: p.name, avatar: p.avatar, color: p.color });
      if (r === 'ok') {
        sfx.pop();
        setInput('');
        show('İstek gönderildi');
      } else {
        sfx.tap();
        show(r === 'yok' ? 'Böyle bir kod yok' : r === 'kendim' ? 'Bu senin kendi kodun' : 'Zaten listende');
      }
    } catch {
      show('Bağlantı kurulamadı');
    } finally {
      setBusy(false);
    }
  };

  const accept = async (uid: string) => {
    sfx.pop();
    const { acceptFriend } = await import('../online/friends');
    await acceptFriend(uid, { name: p.name, avatar: p.avatar, color: p.color });
  };

  const dismiss = async (uid: string) => {
    sfx.tap();
    const { dismissIncoming } = await import('../online/friends');
    await dismissIncoming(uid);
  };

  const drop = async (uid: string, name: string) => {
    if (!window.confirm(`${name} arkadaş listenden çıkarılsın mı?`)) return;
    sfx.tap();
    const { removeFriend } = await import('../online/friends');
    await removeFriend(uid);
  };

  const call = async (uid: string) => {
    if (!room) return;
    sfx.pop();
    const { invite } = await import('../online/friends');
    await invite(uid, room, { name: p.name, avatar: p.avatar, color: p.color });
    show('Davet gönderildi');
  };

  const joinRoomOf = async (roomCode: string) => {
    setBusy(true);
    try {
      const { joinRoom } = await import('../online/firebase');
      const r = await joinRoom(roomCode, { name: p.name, avatar: p.avatar, color: p.color });
      if (typeof r === 'string') show(r === 'network' ? 'İnternet bağlantısı yok' : 'Bu oda artık yok');
      else {
        useGame.getState().attach(r);
        nav('/oyun');
      }
    } finally {
      setBusy(false);
    }
  };

  if (!ONLINE_AVAILABLE) {
    return (
      <main className="bg page">
        <header className="topbar">
          <button className="round-btn round-btn--soft" onClick={() => nav(-1)} aria-label="Geri"><X size={22} /></button>
          <h1 className="topbar__title title-md">Arkadaşlar</h1>
        </header>
        <p className="muted">Çevrimiçi oyun kapalı olduğu için arkadaş listesi kullanılamıyor.</p>
      </main>
    );
  }

  return (
    <main className="bg page friends">
      <header className="topbar">
        <button className="round-btn round-btn--soft" onClick={() => (sfx.tap(), nav(-1))} aria-label="Geri"><X size={22} /></button>
        <h1 className="topbar__title title-md">Arkadaşlar</h1>
      </header>

      {/* ---- Gelen oyun davetleri ---- */}
      {invites.map((x) => (
        <section key={x.uid} className="paper-card invite-card pop-in">
          <Avatar emoji={x.avatar} color={x.color} size={44} />
          <div className="invite-card__text">
            <b>{x.name} seni oyuna çağırdı</b>
            <small>Oda {x.code} · {since(x.at)}</small>
          </div>
          <button className="pill pill--teal" disabled={busy} onClick={() => void joinRoomOf(x.code)}>
            <LogIn size={18} strokeWidth={2.8} /> Katıl
          </button>
          <button className="round-btn round-btn--soft" aria-label="Kapat" onClick={async () => {
            sfx.tap();
            const { dismissInvite } = await import('../online/friends');
            await dismissInvite(x.uid);
          }}><X size={18} /></button>
        </section>
      ))}

      {/* ---- Kendi kodum ---- */}
      <section className="paper-card code-card">
        <span className="code-card__label">Senin arkadaş kodun</span>
        <div className="code-card__row">
          <b className="code-card__code">{code || '······'}</b>
          <button className="round-btn round-btn--soft" aria-label="Kopyala" disabled={!code} onClick={copy}><Copy size={20} /></button>
          <button className="round-btn round-btn--soft" aria-label="Paylaş" disabled={!code} onClick={shareCode}><Share2 size={20} /></button>
        </div>
        <p className="muted">Bu kodu arkadaşlarına ver; onlar da sana kendi kodunu versin.</p>
      </section>

      {/* ---- Arkadaş ekle ---- */}
      <section className="paper-card add-card">
        <label className="code-card__label" htmlFor="kod">Arkadaş kodu ile ekle</label>
        <div className="add-card__row">
          <input
            id="kod"
            className="input input--code"
            value={input}
            onChange={(e) => setInput(normCode(e.target.value))}
            onKeyDown={(e) => e.key === 'Enter' && void add()}
            placeholder={'·'.repeat(CODE_LEN)}
            maxLength={CODE_LEN}
            autoComplete="off"
            inputMode="text"
          />
          <button className="pill" disabled={normCode(input).length !== CODE_LEN || busy} onClick={add}>
            <UserPlus size={20} strokeWidth={2.8} /> Ekle
          </button>
        </div>
      </section>

      {/* ---- Gelen istekler ---- */}
      {incoming.length > 0 && (
        <section className="friend-group">
          <h2 className="friend-group__title">Gelen istekler</h2>
          <ul className="friend-list">
            {incoming.map((x) => (
              <li key={x.uid} className="friend-row">
                <Avatar emoji={x.avatar} color={x.color} size={40} />
                <div className="friend-row__text">
                  <b>{x.name}</b>
                  <small>{x.k === 'req' ? 'seni arkadaş olarak ekledi' : 'isteğini kabul etti'}</small>
                </div>
                {x.k === 'req' ? (
                  <>
                    <button className="round-btn round-btn--ok" aria-label="Kabul et" onClick={() => void accept(x.uid)}><Check size={20} strokeWidth={3} /></button>
                    <button className="round-btn round-btn--soft" aria-label="Reddet" onClick={() => void dismiss(x.uid)}><X size={20} strokeWidth={3} /></button>
                  </>
                ) : (
                  <button className="round-btn round-btn--soft" aria-label="Kapat" onClick={() => void dismiss(x.uid)}><X size={20} strokeWidth={3} /></button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- Arkadaş listesi ---- */}
      <section className="friend-group">
        <h2 className="friend-group__title">Arkadaşların {mine.length > 0 && <span className="muted">({mine.filter((x) => x.on).length} çevrimiçi)</span>}</h2>
        {mine.length === 0 ? (
          <div className="paper-card empty-card">
            <Icon name="el" size={40} />
            <p>Henüz arkadaşın yok. Kodunu paylaş ya da arkadaşının kodunu yukarıya yaz.</p>
          </div>
        ) : (
          <ul className="friend-list">
            {mine.map((x) => (
              <li key={x.uid} className={`friend-row ${x.on ? 'is-on' : ''}`}>
                <Avatar emoji={x.avatar} color={x.color} size={40} off={!x.on} />
                <div className="friend-row__text">
                  <b>{x.name}</b>
                  <small>{x.on ? (x.room ? `Oda ${x.room}` : 'çevrimiçi') : `son görülme ${since(x.seen)}`}</small>
                </div>
                {x.on && x.room && x.room !== room && (
                  <button className="pill pill--teal pill--sm" disabled={busy} onClick={() => void joinRoomOf(x.room!)}>
                    <LogIn size={16} strokeWidth={2.8} /> Katıl
                  </button>
                )}
                {room && x.on && x.room !== room && (
                  <button className="pill pill--sm" onClick={() => void call(x.uid)}>
                    <Send size={16} strokeWidth={2.8} /> Davet
                  </button>
                )}
                <button className="round-btn round-btn--soft" aria-label="Çıkar" onClick={() => void drop(x.uid, x.name)}><Trash2 size={18} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Gönderilmiş, henüz kabul edilmemiş istekler ---- */}
      {waiting.length > 0 && (
        <section className="friend-group">
          <h2 className="friend-group__title">Bekleyen isteklerin</h2>
          <ul className="friend-list">
            {waiting.map((x) => (
              <li key={x.uid} className="friend-row is-waiting">
                <Avatar emoji={x.avatar} color={x.color} size={40} off />
                <div className="friend-row__text">
                  <b>{x.name}</b>
                  <small>kabul etmesi bekleniyor</small>
                </div>
                <button className="round-btn round-btn--soft" aria-label="İsteği geri al" onClick={() => void drop(x.uid, x.name)}><Trash2 size={18} /></button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- Bildirim ayarları ---- */}
      <section className="paper-card notify-card">
        <h2 className="friend-group__title">Bildirimler</h2>
        {!allowed && (
          <button className="btn-outline notify-card__ask" onClick={() => void askNotify().then(setAllowed)}>
            <BellOff size={20} /> Bildirimler kapalı — izin ver
          </button>
        )}
        <div className="toggles">
          <Toggle
            icon={<Bell size={20} />}
            label="Davet ve arkadaş isteği"
            desc="Arkadaşın seni oyuna çağırınca bildir"
            on={p.notifyInvite}
            set={(v) => p.set({ notifyInvite: v })}
          />
          <Toggle
            icon={<Bell size={20} />}
            label="Arkadaşım çevrimiçi olunca"
            desc="Sık gelebilir; varsayılan kapalı"
            on={p.notifyOnline}
            set={(v) => p.set({ notifyOnline: v })}
          />
        </div>
        <p className="muted">Bildirimler uygulama açıkken ya da yeni kapatılmışken gelir.</p>
      </section>
      {toast}
    </main>
  );
}
