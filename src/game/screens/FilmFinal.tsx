/** Sinema Bilmecesi sonu ("Yılın Sinemaseveri" töreni): kazanan, sıralama, sorulan filmler, skor kartı paylaşımı ve tekrar oyna. */
import { confetti } from '../../lib/confetti';
import { Home, ImageUp, RotateCcw, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Avatar } from '../../components/ui';
import type { RoomState } from '../../engine/types';
import { buzz } from '../../lib/feel';
import { maybeInterstitial } from '../../lib/ads';
import { sfx } from '../../lib/sfx';
import { drawResults, shareImage } from '../../lib/shareCard';
import { shareStory } from '../../lib/storyCard';
import type { Transport } from '../../online/transport';
import { useProfile } from '../../store/useProfile';
import { actingHost, backToLobby } from '../director';
import { filmRank, playedFilms } from '../filmDirector';

const recorded = new Set<string>();

export function FilmFinal({ t, s, onExit }: { t: Transport; s: RoomState; onExit: () => void }) {
  const rank = filmRank(s);
  const isHost = actingHost(s) === t.me;
  const me = rank.find((r) => r.pid === t.me);
  const winner = rank[0] ? s.players[rank[0].pid] : null;
  const films = playedFilms(s);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    sfx.fanfare();
    buzz.success();
    // Altın konfeti (sinema teması)
    const colors = ['#f3c35b', '#fff3c9', '#c8902b', '#ffe39a'];
    const end = Date.now() + 1600;
    const frame = () => {
      void confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors });
      void confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    const key = `film-${s.code}-${s.created}-${s.ctl.seq}`;
    if (me && !recorded.has(key)) {
      recorded.add(key);
      useProfile.getState().addGame(me.pts, me.rank === 1);
    }
  }, []);

  const [making, setMaking] = useState(false);
  const story = async () => {
    if (!me || making) return;
    sfx.tap();
    setMaking(true);
    try {
      await shareStory({ name: s.players[t.me]?.name ?? '', pts: me.pts, rank: me.rank, players: rank.length, films: films.length });
    } catch {
      /* paylaşım iptal edildi */
    } finally {
      setMaking(false);
    }
  };

  const share = async () => {
    sfx.tap();
    const rows = rank.map((r) => ({ name: s.players[r.pid]?.name ?? '', avatar: s.players[r.pid]?.avatar ?? '', color: s.players[r.pid]?.color ?? '#ff6b4a', pts: r.pts, rank: r.rank }));
    const text = `Sinema Bilmecesi: ${winner?.name ?? ''} kazandı! Sen de oyna:`;
    try {
      const img = await drawResults({ game: 'film', rows, sub: `${films.length} film soruldu` });
      await shareImage(img, 'film-sonuc.png', text, 'Sonuçları paylaş');
    } catch {
      /* paylaşım iptal edildi */
    }
  };

  return (
    <div className="final final--chain">
      <h2 className="final__title pop-in">
        {me?.rank === 1 ? 'Kazandın!' : `Kazanan: ${winner?.name ?? ''}`} <Icon name="konfeti" size={44} />
      </h2>

      {winner && (
        <section className="oscar pop-in">
          <span className="oscar__label">Yılın Sinemaseveri</span>
          <Avatar emoji={winner.avatar} color={winner.color} size={92} />
          <b className="oscar__name">{rank[0].pid === t.me ? 'Sen' : winner.name}</b>
          <span className="oscar__pts">{rank[0].pts} puan</span>
          <Icon name="kupa" size={46} />
        </section>
      )}

      <p className="final__sub">{films.length} film soruldu</p>

      <ol className="rest rest--chain">
        {rank.map((r) => {
          const p = s.players[r.pid];
          if (!p) return null;
          return (
            <li key={r.pid} className={r.pid === t.me ? 'is-me' : ''}>
              <b>{r.rank}.</b>
              <Avatar emoji={p.avatar} color={p.color} size={32} />
              {p.name}
              <span className="rest__pts">{r.pts}</span>
            </li>
          );
        })}
      </ol>

      <div className="paper-card chain-card">
        <h3 className="chain-card__title">Sorulan filmler</h3>
        <div className="chain-card__words">
          {films.map((f) => (
            <span key={f.id} className="chain-word">{f.t} <small className="muted">{f.y}</small></span>
          ))}
        </div>
      </div>

      <footer className="final__foot">
        {isHost ? (
          <button
            className="pill pill--big"
            onClick={async () => {
              sfx.pop();
              await maybeInterstitial();
              void backToLobby(t);
            }}
          >
            <RotateCcw size={24} strokeWidth={2.6} /> Tekrar Oyna
          </button>
        ) : (
          <p className="waiting"><span className="dots"><i /><i /><i /></span> Ev sahibi yeni oyunu başlatabilir</p>
        )}
        {me && (
          <button className="pill story-btn" onClick={() => void story()} disabled={making}>
            <ImageUp size={22} strokeWidth={2.6} /> {making ? 'Hazırlanıyor…' : 'Skor kartını paylaş'}
          </button>
        )}
        <div className="final__row">
          <button className="btn-outline" onClick={share}><Share2 size={20} /> Paylaş</button>
          <button className="btn-outline" onClick={async () => (await maybeInterstitial(), onExit())}><Home size={20} /> Ana Sayfa</button>
        </div>
      </footer>
    </div>
  );
}
