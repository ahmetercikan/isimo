# Android 1.0.13 — 26 Ekim 2026

- Paket: `com.ahmetercikan.isimsehir`
- Sürüm: 1.0.13, versionCode 13 (12 Console'da daha önce kullanılmıştı).
- Önceki üretim sürümü: 12 (1.0.12), kullanıcı tarafından onaylanıp mağazaya yayımlandı.
- Yeni özellik: Sinema Salonu → Sen Ne Kadar…? → Oyna → evren seç → tek kişilik 10 soruluk yarışma.
- Oda kurma ve arkadaşların koduyla katılma akışları korunur.
- Sürüm notları: `store/listing-tr.md`.

## Doğrulama

Derleme ve imza doğrulaması tamamlandığında paket SHA-256 değerleri ve imza sertifikası buraya yazılır.

- `npm run build` ve `npm run android:sync`: başarılı.
- `./gradlew --offline assembleRelease bundleRelease`: başarılı.
- APK: `store/release/isim-sehir-1.0.13.apk`; SHA-256 `5353353ec77f8f03e50ebd76b48cf226c5f808200c8955cdeb146aa51079585e`.
- AAB: `store/release/isim-sehir-1.0.13.aab`; SHA-256 `d75238395e026ff0176199fb8d49e93ed283677db5015313f1ed4e8288f7d733`.
- APK manifesti: `com.ahmetercikan.isimsehir`, versionCode 13, versionName 1.0.13.
- APK imza sertifikası SHA-256: `2e937135a59f8447e29a916b06b35240d0b11fa4bdcd10613b974aa5baa36ae1` (önceki paketle aynı).
- `apksigner verify` ve `jarsigner -verify`: başarılı.

## Play Console

1.0.13 üretim sürümü, 26 Ekim 2026'da sürüm adı ve Türkçe sürüm notlarıyla kaydedildi. App Bundle 13 (1.0.13) Console'da görünüyor. Değişiklikler incelemeye gönderildi; son görülen durum “İncelenmekte olan değişiklikler”. İki engelleyici olmayan uyarı vardı, engelleyici hata yoktu. Google'ın inceleme sonucu bekleniyor.
