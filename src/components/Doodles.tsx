/**
 * Ekran zemini (yeni tasarım, 25 Eki 2026): nane gökyüzü, üstte yumuşak bulutlar, alt köşelerde ve yanlarda
 * parlak, yuvarlak çalılar, arada sarı yıldızlar. Bütün ekranlar kullanır; `variant` yalnız yıldızların yerini değiştirir.
 * Çalılar ekranın köşesine sabitlenir (kaydırınca yerinde durur) ve içeriğin arkasında kalır.
 */
import { useId } from 'react';

/** Bir çalı kümesi: arkada koyu, önde açık yeşil daireler; ışık sol üstten gelir. */
function Bush({ className, flip }: { className: string; flip?: boolean }) {
  const id = useId().replace(/:/g, '');
  // Yumrular: arkada büyükçe ve koyu, önde daha küçük ve açık; böylece çalı top gibi değil kabarık durur.
  const back: [number, number, number][] = [[30, 120, 36], [70, 96, 40], [116, 84, 42], [160, 98, 38], [204, 112, 36], [236, 132, 30]];
  const front: [number, number, number][] = [[6, 168, 34], [44, 150, 34], [84, 140, 36], [124, 146, 34], [164, 150, 36], [204, 160, 32], [238, 172, 30]];
  return (
    <svg className={`scene__bush ${className}`} viewBox="0 0 240 220" preserveAspectRatio="xMidYMax meet" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <defs>
        <radialGradient id={`b${id}`} cx="34%" cy="28%" r="78%">
          <stop offset="0" stopColor="#6fd6b0" />
          <stop offset="0.55" stopColor="#33ad8c" />
          <stop offset="1" stopColor="#1d8a71" />
        </radialGradient>
        <radialGradient id={`f${id}`} cx="34%" cy="26%" r="76%">
          <stop offset="0" stopColor="#9eebc8" />
          <stop offset="0.5" stopColor="#4cc69c" />
          <stop offset="1" stopColor="#24a07f" />
        </radialGradient>
      </defs>
      {back.map(([x, y, r], i) => <circle key={`b${i}`} cx={x} cy={y} r={r} fill={`url(#b${id})`} />)}
      {front.map(([x, y, r], i) => <circle key={`f${i}`} cx={x} cy={y} r={r} fill={`url(#f${id})`} />)}
      {front.map(([x, y, r], i) => (
        <path key={`h${i}`} d={`M ${x - r * 0.62} ${y - r * 0.2} Q ${x - r * 0.5} ${y - r * 0.72} ${x + r * 0.05} ${y - r * 0.78}`} stroke="#fff" strokeOpacity="0.45" strokeWidth={r * 0.14} strokeLinecap="round" fill="none" />
      ))}
      <rect x="-20" y="196" width="280" height="40" fill="#24a07f" />
    </svg>
  );
}

function Cloud({ className }: { className: string }) {
  return (
    <svg className={`scene__cloud ${className}`} viewBox="0 0 200 80">
      <g fill="#fff">
        <ellipse cx="60" cy="52" rx="52" ry="24" />
        <circle cx="86" cy="36" r="28" />
        <circle cx="124" cy="44" r="22" />
        <ellipse cx="140" cy="56" rx="48" ry="18" />
      </g>
    </svg>
  );
}

const STAR = 'M0,-12 C1.5,-4 4,-1.5 12,0 C4,1.5 1.5,4 0,12 C-1.5,4 -4,1.5 -12,0 C-4,-1.5 -1.5,-4 0,-12 Z';
/** Yıldızların yeri (ekranın yüzdesi olarak), her yerleşim için. */
const STARS: [number, number, number][][] = [
  [[8, 22, 1], [90, 34, 0.8], [14, 64, 0.7]],
  [[86, 16, 0.9], [6, 46, 0.8], [92, 70, 0.7]],
  [[12, 14, 0.8], [88, 52, 1], [8, 78, 0.7]],
  [[90, 24, 0.8], [10, 36, 1], [86, 82, 0.7]],
];

export function Doodles({ variant = 0 }: { variant?: number }) {
  const stars = STARS[variant % STARS.length];
  return (
    <div className="scene" aria-hidden="true">
      <Cloud className="scene__cloud--l" />
      <Cloud className="scene__cloud--r" />
      <Bush className="scene__bush--side" />
      <Bush className="scene__bush--bl" />
      <Bush className="scene__bush--br" flip />
      {stars.map(([x, y, s], i) => (
        <svg key={i} className="scene__star" viewBox="-14 -14 28 28" style={{ left: `${x}%`, top: `${y}%`, width: 26 * s, height: 26 * s, animationDelay: `${i * 0.7}s` }}>
          <path d={STAR} fill="#ffd23f" stroke="#f0a800" strokeWidth="1.2" />
        </svg>
      ))}
    </div>
  );
}
