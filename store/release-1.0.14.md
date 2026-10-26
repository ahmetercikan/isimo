# Android 1.0.14 — 26 Ekim 2026

- Paket: `com.ahmetercikan.isimsehir`
- Sürüm: 1.0.14, versionCode 14.
- Önceki üretim sürümü: 1.0.13, versionCode 13.
- Sinema Bilmecesi bilgi yarışmasına Leyla ile Mecnun için 300 soru eklendi (toplam havuz 9.360 soru).
- Yarışma adı “Sahneyi Hatırla” oldu; mobilde görsel efektler ve soru ekranı yenileme sıklığı hafifletildi.
- Sürüm notları `store/listing-tr.md` içindedir.

## Paket doğrulaması

- `npm run android:sync`: başarılı.
- `cd android && ./gradlew --offline assembleRelease bundleRelease`: başarılı.
- APK: `store/release/isim-sehir-1.0.14.apk` — SHA-256 `715d1cf29430456d5518ce00bd7fe906e81c16d5840791aa9fbbf8cae14aae1c`.
- AAB: `store/release/isim-sehir-1.0.14.aab` — SHA-256 `640997efef8663264ab0a5e51165a058ff252915fdff34f653f7357ac5a0cea0`.
- APK manifesti: versionCode 14, versionName 1.0.14.
- Paket imzası önceki üretimle aynı yükleme anahtarına ait; `apksigner verify` ve `jarsigner -verify` başarılı.

## Play Console

1.0.14 App Bundle, Android Publisher API üzerinden production kanalına gönderildi. Play Console Yayın Özeti 26 Ekim'de sürüm 14'ün incelemede olduğunu gösterdi. Leyla ile Mecnun soru metinleri sadeleştirildikten sonra, 1.0.15 aynı gün production kanalına gönderildi; yeni gönderim önceki incelemenin yerini aldı.
