/**
 * Film Avı turu: ipuçları birer birer açılır, herkes istediği an filmin adını yazar.
 * Uzun adları parmakla yazmak zor: ilk harflerden sonra öneri listesi çıkar, dokunmak tahmin etmektir.
 * Yanlış tahmin birkaç saniye bekletir (rastgele denemeyle kazanılmasın). Tur kapanınca film açıklanır.
 */
import { Check, Eraser, Keyboard, PenLine, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { confetti } from '../../lib/confetti';
import { FilmLeader } from '../../components/CinemaScene';
import { Icon } from '../../components/Icon';
import { InkPad } from '../../components/InkPad';
import { Avatar, Timer, useNow } from '../../components/ui';
import { CLUE_PTS, CLUES, clueAt, clues, filmById, pickCandidate, ptsAt, suggest } from '../../engine/film';
import { trUpper } from '../../engine/tr';
import type { RoomState } from '../../engine/types';
import { buzz } from '../../lib/feel';
import { recognize, type Stroke } from '../../lib/ink';
import { sfx } from '../../lib/sfx';
import type { Transport } from '../../online/transport';
import { filmPlayers, guessFilm, LEAD_MS, stepMs, totalRounds } from '../filmDirector';

/** Yanlış tahminden sonra bekleme. */
const WRONG_LOCK_MS = 2500;

export function FilmRound({ t, s }: { t: Transport; s: RoomState }) {
  const now = useNow(() => t.now(), 150);
  const c = s.ctl;
  const film = filmById(c.film);
  const step = stepMs(s);
  const clue = clueAt(c.startAt, step, now);
  const list = film ? clues(film) : [];
  const reveal = !!c.nextAt;
  const mineGot = c.got?.[t.me];
  const playing = !reveal && clue > 0 && !mineGot;
  // Sayaç: sıradaki ipucuna (son ipucunda turun sonuna) kalan süre.
  const nextAt = clue === 0 ? c.startAt : clue >= CLUES ? c.endAt : c.startAt + clue * step;
  const left = Math.max(0, Math.ceil((nextAt - now) / 1000));
  const lastClue = clue >= CLUES;

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [text, setText] = useState('');
  const [alts, setAlts] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [kb, setKb] = useState(false);
  const [sent, setSent] = useState(false);
  const [lockUntil, setLockUntil] = useState(0);
  const [wrong, setWrong] = useState('');
  const padBox = useRef<HTMLDivElement>(null);
  const readTimer = useRef(0);
  const reqId = useRef(0);
  const locked = now < lockUntil;

  const clear = () => {
    setStrokes([]);
    setText('');
    setAlts([]);
    setBusy(false);
    reqId.current++;
    clearTimeout(readTimer.current);
  };
  // Yeni filmde defter temizlenir.
  useEffect(() => {
    clear();
    setSent(false);
    setLockUntil(0);
    setWrong('');
  }, [c.round]);

  // ---- El yazısı tanıma ----
  const read = async (strokes: Stroke[]) => {
    const n = ++reqId.current;
    if (!strokes.length) {
      setText('');
      setAlts([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    const box = padBox.current;
    const cands = await recognize(strokes, box?.clientWidth ?? 320, box?.clientHeight ?? 200);
    if (reqId.current !== n) return;
    const pick = pickCandidate(cands);
    setText(pick.text);
    setAlts(pick.alts);
    setBusy(false);
    if (pick.text) sfx.write();
  };
  const onStrokes = (next: Stroke[]) => {
    setStrokes(next);
    setWrong('');
    clearTimeout(readTimer.current);
    readTimer.current = window.setTimeout(() => void read(next), 650);
  };

  const guess = async (input: string) => {
    if (!input.trim() || sent || locked || !playing) return;
    setSent(true);
    const r = await guessFilm(t, s, input);
    if (r === 'ok') {
      sfx.success();
      buzz.success();
      void confetti({ particleCount: 40, spread: 70, startVelocity: 30, origin: { y: 0.6 }, colors: ['#7c5cff', '#ffc83d', '#ff6b4a', '#14a89a'] });
      return;
    }
    setSent(false);
    if (r === 'wrong') {
      sfx.boo();
      buzz.warn();
      setWrong(trUpper(input.trim()));
      setLockUntil(t.now() + WRONG_LOCK_MS);
      clear();
    }
  };

  // ---- Sesler: yeni ipucu, başkası bildi, film açıklandı ----
  const lastClueSeen = useRef(clue);
  useEffect(() => {
    if (clue > lastClueSeen.current && !reveal) {
      sfx.whoosh();
      buzz.light();
    }
    lastClueSeen.current = clue;
  }, [clue, reveal]);
  const gotCount = Object.keys(c.got ?? {}).length;
  const lastGot = useRef(gotCount);
  useEffect(() => {
    if (gotCount > lastGot.current && !mineGot) sfx.coin();
    lastGot.current = gotCount;
  }, [gotCount]);
  useEffect(() => {
    if (reveal) sfx.reveal();
  }, [reveal]);
  // Film başlarken klaket, geri sayımda tık
  useEffect(() => {
    if (clue === 0 && !reveal) sfx.clap();
  }, [c.round]);
  const lead = useRef(-1);
  useEffect(() => {
    if (clue === 0 && !reveal && left !== lead.current && left > 0) {
      lead.current = left;
      sfx.tick(left);
    }
  }, [left, clue, reveal]);
  const tick = useRef(-1);
  useEffect(() => {
    if (playing && lastClue && left <= 5 && left !== tick.current) {
      tick.current = left;
      sfx.clock();
    }
  }, [left, playing, lastClue]);

  const players = filmPlayers(s);
  const sugg = playing && !busy ? suggest(text) : [];
  const total = totalRounds(s);

  return (
    <div className="film">
      <header className="turn__head">
        <div className="turn__count">
          <span className="round-label round-label--sm">{c.round}. film / {total}</span>
          <span className="muted">
            {reveal ? 'Film açıklandı' : clue === 0 ? 'Hazır ol…' : mineGot ? 'Bildin, diğerleri bekleniyor' : `Şimdi bilirsen ${ptsAt(clue)} puan`}
          </span>
        </div>
        {!reveal && <Timer left={left} total={clue === 0 ? LEAD_MS / 1000 : step / 1000} urgent={lastClue && left <= 5} />}
      </header>

      <ul className="turn__players">
        {players.map((pid) => {
          const p = s.players[pid];
          const got = c.got?.[pid];
          return (
            <li key={pid} className={`turn-player ${got ? 'is-got' : ''}`}>
              <Avatar emoji={p.avatar} color={p.color} size={34} off={!p.on && !p.bot} />
              <span className="turn-player__name">{pid === t.me ? 'Sen' : p.name}</span>
              <span className="turn-player__lives">{got ? <span className="film-got">+{got}</span> : null}</span>
              <b className="turn-player__pts">{c.pts?.[pid] ?? 0}</b>
            </li>
          );
        })}
      </ul>

      <ol className="clue-steps" aria-label="İpuçları">
        {CLUE_PTS.map((p, i) => (
          <li key={i} className={`clue-step ${i < clue || reveal ? 'is-open' : ''} ${i === clue - 1 && !reveal ? 'is-now' : ''}`}>{p}</li>
        ))}
      </ol>

      {reveal && film ? (
        <section className="paper-card film-reveal pop-in">
          <span className="word-card__label">Film</span>
          <h2 className="film-reveal__title">{film.t}</h2>
          <p className="muted film-reveal__sub">{film.y} · {film.d}</p>
          <ul className="film-reveal__got">
            {players.filter((p) => c.got?.[p]).sort((a, b) => (c.got![b] ?? 0) - (c.got![a] ?? 0)).map((pid) => (
              <li key={pid}>
                <Avatar emoji={s.players[pid].avatar} color={s.players[pid].color} size={26} />
                {pid === t.me ? 'Sen' : s.players[pid].name}
                <b>+{c.got![pid]}</b>
              </li>
            ))}
            {!gotCount && <li className="film-reveal__none"><Icon name="uzgun" size={22} /> Kimse bilemedi</li>}
          </ul>
          <p className="waiting"><span className="dots"><i /><i /><i /></span> {c.round >= total ? 'Sonuçlar geliyor' : 'Sıradaki film geliyor'}</p>
        </section>
      ) : clue === 0 ? (
        <FilmLeader round={c.round} left={left} />
      ) : (
        <ol className="clues">
          {list.slice(0, clue).map((x, i) => (
            <li key={i} className={`clue ${i === clue - 1 ? 'is-new' : ''}`}>
              <span className="clue__label">{x.label}</span>
              {x.words ? (
                <span className="clue__skel">
                  {x.words.map((w, j) => (
                    <span key={j} className="clue__word">
                      {[...w].map((ch, k) => <span key={k} className={ch === '_' ? 'is-blank' : ''}>{ch === '_' ? '' : ch}</span>)}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="clue__text">{x.text}</span>
              )}
            </li>
          ))}
        </ol>
      )}

      {!reveal && clue > 0 && mineGot ? (
        <section className="paper-card film-done pop-in">
          <span className="film-done__ok"><Check size={30} strokeWidth={3.4} /></span>
          <div>
            <h2 className="title-md">Bildin! +{mineGot}</h2>
            <p className="muted">{film?.t}</p>
          </div>
        </section>
      ) : null}

      {playing && (
        <section className="write-card turn-card film-card">
          {/*
            Tek satır: öneriler, okunan yazı ya da yol gösteren metin. Ayrı bir cevap kutusu yok —
            defterin üstünde iki şerit olunca yazacak alan daralıyordu (kullanıcı şikâyeti).
          */}
          <div className="alts">
            {sugg.length > 0 ? (
              <>
                <span className="alts__label">Bu mu?</span>
                {sugg.map((a) => (
                  <button key={a} className="alt" disabled={locked || sent} onClick={() => (sfx.tap(), void guess(a))}>{a}</button>
                ))}
              </>
            ) : busy ? (
              <span className="alts__label alts__label--idle"><span className="dots"><i /><i /><i /></span></span>
            ) : alts.length > 0 ? (
              <>
                <span className="alts__label">Bunu mu yazdın?</span>
                {alts.map((a) => (
                  <button key={a} className="alt" onClick={() => (sfx.tap(), setText(a), setAlts(alts.filter((x) => x !== a)))}>{trUpper(a)}</button>
                ))}
              </>
            ) : text && !kb ? (
              <span className="alts__mine pop-in" key={text}>{trUpper(text)}</span>
            ) : wrong ? (
              <span className="alts__wrong"><b className="film-wrong">{wrong}</b> olmadı!</span>
            ) : (
              <span className="alts__label alts__label--idle">{locked ? 'Biraz bekle…' : kb ? 'Filmin adını yaz' : 'İlk harfleri yaz, listeden seç'}</span>
            )}
          </div>

          {kb ? (
            <div className="kb-box">
              <input
                className={`input input--answer ${wrong ? 'is-wrong' : ''}`}
                autoFocus
                value={text}
                maxLength={60}
                placeholder="Filmin adı"
                autoComplete="off"
                enterKeyHint="send"
                onChange={(e) => (setText(e.target.value), setWrong(''))}
                onKeyDown={(e) => e.key === 'Enter' && void guess(text)}
              />
            </div>
          ) : (
            <div className="pad-box" ref={padBox}>
              <InkPad key={c.round} strokes={strokes} onChange={onStrokes} hint="filmin adını yaz" disabled={locked} />
            </div>
          )}

          <div className="pad-tools">
            <button className="tool" disabled={kb || !strokes.length} onClick={() => (sfx.tap(), onStrokes(strokes.slice(0, -1)))} aria-label="Geri al">
              <Undo2 size={22} strokeWidth={2.6} />
            </button>
            <button className="tool" disabled={!strokes.length && !text} onClick={() => (sfx.tap(), clear())} aria-label="Sil">
              <Eraser size={22} strokeWidth={2.6} />
            </button>
            <button className={`tool ${kb ? 'is-on' : ''}`} onClick={() => (sfx.tap(), setKb(!kb))} aria-label={kb ? 'El yazısı' : 'Klavye'}>
              {kb ? <PenLine size={22} strokeWidth={2.6} /> : <Keyboard size={22} strokeWidth={2.6} />}
            </button>
            <span className="pad-tools__gap" />
            <button className="pill film-card__go" disabled={!text.trim() || sent || locked} onClick={() => void guess(text)}>
              {locked ? `Bekle ${Math.ceil((lockUntil - now) / 1000)}` : 'Tahmin Et'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
