/** Emoji tepkileri: basınca herkesin ekranında yukarı uçar. */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { hasIcon } from '../../art/icons';
import { Icon } from '../../components/Icon';
import { Avatar } from '../../components/ui';
import type { RoomState } from '../../engine/types';
import { sfx } from '../../lib/sfx';
import type { Transport } from '../../online/transport';

const EMOJIS = ['haha', 'vay', 'ates', 'kalp', 'hmm', 'uzgun'];

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
          <button key={e} className="react-btn" onClick={() => send(e)} aria-label={e}><Icon name={e} size={30} /></button>
        ))}
      </div>
      <div className="react-fly" aria-hidden="true">
        {flying.map(([id, r]) => {
          const p = s.players[r.p];
          const x = (parseInt(id.slice(-4), 10) % 70) + 10;
          return (
            <span key={id} className="react-float" style={{ '--x': `${x}%` } as CSSProperties}>
              <span className="react-float__e">{hasIcon(r.e) ? <Icon name={r.e} size={52} /> : r.e}</span>
              {p && <Avatar emoji={p.avatar} color={p.color} size={26} />}
            </span>
          );
        })}
      </div>
    </>
  );
}
