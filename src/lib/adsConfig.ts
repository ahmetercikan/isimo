/**
 * AdMob reklam kimlikleri (AdMob konsolu → Uygulamalar → İsim Şehir → Reklam birimleri).
 * Gerçek kimlikler (1.0.1'den beri). Uygulama kimliği android/app/src/main/res/values/strings.xml → admob_app_id ile aynı olmalı.
 * Denemek için Google'ın deneme kimlikleri: uygulama ca-app-pub-3940256099942544~3347511713,
 * şerit ca-app-pub-3940256099942544/9214589741, geçiş ca-app-pub-3940256099942544/1033173712.
 */
export const ADMOB = {
  /** Uygulama kimliği (ca-app-pub-…~…): strings.xml'de de olmalı. */
  appId: 'ca-app-pub-8025731390860952~5747527917',
  /** Uyarlanabilir alt şerit. */
  banner: 'ca-app-pub-8025731390860952/2942235321',
  /** Geçiş (tam ekran) reklamı. */
  interstitial: 'ca-app-pub-8025731390860952/5596318824',
};

/** Deneme kimlikleri kullanılıyor mu (gerçek kimliklerle false olur). */
export const ADS_TESTING = ADMOB.banner.startsWith('ca-app-pub-3940256099942544/');
