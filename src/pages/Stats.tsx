/** İstatistikler (alt menü): bu cihazda oynanan oyunların özeti. */
import { Gamepad2, Percent, Star, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Doodles } from '../components/Doodles';
import { TabBar } from '../components/TabBar';
import { TopBar } from '../components/ui';
import { sfx } from '../lib/sfx';
import { useProfile } from '../store/useProfile';

export default function Stats() {
  const nav = useNavigate();
  const s = useProfile((p) => p.stats);
  const rate = s.games ? Math.round((s.wins / s.games) * 100) : 0;
  const ITEMS = [
    { Ico: Gamepad2, label: 'Oynanan oyun', value: s.games, c: 'coral' },
    { Ico: Trophy, label: 'Birincilik', value: s.wins, c: 'sun' },
    { Ico: Star, label: 'En iyi skor', value: s.best, c: 'teal' },
    { Ico: Percent, label: 'Kazanma oranı', value: `%${rate}`, c: 'purple' },
  ];
  return (
    <main className="bg page stats-page has-tabbar">
      <Doodles variant={1} />
      <TopBar title="İstatistikler" back={false} />
      <div className="stat-grid">
        {ITEMS.map(({ Ico, label, value, c }, i) => (
          <div key={label} className={`paper-card stat-tile stat-tile--${c} rise`} style={{ animationDelay: `${i * 0.06}s` }}>
            <span className="stat-tile__icon"><Ico size={24} strokeWidth={2.6} /></span>
            <b>{value}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="paper-card stat-total rise" style={{ animationDelay: '0.24s' }}>
        <span>Toplam puan</span>
        <b>{s.points}</b>
      </div>
      {s.games === 0 && (
        <div className="stat-empty rise">
          <p>Henüz oyun oynamadın. İlk oyununu oyna, burası dolsun!</p>
          <button className="pill" onClick={() => (sfx.tap(), nav('/', { replace: true }))}>Oyunlara Git</button>
        </div>
      )}
      <p className="cta-note stat-note">Bu sayılar yalnızca bu telefonda tutulur.</p>
      <TabBar active="stats" />
    </main>
  );
}
