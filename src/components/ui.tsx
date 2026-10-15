import { ArrowLeft, Crown, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { sfx } from '../lib/sfx';

export function BackButton({ onBack }: { onBack?: () => void }) {
  const nav = useNavigate();
  return (
    <button className="round-btn" aria-label="Geri" onClick={() => (sfx.tap(), onBack ? onBack() : nav(-1))}>
      <ArrowLeft size={26} strokeWidth={2.6} />
    </button>
  );
}

export function TopBar({ title, onBack, right, back = true }: { title?: ReactNode; onBack?: () => void; right?: ReactNode; back?: boolean }) {
  return (
    <div className="topbar">
      {back && <BackButton onBack={onBack} />}
      <h1 className="title-lg topbar__title">{title}</h1>
      {right}
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
      <span className="avatar__emoji">{emoji}</span>
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
