/**
 * Film Avı'nın sinema salonu zemini (Doodles'ın yerine): koyu lacivert-mor salon, tepeden iki spot ışığı,
 * kenarlarda kadife perde, uçuşan toz zerreleri ve ince film greni. İçeriğin arkasında, ekrana sabit.
 * Stiller: src/styles/cinema.css (`.game--cinema`).
 */
const DUST = Array.from({ length: 14 }, (_, i) => ({
  x: (i * 37) % 100,
  y: (i * 53) % 100,
  s: 2 + (i % 3),
  d: 9 + (i % 5) * 2.5,
  delay: -(i * 1.7),
}));

export function CinemaScene() {
  return (
    <div className="cinema" aria-hidden="true">
      <div className="cinema__beam cinema__beam--l" />
      <div className="cinema__beam cinema__beam--r" />
      <svg className="cinema__curtain cinema__curtain--l" viewBox="0 0 120 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="velvet" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#4a0d1e" />
            <stop offset="0.35" stopColor="#8d1c33" />
            <stop offset="0.55" stopColor="#5e1023" />
            <stop offset="0.8" stopColor="#a52540" />
            <stop offset="1" stopColor="#4a0d1e" />
          </linearGradient>
        </defs>
        <path d="M0 0 H120 C 96 120, 70 230, 82 400 H0 Z" fill="url(#velvet)" />
        <path d="M0 0 H120 C 96 120, 70 230, 82 400" fill="none" stroke="#d9a63a" strokeOpacity="0.55" strokeWidth="3" />
      </svg>
      <svg className="cinema__curtain cinema__curtain--r" viewBox="0 0 120 400" preserveAspectRatio="none">
        <path d="M0 0 H120 C 96 120, 70 230, 82 400 H0 Z" fill="url(#velvet)" />
        <path d="M0 0 H120 C 96 120, 70 230, 82 400" fill="none" stroke="#d9a63a" strokeOpacity="0.55" strokeWidth="3" />
      </svg>
      <div className="cinema__valance" />
      {DUST.map((p, i) => (
        <span key={i} className="cinema__dust" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, animationDuration: `${p.d}s`, animationDelay: `${p.delay}s` }} />
      ))}
      <div className="cinema__grain" />
      <div className="cinema__vignette" />
    </div>
  );
}

/**
 * Eski sinema geri sayımı (film başlamadan önce): dönen ibre, halkalar ve büyük rakam.
 * `left` kalan saniye; her saniye ibre bir tur döner.
 */
export function FilmLeader({ round, left }: { round: number; left: number }) {
  return (
    <section className="leader pop-in" aria-label={`${round}. film geliyor`}>
      <span className="leader__kicker">Film {round}</span>
      <div className="leader__dial">
        <svg viewBox="0 0 200 200" className="leader__rings">
          <circle cx="100" cy="100" r="92" />
          <circle cx="100" cy="100" r="72" />
          <line x1="100" y1="0" x2="100" y2="200" />
          <line x1="0" y1="100" x2="200" y2="100" />
        </svg>
        <div className="leader__sweep" key={left} />
        <b className="leader__num" key={`n${left}`}>{Math.max(1, left)}</b>
      </div>
      <p className="leader__hint">İpuçları birer birer açılacak. Erken bilen çok puan alır!</p>
    </section>
  );
}
