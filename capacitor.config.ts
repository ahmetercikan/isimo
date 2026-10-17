import type { CapacitorConfig } from '@capacitor/cli';

/** Android ve iOS paketi: web uygulaması dist/ klasöründen yerel uygulamaya sarılır. */
const config: CapacitorConfig = {
  appId: 'com.ahmetercikan.isimsehir',
  appName: 'İsim Şehir',
  webDir: 'dist',
  backgroundColor: '#cfeee6',
  android: {
    allowMixedContent: false,
    // Hata ayıklama yalnızca debug derlemesinde açık (Capacitor varsayılanı); mağaza sürümünde kapalı.
  },
  ios: {
    // Çentik ve alt çubuk: boşluğu CSS'teki env(safe-area-inset-*) ayarlıyor, WebView kendi payını eklemesin.
    contentInset: 'never',
    // Sayfa lastik gibi esneyip kaymasın (oyun tek ekran).
    scrollEnabled: false,
  },
};

export default config;
