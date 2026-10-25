import { ArrowLeft, Crown, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { avatarIcon, iconSvg } from '../art/icons';
import { sfx } from '../lib/sfx';
import { Mascot } from './Mascot';

export function BackButton({ onBack }: { onBack?: () => void }) {
  const nav = useNavigate();
  return (
    <button className="round-btn" aria-label="Geri" onClick={() => (sfx.tap(), onBack ? onBack() : nav(-1))}>
      <ArrowLeft size={26} strokeWidth={2.6} />
    </button>
  );
}

/** Üst başlık. `art` verilirse sağ üstte maskot kaplan ve yanında o oyunun resmi durur (kurulum ekranı). */
export function TopBar({ title, onBack, right, back = true, art }: { title?: ReactNode; onBack?: () => void; right?: ReactNode; back?: boolean; art?: string }) {
  return (
    <div className={`topbar ${art ? 'topbar--art' : ''}`}>
      {back && <BackButton onBack={onBack} />}
      <h1 className="title-lg topbar__title">{title}</h1>
      {right}
      {art && (
        <div className="topbar__art" aria-hidden="true">
          <Mascot />
          <img className="topbar__prop" src={art} alt="" draggable={false} />
        </div>
      )}
    </div>
  );
}

export function Modal({ children, onClose, className }: { children: ReactNode; onClose?: () => void; className?: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${className ?? ''}`} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

export function Confirm({ title, text, yes = 'Evet', no = 'Vazgeç', danger, onYes, onNo }: {
  title: string; text?: string; yes?: string; no?: string; danger?: boolean; onYes: () => void; onNo: () => void;
}) {
  return (
    <Modal onClose={onNo}>
      <h2 className="title-lg">{title}</h2>
      {text && <p className="muted modal-text">{text}</p>}
      <div className="modal-actions">
        <button className="btn-outline" onClick={onNo}>{no}</button>
        <button className={`btn-dark ${danger ? 'btn-dark--danger' : ''}`} onClick={onYes}>{yes}</button>
      </div>
    </Modal>
  );
}

let toastTimer: number | undefined;
export function useToast(): [ReactNode, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string) => {
    setMsg(m);
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => setMsg(null), 2600);
  };
  return [msg ? <div className="toast" role="status">{msg}</div> : null, show];
}

/** Emoji avatar: renkli halka içinde. */
export function Avatar({ emoji, color, size = 48, host, off, style }: { emoji: string; color: string; size?: number; host?: boolean; off?: boolean; style?: CSSProperties }) {
  return (
    <span className={`avatar ${off ? 'avatar--off' : ''}`} style={{ width: size, height: size, fontSize: size * 0.56, '--c': color, ...style } as CSSProperties}>
      {avatarIcon(emoji) ? (
        <span className="avatar__art" dangerouslySetInnerHTML={{ __html: iconSvg(avatarIcon(emoji), size) }} />
      ) : (
        <span className="avatar__emoji">{emoji}</span>
      )}
      {host && (
        <span className="avatar__crown" aria-label="Ev sahibi">
          <Crown size={Math.max(12, size * 0.3)} fill="#ffc83d" stroke="#e8a200" strokeWidth={2.4} />
        </span>
      )}
      {off && (
        <span className="avatar__off" aria-label="Bağlantı yok">
          <WifiOff size={Math.max(10, size * 0.24)} strokeWidth={3} />
        </span>
      )}
    </span>
  );
}

/** Belirli aralıkla yenilenen "şimdi" (geri sayımlar için). */
export function useNow(clock: () => number, ms = 200) {
  const ref = useRef(clock);
  ref.current = clock;
  const [now, setNow] = useState(clock);
  useEffect(() => {
    const iv = window.setInterval(() => setNow(ref.current()), ms);
    return () => clearInterval(iv);
  }, [ms]);
  return now;
}

/** Logo: "İsim Şehir" + eğik STOP! etiketi. */
export function Logo({ small }: { small?: boolean }) {
  return (
    <div className={`logo ${small ? 'logo--sm' : ''}`} aria-label="İsim Şehir">
      <span className="logo__row">
        {'İSİM'.split('').map((ch, i) => (
          <span key={i} className="logo__tile" style={{ '--i': i } as CSSProperties}>{ch}</span>
        ))}
      </span>
      <span className="logo__row logo__row--2">
        {'ŞEHİR'.split('').map((ch, i) => (
          <span key={i} className="logo__tile" style={{ '--i': i + 4 } as CSSProperties}>{ch}</span>
        ))}
      </span>
      <span className="logo__stop">STOP!</span>
    </div>
  );
}

/** Daire şeklinde geri sayım (yazma ve Sıra Sende ekranlarında). */
export function Timer({ left, total, urgent }: { left: number; total: number; urgent: boolean }) {
  const r = 24;
  const C = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, left / Math.max(1, total)));
  return (
    <div className={`timer ${urgent ? 'is-urgent' : ''}`} aria-label={`${left} saniye`}>
      <svg viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} className="timer__bg" />
        <circle cx="30" cy="30" r={r} className="timer__fg" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} />
      </svg>
      <span>{left}</span>
    </div>
  );
}
