/**
 * AdMob reklam kimlikleri (AdMob konsolu → Uygulamalar → İsim Şehir → Reklam birimleri).
 * Şu an Google'ın herkese açık DENEME kimlikleri: deneme reklamları gösterilir, para kazandırmaz.
 * Gerçek kimlikler gelince buraya ve android/app/src/main/res/values/strings.xml → admob_app_id yazılır.
 */
export const ADMOB = {
  /** Uygulama kimliği (ca-app-pub-…~…): strings.xml'de de olmalı. */
  appId: 'ca-app-pub-3940256099942544~3347511713',
  /** Uyarlanabilir alt şerit. */
  banner: 'ca-app-pub-3940256099942544/9214589741',
  /** Geçiş (tam ekran) reklamı. */
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
};

/** Deneme kimlikleri kullanılıyor mu (gerçek kimliklerle false olur). */
export const ADS_TESTING = ADMOB.banner.startsWith('ca-app-pub-3940256099942544/');
