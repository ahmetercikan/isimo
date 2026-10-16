import { Check, Headphones, Megaphone, Music, Shuffle, Vibrate, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Doodles } from '../components/Doodles';
import { Icon } from '../components/Icon';
import { Avatar, Logo, TopBar } from '../components/ui';
import { avatarIcon } from '../art/icons';
import { privacyOptionsRequired, showPrivacyOptions } from '../lib/ads';
import { sfx } from '../lib/sfx';
import { say } from '../lib/voice';
import { VOICE } from '../voice/lines';
import { AVATARS, COLORS, useProfile } from '../store/useProfile';

const FUN_NAMES = ['Harf Avcısı', 'Kalem Ustası', 'Hızlı Parmak', 'Sözlük Kurdu', 'STOP Kralı', 'Kelime Cambazı'];

export default function Profile() {
  const nav = useNavigate();
  const first = useSearchParams()[0].get('ilk') === '1';
  const p = useProfile();
  const [name, setName] = useState(p.name);
  const [avatar, setAvatar] = useState(avatarIcon(p.avatar) || p.avatar);
  const [color, setColor] = useState(p.color);
  const ok = name.trim().length >= 2;
  // İlk açılışta sunucu karşılasın (tarayıcı sesi ilk dokunuştan sonra açar)
  useEffect(() => {
    if (!first) return;
    const h = () => void say(VOICE.welcome);
    window.addEventListener('pointerdown', h, { once: true });
    return () => window.removeEventListener('pointerdown', h);
  }, [first]);

  const save = () => {
    if (!ok) return;
    sfx.success();
    p.set({ name: name.trim().slice(0, 14), avatar, color });
    nav('/', { replace: true });
  };

  return (
    <main className="bg page profile">
      <Doodles variant={1} />
      {first ? (
        <div className="profile__hello pop-in">
          <Logo small />
          <p className="sub">Hoş geldin! Önce seni tanıyalım.</p>
        </div>
      ) : (
        <TopBar title="Profilim" />
      )}

      <div className="paper-card profile__card rise">
        <div className="profile__preview">
          <Avatar emoji={avatar} color={color} size={96} />
        </div>
        <label className="field">
          <span className="field__label">Adın</span>
          <div className="field__row">
            <input
              className="input"
              value={name}
              maxLength={14}
              placeholder="ör. Ayşe"
              autoComplete="off"
              enterKeyHint="done"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
            <button className="round-btn round-btn--soft" aria-label="Rastgele ad" onClick={() => (sfx.tap(), setName(FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)]))}>
              <Shuffle size={20} />
            </button>
          </div>
        </label>

        <span className="field__label">Avatarın</span>
        <div className="avatar-grid">
          {AVATARS.map((a) => (
            <button key={a} className={`avatar-pick ${a === avatar ? 'is-on' : ''}`} onClick={() => (sfx.tap(), setAvatar(a))} aria-label={a}>
              <Icon name={a} size={44} />
            </button>
          ))}
        </div>

        <span className="field__label">Rengin</span>
        <div className="color-row">
          {COLORS.map((c) => (
            <button key={c} className={`color-dot ${c === color ? 'is-on' : ''}`} style={{ background: c }} onClick={() => (sfx.tap(), setColor(c))} aria-label={c}>
              {c === color && <Check size={18} strokeWidth={3.4} color="#fff" />}
            </button>
          ))}
        </div>

        {!first && (
          <>
            <span className="field__label">Ayarlar</span>
            <div className="toggles">
              <Toggle icon={<Volume2 size={20} />} label="Ses efektleri" on={p.sfx} set={(v) => p.set({ sfx: v })} />
              <Toggle icon={<Music size={20} />} label="Müzik" desc="Oyun sırasında fon müziği" on={p.music !== false} set={(v) => p.set({ music: v })} />
              <Toggle icon={<Megaphone size={20} />} label="Sunucu sesi" desc="Harfi ve oyun anlarını sesli söyler" on={p.voice} set={(v) => p.set({ voice: v })} />
              <Toggle icon={<Vibrate size={20} />} label="Titreşim" on={p.haptics} set={(v) => p.set({ haptics: v })} />
            </div>
            <button className="btn-outline" onClick={() => (sfx.tap(), nav('/sesler'))}>
              <Headphones size={20} /> Sesleri dinle
            </button>
            {privacyOptionsRequired() && (
              <button className="link-btn" onClick={() => void showPrivacyOptions()}>Reklam gizlilik seçenekleri</button>
            )}
          </>
        )}
      </div>

      <div className="page__cta">
        <button className="pill pill--big" disabled={!ok} onClick={save}>
          {first ? 'Hadi Başlayalım!' : 'Kaydet'}
        </button>
      </div>
      <p className="version">Sürüm {__APP_VERSION__}</p>
    </main>
  );
}

export function Toggle({ icon, label, desc, on, set }: { icon?: React.ReactNode; label: string; desc?: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <button className={`toggle ${on ? 'is-on' : ''}`} role="switch" aria-checked={on} onClick={() => (sfx.tap(), set(!on))}>
      {icon && <span className="toggle__icon">{icon}</span>}
      <span className="toggle__text">
        <b>{label}</b>
        {desc && <small>{desc}</small>}
      </span>
      <span className="toggle__knob" />
    </button>
  );
}
