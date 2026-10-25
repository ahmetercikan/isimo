/** Sinema Bilmecesi ayarları: film sayısı, ipuçları arası süre ve hangi filmler (yerli/yabancı). */
import { Timer } from 'lucide-react';
import { POOLS } from '../engine/film';
import type { Settings } from '../engine/types';
import { sfx } from '../lib/sfx';
import { Icon } from './Icon';

const ROUNDS = [5, 8, 10];
const TIMES = [8, 10, 15];

export function FilmSettings({ value, onChange }: { value: Settings; onChange: (s: Settings) => void }) {
  const set = (p: Partial<Settings>) => onChange({ ...value, ...p });
  return (
    <div className="settings">
      <section className="settings__block">
        <div className="settings__title"><h3><Icon name="dizi" size={20} /> Film sayısı</h3></div>
        <div className="seg">
          {ROUNDS.map((n) => (
            <button key={n} className={`seg__btn ${value.rounds === n ? 'is-on' : ''}`} onClick={() => (sfx.tap(), set({ rounds: n }))}>{n} film</button>
          ))}
        </div>
      </section>

      <section className="settings__block">
        <div className="settings__title"><h3><Timer size={20} strokeWidth={2.6} /> İpuçları arası</h3></div>
        <div className="seg">
          {TIMES.map((n) => (
            <button key={n} className={`seg__btn ${value.time === n ? 'is-on' : ''}`} onClick={() => (sfx.tap(), set({ time: n }))}>{n} sn</button>
          ))}
        </div>
        <p className="muted settings__note">Her filmde 6 ipucu var; bir film en fazla {6 * value.time} saniye sürer.</p>
      </section>

      <section className="settings__block">
        <div className="settings__title"><h3><Icon name="yildiz" size={20} /> Filmler</h3></div>
        <div className="seg">
          {POOLS.map((x) => (
            <button key={x.id} className={`seg__btn ${(value.pool ?? 'hepsi') === x.id ? 'is-on' : ''}`} onClick={() => (sfx.tap(), set({ pool: x.id }))}>{x.label}</button>
          ))}
        </div>
      </section>
    </div>
  );
}
