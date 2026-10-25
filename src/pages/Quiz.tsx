/**
 * "Sen Ne Kadar…?" yarışması: 10 soru (kolaydan zora), soru başına 20 sn. Bilince altın parıltı, bilemeyince
 * doğru cevap + filme özgü küçük bir espri. Sonda unvan, yüzde, puan ve hikâye kartı paylaşımı.
 */
import { Home, ImageUp, RotateCcw, Ticket } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { CinemaScene } from '../components/CinemaScene';
import { Icon } from '../components/Icon';
import { Timer, TopBar, useNow } from '../components/ui';
import { loadQuiz, QUIZZES } from '../data/quiz';
import { pickRound, QUESTION_MS, questionPoints, ROUND, tierIndex, type Quiz as QuizData, type RoundQuestion } from '../engine/quiz';
import { confetti } from '../lib/confetti';
import { buzz } from '../lib/feel';
import { sfx } from '../lib/sfx';
import { shareQuizStory } from '../lib/storyCard';
import { useProfile } from '../store/useProfile';
import { useCinemaMusic } from './Cinema';

type Answer = { pick: number | null; ok: boolean; pts: number };

export default function Quiz() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  useCinemaMusic();
  const meta = QUIZZES.find((q) => q.id === id);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [round, setRound] = useState<RoundQuestion[]>([]);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [startAt, setStartAt] = useState(0);
  const [making, setMaking] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const now = useNow(() => Date.now(), 200);
  const nextTimer = useRef(0);
  const locked = useRef(true);
  const saved = useRef(false);

  const start = (q: QuizData) => {
    clearTimeout(nextTimer.current);
    locked.current = false;
    saved.current = false;
    const seen = useProfile.getState().quizSeen?.[q.id] ?? [];
    const r = pickRound(q, seen);
    setRound(r);
    setI(0);
    setAnswers([]);
    setStartAt(Date.now());
    const p = useProfile.getState();
    p.set({ quizSeen: { ...p.quizSeen, [q.id]: [...r.map((x) => x.key), ...seen].slice(0, 40) } });
  };

  useEffect(() => {
    let live = true;
    setQuiz(null);
    setRound([]);
    setLoadError(false);
    locked.current = true;
    void loadQuiz(id).then((q) => {
      if (!live) return;
      if (!q) { setLoadError(true); return; }
      setQuiz(q);
      start(q);
    }).catch(() => {
      if (live) setLoadError(true);
    });
    return () => {
      live = false;
      clearTimeout(nextTimer.current);
    };
  }, [id]);

  const q = round[i];
  const done = round.length > 0 && answers.length >= round.length;
  const answered = answers.length > i;
  const left = Math.min(QUESTION_MS, Math.max(0, QUESTION_MS - (now - startAt)));

  const answer = (pick: number | null) => {
    if (!q || answered || done || locked.current) return;
    locked.current = true;
    if (Date.now() - startAt >= QUESTION_MS) pick = null;
    const ok = pick === q.right;
    const pts = questionPoints(ok, QUESTION_MS - (Date.now() - startAt));
    setAnswers((a) => [...a, { pick, ok, pts }]);
    if (ok) {
      sfx.success();
      buzz.success();
    } else {
      sfx.boo();
      buzz.warn();
    }
    if (i < round.length - 1) nextTimer.current = window.setTimeout(() => {
      setI((x) => x + 1);
      setStartAt(Date.now());
      locked.current = false;
    }, ok ? 1300 : 2600);
  };

  // Süre biterse cevapsız (yanlış) sayılır
  useEffect(() => {
    if (q && !answered && !done && now - startAt >= QUESTION_MS) answer(null);
  }, [now]);

  const correct = answers.filter((a) => a.ok).length;
  const pts = answers.reduce((s, a) => s + a.pts, 0);
  const tier = quiz ? quiz.tiers[Math.min(quiz.tiers.length - 1, tierIndex(correct, round.length || ROUND))] : null;
  const pct = Math.round((correct / Math.max(1, round.length)) * 100);

  // Sonuç: en iyiyi kaydet, kutla
  useEffect(() => {
    if (!done || !quiz || !tier || saved.current) return;
    saved.current = true;
    const p = useProfile.getState();
    const old = p.quizBest?.[quiz.id];
    if (!old || pct > old.pct || (pct === old.pct && pts > old.pts))
      p.set({ quizBest: { ...p.quizBest, [quiz.id]: { pct, tier: tierIndex(correct, round.length), pts, name: tier.name } } });
    sfx.fanfare();
    if (pct >= 60) void confetti({ particleCount: 90, spread: 80, origin: { y: 0.45 }, colors: ['#f3c35b', '#fff3c9', '#c8902b', '#ffe39a'] });
  }, [done]);

  if (!meta) return <Navigate to="/sinema/sen-ne-kadar" replace />;

  const again = () => {
    sfx.tap();
    if (quiz) start(quiz);
  };
  const story = async () => {
    if (!quiz || !tier || making) return;
    sfx.tap();
    setMaking(true);
    try {
      await shareQuizStory({ title: quiz.title, ask: quiz.ask, pct, tier: tier.name, line: tier.line, name: useProfile.getState().name });
    } catch {
      /* paylaşım iptal */
    } finally {
      setMaking(false);
    }
  };

  return (
    <main className="bg page game--cinema quiz">
      <CinemaScene />
      <TopBar title={meta.title} />

      {loadError ? (
        <section className="paper-card">
          <p>Sorular yüklenemedi. Bağlantını kontrol edip tekrar deneyebilirsin.</p>
          <button className="pill" onClick={() => nav('/sinema/sen-ne-kadar')}>Film listesine dön</button>
        </section>
      ) : !quiz || !q && !done ? (
        <div className="quiz__loading"><div className="loader" /></div>
      ) : done && tier ? (
        <section className="quiz-result pop-in">
          <span className="quiz-result__ask">{quiz.ask}</span>
          <b className="quiz-result__pct">%{pct}</b>
          <span className="quiz-result__label">Unvanın</span>
          <h2 className="quiz-result__tier">{tier.name}</h2>
          <p className="quiz-result__line">{tier.line}</p>
          <p className="quiz-result__meta">{round.length} sorudan {correct} doğru · {pts} puan</p>
          <div className="quiz-result__btns">
            <button className="pill story-btn" onClick={() => void story()} disabled={making}>
              <ImageUp size={22} strokeWidth={2.6} /> {making ? 'Hazırlanıyor…' : 'Hikâyende paylaş'}
            </button>
            <button className="pill pill--big" onClick={again}><RotateCcw size={22} strokeWidth={2.6} /> Tekrar Oyna</button>
            <div className="final__row">
              <button className="btn-outline" onClick={() => (sfx.tap(), nav('/sinema/sen-ne-kadar'))}><Ticket size={20} /> Başka film</button>
              <button className="btn-outline" onClick={() => (sfx.tap(), nav('/', { replace: true }))}><Home size={20} /> Ana Sayfa</button>
            </div>
          </div>
        </section>
      ) : (
        <>
          <header className="quiz__head">
            <div className="quiz__progress">
              <span className="round-label round-label--sm">Soru {i + 1} / {round.length}</span>
              <div className="quiz__dots">
                {round.map((_, k) => (
                  <i key={k} className={k < answers.length ? (answers[k].ok ? 'is-ok' : 'is-bad') : k === i ? 'is-now' : ''} />
                ))}
              </div>
            </div>
            <Timer left={Math.ceil(left / 1000)} total={QUESTION_MS / 1000} urgent={left <= 5000 && !answered} />
          </header>

          <section className="paper-card quiz-q pop-in" key={`q${i}`}>
            <span className="quiz-q__level">{['', 'Kolay', 'Orta', 'Zor'][q.d]}</span>
            <h2 className="quiz-q__text">{q.q}</h2>
          </section>

          <div className={`quiz-opts ${q.tf ? 'quiz-opts--tf' : ''}`} key={`o${i}`}>
            {q.options.map((o, k) => {
              const a = answers[i];
              const cls = !a ? '' : k === q.right ? 'is-right' : a.pick === k ? 'is-wrong' : 'is-dim';
              return (
                <button key={k} className={`quiz-opt ${cls}`} disabled={answered} onClick={() => answer(k)} style={{ animationDelay: `${k * 0.05}s` }}>
                  <span className="quiz-opt__key">{'ABCD'[k]}</span>
                  <span className="quiz-opt__text">{o}</span>
                </button>
              );
            })}
          </div>

          {answered && (
            <p className={`quiz-feedback pop-in ${answers[i].ok ? 'is-ok' : 'is-bad'}`}>
              {answers[i].ok ? (
                <><Icon name="yildiz" size={22} /> Doğru! +{answers[i].pts}</>
              ) : (
                <>{answers[i].pick === null ? 'Süre doldu! ' : ''}{q.oops ?? `Doğrusu: ${q.options[q.right]}`}</>
              )}
            </p>
          )}
        </>
      )}
    </main>
  );
}
