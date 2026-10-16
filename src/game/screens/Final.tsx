/** Oyun sonu: kürsü, ödüller, tekrar oyna. */
import { Share } from '@capacitor/share';
import confetti from 'canvas-confetti';
import { Home, RotateCcw, Share2 } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { Icon } from '../../components/Icon';
import { Avatar } from '../../components/ui';
import { judgeRound, ranking } from '../../engine/scoring';
import type { RoomState } from '../../engine/types';
import { buzz } from '../../lib/feel';
import { say } from '../../lib/voice';
import { VOICE } from '../../voice/lines';
import { maybeInterstitial } from '../../lib/ads';
import { sfx } from '../../lib/sfx';
import type { Transport } from '../../online/transport';
import { useProfile } from '../../store/useProfile';
import { actingHost, backToLobby } from '../director';

const recorded = new Set<string>();

export function Final({ t, s, onExit }: { t: Transport; s: RoomState; onExit: () => void }) {
  const rank = ranking(s);
  const isHost = actingHost(s) === t.me;
  const me = rank.find((r) => r.pid === t.me);
  const winner = rank[0] ? s.players[rank[0].pid] : null;
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    sfx.fanfare();
    buzz.success();
    void say(me?.rank === 1 ? VOICE.win : VOICE.end, 1400);
    const colors = ['#ff6b4a', '#14a89a', '#ffc83d', '#e9487d', '#7c5cff'];
    const end = Date.now() + 1800;
    const frame = () => {
      void confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors });
      void confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    // İstatistik: her oyun bir kez
    const key = `${s.code}-${s.created}-${s.ctl.seq}`;
    if (me && !recorded.has(key)) {
      recorded.add(key);
      useProfile.getState().addGame(me.total, me.rank === 1);
    }
  }, []);

  const awards = useMemo(() => {
    const alone: Record<string, number> = {};
    const valid: Record<string, number> = {};
    const stops: Record<string, number> = {};
    for (let r = 1; r <= s.ctl.round; r++) {
      const res = s.results?.[`r${r}`];
      if (!res) continue;
      if (res.stopBy) stops[res.stopBy] = (stops[res.stopBy] ?? 0) + 1;
      const j = judgeRound(s, r, res.letter);
      for (const cat of Object.values(j))
        for (const [pid, v] of Object.entries(cat)) {
          if (v.pts === 20) alone[pid] = (alone[pid] ?? 0) + 1;
          if (v.valid) valid[pid] = (valid[pid] ?? 0) + 1;
        }
    }
    const best = (m: Record<string, number>) => Object.entries(m).sort((a, b) => b[1] - a[1])[0];
    return [
      { e: 'yildiz', t: 'Tek Kalan', d: 'en çok 20 puanlık cevap', w: best(alone) },
      { e: 'simsek', t: 'STOP Ustası', d: 'en çok STOP', w: best(stops) },
      { e: 'kitap', t: 'Kelime Hazinesi', d: 'en çok geçerli cevap', w: best(valid) },
    ].filter((a) => a.w && s.players[a.w[0]]);
  }, [s]);

  const share = async () => {
    sfx.tap();
    const lines = rank.slice(0, 5).map((r) => `${r.rank}. ${s.players[r.pid]?.name} — ${r.total}`);
    const text = `İsim Şehir sonuçları 🏆\n${lines.join('\n')}`;
    try {
      await Share.share({ title: 'İsim Şehir', text });
    } catch {
      await navigator.clipboard?.writeText(text).catch(() => {});
    }
  };

  const podium = [rank[1], rank[0], rank[2]];
  return (
    <div className="final">
      <h2 className="final__title pop-in">{me?.rank === 1 ? 'Kazandın!' : `Kazanan: ${winner?.name ?? ''}`} <Icon name="konfeti" size={44} /></h2>
      <div className="podium">
        {podium.map((r, i) => {
          if (!r) return <span key={i} className="podium__col podium__col--empty" />;
          const p = s.players[r.pid];
          const place = [2, 1, 3][i];
          return (
            <div key={r.pid} className={`podium__col podium__col--${place}`} style={{ animationDelay: `${[0.5, 0.9, 0.2][i]}s` }}>
              <Avatar emoji={p.avatar} color={p.color} size={place === 1 ? 76 : 58} />
              <span className="podium__name">{p.name}</span>
              <span className="podium__pts">{r.total}</span>
              <div className="podium__block">
                {r.rank <= 3 ? <Icon name={`m${r.rank}`} size={place === 1 ? 54 : 44} /> : <span>{r.rank}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {rank.length > 3 && (
        <ol className="rest" start={4}>
          {rank.slice(3).map((r) => (
            <li key={r.pid} className={r.pid === t.me ? 'is-me' : ''}>
              <b>{r.rank}.</b> <Avatar emoji={s.players[r.pid].avatar} color={s.players[r.pid].color} size={28} /> {s.players[r.pid].name}
              <span className="rest__pts">{r.total}</span>
            </li>
          ))}
        </ol>
      )}

      {awards.length > 0 && (
        <div className="awards">
          {awards.map((a, i) => (
            <div key={a.t} className="award rise" style={{ animationDelay: `${1.2 + i * 0.15}s` }}>
              <span className="award__e"><Icon name={a.e} size={46} /></span>
              <span className="award__t">{a.t}</span>
              <span className="award__w">{s.players[a.w![0]].name}</span>
              <small>{a.d}</small>
            </div>
          ))}
        </div>
      )}

      <footer className="final__foot">
        {isHost ? (
          <button className="pill pill--big" onClick={async () => {
            sfx.pop();
            await maybeInterstitial();
            void backToLobby(t);
          }}>
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
