/** Emoji tepkileri: basınca herkesin ekranında yukarı uçar. */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { RoomState } from '../../engine/types';
import { sfx } from '../../lib/sfx';
import type { Transport } from '../../online/transport';

const EMOJIS = ['😂', '👏', '😮', '🔥', '🤔', '🙈'];

export function Reactions({ t, s }: { t: Transport; s: RoomState }) {
  const since = useRef(t.now() - 1500);
  const [, setTick] = useState(0);
  const lastSent = useRef(0);
  const flying = Object.entries(s.reactions ?? {}).filter(([, r]) => r.t > since.current && t.now() - r.t < 3500);

  useEffect(() => {
    const iv = window.setInterval(() => setTick((x) => x + 1), 700);
    return () => clearInterval(iv);
  }, []);

  const send = (e: string) => {
    const now = t.now();
    if (now - lastSent.current < 600) return;
    lastSent.current = now;
    sfx.pop();
    void t.update({ [`reactions/${t.me.slice(0, 8)}-${now}`]: { p: t.me, e, t: now } });
  };

  return (
    <>
      <div className="react-bar">
        {EMOJIS.map((e) => (
          <button key={e} className="react-btn" onClick={() => send(e)} aria-label={e}>{e}</button>
        ))}
      </div>
      <div className="react-fly" aria-hidden="true">
        {flying.map(([id, r]) => {
          const p = s.players[r.p];
          const x = (parseInt(id.slice(-4), 10) % 70) + 10;
          return (
            <span key={id} className="react-float" style={{ '--x': `${x}%` } as CSSProperties}>
              <span className="react-float__e">{r.e}</span>
              {p && <span className="react-float__who" style={{ background: p.color }}>{p.avatar}</span>}
            </span>
          );
        })}
      </div>
    </>
  );
}
