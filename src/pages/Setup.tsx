import { Minus, Play, Plus, Users } from 'lucide-react';
import artFilm from '../assets/home/film.webp';
import artIsim from '../assets/home/isim.webp';
import artSiram from '../assets/home/siram.webp';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChainSettings } from '../components/ChainSettings';
import { FilmSettings } from '../components/FilmSettings';
import { QuizSettings } from '../components/QuizSettings';
import { QUIZZES } from '../data/quiz';
import { Doodles } from '../components/Doodles';
import { SettingsForm } from '../components/SettingsForm';
import { Avatar, TopBar, useToast } from '../components/ui';
import { BOT_LEVELS, BOT_PROFILES } from '../game/bots';
import { sfx } from '../lib/sfx';
import type { Settings } from '../engine/types';
import { useGame } from '../store/useGame';
import { DEFAULT_CHAIN, DEFAULT_FILM, useProfile } from '../store/useProfile';

export default function Setup() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const oyun = params.get('oyun');
  const quiz = oyun === 'quiz';
  const bots = useParams().mode === 'bot' && !quiz;
  const siram = oyun === 'siram';
  const film = oyun === 'film';
  const p = useProfile();
  const [settings, setSettings] = useState<Settings>(
    quiz ? { ...DEFAULT_FILM, game: 'quiz', rounds: 10, time: 20, quizId: QUIZZES.some((q) => q.id === params.get('evren')) ? params.get('evren')! : 'harrypotter' } : siram ? { ...DEFAULT_CHAIN, ...p.chain, game: 'siram' } : film ? { ...DEFAULT_FILM, ...p.film, game: 'film' } : p.settings,
  );
  const [count, setCount] = useState(p.bots.count);
  const [level, setLevel] = useState(p.bots.level);
  const [busy, setBusy] = useState(false);
  const [toast, show] = useToast();

  const go = async () => {
    if (busy) return;
    sfx.pop();
    if (!quiz) p.set(siram ? { chain: settings, bots: { count, level } } : film ? { film: settings, bots: { count, level } } : { settings, bots: { count, level } });
    if (bots) {
      useGame.getState().startBots(settings, count, level);
      nav('/oyun', { replace: true });
      return;
    }
    setBusy(true);
    try {
      const { createRoom } = await import('../online/firebase');
      const t = await createRoom({ name: p.name, avatar: p.avatar, color: p.color }, settings);
      p.set({ lastRoom: { code: t.code, at: Date.now() } });
      useGame.getState().attach(t);
      nav('/oyun', { replace: true });
    } catch {
      show('Oda kurulamadı. İnternet bağlantını kontrol et.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="bg page setup">
      <Doodles variant={2} />
      <TopBar title={`${quiz ? 'Sahneyi Hatırla' : siram ? 'Sıra Sende' : film ? 'Sinema Bilmecesi' : 'İsim Şehir'} · ${bots ? 'Botlara Karşı' : 'Oda Kur'}`} art={siram ? artSiram : film || quiz ? artFilm : artIsim} />

      {bots && (
        <section className="paper-card setup__bots rise">
          <div className="settings__title"><h3><Users className="ico-coral" strokeWidth={2.6} /> Rakipler</h3></div>
          <div className="bot-row">
            <button className="round-btn round-btn--soft" aria-label="Azalt" disabled={count <= 1} onClick={() => (sfx.tap(), setCount(count - 1))}><Minus size={22} strokeWidth={3} /></button>
            <div className="bot-faces">
              {BOT_PROFILES.slice(0, count).map((b, i) => (
                <span key={b.name} className="pop-in" style={{ animationDelay: `${i * 0.03}s` }}><Avatar emoji={b.avatar} color={b.color} size={40} /></span>
              ))}
            </div>
            <button className="round-btn round-btn--soft" aria-label="Arttır" disabled={count >= 9} onClick={() => (sfx.tap(), setCount(count + 1))}><Plus size={22} strokeWidth={3} /></button>
          </div>
          <p className="muted bot-count">{count} bot</p>
          <div className="seg">
            {BOT_LEVELS.map((l) => (
              <button key={l.level} className={`seg__btn ${level === l.level ? 'is-on' : ''}`} onClick={() => (sfx.tap(), setLevel(l.level))}>{l.label}</button>
            ))}
          </div>
        </section>
      )}

      <section className="paper-card setup__card rise" style={{ animationDelay: '0.06s' }}>
        {quiz ? <QuizSettings value={settings} onChange={setSettings} /> : siram ? (
          <ChainSettings value={settings} onChange={setSettings} />
        ) : film ? (
          <FilmSettings value={settings} onChange={setSettings} />
        ) : (
          <SettingsForm value={settings} onChange={setSettings} />
        )}
      </section>

      <div className="page__cta page__cta--sticky page__cta--spark">
        <button className="pill pill--big" onClick={go} disabled={busy}>
          {!busy && <Play size={26} fill="currentColor" strokeWidth={2} />}
          {busy ? 'Oda kuruluyor…' : bots ? 'Oyunu Başlat' : 'Odayı Kur'}
        </button>
      </div>
      {toast}
    </main>
  );
}
