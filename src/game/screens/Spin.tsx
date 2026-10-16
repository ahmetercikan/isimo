/** Harf sayacı: A'dan Z'ye sayar (çıkmış harfler atlanır), sırası gelen oyuncu DUR der. */
import { Hand } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Avatar, useNow } from '../../components/ui';
import { ALPHABET, HARD_LETTERS } from '../../engine/tr';
import type { RoomState } from '../../engine/types';
import { buzz } from '../../lib/feel';
import { sfx } from '../../lib/sfx';
import type { Transport } from '../../online/transport';
import { say } from '../../lib/voice';
import { VOICE } from '../../voice/lines';
import { letterAt, stopLetter } from '../director';

export function Spin({ t, s }: { t: Transport; s: RoomState }) {
  const now = useNow(() => t.now(), 50);
  const c = s.ctl;
  const cur = letterAt(c, s.settings.hard, now);
  const stopper = s.players[c.stopper];
  const mine = c.stopper === t.me && s.settings.manualStop;
  const pressed = useRef(false);
  const last = useRef('');
  const ticks = useRef(0);

  // Sunucu: ilk turda "oyun başlıyor", son turda "son tur", sıra bendeyse "sıra sende"
  useEffect(() => {
    const intro = c.round === 1 || c.round === s.settings.rounds;
    if (c.round === 1) void say(VOICE.gameStart);
    else if (c.round === s.settings.rounds) void say(VOICE.lastRound);
    if (mine) void say(VOICE.myTurn, intro ? 2200 : 300);
  }, [c.round]); // eslint-disable-line

  useEffect(() => {
    if (cur !== last.current) {
      last.current = cur;
      sfx.tick(ticks.current++);
    }
  }, [cur]);

  const stop = () => {
    if (pressed.current) return;
    pressed.current = true;
    sfx.stop();
    buzz.heavy();
    void stopLetter(t, s);
  };

  return (
    <div className="spin">
      <p className="round-label rise">Tur {c.round} / {s.settings.rounds}</p>
      <div className="spin__stage">
        <div className="spin__rays" aria-hidden="true" />
        <div key={cur} className="letter-tile letter-tile--spin">{cur}</div>
      </div>

      <div className="alpha-strip" aria-hidden="true">
        {ALPHABET.map((l) => {
          const used = c.used.includes(l);
          const off = !s.settings.hard && HARD_LETTERS.has(l);
          return (
            <span key={l} className={`alpha ${used ? 'is-used' : ''} ${off ? 'is-off' : ''} ${l === cur ? 'is-cur' : ''}`}>{l}</span>
          );
        })}
      </div>

      {mine ? (
        <div className="spin__action">
          <button className="dur-btn" onPointerDown={stop} aria-label="Dur">
            <Hand size={40} strokeWidth={2.6} />
            <span>DUR!</span>
          </button>
          <p className="spin__hint">Sıra sende! İstediğin anda bas.</p>
        </div>
      ) : (
        <div className="spin__action spin__wait">
          {stopper && <Avatar emoji={stopper.avatar} color={stopper.color} size={56} />}
          <p className="spin__hint">
            {s.settings.manualStop ? (
              <>
                <b>{stopper?.name ?? 'Biri'}</b> harfi durduracak…
              </>
            ) : (
              'Harf seçiliyor…'
            )}
          </p>
        </div>
      )}
    </div>
  );
}
