/**
 * Sinema Salonu: Sinema Bilmecesi evreninin menüsü (ana sayfadaki Sinema Bilmecesi kartı buraya açılır).
 * Bölümler: Film Tahmini (oda kur / katıl / botlara karşı) · Sen Ne Kadar…? (film bilgi yarışması) · yakında gelenler.
 * Sinema teması (`.game--cinema`, src/styles/cinema.css); müzik sayfalar arasında kesilmez (useCinemaMusic).
 */
import { Bot, ChevronRight, Clapperboard, LogIn, Plus, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import artFilm from '../assets/home/film.webp';
import { CinemaScene } from '../components/CinemaScene';
import { Mascot } from '../components/Mascot';
import { TopBar } from '../components/ui';
import { QUIZZES } from '../data/quiz';
import { setMood } from '../lib/music';
import { sfx } from '../lib/sfx';
import { ONLINE_AVAILABLE } from '../online/config';

let cinemaPages = 0;
let offTimer = 0;
/** Sinema sayfalarında sakin yarışma müziği; sayfadan sayfaya geçerken kesilmez, salondan çıkınca susar. */
export function useCinemaMusic() {
  useEffect(() => {
    cinemaPages++;
    clearTimeout(offTimer);
    setMood('film');
    return () => {
      cinemaPages--;
      offTimer = window.setTimeout(() => cinemaPages === 0 && setMood('off'), 80);
    };
  }, []);
}

export default function Cinema() {
  const nav = useNavigate();
  useCinemaMusic();
  const go = (to: string) => (sfx.tap(), nav(to));
  return (
    <main className="bg page game--cinema cinema-hub">
      <CinemaScene />
      <TopBar title="Sinema Salonu" />

      <section className="marquee pop-in">
        <span className="marquee__bulbs" aria-hidden="true" />
        <b className="marquee__title">Sinema Bilmecesi</b>
        <span className="marquee__sub">Bu akşam salonda iki gösteri var</span>
        <img className="marquee__art" src={artFilm} alt="" draggable={false} />
      </section>

      <section className="paper-card show-card rise">
        <div className="show-card__head">
          <span className="show-card__icon"><Clapperboard size={26} strokeWidth={2.4} /></span>
          <div>
            <h2 className="show-card__title">Film Tahmini</h2>
            <p className="show-card__desc">İpuçları birer birer açılır, filmi en erken bilen kazanır. 119 film.</p>
          </div>
        </div>
        <div className="show-card__btns">
          <button className="pill pill--sm" disabled={!ONLINE_AVAILABLE} onClick={() => go('/kur/online?oyun=film')}>
            <Plus size={18} strokeWidth={3} /> <span>Oda Kur</span>
          </button>
          <button className="pill pill--sm show-card__alt" disabled={!ONLINE_AVAILABLE} onClick={() => go('/katil')}>
            <LogIn size={18} strokeWidth={2.8} /> <span>Katıl</span>
          </button>
          <button className="pill pill--sm show-card__alt" onClick={() => go('/kur/bot?oyun=film')}>
            <Bot size={20} strokeWidth={2.6} /> <span>Botlara Karşı</span>
          </button>
        </div>
      </section>

      <section className="paper-card show-card show-card--hero rise" style={{ animationDelay: '0.06s' }}>
        <span className="show-card__new">Yeni</span>
        <div className="show-card__head">
          <span className="show-card__icon show-card__icon--gold"><Sparkles size={26} strokeWidth={2.4} /></span>
          <div>
            <h2 className="show-card__title">Sen Ne Kadar…?</h2>
            <p className="show-card__desc">Arkadaşlarınla aynı sorularda yarış, unvanını kazan. {QUIZZES.length} film evreni.</p>
          </div>
          <ChevronRight className="show-card__go" size={28} strokeWidth={3} />
        </div>
        <div className="show-card__btns">
          <button className="pill pill--sm" disabled={!ONLINE_AVAILABLE} onClick={() => go('/sinema/sen-ne-kadar')}><Plus size={18} /><span>Oda Kur</span></button>
          <button className="pill pill--sm show-card__alt" disabled={!ONLINE_AVAILABLE} onClick={() => go('/katil?oyun=quiz')}><LogIn size={18} /><span>Katıl</span></button>
        </div>
        <Mascot className="show-card__mascot" />
      </section>

      <div className="soon-row rise" style={{ animationDelay: '0.12s' }}>
        {['Replik Kimin?', 'Hangi Yıl?'].map((t) => (
          <div key={t} className="soon-card">
            <b>{t}</b>
            <span>Yakında</span>
          </div>
        ))}
      </div>
    </main>
  );
}
