import { App as CapApp } from '@capacitor/app';
import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { setFeel } from './lib/feel';
import { prepareInk } from './lib/ink';
import { setMusicEnabled } from './lib/music';
import { setVoiceEnabled } from './lib/voice';
import { initAds } from './lib/ads';
import { audio, setSfxEnabled } from './lib/sfx';
import Home from './pages/Home';
import Profile from './pages/Profile';
import { useFriends } from './store/useFriends';
import { useGame } from './store/useGame';
import { useProfile } from './store/useProfile';

const Setup = lazy(() => import('./pages/Setup'));
const Join = lazy(() => import('./pages/Join'));
const HowTo = lazy(() => import('./pages/HowTo'));
const Sounds = lazy(() => import('./pages/Sounds'));
const Game = lazy(() => import('./pages/Game'));
const Friends = lazy(() => import('./pages/Friends'));
const Stats = lazy(() => import('./pages/Stats'));

/** Ad yoksa önce profil. */
function NeedsName({ children }: { children: ReactNode }) {
  const name = useProfile((s) => s.name);
  if (!name) return <Navigate to="/profil?ilk=1" replace />;
  return <>{children}</>;
}

/** Android geri tuşu: oyundaysa çıkış onayı oyun ekranında; değilse geri git, ana sayfadaysa uygulamadan çık. */
function BackHandler() {
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => {
    const h = CapApp.addListener('backButton', () => {
      if (loc.pathname === '/oyun') window.dispatchEvent(new Event('game-back'));
      else if (loc.pathname === '/') void CapApp.exitApp();
      else nav(-1);
    });
    return () => void h.then((x) => x.remove()).catch(() => {});
  }, [loc.pathname, nav]);
  return null;
}

export default function App() {
  const sfxOn = useProfile((s) => s.sfx);
  const voice = useProfile((s) => s.voice);
  const haptics = useProfile((s) => s.haptics);
  const musicOn = useProfile((s) => s.music !== false);
  useEffect(() => setSfxEnabled(sfxOn), [sfxOn]);
  useEffect(() => setMusicEnabled(musicOn), [musicOn]);
  // Tarayıcılar sesi ancak bir dokunuştan sonra açar: ilk dokunuşta ses motorunu başlat.
  useEffect(() => {
    const once = () => void audio();
    window.addEventListener('pointerdown', once, { once: true });
    return () => window.removeEventListener('pointerdown', once);
  }, []);
  useEffect(() => setFeel({ voice, haptics }), [voice, haptics]);
  useEffect(() => setVoiceEnabled(voice), [voice]);
  // El yazısı modeli arka planda hazırlansın (Android'de ilk açılışta iner).
  useEffect(() => void prepareInk(), []);
  // Reklamlar (yalnızca Android): ilk açılışta biraz sonra, ekran çizildikten sonra
  useEffect(() => {
    const t = setTimeout(() => void initAds(), 1500);
    return () => clearTimeout(t);
  }, []);
  // Uygulama kapanırken çevrimiçi odadan çıkmadan önce bağlantı "çevrimdışı" işaretlenir (onDisconnect).
  useEffect(() => () => void useGame.getState().leave(), []);
  // Arkadaşlar: ad girilmişse uygulama açıkken dinlenir (davet/istek bildirimi buradan gelir).
  // Arka plana geçince "çevrimdışı" yazılır, geri gelince yeniden "çevrimiçi".
  const named = useProfile((s) => !!s.name);
  useEffect(() => {
    if (!named) return;
    void useFriends.getState().start();
    const h = CapApp.addListener('appStateChange', ({ isActive }) => {
      // start() bir kez çalışır (live olunca erken döner); arka plandan dönünce "çevrimiçi"yi
      // yeniden yazmak için doğrudan goOnline çağrılmalı, yoksa arkadaşlara çevrimdışı görünürüz.
      const me = useProfile.getState();
      void import('./online/friends')
        .then(async (f) => {
          if (isActive) await f.goOnline({ name: me.name, avatar: me.avatar, color: me.color });
          else await f.goOffline();
        })
        .catch(() => {});
    });
    return () => {
      void h.then((x) => x.remove()).catch(() => {});
      useFriends.getState().stop();
    };
  }, [named]);

  return (
    <HashRouter>
      <BackHandler />
      <Suspense fallback={<div className="bg page-wait" />}>
        <Routes>
          <Route path="/" element={<NeedsName><Home /></NeedsName>} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/kur/:mode" element={<NeedsName><Setup /></NeedsName>} />
          <Route path="/katil" element={<NeedsName><Join /></NeedsName>} />
          <Route path="/arkadaslar" element={<NeedsName><Friends /></NeedsName>} />
          <Route path="/nasil" element={<HowTo />} />
          <Route path="/istatistik" element={<Stats />} />
          <Route path="/sesler" element={<Sounds />} />
          <Route path="/oyun" element={<NeedsName><Game /></NeedsName>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
