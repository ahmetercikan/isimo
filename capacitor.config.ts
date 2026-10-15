import type { CapacitorConfig } from '@capacitor/cli';

/** Android paketi: web uygulaması dist/ klasöründen yerel uygulamaya sarılır. */
const config: CapacitorConfig = {
  appId: 'com.ahmetercikan.isimsehir',
  appName: 'İsim Şehir',
  webDir: 'dist',
  backgroundColor: '#cfeee6',
  android: {
    allowMixedContent: false,
    // Hata ayıklama yalnızca debug derlemesinde açık (Capacitor varsayılanı); mağaza sürümünde kapalı.
  },
};

export default config;
