# Android 1.0.12 — 25 Ekim 2026

- Paket: `com.ahmetercikan.isimsehir`
- Sürüm: 1.0.12, versionCode 12.
- Play Console'da üretimde görülen önceki sürüm: 11 (1.0.11).
- Soru havuzu: 19 evren, 9.360 soru; özgün 936 soru sırası korunmuş, her hedef tam 10 kattır.
- Devam filmli kapsamlar: Wizarding World, Hobbit, Matrix dörtlemesi, Yıldız Savaşları dokuz ana film + Rogue One/Solo, Karayip Korsanları ilk beş, Aslan Kral/Mufasa, Şrek/Çizmeli Kedi.
- Soru geçmişi çevrimdışı ve arkadaş odalarında oyun başında kaydedilir, yeniden girişte ve yeni odada sürer.
- Filmi Bil ve Sen Ne Kadar sonuçlarında geçiş reklamı eklenmiştir; 3 dakika sıklık sınırı korunur.
- Sürüm notu: `store/listing-tr.md`.

## İçerik ve kaynak

- İki ayrı, kaynaklı bilgiyi birleştiren yeni sorular üretilir. Her iki kaynak sorunun atıfları ayrı saklanır.
- Yeni tekil bilgiler için resmî kaynaklar: StarWars.com Databank, FantasticBeasts.com, TheMatrix.com, Disney film sayfaları, DreamWorks. Ayrıntıların resmî sayfada yer almadığı durumlarda ikinci kaynaklar soru içinde belirtilmiştir.
- `store/quiz-expansion-facts.json` stores added series facts.
- `store/quiz-expansion-targets.json` stores exact per-universe counts.

## Doğrulama

- `node scripts/check-quiz-expansion.mjs`: 19/19 hedef; toplam 9.360.
- `npm test`: 83 test geçti.
- `npm run build` / `npm run android:sync`: başarılı.
- `assembleRelease bundleRelease`: Java 21, offline Gradle cache ile başarılı.
- APK SHA-256: `fa7fabcd7d355fe5f974c8c23c7e01fff1c37b2ea9716bb0d6a676677db5d4ec`.
- AAB SHA-256: `3e2d370840c103c629403bb7b8d462dfca4ba3c56a42f78b33c592eb16197892`.
- APK signer SHA-256: `2e937135a59f8447e29a916b06b35240d0b11fa4bdcd10613b974aa5baa36ae1`.
- APK sürüm manifesti 1.0.12 / 12; AAB `jarsigner -verify`: `jar verified.`
- 83 birim testi geçti. Chrome üç cihazla çevrimiçi quiz akışı; ayrıca yarıda çıkış, yeniden açılış, yeni oda ve ev sahibi değişiminde soru geçmişinin korunması geçti. Fiziksel Android cihaz testi yapılmadı.

## Play Console

1.0.12 üretim sürümü Google Play Console'da oluşturulup incelemeye gönderildi. Kullanıcı 26 Ekim 2026'da sürümün incelemeden geçtiğini ve mağazada yayımlandığını bildirdi. Yeni 1.0.13 sürümü ayrı bir inceleme olarak gönderildi.
