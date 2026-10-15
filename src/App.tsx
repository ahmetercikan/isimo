import { App as CapApp } from '@capacitor/app';
import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { setFeel } from './lib/feel';
import { prepareInk } from './lib/ink';
import { setSfxEnabled } from './lib/sfx';
import Home from './pages/Home';
import Profile from './pages/Profile';
import { useGame } from './store/useGame';
import { useProfile } from './store/useProfile';

const Setup = lazy(() => import('./pages/Setup'));
const Join = lazy(() => import('./pages/Join'));
const HowTo = lazy(() => import('./pages/HowTo'));
const Game = lazy(() => import('./pages/Game'));

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
  useEffect(() => setSfxEnabled(sfxOn), [sfxOn]);
  useEffect(() => setFeel({ voice, haptics }), [voice, haptics]);
  // El yazısı modeli arka planda hazırlansın (Android'de ilk açılışta iner).
  useEffect(() => void prepareInk(), []);
  // Uygulama kapanırken çevrimiçi odadan çıkmadan önce bağlantı "çevrimdışı" işaretlenir (onDisconnect).
  useEffect(() => () => void useGame.getState().leave(), []);

  return (
    <HashRouter>
      <BackHandler />
      <Suspense fallback={<div className="bg page-wait" />}>
        <Routes>
          <Route path="/" element={<NeedsName><Home /></NeedsName>} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/kur/:mode" element={<NeedsName><Setup /></NeedsName>} />
          <Route path="/katil" element={<NeedsName><Join /></NeedsName>} />
          <Route path="/nasil" element={<HowTo />} />
          <Route path="/oyun" element={<NeedsName><Game /></NeedsName>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
