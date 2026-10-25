import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles/theme.css';
import './styles/app.css';
import './styles/game.css';
import './styles/tablet.css';
import './styles/landscape.css';
import './styles/cinema.css';

// Web'de çevrimdışı çalışma ve "Ana ekrana ekle" için servis çalışanı (Android uygulamasında dosyalar zaten pakette).
if (!Capacitor.isNativePlatform()) registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
