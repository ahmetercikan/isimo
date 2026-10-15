/** Oyun ayarları: kategoriler (özel kategori eklenebilir), tur, süre, STOP, harf durdurma ve zor harfler. */
import { Hand, Plus, Skull, Timer, X } from 'lucide-react';
import { useState } from 'react';
import { CATEGORIES, MAX_CATS, MIN_CATS, type Category } from '../engine/categories';
import type { Settings } from '../engine/types';
import { sfx } from '../lib/sfx';
import { Toggle } from '../pages/Profile';

const ROUNDS = [3, 5, 7, 10];
const TIMES = [60, 90, 120, 180];

export function SettingsForm({ value, onChange }: { value: Settings; onChange: (s: Settings) => void }) {
  const [custom, setCustom] = useState('');
  const set = (p: Partial<Settings>) => onChange({ ...value, ...p });
  const has = (id: string) => value.cats.some((c) => c.id === id);
  const full = value.cats.length >= MAX_CATS;

  const toggleCat = (c: Category) => {
    sfx.tap();
    if (has(c.id)) {
      if (value.cats.length > MIN_CATS) set({ cats: value.cats.filter((x) => x.id !== c.id) });
    } else if (!full) set({ cats: [...value.cats, c] });
  };

  const addCustom = () => {
    const label = custom.trim().slice(0, 16);
    if (label.length < 2 || full) return;
    sfx.pop();
    const id = `c${Date.now().toString(36)}`;
    set({ cats: [...value.cats, { id, label: label[0].toLocaleUpperCase('tr-TR') + label.slice(1), emoji: '✨', custom: true }] });
    setCustom('');
  };

  return (
    <div className="settings">
      <section className="settings__block">
        <div className="settings__title">
          <h3>Kategoriler</h3>
          <span className={`count-pill ${full ? 'is-full' : ''}`}>{value.cats.length}/{MAX_CATS}</span>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <button key={c.id} className={`cat-chip ${has(c.id) ? 'is-on' : ''}`} style={{ '--c': c.color } as React.CSSProperties} onClick={() => toggleCat(c)} disabled={!has(c.id) && full}>
              <span className="cat-chip__emoji">{c.emoji}</span>
              {c.label}
            </button>
          ))}
          {value.cats.filter((c) => c.custom).map((c) => (
            <button key={c.id} className="cat-chip is-on cat-chip--custom" onClick={() => value.cats.length > MIN_CATS && set({ cats: value.cats.filter((x) => x.id !== c.id) })}>
              <span className="cat-chip__emoji">{c.emoji}</span>
              {c.label}
              <X size={16} strokeWidth={3} />
            </button>
          ))}
        </div>
        <div className="custom-cat">
          <input className="input input--sm" value={custom} maxLength={16} placeholder="Kendi kategorini ekle (ör. Çizgi film)" onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustom()} />
          <button className="round-btn round-btn--soft" aria-label="Ekle" onClick={addCustom} disabled={custom.trim().length < 2 || full}>
            <Plus size={22} strokeWidth={3} />
          </button>
        </div>
      </section>

      <section className="settings__block">
        <div className="settings__title"><h3>Tur sayısı</h3></div>
        <div className="seg">
          {ROUNDS.map((r) => (
            <button key={r} className={`seg__btn ${value.rounds === r ? 'is-on' : ''}`} onClick={() => (sfx.tap(), set({ rounds: r }))}>{r}</button>
          ))}
        </div>
      </section>

      <section className="settings__block">
        <div className="settings__title"><h3><Timer size={20} strokeWidth={2.6} /> Yazma süresi</h3></div>
        <div className="seg">
          {TIMES.map((t) => (
            <button key={t} className={`seg__btn ${value.time === t ? 'is-on' : ''}`} onClick={() => (sfx.tap(), set({ time: t }))}>
              {t < 120 ? `${t} sn` : `${t / 60} dk`}
            </button>
          ))}
        </div>
      </section>

      <section className="settings__block toggles">
        <Toggle icon={<span className="stop-mini">STOP</span>} label="STOP kuralı" desc={`Bitiren STOP der, diğerlerine ${value.grace} saniye kalır`} on={value.stop} set={(v) => set({ stop: v })} />
        <Toggle icon={<Hand size={20} />} label="Harfi oyuncular durdursun" desc="Sırayla biri DUR der; kapalıysa sayaç kendi durur" on={value.manualStop} set={(v) => set({ manualStop: v })} />
        <Toggle icon={<Skull size={20} />} label="Zor harfler" desc="I, J, Ö, Ü, V, Ç, Ş, Z de çıkabilir" on={value.hard} set={(v) => set({ hard: v })} />
      </section>
    </div>
  );
}
