import { Home, ImageUp, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar, Timer, useNow } from '../../components/ui';
import { QUESTION_MS, tierIndex } from '../../engine/quiz';
import type { RoomState } from '../../engine/types';
import { maybeInterstitial } from '../../lib/ads';
import { sfx } from '../../lib/sfx';
import { shareQuizStory } from '../../lib/storyCard';
import type { Transport } from '../../online/transport';
import { useProfile } from '../../store/useProfile';
import { actingHost, backToLobby } from '../director';
import { answerQuiz, currentQuizQuestion, quizHumans, quizRank } from '../quizDirector';

export function QuizRoomRound({ t, s }: { t: Transport; s: RoomState }) {
  const c = s.ctl, quiz = c.quiz, q = currentQuizQuestion(c);
  const now = useNow(() => t.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  const pick = c.quizPicks?.[t.me];
  const revealed = !!c.nextAt;
  const watching = !quiz?.players.includes(t.me);
  const waiting = quiz?.players.filter((p) => quizHumans(s).includes(p)) ?? [];
  const answered = waiting.filter((p) => c.quizPicks?.[p] !== undefined).length;
  const left = Math.max(0, Math.min(QUESTION_MS, c.endAt - now));
  useEffect(() => { if (revealed && pick !== undefined) (pick === q?.right ? sfx.success : sfx.boo)(); }, [revealed]);
  if (!quiz || !q) return <p>Oyun bilgileri bekleniyor…</p>;
  const choose = async (k: number) => {
    if (locked.current || pick !== undefined) return;
    locked.current = true; setBusy(true); setError('');
    try { if (!await answerQuiz(t, s, k)) setError('Cevap kaydedilemedi veya süre doldu.'); }
    catch { setError('Bağlantını kontrol edip tekrar dene.'); }
    finally { locked.current = false; setBusy(false); }
  };
  return <div className="quiz quiz-room">
    <h1 className="quiz-room__title">{quiz.title}</h1>
    <header className="quiz__head">
      <span className="round-label round-label--sm">Soru {c.round} / {quiz.questions.length}</span>
      <Timer left={Math.ceil(left / 1000)} total={QUESTION_MS / 1000} urgent={left <= 5000 && !revealed} />
    </header>
    <section className="paper-card quiz-q">
      <span className="quiz-q__level">{['', 'Kolay', 'Orta', 'Zor'][q.d]}</span>
      <h2 className="quiz-q__text">{q.q}</h2>
    </section>
    {watching && <p className="quiz-room__status">Oyun başladı. Bu turu izleyebilir, sonraki oyuna katılabilirsin.</p>}
    {now < c.startAt && <p className="quiz-room__status">Hazırlan… {Math.ceil((c.startAt - now) / 1000)}</p>}
    <div className={`quiz-opts ${q.tf ? 'quiz-opts--tf' : ''}`}>
      {q.options.map((o, k) => <button key={k}
        className={`quiz-opt ${revealed ? k === q.right ? 'is-right' : pick === k ? 'is-wrong' : 'is-dim' : pick === k ? 'is-picked' : ''}`}
        disabled={watching || busy || pick !== undefined || revealed || now < c.startAt || now >= c.endAt}
        onClick={() => void choose(k)}><span className="quiz-opt__key">{'ABCD'[k]}</span><span className="quiz-opt__text">{o}</span></button>)}
    </div>
    <p className="quiz-room__status" role="status">{revealed
      ? `Doğru cevap: ${q.options[q.right]}${watching ? '' : pick === undefined ? ' · Süre doldu.' : pick === q.right ? ' · Bildin!' : ` · ${q.oops ?? 'Bir sonrakinde yakalarsın!'}`}`
      : pick !== undefined ? `Cevabın alındı. Diğer oyuncular bekleniyor (${answered}/${waiting.length}).` : `${answered}/${waiting.length} oyuncu yanıtladı`}</p>
    {error && <p className="join__err" role="alert">{error}</p>}
    <div className="quiz-room__players">{waiting.map((pid) => <span key={pid}><Avatar emoji={s.players[pid].avatar} color={s.players[pid].color} size={28} />{s.players[pid].name} {c.quizPicks?.[pid] !== undefined ? '✓' : '…'}</span>)}</div>
  </div>;
}

const recorded = new Set<string>();
export function QuizRoomFinal({ t, s, onExit }: { t: Transport; s: RoomState; onExit: () => void }) {
  const quiz = s.ctl.quiz;
  const rows = quizRank(s), me = rows.find((r) => r.pid === t.me);
  const [making, setMaking] = useState(false);
  const pct = quiz && me ? Math.round(me.correct / quiz.questions.length * 100) : 0;
  const tier = quiz?.tiers[tierIndex(me?.correct ?? 0, quiz?.questions.length)];
  useEffect(() => {
    if (!quiz || !me || !tier) return;
    const key = `${s.code}-${quiz.run}-${t.me}`;
    if (recorded.has(key)) return;
    recorded.add(key); sfx.fanfare();
    const p = useProfile.getState(), old = p.quizBest?.[quiz.id];
    if (!old || pct > old.pct || pct === old.pct && me.pts > old.pts)
      p.set({ quizBest: { ...p.quizBest, [quiz.id]: { pct, tier: tierIndex(me.correct, quiz.questions.length), pts: me.pts, name: tier.name } } });
    p.addGame(me.pts, me.rank === 1);
  }, [quiz?.run]);
  if (!quiz) return <p>Sonuçlar bekleniyor…</p>;
  const share = async () => {
    if (!me || !tier || making) return;
    setMaking(true);
    try { await shareQuizStory({ title: quiz.title, ask: quiz.ask, pct, tier: tier.name, line: tier.line, name: s.players[t.me]?.name ?? '' }); }
    catch { /* paylaşım iptal */ } finally { setMaking(false); }
  };
  return <div className="quiz-result quiz-room">
    <h1 className="quiz-room__title">{quiz.title}</h1>
    <h2>{rows.length > 1 && rows[0].pts === rows[1].pts ? 'Zirvede beraberlik!' : `Kazanan: ${s.players[rows[0]?.pid]?.name ?? ''}`}</h2>
    {me && <><b className="quiz-result__pct">%{pct}</b><h2 className="quiz-result__tier">{tier?.name}</h2><p>{me.correct}/{quiz.questions.length} doğru · {me.pts} puan</p></>}
    <ol className="rest rest--chain quiz-room__ranking">{rows.map((r) => <li key={r.pid} className={r.pid === t.me ? 'is-me' : ''}>
      <b>{r.rank}.</b><Avatar emoji={s.players[r.pid].avatar} color={s.players[r.pid].color} size={32} /><span>{s.players[r.pid].name}<small>{r.correct} doğru · {quiz.tiers[tierIndex(r.correct, quiz.questions.length)]?.name}</small></span><span className="rest__pts">{r.pts}</span>
    </li>)}</ol>
    <div className="quiz-result__btns">
      {me && <button className="pill story-btn" disabled={making} onClick={() => void share()}><ImageUp size={20} />{making ? 'Hazırlanıyor…' : 'Hikâyende paylaş'}</button>}
      {actingHost(s) === t.me ? <button className="pill" onClick={async () => { await maybeInterstitial(); await backToLobby(t); }}><RotateCcw size={20} />Tekrar Oyna</button> : <p>Ev sahibi yeni oyunu başlatacak.</p>}
      <button className="btn-outline" onClick={async () => { await maybeInterstitial(); onExit(); }}><Home size={20} />Ana Sayfa</button>
    </div>
  </div>;
}
