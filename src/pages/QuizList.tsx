/** "Sen Ne Kadar…?" evrenleri: sinema bileti görünümünde liste; her bilette o filmdeki en iyi unvan. */
import { useNavigate } from 'react-router-dom';
import { CinemaScene } from '../components/CinemaScene';
import { TopBar } from '../components/ui';
import { QUIZZES } from '../data/quiz';
import { Plus, LogIn } from 'lucide-react';
import { ONLINE_AVAILABLE } from '../online/config';
import { sfx } from '../lib/sfx';
import { useProfile } from '../store/useProfile';
import { useCinemaMusic } from './Cinema';

/** Bilet renkleri (evren sırasına göre döner). */
export const TICKET = ['#7d58ee', '#e9487d', '#1fa9cf', '#f08a12', '#2bb673', '#f24d40', '#5b6cff', '#d6409f'];

export default function QuizList() {
  const nav = useNavigate();
  useCinemaMusic();
  const best = useProfile((p) => p.quizBest ?? {});
  return (
    <main className="bg page game--cinema quiz-list">
      <CinemaScene />
      <TopBar title="Sen Ne Kadar…?" />
      <p className="quiz-list__intro rise">Bir evren seçip odanı kur veya arkadaşının koduyla katıl. Hepiniz aynı 10 soruda yarışın!</p>
      <div className="show-card__btns">
        <button className="pill pill--sm" disabled={!ONLINE_AVAILABLE} onClick={() => nav('/kur/online?oyun=quiz')}><Plus size={18} /><span>Oda Kur</span></button>
        <button className="pill pill--sm show-card__alt" disabled={!ONLINE_AVAILABLE} onClick={() => nav('/katil?oyun=quiz')}><LogIn size={18} /><span>Katıl</span></button>
      </div>
      <ul className="tickets">
        {QUIZZES.map((q, i) => {
          const b = best[q.id];
          return (
            <li key={q.id} className="rise" style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }}>
              <button className="ticket" disabled={!ONLINE_AVAILABLE} style={{ '--tc': TICKET[i % TICKET.length] } as React.CSSProperties} onClick={() => (sfx.tap(), nav(`/kur/online?oyun=quiz&evren=${q.id}`))}>
                <span className="ticket__stub">
                  <b>{String(i + 1).padStart(2, '0')}</b>
                  <small>{q.count} soru</small>
                </span>
                <span className="ticket__body">
                  <b className="ticket__title">{q.title}</b>
                  <span className="ticket__ask">{q.ask}</span>
                  {q.scope && <span className="ticket__ask">{q.scope}</span>}
                  {b ? <span className="ticket__best">%{b.pct} · {b.name}</span> : <span className="ticket__best ticket__best--new">Henüz oynamadın</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
