/**
 * Yazma: her kategori için el yazısı defteri. Yazılan okunur (chooseCandidate), cevap anında odaya yazılır.
 * Harf gösterimi ve 3-2-1 de burada (yazma startAt'te başlar).
 * STOP yalnızca bütün kategorilerde geçerli cevabı olana açıktır (isAnswer: harfi tutan, en az iki harfli).
 */
import { ArrowLeft, ArrowRight, Check, Eraser, Keyboard, PenLine, Undo2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import confetti from 'canvas-confetti';
import { CatIcon } from '../../components/Icon';
import { InkPad } from '../../components/InkPad';
import { Avatar, Timer, useNow } from '../../components/ui';
import { catInfo } from '../../engine/categories';
import { lookup } from '../../engine/dict';
import { capitalize, fixFirstLetter, isAnswer, startsWithLetter } from '../../engine/tr';
import { rKey, type RoomState } from '../../engine/types';
import { buzz } from '../../lib/feel';
import { say } from '../../lib/voice';
import { VOICE } from '../../voice/lines';
import { chooseCandidate, inkToPath, recognize, type Stroke } from '../../lib/ink';
import { sfx } from '../../lib/sfx';
import type { Transport } from '../../online/transport';
import { pressStop } from '../director';

interface Slot {
  strokes: Stroke[];
  text: string;
  alts: string[];
  busy: boolean;
  typed: boolean;
}
const empty = (): Slot => ({ strokes: [], text: '', alts: [], busy: false, typed: false });

export function Write({ t, s }: { t: Transport; s: RoomState }) {
  const now = useNow(() => t.now(), 150);
  const c = s.ctl;
  const cats = s.settings.cats;
  const letter = c.letter;
  const [cur, setCur] = useState(0);
  const [slots, setSlots] = useState<Record<string, Slot>>(() => Object.fromEntries(cats.map((x) => [x.id, empty()])));
  const [kb, setKb] = useState(false);
  const padBox = useRef<HTMLDivElement>(null);
  const reqId = useRef<Record<string, number>>({});
  const timers = useRef<Record<string, number>>({});
  const pending = useRef<Record<string, string>>({});

  const started = now >= c.startAt;
  const over = now >= c.endAt;
  const left = Math.max(0, Math.ceil((c.endAt - now) / 1000));
  const total = s.settings.time;
  const cat = cats[cur];
  const slot = slots[cat.id] ?? empty();
  const info = catInfo(cat);
  /** Bu kategori gerçekten dolu mu (harfi tutan, en az iki harfli cevap). */
  const ok = (id: string) => isAnswer(slots[id]?.text ?? '', letter);
  const filled = cats.filter((x) => ok(x.id)).length;
  const allDone = filled === cats.length;

  // ---- Odaya yazma (her kategori ayrı, kısa gecikmeyle; süre bitmeden hepsi gönderilir) ----
  const flushOne = useCallback(
    (id: string) => {
      if (!(id in pending.current)) return;
      const v = pending.current[id];
      delete pending.current[id];
      clearTimeout(timers.current[id]);
      void t.update({ [`answers/${rKey(c.round)}/${t.me}/${id}`]: v || null });
    },
    [t, c.round],
  );
  const queue = (id: string, text: string) => {
    pending.current[id] = text;
    clearTimeout(timers.current[id]);
    timers.current[id] = window.setTimeout(() => flushOne(id), 450);
  };
  useEffect(() => {
    if (over) Object.keys(pending.current).forEach(flushOne);
  }, [over, flushOne]);
  useEffect(() => () => Object.keys(pending.current).forEach(flushOne), [flushOne]);

  const setSlot = (id: string, p: Partial<Slot>) => setSlots((all) => ({ ...all, [id]: { ...(all[id] ?? empty()), ...p } }));

  // ---- El yazısı tanıma ----
  const read = async (id: string, strokes: Stroke[]) => {
    const n = (reqId.current[id] = (reqId.current[id] ?? 0) + 1);
    if (!strokes.length) {
      setSlot(id, { text: '', alts: [], busy: false });
      queue(id, '');
      void t.setInk(c.round, id, null);
      return;
    }
    setSlot(id, { busy: true });
    const box = padBox.current;
    const cands = await recognize(strokes, box?.clientWidth ?? 320, box?.clientHeight ?? 200);
    if (reqId.current[id] !== n) return;
    const pick = chooseCandidate(cands, letter, id);
    setSlot(id, { text: pick.text, alts: pick.alts, busy: false, typed: false });
    queue(id, pick.text);
    if (pick.text) {
      sfx.write();
      void t.setInk(c.round, id, inkToPath(strokes));
    }
  };
  const readTimer = useRef(0);
  const onStrokes = (strokes: Stroke[]) => {
    setSlot(cat.id, { strokes, typed: false });
    clearTimeout(readTimer.current);
    const id = cat.id;
    readTimer.current = window.setTimeout(() => void read(id, strokes), 650);
  };

  const choose = (text: string) => {
    sfx.tap();
    const old = slot.text;
    setSlot(cat.id, { text, alts: [old, ...slot.alts.filter((a) => a !== text)].filter(Boolean).slice(0, 4) });
    queue(cat.id, text);
  };

  const type = (v: string) => {
    const text = v.slice(0, 32);
    setSlot(cat.id, { text, typed: true, alts: [], strokes: [] });
    queue(cat.id, text);
    void t.setInk(c.round, cat.id, null);
  };

  const go = (d: number) => {
    sfx.tap();
    setCur((i) => (i + d + cats.length) % cats.length);
  };
  /** Sıradaki boş kategoriye geç. */
  const nextEmpty = () => {
    for (let k = 1; k <= cats.length; k++) {
      const i = (cur + k) % cats.length;
      if (!ok(cats[i].id)) return go(i - cur);
    }
    go(1);
  };

  // ---- Harf gösterimi ve 3-2-1 ----
  const revealed = useRef(false);
  const counted = useRef(-1);
  useEffect(() => {
    if (!revealed.current && !started) {
      revealed.current = true;
      sfx.reveal();
      buzz.success();
      void say(VOICE.letter(letter), 600);
      void confetti({ particleCount: 70, spread: 80, startVelocity: 38, origin: { y: 0.42 }, colors: ['#ff6b4a', '#14a89a', '#ffc83d', '#e9487d', '#7c5cff'] });
    }
  }, [started, letter]);
  const countdown = Math.ceil((c.startAt - now) / 1000);
  useEffect(() => {
    if (started || countdown > 3 || countdown === counted.current) return;
    counted.current = countdown;
    sfx.count(false);
  }, [countdown, started]);
  const wasStarted = useRef(started);
  useEffect(() => {
    if (started && !wasStarted.current) {
      sfx.count(true);
      buzz.light();
      if (now - c.startAt < 1500) void say(VOICE.go);
    }
    wasStarted.current = started;
  }, [started]);

  // ---- Son saniyeler, STOP ve süre bitti ----
  const tenSaid = useRef(false);
  useEffect(() => {
    if (started && !over && !c.stopBy && left <= 10 && left > 8 && !tenSaid.current) {
      tenSaid.current = true;
      void say(VOICE.tenLeft);
    }
  }, [left, started, over, c.stopBy]);
  const lastTick = useRef(-1);
  useEffect(() => {
    if (started && !over && left <= 5 && left !== lastTick.current) {
      lastTick.current = left;
      sfx.clock();
    }
  }, [left, started, over]);
  const stopSeen = useRef(c.stopBy);
  useEffect(() => {
    if (c.stopBy && !stopSeen.current) {
      stopSeen.current = c.stopBy;
      sfx.siren();
      buzz.warn();
      void say(VOICE.stop);
    }
  }, [c.stopBy, t.me]);
  const overSeen = useRef(false);
  useEffect(() => {
    if (over && !overSeen.current) {
      overSeen.current = true;
      sfx.timeUp();
      buzz.heavy();
      void say(VOICE.timeUp, 500);
    }
  }, [over]);

  // ---- Diğer oyuncuların ilerlemesi ----
  const progress = useMemo(() => {
    const ans = s.answers?.[rKey(c.round)] ?? {};
    return Object.entries(s.players)
      .filter(([p, v]) => p !== t.me && !v.left)
      .sort((a, b) => a[1].joined - b[1].joined)
      .map(([p, v]) => ({ pid: p, ...v, n: Object.values(ans[p] ?? {}).filter((x) => isAnswer(x ?? '', letter)).length }));
  }, [s.answers, s.players, c.round, t.me, letter]);

  const stopper = c.stopBy ? s.players[c.stopBy] : null;
  const wrongLetter = !!slot.text && !startsWithLetter(slot.text, letter);
  const inDict = slot.text ? lookup(cat.id, slot.text) : null;
  const urgent = started && !over && left <= 10;

  if (!started)
    return (
      <div className="reveal">
        <p className="round-label">Tur {c.round} / {s.settings.rounds}</p>
        <p className="reveal__label pop-in">Harfimiz</p>
        <div className="letter-tile letter-tile--big letter-tile--reveal">{letter}</div>
        <div className="reveal__count" key={countdown}>{countdown <= 3 ? (countdown > 0 ? countdown : 'YAZ!') : ''}</div>
        <div className="reveal__cats">
          {cats.map((x, i) => (
            <span key={x.id} className="mini-cat rise" style={{ animationDelay: `${0.4 + i * 0.06}s` }}><CatIcon cat={x} size={20} /> {x.label}</span>
          ))}
        </div>
      </div>
    );

  return (
    <div className={`write ${urgent ? 'is-urgent' : ''}`}>
      <header className="write__head">
        <div className="letter-badge" aria-label={`Harf ${letter}`}>{letter}</div>
        <div className="write__mid">
          <span className="round-label round-label--sm">Tur {c.round}/{s.settings.rounds}</span>
          <div className="others">
            {progress.slice(0, 9).map((p) => (
              <span key={p.pid} className={`other ${p.n === cats.length ? 'is-done' : ''}`} title={p.name}>
                <Avatar emoji={p.avatar} color={p.color} size={28} off={!p.on && !p.bot} />
                <b>{p.n}</b>
              </span>
            ))}
          </div>
        </div>
        <Timer left={left} total={c.stopBy ? s.settings.grace : total} urgent={urgent} />
      </header>

      {stopper && !over && (
        <div className="stop-banner pop-in">
          <span className="stop-sign">STOP</span>
          <span>
            <b>{c.stopBy === t.me ? 'Sen' : stopper.name}</b> STOP dedi! Son <b>{left}</b> saniye
          </span>
        </div>
      )}

      <nav className="cat-tabs" aria-label="Kategoriler">
        {cats.map((x, i) => {
          const done = ok(x.id);
          return (
            <button key={x.id} className={`cat-tab ${i === cur ? 'is-cur' : ''} ${done ? 'is-done' : ''}`} style={{ '--c': catInfo(x).color } as CSSProperties} onClick={() => (sfx.tap(), setCur(i))}>
              <span className="cat-tab__emoji">{done ? <Check size={16} strokeWidth={3.6} /> : <CatIcon cat={x} size={22} />}</span>
              {x.label}
            </button>
          );
        })}
      </nav>

      <section className="write-card" style={{ '--c': info.color } as CSSProperties} key={cat.id}>
        <div className="write-card__top">
          <h2 className="write-card__title">
            <CatIcon cat={cat} size={34} /> {cat.label}
          </h2>
          <span className="write-card__hint">
            <b>{letter}</b> ile başlayan {info.hint}
          </span>
        </div>

        {!kb && <div className={`answer ${slot.text ? 'has-text' : ''} ${wrongLetter ? 'is-wrong' : ''}`}>
          {slot.text ? (
            <span className="answer__text pop-in" key={slot.text}>{capitalize(slot.text)}</span>
          ) : slot.busy ? null : (
            <span className="answer__ph">{letter}…</span>
          )}
          {slot.busy && <span className="answer__busy"><span className="dots"><i /><i /><i /></span></span>}
          {!slot.busy && slot.text && !wrongLetter && inDict && <span className="answer__ok" title="Sözlükte var"><Check size={16} strokeWidth={3.4} /></span>}
          {wrongLetter && <span className="answer__warn">{letter} ile başlamıyor</span>}
        </div>}

        {/* Öneri satırı hep yerinde durur (yüksekliği sabit): öneri gelince yazı defteri kaymaz. */}
        {!kb && (
          <div className="alts">
            {slot.alts.length > 0 && !slot.busy ? (
              <>
                <span className="alts__label">Bunu mu demek istedin?</span>
                {slot.alts.map((a) => (
                  <button key={a} className="alt" onClick={() => choose(fixFirstLetter(a, letter))}>{capitalize(a)}</button>
                ))}
              </>
            ) : (
              <span className="alts__label alts__label--idle">{slot.text ? 'Yanlış okunduysa sil ve tekrar yaz' : 'Parmağınla büyük ve rahat yaz'}</span>
            )}
          </div>
        )}

        {kb ? (
          <div className="kb-box">
            <input
              className={`input input--answer ${wrongLetter ? 'is-wrong' : ''}`}
              autoFocus
              value={slot.text}
              placeholder={`${letter} ile başlayan ${info.hint}`}
              disabled={over}
              enterKeyHint="next"
              autoComplete="off"
              onChange={(e) => type(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && nextEmpty()}
            />
            {wrongLetter ? <span className="kb-box__note is-wrong">{letter} ile başlamıyor</span> : inDict ? <span className="kb-box__note"><Check size={14} strokeWidth={3.4} /> sözlükte var</span> : null}
          </div>
        ) : (
          <div className="pad-box" ref={padBox}>
            <InkPad key={cat.id} strokes={slot.strokes} onChange={onStrokes} disabled={over} hint={`${letter} ile yaz`} />
          </div>
        )}

        <div className="pad-tools">
          <button className="tool" disabled={over || !slot.strokes.length} onClick={() => (sfx.tap(), onStrokes(slot.strokes.slice(0, -1)))} aria-label="Geri al">
            <Undo2 size={22} strokeWidth={2.6} />
          </button>
          <button className="tool" disabled={over || (!slot.strokes.length && !slot.text)} onClick={() => (sfx.tap(), slot.typed ? type('') : onStrokes([]))} aria-label="Sil">
            <Eraser size={22} strokeWidth={2.6} />
          </button>
          <button className={`tool ${kb ? 'is-on' : ''}`} onClick={() => (sfx.tap(), setKb(!kb))} aria-label={kb ? 'El yazısı' : 'Klavye'}>
            {kb ? <PenLine size={22} strokeWidth={2.6} /> : <Keyboard size={22} strokeWidth={2.6} />}
          </button>
          <span className="pad-tools__gap" />
          <button className="tool" onClick={() => go(-1)} aria-label="Önceki"><ArrowLeft size={22} strokeWidth={2.8} /></button>
          <button className="tool tool--next" onClick={nextEmpty} aria-label="Sonraki">
            Sonraki <ArrowRight size={20} strokeWidth={2.8} />
          </button>
        </div>
      </section>

      <footer className="write__foot">
        {over ? (
          <div className="time-up pop-in">⏰ Süre doldu!</div>
        ) : s.settings.stop && !c.stopBy ? (
          <button
            className={`stop-btn ${allDone ? 'is-ready' : ''}`}
            disabled={!allDone}
            onClick={() => {
              Object.keys(pending.current).forEach(flushOne);
              sfx.siren();
              buzz.heavy();
              void pressStop(t, s);
            }}
          >
            {allDone ? 'STOP!' : `${filled}/${cats.length} doldu`}
          </button>
        ) : (
          <p className="write__count">{filled}/{cats.length} kategori dolu</p>
        )}
      </footer>
    </div>
  );
}
