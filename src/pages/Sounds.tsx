/** Sesleri dinle: oyundaki bütün efektler ve fon müzikleri (ayarlardan açılır). */
import { Play, Square } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Doodles } from '../components/Doodles';
import { Icon } from '../components/Icon';
import { TopBar } from '../components/ui';
import { say } from '../lib/voice';
import { VOICE, VOICE_LINES } from '../voice/lines';
import { setMood, type Mood } from '../lib/music';
import { sfx } from '../lib/sfx';

const EFFECTS: [string, string, () => void][] = [
  ['harf', 'Dokunuş', () => sfx.tap()],
  ['harf', 'Harf sayacı', () => [0, 1, 2, 3, 4, 5].forEach((i) => setTimeout(() => sfx.tick(i), i * 110))],
  ['el', 'DUR!', sfx.stop],
  ['yildiz', 'Harf ortaya çıktı', sfx.reveal],
  ['simsek', '3-2-1 Başla', () => [0, 1, 2, 3].forEach((i) => setTimeout(() => sfx.count(i === 3), i * 1000))],
  ['kalem', 'Kelime okundu', sfx.write],
  ['ates', 'Son saniyeler', () => [0, 1, 2].forEach((i) => setTimeout(sfx.clock, i * 1000))],
  ['stop', 'STOP düdüğü', sfx.siren],
  ['uzgun', 'Süre doldu', sfx.timeUp],
  ['hmm', 'Geçersiz oyu', sfx.boo],
  ['haha', 'Oyuncu katıldı', sfx.join],
  ['m1', 'Puan sayımı', () => [0, 1, 2, 3, 4].forEach((i) => setTimeout(() => sfx.coin(i), i * 120))],
  ['ozel', 'Geçiş', sfx.whoosh],
  ['balina', 'Kabarcık', sfx.pop],
  ['konfeti', 'Başarı', sfx.success],
  ['kupa', 'Final fanfarı', sfx.fanfare],
];

const MUSIC: [Mood, string, string][] = [
  ['lobby', 'kalp', 'Lobi'],
  ['roll', 'harf', 'Harf seçilirken'],
  ['write', 'kalem', 'Yazarken'],
  ['tension', 'ates', 'Son 10 saniye'],
  ['chill', 'kupa', 'Puanlar'],
  ['film', 'dizi', 'Sinema Bilmecesi'],
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
              <Icon name={e} size={26} />
              <span>{label}</span>
              {playing === m ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
          ))}
        </div>
      </section>
      <section className="paper-card sounds__card rise" style={{ animationDelay: '0.03s' }}>
        <h3 className="settings__title">Sunucu</h3>
        <div className="sound-grid">
          {VOICE_LINES.filter((l) => !l.startsWith('Harfimiz') || l === VOICE.letter('K')).map((l) => (
            <button key={l} className="sound-btn" onClick={() => void say(l)}>
              <Icon name="haha" size={26} />
              <span>{l}</span>
              <Play size={18} fill="currentColor" />
            </button>
          ))}
        </div>
      </section>
      <section className="paper-card sounds__card rise" style={{ animationDelay: '0.06s' }}>
        <h3 className="settings__title">Efektler</h3>
        <div className="sound-grid">
          {EFFECTS.map(([e, label, play]) => (
            <button key={label} className="sound-btn" onClick={play}>
              <Icon name={e} size={26} />
              <span>{label}</span>
              <Play size={18} fill="currentColor" />
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
