/** Oyun ekranı: aşamaya göre lobi, harf, yazma, değerlendirme, puanlar ve final. */
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Confirm } from '../components/ui';
import { Doodles } from '../components/Doodles';
import { ChainFinal } from '../game/screens/ChainFinal';
import { Final } from '../game/screens/Final';
import { Lobby } from '../game/screens/Lobby';
import { Review } from '../game/screens/Review';
import { Scores } from '../game/screens/Scores';
import { Spin } from '../game/screens/Spin';
import { Turn } from '../game/screens/Turn';
import { Write } from '../game/screens/Write';
import { setMood, type Mood } from '../lib/music';
import { preloadVoice } from '../lib/voice';
import { maybeInterstitial } from '../lib/ads';
import { VOICE_LINES } from '../voice/lines';
import { sfx } from '../lib/sfx';
import { useNow } from '../components/ui';
import { preloadDicts, useGame } from '../store/useGame';
import { loadWords } from '../engine/chain';

export default function Game() {
  const nav = useNavigate();
  const t = useGame((g) => g.t);
  const s = useGame((g) => g.s);
  const lost = useGame((g) => g.lost);
  const [ask, setAsk] = useState(false);
  const joinedPlayers = useRef<number | null>(null);

  // Fon müziği aşamaya göre: lobi sakin, harf seçerken rulo, yazarken tempolu, son 10 sn gerilim, sonra yumuşak.
  const now = useNow(() => (t ? t.now() : Date.now()), 500);
  let mood: Mood = 'off';
  if (s) {
    const c = s.ctl;
    mood = { lobby: 'lobby', spin: 'roll', review: 'chill', scores: 'chill', final: 'off', write: 'write', turn: 'write' }[c.phase] as Mood;
    if (c.phase === 'write') mood = now < c.startAt || now >= c.endAt ? 'off' : c.endAt - now <= 10500 ? 'tension' : 'write';
    if (c.phase === 'turn') mood = c.endAt - now <= 8000 ? 'tension' : 'write';
  }
  useEffect(() => setMood(mood), [mood]);
  useEffect(() => () => setMood('off'), []);
  useEffect(() => void preloadVoice(VOICE_LINES), []);
  // Oyun bitip lobiye dönülünce (oyun arası mola) geçiş reklamı; 3 dakikada en fazla bir kez
  const prevPhase = useRef(s?.ctl.phase);
  useEffect(() => {
    const ph = s?.ctl.phase;
    if (prevPhase.current === 'final' && ph === 'lobby') void maybeInterstitial();
    prevPhase.current = ph;
  }, [s?.ctl.phase]);

  useEffect(() => {
    const h = () => setAsk(true);
    window.addEventListener('game-back', h);
    return () => window.removeEventListener('game-back', h);
  }, []);

  // Sözlükler oyun başlamadan yüklensin
  const catKey = s?.settings.cats.map((c) => c.id).join(',');
  const siram = s?.settings.game === 'siram';
  useEffect(() => void (s && !siram && preloadDicts(s)), [catKey, siram]);
  // Sıra Sende'nin kelime havuzu
  useEffect(() => void (siram && loadWords()), [siram]);

  // Yeni oyuncu katılınca ses
  const count = s ? Object.values(s.players).filter((p) => !p.left).length : 0;
  useEffect(() => {
    if (joinedPlayers.current !== null && count > joinedPlayers.current) sfx.join();
    joinedPlayers.current = count;
  }, [count]);

  if (!t) return <Navigate to="/" replace />;

  const leave = async () => {
    await useGame.getState().leave();
    nav('/', { replace: true });
  };

  if (lost)
    return (
      <main className="bg page game-lost">
        <Doodles variant={2} />
        <div className="paper-card lost-card pop-in">
          <Icon name="fis" size={72} />
          <h2 className="title-lg">Oda kapandı</h2>
          <p className="muted">Herkes ayrıldı ya da bağlantı koptu.</p>
          <button className="pill" onClick={leave}>Ana Sayfa</button>
        </div>
      </main>
    );

  if (s && t.kind === 'online' && !s.players[t.me])
    return (
      <main className="bg page game-lost">
        <Doodles variant={2} />
        <div className="paper-card lost-card pop-in">
          <Icon name="el" size={72} />
          <h2 className="title-lg">Odadan çıkarıldın</h2>
          <p className="muted">Ev sahibi seni bu odadan çıkardı.</p>
          <button className="pill" onClick={leave}>Ana Sayfa</button>
        </div>
      </main>
    );

  if (!s)
    return (
      <main className="bg page page-wait">
        <div className="loader" aria-label="Yükleniyor" />
      </main>
    );

  const phase = s.ctl.phase;
  return (
    <main className={`bg page game game--${phase}`}>
      <Doodles variant={s.ctl.round % 4} />
      <button className="round-btn round-btn--soft game__exit" aria-label="Oyundan çık" onClick={() => (sfx.tap(), setAsk(true))}>
        <X size={24} strokeWidth={2.8} />
      </button>
      {phase === 'lobby' && <Lobby t={t} s={s} />}
      {phase === 'spin' && <Spin t={t} s={s} />}
      {phase === 'write' && <Write key={s.ctl.round} t={t} s={s} />}
      {phase === 'review' && <Review t={t} s={s} />}
      {phase === 'scores' && <Scores t={t} s={s} />}
      {phase === 'turn' && <Turn t={t} s={s} />}
      {phase === 'final' && (siram ? <ChainFinal t={t} s={s} onExit={leave} /> : <Final t={t} s={s} onExit={leave} />)}
      {ask && (
        <Confirm
          title="Oyundan çıkılsın mı?"
          text={t.kind === 'online' && phase !== 'lobby' ? 'Puanların tabloda kalır; aynı kodla geri dönebilirsin.' : undefined}
          yes="Çık"
          no="Kal"
          danger
          onYes={leave}
          onNo={() => setAsk(false)}
        />
      )}
    </main>
  );
}
