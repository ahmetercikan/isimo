/**
 * Sıra Sende: masadaki kelimeden tek harf değiştirip yeni kelime yazma ekranı.
 * Sırası gelen oyuncu parmağıyla ya da klavyeyle yazar; kural kontrolü anında görünür.
 */
import { Eraser, Keyboard, PenLine, SkipForward, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Icon } from '../../components/Icon';
import { InkPad } from '../../components/InkPad';
import { Avatar, Timer, useNow } from '../../components/ui';
import { chainList, check, pickCandidate, ruleOf, show, whyText } from '../../engine/chain';
import { locative } from '../../engine/tr';
import type { RoomState } from '../../engine/types';
import { buzz } from '../../lib/feel';
import { recognize, type Stroke } from '../../lib/ink';
import { sfx } from '../../lib/sfx';
import type { Transport } from '../../online/transport';
import { alive, missTurn, playWord, seated } from '../chainDirector';

export function Turn({ t, s }: { t: Transport; s: RoomState }) {
  const now = useNow(() => t.now(), 150);
  const c = s.ctl;
  const word = c.word ?? '';
  const used = chainList(c.chain);
  const rule = ruleOf(s.settings.free);
  const mine = c.turn === t.me;
  const total = s.settings.time;
  const left = Math.max(0, Math.ceil((c.endAt - now) / 1000));
  const urgent = left <= 8;

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [text, setText] = useState('');
  const [alts, setAlts] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [kb, setKb] = useState(false);
  const [sent, setSent] = useState(false);
  const padBox = useRef<HTMLDivElement>(null);
  const readTimer = useRef(0);
  const reqId = useRef(0);

  // Sıra değişince defter temizlenir.
  useEffect(() => {
    setStrokes([]);
    setText('');
    setAlts([]);
    setBusy(false);
    setSent(false);
    reqId.current++;
    clearTimeout(readTimer.current);
  }, [c.turn, c.word, c.seq]);

  const v = text.trim() ? check(word, text, used, rule) : null;
  const valid = v?.why === 'ok';

  // ---- El yazısı tanıma ----
  const read = async (list: Stroke[]) => {
    const n = ++reqId.current;
    if (!list.length) {
      setText('');
      setAlts([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    const box = padBox.current;
    const cands = await recognize(list, box?.clientWidth ?? 320, box?.clientHeight ?? 200);
    if (reqId.current !== n) return;
    const pick = pickCandidate(cands, word, used, rule);
    setText(pick.text);
    setAlts(pick.alts);
    setBusy(false);
    if (pick.text) sfx.write();
  };
  const onStrokes = (list: Stroke[]) => {
    setStrokes(list);
    clearTimeout(readTimer.current);
    readTimer.current = window.setTimeout(() => void read(list), 650);
  };

  const play = async () => {
    if (!valid || sent || !v) return;
    setSent(true);
    const ok = await playWord(t, s, v.word);
    if (ok) {
      sfx.pop();
      buzz.success();
      void confetti({ particleCount: 28, spread: 60, startVelocity: 26, origin: { y: 0.6 }, colors: ['#14a89a', '#ffc83d', '#ff6b4a'] });
    } else setSent(false);
  };

  const pass = async () => {
    if (sent) return;
    setSent(true);
    sfx.tap();
    buzz.warn();
    if (!(await missTurn(t, s, t.me, 'pass'))) setSent(false);
  };

  // ---- Duyurular (son olay) ----
  const lastSeen = useRef(c.seq);
  useEffect(() => {
    if (c.seq === lastSeen.current) return;
    lastSeen.current = c.seq;
    const k = c.last?.k;
    if (k === 'time' || k === 'pass') sfx.clock();
    if (k === 'out') {
      sfx.siren();
      buzz.heavy();
    }
  }, [c.seq, c.last?.k]);
  const tick = useRef(-1);
  useEffect(() => {
    if (mine && left <= 5 && left !== tick.current) {
      tick.current = left;
      sfx.clock();
    }
  }, [left, mine]);

  const players = seated(s);
  const liveCount = alive(s).length;
  const turnName = s.players[c.turn ?? '']?.name ?? '';
  const last = c.last;
  const lastName = last ? (last.p === t.me ? 'Sen' : s.players[last.p]?.name ?? '') : '';
  const note =
    last?.k === 'fresh'
      ? `Yol kalmadı! Masaya yeni kelime geldi: ${show(last.w ?? '')}`
      : last?.k === 'ok'
        ? `${lastName}: ${show(last.w ?? '')}`
        : last?.k === 'pass'
          ? `${lastName} pas geçti — bir can gitti`
          : last?.k === 'time'
            ? `${lastName} süreyi kaçırdı — bir can gitti`
            : last?.k === 'out'
              ? `${lastName} elendi!`
              : '';

  return (
    <div className={`turn ${urgent && mine ? 'is-urgent' : ''}`}>
      <header className="turn__head">
        <div className="turn__count">
          <span className="round-label round-label--sm">{c.round}. kelime</span>
          <span className="muted">{liveCount} oyuncu ayakta</span>
        </div>
        <Timer left={left} total={total} urgent={urgent} />
      </header>

      <ul className="turn__players">
        {players.map((pid) => {
          const p = s.players[pid];
          const lives = c.lives?.[pid] ?? 0;
          return (
            <li key={pid} className={`turn-player ${c.turn === pid ? 'is-turn' : ''} ${lives ? '' : 'is-out'}`}>
              <Avatar emoji={p.avatar} color={p.color} size={34} off={!p.on && !p.bot} />
              <span className="turn-player__name">{pid === t.me ? 'Sen' : p.name}</span>
              <span className="turn-player__lives" aria-label={`${lives} can`}>
                {lives > 0 ? Array.from({ length: Math.min(lives, 4) }, (_, i) => <Icon key={i} name="kalp" size={13} />) : <Icon name="uzgun" size={16} />}
              </span>
              <b className="turn-player__pts">{c.pts?.[pid] ?? 0}</b>
            </li>
          );
        })}
      </ul>

      <section className="word-card">
        <span className="word-card__label">Masadaki kelime</span>
        <div className="word-tiles" key={word}>
          {show(word).split('').map((ch, i) => (
            <span key={i} className="letter-tile letter-tile--word" style={{ animationDelay: `${i * 0.05}s` }}>{ch}</span>
          ))}
        </div>
        <p className="word-card__rule">
          {rule === 'serbest' ? 'Tek bir harf değiştir, ekle ya da çıkar' : 'Tek bir harf değiştir, yeni kelime yap'}
        </p>
      </section>

      {note && <div className="turn-note pop-in" key={c.seq}>{note}</div>}

      {mine ? (
        <section className="write-card turn-card">
          <div className={`answer ${text ? 'has-text' : ''} ${v && !valid ? 'is-wrong' : ''}`}>
            {text ? <span className="answer__text pop-in" key={text}>{show(text)}</span> : busy ? null : <span className="answer__ph">yaz…</span>}
            {busy && <span className="answer__busy"><span className="dots"><i /><i /><i /></span></span>}
            {v && !valid && <span className="answer__warn">{whyText(v.why, rule)}</span>}
          </div>

          <div className="alts">
            {alts.length > 0 && !busy ? (
              <>
                <span className="alts__label">Bunu mu demek istedin?</span>
                {alts.map((a) => (
                  <button key={a} className="alt" onClick={() => (sfx.tap(), setText(a), setAlts(alts.filter((x) => x !== a)))}>{show(a)}</button>
                ))}
              </>
            ) : (
              <span className="alts__label alts__label--idle">{kb ? 'Kelimeyi yaz' : 'Parmağınla büyük ve rahat yaz'}</span>
            )}
          </div>

          {kb ? (
            <div className="kb-box">
              <input
                className={`input input--answer ${v && !valid ? 'is-wrong' : ''}`}
                autoFocus
                value={text}
                maxLength={8}
                placeholder={`${word.length} harfli kelime`}
                autoComplete="off"
                enterKeyHint="send"
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void play()}
              />
            </div>
          ) : (
            <div className="pad-box" ref={padBox}>
              <InkPad key={`${c.turn}-${c.seq}`} strokes={strokes} onChange={onStrokes} hint="kelimeyi yaz" />
            </div>
          )}

          <div className="pad-tools">
            <button className="tool" disabled={kb || !strokes.length} onClick={() => (sfx.tap(), onStrokes(strokes.slice(0, -1)))} aria-label="Geri al">
              <Undo2 size={22} strokeWidth={2.6} />
            </button>
            <button className="tool" disabled={!strokes.length && !text} onClick={() => (sfx.tap(), setText(''), setAlts([]), onStrokes([]))} aria-label="Sil">
              <Eraser size={22} strokeWidth={2.6} />
            </button>
            <button className={`tool ${kb ? 'is-on' : ''}`} onClick={() => (sfx.tap(), setKb(!kb))} aria-label={kb ? 'El yazısı' : 'Klavye'}>
              {kb ? <PenLine size={22} strokeWidth={2.6} /> : <Keyboard size={22} strokeWidth={2.6} />}
            </button>
            <span className="pad-tools__gap" />
            <button className="tool tool--pass" onClick={pass} disabled={sent} aria-label="Pas geç">
              Pas <SkipForward size={18} strokeWidth={2.8} />
            </button>
          </div>

          <button className={`pill pill--big turn__play ${valid ? 'pulse' : ''}`} disabled={!valid || sent} onClick={play}>
            {valid ? `${show(v!.word)} — Oyna!` : 'Oyna'}
          </button>
        </section>
      ) : (
        <section className="paper-card turn-wait pop-in">
          <Avatar emoji={s.players[c.turn ?? '']?.avatar ?? 'robot'} color={s.players[c.turn ?? '']?.color ?? '#14a89a'} size={64} />
          <h2 className="title-md">Sıra {locative(turnName)}</h2>
          <p className="waiting"><span className="dots"><i /><i /><i /></span> kelime arıyor</p>
        </section>
      )}

      {used.length > 1 && (
        <div className="chain-trail" aria-label="Oynanan kelimeler">
          {used.slice(-7, -1).map((w, i) => (
            <span key={`${w}-${i}`} className="chain-trail__w">{show(w)}</span>
          ))}
        </div>
      )}
    </div>
  );
}
