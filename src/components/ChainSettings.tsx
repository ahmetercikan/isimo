/** Sıra Sende ayarları: kelime uzunluğu, sıra süresi, can ve harf ekleme/çıkarma. */
import { Heart, Timer } from 'lucide-react';
import { LENGTHS } from '../engine/chain';
import type { Settings } from '../engine/types';
import { sfx } from '../lib/sfx';
import { Toggle } from '../pages/Profile';
import { Icon } from './Icon';

const TIMES = [15, 20, 30, 45];
const LIVES = [1, 2, 3];

export function ChainSettings({ value, onChange }: { value: Settings; onChange: (s: Settings) => void }) {
  const set = (p: Partial<Settings>) => onChange({ ...value, ...p });
  return (
    <div className="settings">
      <section className="settings__block">
        <div className="settings__title"><h3><Icon name="harf" size={20} /> Kelime uzunluğu</h3></div>
        <div className="seg">
          {LENGTHS.map((n) => (
            <button key={n} className={`seg__btn ${(value.len ?? 4) === n ? 'is-on' : ''}`} onClick={() => (sfx.tap(), set({ len: n }))}>{n} harf</button>
          ))}
        </div>
        <p className="muted settings__note">Kısa kelime kolay, uzun kelime zor.</p>
      </section>

      <section className="settings__block">
        <div className="settings__title"><h3><Timer size={20} strokeWidth={2.6} /> Sıra süresi</h3></div>
        <div className="seg">
          {TIMES.map((n) => (
            <button key={n} className={`seg__btn ${value.time === n ? 'is-on' : ''}`} onClick={() => (sfx.tap(), set({ time: n }))}>{n} sn</button>
          ))}
        </div>
      </section>

      <section className="settings__block">
        <div className="settings__title"><h3><Heart size={20} strokeWidth={2.6} /> Can</h3></div>
        <div className="seg">
          {LIVES.map((n) => (
            <button key={n} className={`seg__btn ${(value.lives ?? 3) === n ? 'is-on' : ''}`} onClick={() => (sfx.tap(), set({ lives: n }))}>{n}</button>
          ))}
        </div>
        <p className="muted settings__note">Süreyi kaçıran ya da pas geçen bir can kaybeder; canı bitince elenir.</p>
      </section>

      <section className="settings__block toggles">
        <Toggle
          icon={<Icon name="kalem" size={20} />}
          label="Harf eklemek/çıkarmak da serbest"
          desc="Kapalıysa yalnızca tek harf değiştirilir (klasik kural)"
          on={!!value.free}
          set={(v) => set({ free: v })}
        />
      </section>
    </div>
  );
}
