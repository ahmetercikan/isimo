import { Bot, Brain, ChartNoAxesColumn, ChevronRight, Lightbulb, LogIn, Pencil, Play, Plus, RotateCcw, Users, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import artFilm from '../assets/home/film.webp';
import artIsim from '../assets/home/isim.webp';
import artSiram from '../assets/home/siram.webp';
import { Doodles } from '../components/Doodles';
import { Mascot } from '../components/Mascot';
import { TabBar } from '../components/TabBar';
import { Avatar, Modal, useToast } from '../components/ui';
import { hideBanner, showBanner } from '../lib/ads';
import { sfx } from '../lib/sfx';
import { ONLINE_AVAILABLE } from '../online/config';
import { useFriends } from '../store/useFriends';
import { useGame } from '../store/useGame';
import { useProfile } from '../store/useProfile';

/** Üç bölüm: İsim Şehir (STOP), Sıra Sende (harf değiştir) ve Sinema Bilmecesi (ipuçlarından film bil). */
const GAMES = [
  { key: 'isim', art: artIsim, title: 'İsim Şehir', tag: 'Harf çevir, yaz, STOP de!', q: '', chip: [ChartNoAxesColumn, 'Kelime Bilgisi'] },
  { key: 'siram', art: artSiram, title: 'Sıra Sende', tag: 'Bir harf değiştir, yeni kelime!', q: '?oyun=siram', chip: [Brain, 'Zeka Geliştirir'] },
  { key: 'film', art: artFilm, title: 'Sinema Bilmecesi', tag: 'İpuçlarından filmi ilk sen bil!', q: '?oyun=film', chip: [Lightbulb, 'Film Kültürü'] },
] as const;

export default function Home() {
  const nav = useNavigate();
  const p = useProfile();
  const [toast, show] = useToast();
  const [busy, setBusy] = useState(false);
  // "Oyna"ya basılan oyun: oda kur / katıl / botlara karşı seçimi açılır.
  const [pick, setPick] = useState<(typeof GAMES)[number] | null>(null);
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

  const go = (to: string) => {
    sfx.tap();
    setPick(null);
    nav(to);
  };

  return (
    <main className="bg page home has-tabbar">
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

      {recent && (
        <button className="rejoin rise" onClick={rejoin} disabled={busy}>
          <RotateCcw size={22} strokeWidth={2.6} />
          <span>
            <b>Oyuna geri dön</b>
            <small>Oda {recent.code}</small>
          </span>
        </button>
      )}

      <section className="home__hero">
        <div className="hello pop-in">
          <b>Merhaba {p.name}!</b>
          <span>Bugün hangi oyunu oynayalım?</span>
        </div>
        <Mascot className="home__mascot" />
      </section>

      <section className="home__games">
        {GAMES.map((g, i) => {
          const [ChipIcon, chipText] = g.chip;
          return (
            <article key={g.key} className={`game-card game-card--${g.key} rise`} style={{ animationDelay: `${0.08 + i * 0.08}s` }}>
              <img className="game-card__art" src={g.art} alt="" draggable={false} />
              <div className="game-card__body">
                <h2 className="game-card__title">{g.title}</h2>
                <p className="game-card__tag">{g.tag}</p>
                <div className="game-card__chips">
                  <span className="chip-tag"><Users size={14} strokeWidth={2.6} /> Çok Oyunculu</span>
                  <span className="chip-tag"><ChipIcon size={14} strokeWidth={2.6} /> {chipText}</span>
                </div>
                <div className="game-card__row">
                  <button className="play-btn" onClick={() => (sfx.tap(), setPick(g))}>
                    <Play size={24} fill="currentColor" strokeWidth={2} /> Oyna
                  </button>
                  <button className="game-card__more" aria-label={`${g.title} nasıl oynanır?`} onClick={() => (sfx.tap(), nav(`/nasil?oyun=${g.key}`))}>
                    <ChevronRight size={22} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <TabBar active="home" />

      {pick && (
        <Modal onClose={() => setPick(null)} className={`play-sheet play-sheet--${pick.key}`}>
          <div className="play-sheet__head">
            <img src={pick.art} alt="" />
            <div>
              <h2 className="title-md">{pick.title}</h2>
              <p>Nasıl oynamak istersin?</p>
            </div>
          </div>
          <div className="play-sheet__btns">
            <button className="pill" disabled={!ONLINE_AVAILABLE} onClick={() => go(`/kur/online${pick.q}`)}>
              <Plus size={22} strokeWidth={3} /> Oda Kur
            </button>
            <button className="pill pill--teal" disabled={!ONLINE_AVAILABLE} onClick={() => go('/katil')}>
              <LogIn size={20} strokeWidth={2.8} /> Odaya Katıl
            </button>
            <button className="pill play-sheet__bot" onClick={() => go(`/kur/bot${pick.q}`)}>
              <Bot size={24} strokeWidth={2.6} /> Botlara Karşı
            </button>
          </div>
          {!ONLINE_AVAILABLE && <p className="cta-note">Çevrimiçi oyun yakında açılıyor.</p>}
          <button className="link-btn" onClick={() => setPick(null)}>Vazgeç</button>
        </Modal>
      )}
      {toast}
    </main>
  );
}
