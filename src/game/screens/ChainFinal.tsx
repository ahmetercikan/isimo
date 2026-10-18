/** Sıra Sende sonu: kazanan, sıralama, oynanan kelime zinciri ve tekrar oyna. */
import { Share } from '@capacitor/share';
import confetti from 'canvas-confetti';
import { Home, RotateCcw, Share2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Icon } from '../../components/Icon';
import { Avatar } from '../../components/ui';
import { chainList, show } from '../../engine/chain';
import type { RoomState } from '../../engine/types';
import { buzz } from '../../lib/feel';
import { maybeInterstitial } from '../../lib/ads';
import { sfx } from '../../lib/sfx';
import type { Transport } from '../../online/transport';
import { useProfile } from '../../store/useProfile';
import { chainRank } from '../chainDirector';
import { actingHost, backToLobby } from '../director';

const recorded = new Set<string>();

export function ChainFinal({ t, s, onExit }: { t: Transport; s: RoomState; onExit: () => void }) {
  const rank = chainRank(s);
  const isHost = actingHost(s) === t.me;
  const me = rank.find((r) => r.pid === t.me);
  const winner = rank[0] ? s.players[rank[0].pid] : null;
  const chain = chainList(s.ctl.chain);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    sfx.fanfare();
    buzz.success();
    const colors = ['#ff6b4a', '#14a89a', '#ffc83d', '#e9487d', '#7c5cff'];
    const end = Date.now() + 1600;
    const frame = () => {
      void confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors });
      void confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    const key = `siram-${s.code}-${s.created}-${s.ctl.seq}`;
    if (me && !recorded.has(key)) {
      recorded.add(key);
      useProfile.getState().addGame(me.pts, me.rank === 1);
    }
  }, []);

  const share = async () => {
    sfx.tap();
    const lines = rank.slice(0, 5).map((r) => `${r.rank}. ${s.players[r.pid]?.name} — ${r.pts} puan`);
    const text = `Sıra Sende sonuçları\n${lines.join('\n')}\n\n${chain.map(show).join(' → ')}`;
    try {
      await Share.share({ title: 'Sıra Sende', text });
    } catch {
      await navigator.clipboard?.writeText(text).catch(() => {});
    }
  };

  return (
    <div className="final final--chain">
      <h2 className="final__title pop-in">
        {me?.rank === 1 ? 'Kazandın!' : `Kazanan: ${winner?.name ?? ''}`} <Icon name="konfeti" size={44} />
      </h2>

      <p className="final__sub">{chain.length} kelime oynandı</p>

      <ol className="rest rest--chain">
        {rank.map((r) => {
          const p = s.players[r.pid];
          if (!p) return null;
          return (
            <li key={r.pid} className={r.pid === t.me ? 'is-me' : ''}>
              <b>{r.rank}.</b>
              <Avatar emoji={p.avatar} color={p.color} size={32} />
              {p.name}
              {r.lives > 0 ? <span className="rest__tag">ayakta</span> : null}
              <span className="rest__pts">{r.pts}</span>
            </li>
          );
        })}
      </ol>

      <div className="paper-card chain-card">
        <h3 className="chain-card__title">Kelime zinciri</h3>
        <div className="chain-card__words">
          {chain.map((w, i) => (
            <span key={`${w}-${i}`} className="chain-word">{show(w)}</span>
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
        <div className="final__row">
          <button className="btn-outline" onClick={share}><Share2 size={20} /> Paylaş</button>
          <button className="btn-outline" onClick={async () => (await maybeInterstitial(), onExit())}><Home size={20} /> Ana Sayfa</button>
        </div>
      </footer>
    </div>
  );
}
