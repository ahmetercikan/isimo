/** Sesleri dinle: oyundaki bütün efektler ve fon müzikleri (ayarlardan açılır). */
import { Play, Square } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Doodles } from '../components/Doodles';
import { TopBar } from '../components/ui';
import { setMood, type Mood } from '../lib/music';
import { sfx } from '../lib/sfx';

const EFFECTS: [string, string, () => void][] = [
  ['👆', 'Dokunuş', () => sfx.tap()],
  ['🔤', 'Harf sayacı', () => [0, 1, 2, 3, 4, 5].forEach((i) => setTimeout(() => sfx.tick(i), i * 110))],
  ['✋', 'DUR!', sfx.stop],
  ['✨', 'Harf ortaya çıktı', sfx.reveal],
  ['3️⃣', '3-2-1 Başla', () => [0, 1, 2, 3].forEach((i) => setTimeout(() => sfx.count(i === 3), i * 1000))],
  ['✍️', 'Kelime okundu', sfx.write],
  ['⏱️', 'Son saniyeler', () => [0, 1, 2].forEach((i) => setTimeout(sfx.clock, i * 1000))],
  ['🛑', 'STOP düdüğü', sfx.siren],
  ['⏰', 'Süre doldu', sfx.timeUp],
  ['👎', 'Geçersiz oyu', sfx.boo],
  ['🔔', 'Oyuncu katıldı', sfx.join],
  ['🪙', 'Puan sayımı', () => [0, 1, 2, 3, 4].forEach((i) => setTimeout(() => sfx.coin(i), i * 120))],
  ['💨', 'Geçiş', sfx.whoosh],
  ['🫧', 'Kabarcık', sfx.pop],
  ['🎉', 'Başarı', sfx.success],
  ['🏆', 'Final fanfarı', sfx.fanfare],
];

const MUSIC: [Mood, string, string][] = [
  ['lobby', '🛋️', 'Lobi'],
  ['roll', '🥁', 'Harf seçilirken'],
  ['write', '✍️', 'Yazarken'],
  ['tension', '⏳', 'Son 10 saniye'],
  ['chill', '🍹', 'Puanlar'],
];

export default function Sounds() {
  const [playing, setPlaying] = useState<Mood>('off');
  useEffect(() => () => setMood('off'), []);
  const music = (m: Mood) => {
    const next = playing === m ? 'off' : m;
    setPlaying(next);
    setMood(next);
  };

  return (
    <main className="bg page sounds">
      <Doodles variant={3} />
      <TopBar title="Sesler" />
      <section className="paper-card sounds__card rise">
        <h3 className="settings__title">Fon müziği</h3>
        <div className="sound-grid">
          {MUSIC.map(([m, e, label]) => (
            <button key={m} className={`sound-btn ${playing === m ? 'is-on' : ''}`} onClick={() => music(m)}>
              <span className="sound-btn__e">{e}</span>
              <span>{label}</span>
              {playing === m ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
          ))}
        </div>
      </section>
      <section className="paper-card sounds__card rise" style={{ animationDelay: '0.06s' }}>
        <h3 className="settings__title">Efektler</h3>
        <div className="sound-grid">
          {EFFECTS.map(([e, label, play]) => (
            <button key={label} className="sound-btn" onClick={play}>
              <span className="sound-btn__e">{e}</span>
              <span>{label}</span>
              <Play size={18} fill="currentColor" />
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
