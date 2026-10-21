/**
 * Reklamlar (Google AdMob; Android ve iOS uygulamasında, web sürümünde reklam yok).
 *
 * Nerede:
 *   - Ana sayfada ve lobide: ekranın altında küçük şerit (banner). Oyun sırasında hiç yok — lobiden
 *     çıkılırken gizlenir, şerit geç açılırsa da hemen gizlenir (bkz. showBanner).
 *   - Oyun bitince (final ekranından çıkarken): tam ekran geçiş reklamı; en fazla 3 dakikada bir.
 * Avrupa (GDPR) için Google'ın onay penceresi (UMP) ilk açılışta gösterilir; ayarlardan değiştirilebilir.
 * iOS'ta bir de Apple'ın izleme izni penceresi çıkar (onay penceresinden sonra; izin verilmezse
 * reklamlar kişiselleştirilmeden gösterilir).
 * Reklam içerik sınıfı platforma göre: Android'de en geniş (MA), iOS'ta PG — App Store'daki yaş
 * derecelendirmesi 4+ olduğu için iOS'ta yetişkin reklamı gösterilemez (Apple kuralı).
 * Reklam kimlikleri: src/lib/adsConfig.ts — bir platformun kimlikleri boşsa orada reklam yoktur.
 */
import { Capacitor } from '@capacitor/core';
import {
  AdMob, AdmobConsentStatus, BannerAdPluginEvents, BannerAdPosition, BannerAdSize, InterstitialAdPluginEvents, MaxAdContentRating,
} from '@capacitor-community/admob';
import { adIdsFor, isTestIds } from './adsConfig';

const platform = Capacitor.getPlatform();
const ids = adIdsFor(platform);
const native = ids !== null;
/** Gösterilebilecek en üst reklam içerik sınıfı (iOS'ta uygulama 4+ olduğu için daha dar). */
const MAX_AD_RATING = platform === 'ios' ? MaxAdContentRating.ParentalGuidance : MaxAdContentRating.MatureAudience;
const ADMOB = ids ?? { appId: '', banner: '', interstitial: '' };
const ADS_TESTING = ids ? isTestIds(ids) : false;
let ready: Promise<boolean> | null = null;
let privacyRequired = false;
let bannerWanted = 0;
let bannerShown = false;
/** Şerit (AdView) kuruldu ve yok edilmedi; gizliyken de durur. */
let bannerExists = false;
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
      await AdMob.initialize({ maxAdContentRating: MAX_AD_RATING, tagForChildDirectedTreatment: false, initializeForTesting: ADS_TESTING });
      // iOS: Apple'ın izleme izni penceresi (izin yoksa reklamlar kişiselleştirilmez, yine çıkar).
      if (platform === 'ios') await AdMob.trackingAuthorizationStatus().then(
        (s) => (s.status === 'notDetermined' ? AdMob.requestTrackingAuthorization() : undefined),
      ).catch(() => {});
      void AdMob.addListener(BannerAdPluginEvents.SizeChanged, (s) => setAdHeight(bannerShown ? s.height : 0));
      // Reklam gelmezse eklenti şeridi kendisi yok eder; bir sonraki ana sayfada yeniden kurulur.
      void AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
        bannerExists = false;
        setAdHeight(0);
      });
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

/**
 * Alt şerit reklamı göster (birden çok ekran isteyebilir; son ekran bırakınca gizlenir).
 * initAds ilk açılışta saniyeler sürebildiği için, bu arada ekrandan çıkıldıysa şerit hiç
 * açılmaz — yoksa oyun başladıktan sonra beliriyor ve WebView'i aşağıdan kırptığı için
 * ekran bir anlığına boş kalıyordu.
 *
 * Şerit bir kez kurulur, sonra yalnızca gizlenip yeniden gösterilir: her ekran değişiminde
 * kurup yok etmek (şeridin içinde ayrı bir WebView var) bazı telefonlarda oyun ekranının
 * saniyelerce bembeyaz kalmasına yol açıyordu — lobiden oyuna geçerken harf çevrilirken.
 * create=false: şerit yoksa yenisini kurma (lobi; oyuna geçişte yeni reklam isteği olmasın).
 */
export async function showBanner(create = true) {
  bannerWanted++;
  if (!(await initAds()) || bannerShown || bannerWanted <= 0 || (!bannerExists && !create)) return;
  bannerShown = true;
  try {
    if (bannerExists) await AdMob.resumeBanner();
    else {
      bannerExists = true;
      await AdMob.showBanner({ adId: ADMOB.banner, adSize: BannerAdSize.ADAPTIVE_BANNER, position: BannerAdPosition.BOTTOM_CENTER, margin: 0, isTesting: ADS_TESTING });
    }
    if (bannerWanted <= 0) {
      bannerShown = false;
      setAdHeight(0);
      await AdMob.hideBanner().catch(() => {});
    }
  } catch {
    bannerShown = false;
    bannerExists = false;
  }
}

export async function hideBanner() {
  bannerWanted = Math.max(0, bannerWanted - 1);
  if (bannerWanted > 0 || !bannerShown) return;
  bannerShown = false;
  setAdHeight(0);
  await AdMob.hideBanner().catch(() => {});
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
