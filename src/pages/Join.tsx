import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Doodles } from '../components/Doodles';
import { TopBar } from '../components/ui';
import { buzz } from '../lib/feel';
import { sfx } from '../lib/sfx';
import { useGame } from '../store/useGame';
import { useProfile } from '../store/useProfile';

const LEN = 5;
const ERR = { notfound: 'Bu kodla bir oda yok. Kodu kontrol et.', full: 'Oda dolu (en fazla 10 kişi).', network: 'İnternet bağlantısı yok.' };

export default function Join() {
  const nav = useNavigate();
  const p = useProfile();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);

  const join = async (c = code) => {
    if (c.length !== LEN || busy) return;
    setBusy(true);
    setErr('');
    try {
      const { joinRoom } = await import('../online/firebase');
      const r = await joinRoom(c, { name: p.name, avatar: p.avatar, color: p.color });
      if (typeof r === 'string') {
        buzz.warn();
        setErr(ERR[r]);
        return;
      }
      sfx.join();
      p.set({ lastRoom: { code: r.code, at: Date.now() } });
      useGame.getState().attach(r);
      nav('/oyun', { replace: true });
    } catch {
      setErr(ERR.network);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="bg page join">
      <Doodles variant={3} />
      <TopBar title="Odaya Katıl" />
      <div className="paper-card join__card rise">
        <p className="sub">Arkadaşının ekranındaki oda kodunu yaz</p>
        <label className="code-boxes" onClick={() => input.current?.focus()}>
          {Array.from({ length: LEN }, (_, i) => (
            <span key={i} className={`code-box ${i === code.length ? 'is-cur' : ''} ${code[i] ? 'is-full' : ''}`}>{code[i] ?? ''}</span>
          ))}
          <input
            ref={input}
            className="code-input"
            value={code}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={LEN}
            aria-label="Oda kodu"
            onChange={(e) => {
              const c = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, LEN);
              if (c.length > code.length) sfx.tick(c.length);
              setCode(c);
              setErr('');
              if (c.length === LEN) void join(c);
            }}
          />
        </label>
        {err && <p className="join__err pop-in">{err}</p>}
        <button className="pill pill--teal pill--big" disabled={code.length !== LEN || busy} onClick={() => join()}>
          {busy ? 'Bağlanıyor…' : 'Katıl'}
        </button>
      </div>
    </main>
  );
}
