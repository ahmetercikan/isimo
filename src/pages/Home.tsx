import { Bot, CircleHelp, LogIn, Pencil, Plus, RotateCcw, Users, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Doodles } from '../components/Doodles';
import { Icon } from '../components/Icon';
import { Avatar, Logo, useToast } from '../components/ui';
import { hideBanner, showBanner } from '../lib/ads';
import { sfx } from '../lib/sfx';
import { ONLINE_AVAILABLE } from '../online/config';
import { useFriends } from '../store/useFriends';
import { useGame } from '../store/useGame';
import { useProfile } from '../store/useProfile';

/** İki bölüm: İsim Şehir (STOP) ve Sıra Sende (harf değiştir). */
const GAMES = [
  { key: 'isim', icon: 'stop', title: 'İsim Şehir', tag: 'Harfi çevir, yaz, STOP de!', q: '' },
  { key: 'siram', icon: 'harf', title: 'Sıra Sende', tag: 'Bir harf değiştir, yeni kelime!', q: '?oyun=siram' },
] as const;

export default function Home() {
  const nav = useNavigate();
  const p = useProfile();
  const [toast, show] = useToast();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void showBanner();
    return () => void hideBanner();
  }, []);
  const recent = p.lastRoom && Date.now() - p.lastRoom.at < 3 * 3600_000 ? p.lastRoom : null;
  // Rozet: bekleyen davet + arkadaş isteği sayısı.
  const waiting = useFriends((s) => s.invites.length + s.incoming.length);
  const onlineNow = useFriends((s) => s.friends.filter((x) => x.mutual && x.on).length);

  const rejoin = async () => {
    if (!recent || busy) return;
    setBusy(true);
    try {
      const { joinRoom } = await import('../online/firebase');
      const r = await joinRoom(recent.code, { name: p.name, avatar: p.avatar, color: p.color });
      if (typeof r === 'string') {
        p.set({ lastRoom: null });
        show(r === 'network' ? 'İnternet bağlantısı yok' : 'Bu oyun bitmiş');
      } else {
        useGame.getState().attach(r);
        nav('/oyun');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="bg page home">
      <Doodles variant={0} />
      <header className="home__top rise">
        <button className="me-chip" onClick={() => (sfx.tap(), nav('/profil'))}>
          <Avatar emoji={p.avatar} color={p.color} size={44} />
          <span className="me-chip__name">{p.name}</span>
          <Pencil size={16} strokeWidth={2.6} />
        </button>
        {ONLINE_AVAILABLE && (
          <button className="round-btn round-btn--soft has-badge" aria-label="Arkadaşlar" onClick={() => (sfx.tap(), nav('/arkadaslar'))}>
            <Users size={22} />
            {waiting > 0 ? <span className="badge">{waiting}</span> : onlineNow > 0 ? <span className="badge badge--dot" aria-label={`${onlineNow} arkadaşın çevrimiçi`} /> : null}
          </button>
        )}
        <button className="round-btn round-btn--soft" aria-label={p.sfx ? 'Sesi kapat' : 'Sesi aç'} onClick={() => p.set({ sfx: !p.sfx, music: !p.sfx })}>
          {p.sfx ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </button>
      </header>

      <div className="home__logo pop-in">
        <Logo small />
      </div>

      {recent && (
        <button className="rejoin rise" onClick={rejoin} disabled={busy}>
          <RotateCcw size={22} strokeWidth={2.6} />
          <span>
            <b>Oyuna geri dön</b>
            <small>Oda {recent.code}</small>
          </span>
        </button>
      )}

      <section className="home__games">
        {GAMES.map((g, i) => (
          <article key={g.key} className={`mode-card mode-card--${g.key} rise`} style={{ animationDelay: `${0.08 + i * 0.08}s` }}>
            <div className="mode-card__head">
              <span className="mode-card__icon"><Icon name={g.icon} size={34} /></span>
              <div>
                <h2 className="title-md">{g.title}</h2>
                <p>{g.tag}</p>
              </div>
            </div>
            <div className="mode-card__btns">
              <button className="pill" disabled={!ONLINE_AVAILABLE} onClick={() => (sfx.tap(), nav(`/kur/online${g.q}`))}>
                <Plus size={22} strokeWidth={3} /> Oda Kur
              </button>
              <button className="pill pill--teal" disabled={!ONLINE_AVAILABLE} onClick={() => (sfx.tap(), nav('/katil'))}>
                <LogIn size={20} strokeWidth={2.8} /> Katıl
              </button>
            </div>
            <button className="mode-card__bot" onClick={() => (sfx.tap(), nav(`/kur/bot${g.q}`))}>
              <Bot size={26} strokeWidth={2.6} /> Botlara Karşı
              <span className="mode-card__faces" aria-hidden="true">
                <Avatar emoji="robot" color="#a5b4fc" size={32} />
                <Avatar emoji="baykus" color="#ffc83d" size={32} />
                <Avatar emoji="tilki" color="#ff8a3d" size={32} />
              </span>
            </button>
            {!ONLINE_AVAILABLE && <p className="mode-card__note">Çevrimiçi oyun yakında açılıyor.</p>}
          </article>
        ))}
      </section>

      <footer className="home__foot rise" style={{ animationDelay: '0.24s' }}>
        {p.stats.games > 0 && (
          <div className="stats">
            <span><b>{p.stats.games}</b> oyun</span>
            <span><b>{p.stats.wins}</b> birincilik</span>
            <span><b>{p.stats.best}</b> en iyi skor</span>
          </div>
        )}
        <button className="link-btn howto-link" onClick={() => (sfx.tap(), nav('/nasil'))}>
          <CircleHelp size={20} strokeWidth={2.6} /> Nasıl oynanır?
        </button>
      </footer>
      {toast}
    </main>
  );
}
