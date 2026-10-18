import { Share } from '@capacitor/share';
import { Copy, Settings2, Share2, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ChainSettings } from '../../components/ChainSettings';
import { SettingsForm } from '../../components/SettingsForm';
import { CatIcon, Icon } from '../../components/Icon';
import { Avatar, Confirm, Modal, useToast } from '../../components/ui';
import { MAX_PLAYERS, type RoomState } from '../../engine/types';
import { hideBanner, showBanner } from '../../lib/ads';
import { sfx } from '../../lib/sfx';
import type { Transport } from '../../online/transport';
import { useProfile } from '../../store/useProfile';
import { startChain } from '../chainDirector';
import { actingHost, startGame } from '../director';

export function Lobby({ t, s }: { t: Transport; s: RoomState }) {
  const [edit, setEdit] = useState(false);
  const [kick, setKick] = useState<string | null>(null);
  const [toast, show] = useToast();
  useEffect(() => {
    void showBanner();
    return () => void hideBanner();
  }, []);
  const isHost = actingHost(s) === t.me;
  const online = t.kind === 'online';
  const players = Object.entries(s.players)
    .filter(([, p]) => !p.left)
    .sort((a, b) => a[1].joined - b[1].joined);
  const canStart = !online || players.length >= 2;
  const st = s.settings;
  const siram = st.game === 'siram';

  const share = async () => {
    sfx.tap();
    const text = siram
      ? `Sıra Sende oynayalım! Uygulamada "Katıl"a bas ve oda kodunu yaz: ${s.code}`
      : `İsim Şehir oynayalım! 🔤✍️ Uygulamada "Katıl"a bas ve oda kodunu yaz: ${s.code}`;
    try {
      await Share.share({ title: 'İsim Şehir', text, dialogTitle: 'Arkadaşlarını çağır' });
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        show('Davet metni kopyalandı');
      } catch {
        show(`Oda kodu: ${s.code}`);
      }
    }
  };

  return (
    <div className="lobby">
      {online ? (
        <section className="code-card pop-in">
          <span className="code-card__label">Oda kodu</span>
          <div className="code-card__code" onClick={() => void navigator.clipboard?.writeText(s.code).then(() => show('Kod kopyalandı'))}>
            {s.code.split('').map((ch, i) => (
              <span key={i} className="code-tile" style={{ animationDelay: `${i * 0.06}s` }}>{ch}</span>
            ))}
            <Copy size={18} className="code-card__copy" />
          </div>
          <button className="pill pill--yellow pill--sm" onClick={share}>
            <Share2 size={20} strokeWidth={2.6} /> Arkadaşlarını çağır
          </button>
        </section>
      ) : (
        <section className="code-card code-card--bots pop-in">
          <span className="code-card__label">Rakiplerin hazır</span>
          <p className="title-lg">Kim daha hızlı? <Icon name="simsek" size={30} /></p>
        </section>
      )}

      <section className="paper-card players-card rise">
        <div className="settings__title">
          <h3>Oyuncular</h3>
          <span className="count-pill">{players.length}/{online ? MAX_PLAYERS : players.length}</span>
        </div>
        <ul className="player-grid">
          {players.map(([pid, p], i) => (
            <li key={pid} className="player-slot pop-in" style={{ animationDelay: `${i * 0.04}s` }}>
              <Avatar emoji={p.avatar} color={p.color} size={56} host={pid === s.host} off={!p.on && !p.bot} />
              <span className="player-slot__name">{p.name}</span>
              {pid === t.me && <span className="me-tag">Sen</span>}
              {isHost && online && pid !== t.me && (
                <button className="player-slot__kick" aria-label={`${p.name} çıkar`} onClick={() => setKick(pid)}>
                  <UserX size={16} strokeWidth={2.6} />
                </button>
              )}
            </li>
          ))}
          {online &&
            Array.from({ length: Math.min(3, MAX_PLAYERS - players.length) }, (_, i) => (
              <li key={`e${i}`} className="player-slot player-slot--empty">
                <span className="empty-avatar">?</span>
                <span className="player-slot__name muted">bekleniyor</span>
              </li>
            ))}
        </ul>
      </section>

      <section className="paper-card rules-card rise" style={{ animationDelay: '0.08s' }}>
        {siram ? (
          <>
            <p className="rules-card__head"><Icon name="harf" size={26} /> Masadaki kelimede tek harf değiştir, yeni kelime yap.</p>
            <p className="rules-card__line">
              <b>{st.len ?? 4}</b> harfli · <b>{st.time}</b> sn · <b>{st.lives ?? 3}</b> can{st.free ? ' · ekle/çıkar serbest' : ''}
            </p>
          </>
        ) : (
          <>
            <div className="rules-card__cats">
              {st.cats.map((c) => (
                <span key={c.id} className="mini-cat"><CatIcon cat={c} size={20} /> {c.label}</span>
              ))}
            </div>
            <p className="rules-card__line">
              <b>{st.rounds}</b> tur · <b>{st.time}</b> sn · STOP {st.stop ? 'açık' : 'kapalı'}{st.hard ? ' · zor harfler' : ''}
            </p>
          </>
        )}
        {isHost && (
          <button className="btn-outline btn-outline--sm" onClick={() => (sfx.tap(), setEdit(true))}>
            <Settings2 size={18} /> Ayarları değiştir
          </button>
        )}
      </section>

      <div className="page__cta page__cta--sticky">
        {isHost ? (
          <>
            <button className="pill pill--big pulse" disabled={!canStart} onClick={() => (sfx.pop(), void (siram ? startChain(t, s) : startGame(t, s)))}>
              Oyunu Başlat
            </button>
            {!canStart && <p className="cta-note">Başlamak için en az 2 oyuncu gerekli</p>}
          </>
        ) : (
          <p className="waiting">
            <span className="dots"><i /><i /><i /></span> {s.players[s.host]?.name ?? 'Ev sahibi'} oyunu başlatacak
          </p>
        )}
      </div>

      {edit && (
        <Modal onClose={() => setEdit(false)} className="modal--settings">
          {siram ? (
            <ChainSettings
              value={st}
              onChange={(v) => {
                void t.update({ settings: v });
                useProfile.getState().set({ chain: v });
              }}
            />
          ) : (
            <SettingsForm
              value={st}
              onChange={(v) => {
                void t.update({ settings: v });
                useProfile.getState().set({ settings: v });
              }}
            />
          )}
          <button className="pill" style={{ width: '100%', marginTop: 16 }} onClick={() => setEdit(false)}>Tamam</button>
        </Modal>
      )}
      {kick && (
        <Confirm
          title={`${s.players[kick]?.name} çıkarılsın mı?`}
          yes="Çıkar"
          danger
          onYes={() => {
            void t.update({ [`players/${kick}`]: null });
            setKick(null);
          }}
          onNo={() => setKick(null)}
        />
      )}
      {toast}
    </div>
  );
}
