/**
 * AdMob reklam kimlikleri (AdMob konsolu → Uygulamalar → İsim Şehir → Reklam birimleri).
 * Android ve iOS'un AdMob'da **ayrı** uygulaması ve ayrı reklam birimleri olur; kimlikler de ayrıdır.
 * Uygulama kimliği şuralarla aynı olmalı:
 *   Android → android/app/src/main/res/values/strings.xml → admob_app_id
 *   iOS     → ios/App/App/Info.plist → GADApplicationIdentifier
 * Bir platformun kimlikleri boşsa o platformda reklam gösterilmez (oyunun geri kalanı etkilenmez).
 * Denemek için Google'ın deneme kimlikleri: uygulama ca-app-pub-3940256099942544~1458002511 (iOS)
 * / ~3347511713 (Android), şerit ca-app-pub-3940256099942544/2934735716 (iOS)
 * / 9214589741 (Android), geçiş ca-app-pub-3940256099942544/4411468910 (iOS) / 1033173712 (Android).
 */
export interface AdIds {
  /** Uygulama kimliği (ca-app-pub-…~…). */
  appId: string;
  /** Uyarlanabilir alt şerit. */
  banner: string;
  /** Geçiş (tam ekran) reklamı. */
  interstitial: string;
}

/** Android (gerçek kimlikler, 1.0.1'den beri). */
export const ADMOB_ANDROID: AdIds = {
  appId: 'ca-app-pub-8025731390860952~5747527917',
  banner: 'ca-app-pub-8025731390860952/2942235321',
  interstitial: 'ca-app-pub-8025731390860952/5596318824',
};

/** iOS (gerçek kimlikler, 17 Ekim 2026'da AdMob'da açılan iOS uygulaması). */
export const ADMOB_IOS: AdIds = {
  appId: 'ca-app-pub-8025731390860952~9852483361',
  banner: 'ca-app-pub-8025731390860952/5370312876',
  interstitial: 'ca-app-pub-8025731390860952/3878846817',
};

/** Platformun kimlikleri; reklam gösterilemeyecekse null (web, ya da kimlikleri girilmemiş platform). */
export function adIdsFor(platform: string): AdIds | null {
  const ids = platform === 'android' ? ADMOB_ANDROID : platform === 'ios' ? ADMOB_IOS : null;
  return ids && ids.appId && ids.banner && ids.interstitial ? ids : null;
}

/** Google'ın deneme kimlikleri mi kullanılıyor (gerçek kimliklerle false). */
export const isTestIds = (ids: AdIds) => ids.banner.startsWith('ca-app-pub-3940256099942544/');
