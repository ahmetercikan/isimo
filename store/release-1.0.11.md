# Android 1.0.11 — 25 Ekim 2026

- Paket kimliği: `com.ahmetercikan.isimsehir`
- Sürüm adı: `1.0.11`; sürüm kodu: `11`
- AAB: `store/release/isim-sehir-1.0.11.aab` (29.430.071 bayt)
- APK: `store/release/isim-sehir-1.0.11.apk` (46.835.986 bayt)
- İmza: mevcut Cizio yükleme anahtarı; SHA-256 `2E:93:71:35:A5:9F:84:47:E2:9A:91:6B:06:B3:52:40:D0:B1:1F:A4:BD:CD:10:61:3B:97:4A:A5:BA:A3:6A:E1`

## İçerik

Sinema Salonu, Sen Ne Kadar…? (13 evren, 716 soru; Harry Potter 119), altı unvan ve sonuç hikâye kartı.
Film Tahmini butonları dar ekranda satırlanır. Sinema müziği daha sakin yarışma döngüsüyle değişti;
son saniyelerde farklı parçaya geçiş kaldırıldı. Yarışmada puan sınırı, çift cevap ve zamanlayıcı korumaları var.
Türkçe sürüm notlarının tam metni: `store/listing-tr.md`.

## Kontroller

- `npm test`: 61 test geçti.
- TypeScript/Vite/PWA derlemesi ve `cap sync android` geçti.
- `assembleRelease bundleRelease`: başarılı; Java 21 ve önbellekteki bağımlılıklar kullanıldı.
- APK `apksigner verify`; AAB `jarsigner -verify`: imzalar doğrulandı.
- APK manifestinde sürüm kodu 11 / adı 1.0.11 doğrulandı.
- Her iki pakette yeni `music/film-quiz.m4a` bulundu.
- Chrome'da 320, 390 ve 768 px genişlikte üç Film Tahmini butonunun içeriği sığıyor;
  13 evren menüsü ve Harry Potter yarışma ekranı açılıyor. Bu kontrol fiziksel Android cihaz testi değildir.

## Play Console

Üretimdeki önceki sürüm 10 (1.0.10) olarak doğrulandı. 1.0.11 AAB normal dosya seçicisiyle yüklendi;
sürüm adı ve Türkçe notlar kaydedildi. Önizleme: %100 sunum, cihaz kaybı yok, indirme 17,6 MB (-630 KB).
İki engelleyici olmayan uyarı: R8/proguard eşleme dosyası ve yerel hata ayıklama sembolleri yok.

25 Ekim 2026, yaklaşık 20:30 (İstanbul): yalnız bu sürüme ait bir değişikliğin incelemeye gönderimi onaylandı.
Konsol “İncelenmekte olan değişiklikler” gösteriyor; hızlı ön kontroller devam ediyor ve en fazla 14 dakika
kalabileceğini belirtiyor. Ön kontroller başarıyla tamamlanınca Google incelemesine otomatik aktarılacak.
Bu kayıt Google'ın sürümü onayladığı veya yeni sürümün yayına çıktığı anlamına gelmez.
