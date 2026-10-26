import { Share } from '@capacitor/share';
import { Bot, Copy, Play, Settings2, Share2, UserX, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ChainSettings } from '../../components/ChainSettings';
import { FilmSettings } from '../../components/FilmSettings';
import { QuizSettings } from '../../components/QuizSettings';
import { QUIZZES } from '../../data/quiz';
import { quizHumans, quizHistoryReady, startQuiz } from '../quizDirector';
import { SettingsForm } from '../../components/SettingsForm';
import { CatIcon, Icon } from '../../components/Icon';
import { Mascot } from '../../components/Mascot';
import { Avatar, Confirm, Modal, useToast } from '../../components/ui';
import { MAX_PLAYERS, type RoomState } from '../../engine/types';
import { hideBanner, showBanner } from '../../lib/ads';
import { sfx } from '../../lib/sfx';
import { drawInvite, shareImage } from '../../lib/shareCard';
import type { Transport } from '../../online/transport';
import { useProfile } from '../../store/useProfile';
import { startChain } from '../chainDirector';
import { startFilm } from '../filmDirector';
import { actingHost, startGame } from '../director';
import { BOT_LEVELS, BOT_PROFILES, botId, freeBotSlot } from '../bots';

export function Lobby({ t, s }: { t: Transport; s: RoomState }) {
  const [edit, setEdit] = useState(false);
  const [kick, setKick] = useState<string | null>(null);
  const [level, setLevel] = useState(useProfile.getState().bots.level);
  const [toast, show] = useToast();
  const [starting, setStarting] = useState(false);
  useEffect(() => {
    void showBanner(false);
    return () => void hideBanner();
  }, []);
  const isHost = actingHost(s) === t.me;
  const online = t.kind === 'online';
  const players = Object.entries(s.players)
    .filter(([, p]) => !p.left)
    .sort((a, b) => a[1].joined - b[1].joined);
  const st = s.settings;
  const quiz = st.game === 'quiz';
  const canStart = quiz ? quizHumans(s).length >= 2 && quizHistoryReady(s) : !online || players.length >= 2;
  // Çevrimiçi odaya bot: arkadaş azsa masa bot ile dolsun (botları yöneten cihaz oynatır).
  const slot = freeBotSlot(Object.keys(s.players));
  const canAddBot = !quiz && online && isHost && slot >= 0 && players.length < MAX_PLAYERS;
  const addBot = async () => {
    if (!canAddBot) return;
    sfx.pop();
    useProfile.getState().set({ bots: { ...useProfile.getState().bots, level } });
    try {
      await t.update({ [`players/${botId(slot)}`]: { ...BOT_PROFILES[slot], joined: t.now(), on: true, bot: level } });
    } catch {
      show('Bot eklenemedi');
    }
  };
  const siram = st.game === 'siram';
  const film = st.game === 'film';

  const share = async () => {
    sfx.tap();
    const game = quiz ? 'quiz' : siram ? 'siram' : film ? 'film' : 'isim';
    const name = quiz ? 'Sahneyi Hatırla' : siram ? 'Sıra Sende' : film ? 'Sinema Bilmecesi' : 'İsim Şehir';
    const text = `${name} oynayalım! Uygulamada "Katıl"a bas ve oda kodunu yaz: ${s.code}`;
    try {
      const img = await drawInvite({ game, code: s.code, from: s.players[t.me]?.name ?? 'Arkadaşın' });
      await shareImage(img, `davet-${s.code}.png`, text, 'Arkadaşlarını çağır');
    } catch {
      try {
        await Share.share({ title: 'İsim Şehir', text, dialogTitle: 'Arkadaşlarını çağır' });
      } catch {
        await navigator.clipboard?.writeText(text).then(() => show('Davet metni kopyalandı')).catch(() => show(`Oda kodu: ${s.code}`));
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
          <h3><Users className="ico-coral" strokeWidth={2.6} /> Oyuncular</h3>
          <span className="count-pill">{players.length}/{online ? MAX_PLAYERS : players.length}</span>
        </div>
        <ul className="player-grid">
          {players.map(([pid, p], i) => (
            <li key={pid} className="player-slot pop-in" style={{ animationDelay: `${i * 0.04}s` }}>
              <Avatar emoji={p.avatar} color={p.color} size={56} host={pid === s.host} off={!p.on && !p.bot} />
              <span className="player-slot__name">{p.name}</span>
              {pid === t.me && <span className="me-tag">Sen</span>}
              {isHost && online && pid !== t.me && (
                <button
                  className="player-slot__kick"
                  aria-label={`${p.name} çıkar`}
                  onClick={() => (sfx.tap(), p.bot ? void t.update({ [`players/${pid}`]: null }) : setKick(pid))}
                >
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
        {online && isHost && !quiz && (
          <div className="bot-add">
            <button className="btn-outline btn-outline--sm" disabled={!canAddBot} onClick={() => void addBot()}>
              <Bot size={20} strokeWidth={2.6} /> Bot ekle
            </button>
            <div className="seg seg--sm">
              {BOT_LEVELS.map((l) => (
                <button key={l.level} className={`seg__btn ${level === l.level ? 'is-on' : ''}`} onClick={() => (sfx.tap(), setLevel(l.level))}>{l.label}</button>
              ))}
            </div>
            <p className="muted bot-add__note">{slot < 0 ? 'Bütün botlar masada.' : 'Arkadaş azsa masayı botlarla doldur.'}</p>
          </div>
        )}
      </section>

      <div className="rules-wrap rise" style={{ animationDelay: '0.08s' }}>
      <section className="paper-card rules-card">
        {quiz ? <>
          <p className="rules-card__head">Sahneyi Hatırla · {QUIZZES.find((q) => q.id === st.quizId)?.title}</p>
          <p className="rules-card__line">10 ortak soru · 20 saniye · 2–10 arkadaş</p>
          <p className="rules-card__line">Cevaplar herkesten sonra açıklanır. Doğru ve hızlı cevap veren öne geçer.</p>
        </> : film ? (
          <>
            <p className="rules-card__head"><Icon name="dizi" size={26} /> İpuçları birer birer açılır, filmi erken bilen çok puan alır.</p>
            <p className="rules-card__line">
              <b>{st.rounds}</b> film · ipuçları <b>{st.time}</b> sn arayla · {st.pool === 'yerli' ? 'yerli' : st.pool === 'yabanci' ? 'yabancı' : 'karışık'}
            </p>
          </>
        ) : siram ? (
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
      <Mascot className="rules-wrap__mascot" />
      </div>

      <div className={`page__cta page__cta--sticky ${isHost ? 'page__cta--spark' : ''}`}>
        {isHost ? (
          <>
            <button className="pill pill--big pulse" disabled={!canStart || starting} onClick={async () => {
              if (starting) return;
              sfx.pop(); setStarting(true);
              try {
                const ok = await (quiz ? startQuiz(t, s) : siram ? startChain(t, s) : film ? startFilm(t, s) : startGame(t, s));
                if (ok === false) show('Oyun başlatılamadı. Bağlantını ve oyuncuları kontrol et.');
              } catch { show('Oyun başlatılamadı. Tekrar dene.'); }
              finally { setStarting(false); }
            }}>
              <Play size={26} fill="currentColor" strokeWidth={2} /> {starting ? 'Başlatılıyor…' : 'Oyunu Başlat'}
            </button>
            {!canStart && <p className="cta-note">{quiz && quizHumans(s).length >= 2 ? 'Soru geçmişleri eşitleniyor…' : 'Başlamak için en az 2 oyuncu gerekli'}</p>}
          </>
        ) : (
          <p className="waiting">
            <span className="dots"><i /><i /><i /></span> {s.players[s.host]?.name ?? 'Ev sahibi'} oyunu başlatacak
          </p>
        )}
      </div>

      {edit && (
        <Modal onClose={() => setEdit(false)} className="modal--settings">
          {quiz ? <QuizSettings value={st} onChange={(v) => void t.update({ settings: v }).catch(() => show('Ayarlar kaydedilemedi.'))} /> : film ? (
            <FilmSettings
              value={st}
              onChange={(v) => {
                void t.update({ settings: v });
                useProfile.getState().set({ film: v });
              }}
            />
          ) : siram ? (
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
