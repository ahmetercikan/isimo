import { Bot, CircleHelp, LogIn, Pencil, Plus, RotateCcw, Volume2, VolumeX, Wifi } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Doodles } from '../components/Doodles';
import { Avatar, Logo, useToast } from '../components/ui';
import { sfx } from '../lib/sfx';
import { ONLINE_AVAILABLE } from '../online/config';
import { useGame } from '../store/useGame';
import { useProfile } from '../store/useProfile';

export default function Home() {
  const nav = useNavigate();
  const p = useProfile();
  const [toast, show] = useToast();
  const [busy, setBusy] = useState(false);
  const recent = p.lastRoom && Date.now() - p.lastRoom.at < 3 * 3600_000 ? p.lastRoom : null;

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
        <button className="round-btn round-btn--soft" aria-label={p.sfx ? 'Sesi kapat' : 'Sesi aç'} onClick={() => p.set({ sfx: !p.sfx, music: !p.sfx })}>
          {p.sfx ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </button>
      </header>

      <div className="home__logo pop-in">
        <Logo />
        <p className="home__tag">Harfi çevir, ilk sen yaz, <b>STOP</b> de!</p>
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

      <section className="home__cards">
        <div className="mode-card mode-card--online rise" style={{ animationDelay: '0.08s' }}>
          <div className="mode-card__head">
            <span className="mode-card__icon"><Wifi size={26} strokeWidth={2.6} /></span>
            <div>
              <h2 className="title-md">Arkadaşlarla</h2>
              <p>Herkes kendi telefonundan · en fazla 10 kişi</p>
            </div>
          </div>
          <div className="mode-card__btns">
            <button className="pill" disabled={!ONLINE_AVAILABLE} onClick={() => (sfx.tap(), nav('/kur/online'))}>
              <Plus size={24} strokeWidth={3} /> Oda Kur
            </button>
            <button className="pill pill--teal" disabled={!ONLINE_AVAILABLE} onClick={() => (sfx.tap(), nav('/katil'))}>
              <LogIn size={22} strokeWidth={2.8} /> Katıl
            </button>
          </div>
          {!ONLINE_AVAILABLE && <p className="mode-card__note">Çevrimiçi oyun yakında açılıyor.</p>}
        </div>

        <button className="mode-card mode-card--bots rise" style={{ animationDelay: '0.16s' }} onClick={() => (sfx.tap(), nav('/kur/bot'))}>
          <div className="mode-card__head">
            <span className="mode-card__icon"><Bot size={28} strokeWidth={2.4} /></span>
            <div>
              <h2 className="title-md">Botlara Karşı</h2>
              <p>İnternetsiz · hemen başla · ısın!</p>
            </div>
            <span className="mode-card__bots" aria-hidden="true">
              <Avatar emoji="robot" color="#a5b4fc" size={38} />
              <Avatar emoji="baykus" color="#ffc83d" size={38} />
              <Avatar emoji="tilki" color="#ff8a3d" size={38} />
            </span>
          </div>
        </button>
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
