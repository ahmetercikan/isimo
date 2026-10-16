/**
 * Reklamlar (Google AdMob, yalnızca Android uygulamasında; web sürümünde reklam yok).
 *
 * Nerede:
 *   - Ana sayfa ve lobi: ekranın altında küçük şerit (banner). Oyun sırasında hiç yok.
 *   - Oyun bitince (final ekranından çıkarken): tam ekran geçiş reklamı; en fazla 3 dakikada bir.
 * Avrupa (GDPR) için Google'ın onay penceresi (UMP) ilk açılışta gösterilir; ayarlardan değiştirilebilir.
 * Reklam kimlikleri: src/lib/adsConfig.ts (gerçek kimlikler gelene kadar Google'ın deneme kimlikleri).
 */
import { Capacitor } from '@capacitor/core';
import {
  AdMob, AdmobConsentStatus, BannerAdPluginEvents, BannerAdPosition, BannerAdSize, InterstitialAdPluginEvents, MaxAdContentRating,
} from '@capacitor-community/admob';
import { ADMOB, ADS_TESTING } from './adsConfig';

const native = Capacitor.getPlatform() === 'android';
let ready: Promise<boolean> | null = null;
let privacyRequired = false;
let bannerWanted = 0;
let bannerShown = false;
let interstitialLoaded = false;
let lastInterstitial = 0;
const INTERSTITIAL_GAP_MS = 3 * 60_000;

const setAdHeight = (h: number) => {
  document.documentElement.style.setProperty('--ad-h', `${Math.round(h)}px`);
  document.body.classList.toggle('has-ad', h > 0);
};

/** Reklam altyapısını hazırla (onay penceresi + başlatma + ilk geçiş reklamını yükle). */
export function initAds(): Promise<boolean> {
  if (!native) return Promise.resolve(false);
  if (!ready)
    ready = (async () => {
      try {
        const info = await AdMob.requestConsentInfo();
        if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) await AdMob.showConsentForm();
        privacyRequired = String(info.privacyOptionsRequirementStatus) === 'REQUIRED';
      } catch {
        /* onay bilgisi alınamadı: kişiselleştirilmemiş reklamlarla devam */
      }
      await AdMob.initialize({ maxAdContentRating: MaxAdContentRating.Teen, tagForChildDirectedTreatment: false, initializeForTesting: ADS_TESTING });
      void AdMob.addListener(BannerAdPluginEvents.SizeChanged, (s) => setAdHeight(bannerShown ? s.height : 0));
      void AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => setAdHeight(0));
      void AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => void loadInterstitial());
      void AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => (interstitialLoaded = false));
      void loadInterstitial();
      return true;
    })().catch(() => false);
  return ready;
}

async function loadInterstitial() {
  interstitialLoaded = false;
  try {
    await AdMob.prepareInterstitial({ adId: ADMOB.interstitial, isTesting: ADS_TESTING, immersiveMode: true });
    interstitialLoaded = true;
  } catch {
    interstitialLoaded = false;
  }
}

/** Alt şerit reklamı göster (birden çok ekran isteyebilir; son ekran bırakınca gizlenir). */
export async function showBanner() {
  bannerWanted++;
  if (!(await initAds()) || bannerShown) return;
  bannerShown = true;
  try {
    await AdMob.showBanner({ adId: ADMOB.banner, adSize: BannerAdSize.ADAPTIVE_BANNER, position: BannerAdPosition.BOTTOM_CENTER, margin: 0, isTesting: ADS_TESTING });
  } catch {
    bannerShown = false;
  }
}

export async function hideBanner() {
  bannerWanted = Math.max(0, bannerWanted - 1);
  if (bannerWanted > 0 || !bannerShown) return;
  bannerShown = false;
  setAdHeight(0);
  await AdMob.removeBanner().catch(() => {});
}

/** Oyun bittiğinde tam ekran reklam (yüklüyse ve son reklamdan beri 3 dakika geçtiyse). Döner: reklam kapanınca. */
export async function maybeInterstitial(): Promise<void> {
  if (!native || !interstitialLoaded || Date.now() - lastInterstitial < INTERSTITIAL_GAP_MS) return;
  lastInterstitial = Date.now();
  interstitialLoaded = false;
  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    void AdMob.addListener(InterstitialAdPluginEvents.Dismissed, finish).then((h) => setTimeout(() => void h.remove(), 120_000));
    void AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, finish);
    AdMob.showInterstitial().catch(finish);
    setTimeout(finish, 60_000);
  });
}

/** Avrupa'daki kullanıcılar için "reklam gizlilik seçenekleri" düğmesi gerekli mi. */
export const privacyOptionsRequired = () => privacyRequired;
export const showPrivacyOptions = () => AdMob.showPrivacyOptionsForm().catch(() => {});
export const adsAvailable = native;
