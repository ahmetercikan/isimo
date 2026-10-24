/** Alt menü: Ana Sayfa · İstatistikler · Ayarlar (ana sayfada ve istatistiklerde). */
import { ChartNoAxesColumn, House, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sfx } from '../lib/sfx';

const TABS = [
  { key: 'home', to: '/', label: 'Ana Sayfa', Ico: House },
  { key: 'stats', to: '/istatistik', label: 'İstatistikler', Ico: ChartNoAxesColumn },
  { key: 'settings', to: '/profil', label: 'Ayarlar', Ico: Settings },
] as const;

export function TabBar({ active }: { active: (typeof TABS)[number]['key'] }) {
  const nav = useNavigate();
  return (
    <nav className="tabbar" aria-label="Ana menü">
      {TABS.map(({ key, to, label, Ico }) => (
        <button
          key={key}
          className={`tabbar__btn ${key === active ? 'is-on' : ''}`}
          aria-current={key === active ? 'page' : undefined}
          onClick={() => key !== active && (sfx.tap(), nav(to, { replace: to === '/' }))}
        >
          <Ico size={26} strokeWidth={2.4} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
