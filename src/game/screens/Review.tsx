/**
 * Değerlendirme: kategoriler sırayla gösterilir; herkesin cevabı el yazısıyla birlikte gelir.
 * Uydurma cevaba 👎 oy verilir; çoğunluk derse iptal. Herkes "Tamam" deyince ya da süre dolunca sonraki kategori.
 */
import { BookCheck, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { CatIcon } from '../../components/Icon';
import { InkView } from '../../components/InkPad';
import { Avatar, useNow } from '../../components/ui';
import { catInfo } from '../../engine/categories';
import { judgeCategory, roundPids, voterPids, type Verdict } from '../../engine/scoring';
import { capitalize } from '../../engine/tr';
import { rKey, type RoomState } from '../../engine/types';
import { buzz } from '../../lib/feel';
import { sfx } from '../../lib/sfx';
import type { Transport } from '../../online/transport';
import { activeHumans, markReady, reviewMs } from '../director';
import { Reactions } from './Reactions';
import { say } from '../../lib/voice';
import { VOICE } from '../../voice/lines';

export function Review({ t, s }: { t: Transport; s: RoomState }) {
  const now = useNow(() => t.now(), 250);
  const c = s.ctl;
  const k = rKey(c.round);
  const cat = s.settings.cats[c.cat];
  const info = catInfo(cat);
  const [ink, setInk] = useState<Record<string, Record<string, string>>>({});

  // El yazıları: bir kez, geç gelenler için kısa süre sonra bir kez daha
  useEffect(() => {
    let alive = true;
    const load = () => void t.getInk(c.round).then((v) => alive && setInk(v));
    load();
    const to = window.setTimeout(load, 2500);
    return () => {
      alive = false;
      clearTimeout(to);
    };
  }, [t, c.round]);

  useEffect(() => sfx.whoosh(), [c.cat]);
  useEffect(() => void say(VOICE.review, 400), []);

  const pids = useMemo(() => roundPids(s, c.round), [s, c.round]);
  const verdicts = useMemo(() => {
    const answers: Record<string, string | undefined> = {};
    for (const p of pids) answers[p] = s.answers?.[k]?.[p]?.[cat.id];
    return judgeCategory({ catId: cat.id, letter: c.letter, pids, answers, votes: s.votes?.[k]?.[cat.id], voters: voterPids(s) });
  }, [s, pids, k, cat.id, c.letter]);

  const ready = s.ready?.[k] ?? {};
  const iAmReady = (ready[t.me] ?? -1) >= c.cat;
  const humans = activeHumans(s);
  const readyCount = humans.filter((p) => (ready[p] ?? -1) >= c.cat).length;
  const leftMs = Math.max(0, c.catEndAt - now);
  const frac = Math.min(1, leftMs / reviewMs(Object.keys(s.players).length));
  const canVote = !s.players[t.me]?.bot;

  const vote = (target: string, on: boolean) => {
    if (on) {
      sfx.boo();
      buzz.light();
    } else sfx.tap();
    void t.update({ [`votes/${k}/${cat.id}/${target}/${t.me}`]: on ? true : null });
  };

  // Sıralama: katılma sırası, boşlar en sonda (oylar geldikçe satırlar yer değiştirmesin)
  const order = [...pids.filter((p) => verdicts[p].text), ...pids.filter((p) => !verdicts[p].text)];

  return (
    <div className="review">
      <header className="review__head">
        <div className="letter-badge letter-badge--sm">{c.letter}</div>
        <div className="review__title" style={{ '--c': info.color } as CSSProperties} key={cat.id}>
          <span className="review__emoji pop-in"><CatIcon cat={cat} size={40} /></span>
          <div>
            <h2 className="title-lg">{cat.label}</h2>
            <span className="review__step">Kategori {c.cat + 1} / {s.settings.cats.length}</span>
          </div>
        </div>
      </header>
      <div className="review__bar" aria-hidden="true">
        <span style={{ transform: `scaleX(${frac})` }} />
      </div>

      <ul className="answers" key={cat.id}>
        {order.map((pid, i) => (
          <AnswerRow
            key={pid}
            i={i}
            v={verdicts[pid]}
            p={s.players[pid]}
            me={pid === t.me}
            ink={ink[pid]?.[cat.id]}
            voted={!!s.votes?.[k]?.[cat.id]?.[pid]?.[t.me]}
            canVote={canVote && pid !== t.me && !!verdicts[pid].text && verdicts[pid].reason !== 'letter'}
            onVote={(on) => vote(pid, on)}
          />
        ))}
      </ul>

      <footer className="review__foot">
        <Reactions t={t} s={s} />
        {iAmReady ? (
          <p className="waiting">
            <span className="dots"><i /><i /><i /></span> Bekleniyor ({readyCount}/{humans.length})
          </p>
        ) : (
          <button className="pill pill--teal" onClick={() => (sfx.pop(), void markReady(t, s))}>
            <ThumbsUp size={22} strokeWidth={2.6} /> Tamam
          </button>
        )}
      </footer>
    </div>
  );
}

const REASON: Record<Verdict['reason'], string> = { ok: '', empty: 'boş', letter: 'harf uymuyor', voted: 'oyla iptal' };

function AnswerRow({ i, v, p, me, ink, voted, canVote, onVote }: {
  i: number; v: Verdict; p: RoomState['players'][string]; me: boolean; ink?: string; voted: boolean; canVote: boolean; onVote: (on: boolean) => void;
}) {
  if (!p) return null;
  const pts = v.pts;
  return (
    <li className={`answer-row ${v.valid ? '' : 'is-bad'} ${me ? 'is-me' : ''}`} style={{ animationDelay: `${0.12 + i * 0.09}s` }}>
      <Avatar emoji={p.avatar} color={p.color} size={42} />
      <div className="answer-row__body">
        <span className="answer-row__name">{me ? 'Sen' : p.name}</span>
        {v.text ? (
          <span className="answer-row__text">
            {capitalize(v.text)}
            {v.inDict && v.valid && <BookCheck size={16} className="answer-row__dict" aria-label="Sözlükte var" />}
            {v.same > 1 && <span className="same-tag">×{v.same}</span>}
          </span>
        ) : (
          <span className="answer-row__text answer-row__text--empty">—</span>
        )}
        {ink && v.text && <InkView ink={ink} height={30} />}
        {!v.valid && v.text && <span className="answer-row__why">{REASON[v.reason]}</span>}
      </div>
      <div className="answer-row__side">
        <span className={`pts pts--${pts}`}>{pts > 0 ? `+${pts}` : '0'}</span>
        {canVote && (
          <button className={`vote ${voted ? 'is-on' : ''}`} onClick={() => onVote(!voted)} aria-pressed={voted} aria-label="Geçersiz">
            <ThumbsDown size={16} strokeWidth={2.6} />
            {v.rejects > 0 && <b>{v.rejects}</b>}
          </button>
        )}
        {!canVote && v.rejects > 0 && (
          <span className="vote vote--ro"><ThumbsDown size={14} /> <b>{v.rejects}</b></span>
        )}
      </div>
    </li>
  );
}
