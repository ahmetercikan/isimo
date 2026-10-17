# İsim Şehir — Claude için proje notları

- **Ne:** Klasik "İsim Şehir" oyunu, en fazla 10 kişi, herkes kendi telefonundan (oda kodu) ya da botlara karşı.
  Cevaplar parmakla yazılır; el yazısı tanınır. Tasarım Çizio (../simple-Draw) ile aynı dil.
  React 18 + TypeScript + Vite 5 (HashRouter), zustand, Capacitor 8 (Android + iOS), Firebase Realtime Database.
- **Kullanıcı** teknik değil: her zaman **Türkçe ve sade** yaz. Mağaza/konsol adımlarını ekranda göreceği adlarla anlat.
- **Komutlar:**
  - geliştirme: `npm run dev` (port 5290); çevrimiçi deneme: `npm run emulators` + `VITE_FIREBASE_EMULATOR=1 npx vite --port 5291`
  - test: `npm test` · tip kontrolü + derleme: `npm run build`
  - Android: `npm run android:apk` (debug), `npm run android:aab` (mağaza). Gradle JDK 21 ister (android/gradle.properties).
  - iOS (yalnızca Mac'te): `npm run ios:sync`, `npm run ios:open`, `npm run ios:ipa` (imzalı App Store paketi).
    Ayrıntılar ve mağaza adımları: `IOS.md`, `store/app-store-1.0.1.md`.
  - uygulama ikonu: `npx tsx scripts/make-icons.mts && npx capacitor-assets generate --android --iconBackgroundColor '#16a6c4' --splashBackgroundColor '#cfeee6'`
  - uygulama içi simgeler: `src/art/icons.ts` (Çizio'nun el çizimi simge dili; emoji kullanılmaz)
  - sunucu sesi (Çizio ile aynı Gemini sesi, Sulafat): cümleler `src/voice/lines.ts` → `npx tsx scripts/generate-voice.mts`
    (anahtar: `.env.local` GEMINI_API_KEY); doğrulama: `python scripts/voice-verify.py`
  - mağaza görselleri: `npm run dev` açıkken `npx tsx scripts/store-shots.mts phone|tablet`, sonra `npx tsx scripts/store-promo.mts`
  - sözlükler: `scripts/dict-src/*.txt` düzenle → `node scripts/dict-src/build.cjs`
- **Yapı:**
  - `src/engine/`: Türkçe harf işlemleri (tr.ts), kategoriler, sözlük, puanlama (saf; testler `__tests__`)
  - `src/game/director.ts`: oyun akışı (lobi → harf → yazma → değerlendirme → puan → final); geçişleri "yöneten" oyuncu yapar
  - `src/game/bots.ts`: botlar · `src/game/screens/`: oyun ekranları
  - `src/online/`: ortak arayüz (transport.ts), botlu oyun (local.ts), Firebase (firebase.ts, config.ts); kurallar `database.rules.json`
  - `src/lib/ink.ts`: el yazısı tanıma — Android'de `android/.../InkPlugin.java` (ML Kit Digital Ink, Türkçe model),
    iOS'ta `ios/App/App/InkVision.swift` + `InkPlugin.swift` (Apple Vision, cihazda, internetsiz; denemek: `npm run ios:ink`),
    web'de Google giriş servisi
- **Firebase:** proje `isimo-1ce98` (Realtime Database europe-west1, anonim giriş). `src/online/config.ts` → `FIREBASE_CONFIG` null iken çevrimiçi oyun kapalı (botlu oyun çalışır).
- **Reklam:** Google AdMob (`src/lib/ads.ts`); kimlikler platform başına `src/lib/adsConfig.ts` içinde
  (Android ve iOS'un AdMob'da ayrı uygulaması var; iOS uygulama kimliği `Info.plist` → `GADApplicationIdentifier`
  ile aynı olmalı, bu anahtar boşsa uygulama açılışta çöker). İki platformda da: ana sayfa ve lobi altında şerit, oyun bitince tam ekran
  (3 dk'da en fazla bir). Oyun sırasında reklam yok. Kimlikler `src/lib/adsConfig.ts` + `strings.xml` (admob_app_id);
  gerçek kimlikler (AdMob yayıncı 8025731390860952). Kurulum: `store/admob-adimlar.md`. Hedef kitle: 13+ (Play: 13-15, 16-17, 18+; içerik derecelendirmesi Herkes, mağazada herkese görünür); yaş sorusu yok; reklam sınıfı en geniş (MA), yalnızca Google'ın yasakladıkları gelmez.
- **Güvenlik:** anahtar, keystore ve `.env*` dosyaları asla commit edilmez. Firebase web ayarı gizli değildir.
- **Yayın:** `main`e gönderilen her commit GitHub Pages'e yayınlanır (https://ahmetercikan.github.io/isimo/).
- **Sürüm:** `package.json` → `version`; Android: `android/app/build.gradle` (versionCode/versionName);
  iOS: `ios/App/App.xcodeproj` (MARKETING_VERSION/CURRENT_PROJECT_VERSION). Üçü aynı sürüm adını taşır.
- **iOS imzası:** ekip **AQ2Y664A4Z** (ABDURRAHMAN KAAN DIKEC); paket kimliği Android ile aynı (`com.ahmetercikan.isimsehir`).
