# İsim Şehir — Claude için proje notları

- **Ne:** İki oyun bir arada (ana sayfa ikiye bölünür):
  1. **İsim Şehir** — klasik oyun, harf çevirip kategorileri doldurma, STOP.
  2. **Sıra Sende** — masadaki kelimede tek harf değiştirip yeni kelime yapma (sırayla, canlı/elemeli).
  Her ikisi de en fazla 10 kişi, herkes kendi telefonundan (oda kodu) ya da botlara karşı.
  Cevaplar parmakla yazılır; el yazısı tanınır. Tasarım Çizio (../simple-Draw) ile aynı dil.
  React 18 + TypeScript + Vite 5 (HashRouter), zustand, Capacitor 8 (Android + iOS), Firebase Realtime Database.
- **Kullanıcı** teknik değil: her zaman **Türkçe ve sade** yaz. Mağaza/konsol adımlarını ekranda göreceği adlarla anlat.
- **Komutlar:**
  - geliştirme: `npm run dev` (port 5290); çevrimiçi deneme: `npm run emulators` + `VITE_FIREBASE_EMULATOR=1 npx vite --port 5291`
  - test: `npm test` · tip kontrolü + derleme: `npm run build`
  - Android: `npm run android:apk` (debug), `npm run android:aab` (mağaza; Windows'ta `android:aab:win`).
    Gradle JDK 21 ister (android/gradle.properties). **Bu Mac'te JDK ve yükleme anahtarı yok**, bkz. aşağıdaki "Android imzası".
  - iOS (yalnızca Mac'te): `npm run ios:sync`, `npm run ios:open`, `npm run ios:ipa` (imzalı App Store paketi).
    Ayrıntılar ve mağaza adımları: `IOS.md`, `store/app-store-1.0.1.md`.
  - uygulama ikonu: `npx tsx scripts/make-icons.mts && npx capacitor-assets generate --android --iconBackgroundColor '#16a6c4' --splashBackgroundColor '#cfeee6'`
  - uygulama içi simgeler: `src/art/icons.ts` (Çizio'nun el çizimi simge dili; emoji kullanılmaz)
  - sunucu sesi (Çizio ile aynı Gemini sesi, Sulafat): cümleler `src/voice/lines.ts` → `npx tsx scripts/generate-voice.mts`
    (anahtar: `.env.local` GEMINI_API_KEY); doğrulama: `python scripts/voice-verify.py`
  - mağaza görselleri: `npm run dev` açıkken `npx tsx scripts/store-shots.mts phone|tablet`, sonra `npx tsx scripts/store-promo.mts`
  - sözlükler: `scripts/dict-src/*.txt` düzenle → `node scripts/dict-src/build.cjs` (çıktı `src/data/dict/*.json`;
    tekrarlar atılır, '#' ile başlayan satırlar ve '?' içeren kelimeler alınmaz)
  - Sıra Sende kelime havuzu: `scripts/dict-src/kelime.txt` (3-6 harfli genel Türkçe kelimeler, ~3.900).
    Kategori sözlüklerindeki tek kelimelik adlar da buraya elle taşındı; yeni kelime eklenince build'i çalıştır.
    Oyun yalnız 3-5 harflileri kullanır (`LENGTHS` in `src/engine/chain.ts`); 6 harfliler havuzda durur ama oynanmaz.
    Zincirin sağlığı: 4 harflilerde ortalama 3,7 komşu (%14 çıkmaz), 5 harflilerde 1,35 (%44). 5 harfli havuz hâlâ en zayıf halka.
    Q, W, X ile başlayan kayıt eklenmez (o harfler hiç çıkmaz).
- **Yapı:**
  - `src/engine/`: Türkçe harf işlemleri (tr.ts), kategoriler, sözlük, puanlama (saf; testler `__tests__`)
  - **STOP kuralı (İsim Şehir):** STOP yalnızca bütün kategorilerde **geçerli** cevabı olana açılır (`isAnswer` in `src/engine/tr.ts`:
    turun harfiyle başlayan, en az iki harfli). Tek harf cevap sayılmaz — tanıyıcı düz bir çizgiyi "l"/"i" okuyor,
    eskiden böyle kutular "dolu" görünüp STOP'u açıyordu. Puanlamada da tek harf 0 ("tek harf").
  - `src/game/director.ts`: oyun akışı (lobi → harf → yazma → değerlendirme → puan → final); geçişleri "yöneten" oyuncu yapar
  - `src/game/bots.ts`: botlar (iki oyunda da) · `src/game/screens/`: oyun ekranları
  - **Sıra Sende:** kurallar `src/engine/chain.ts` (kelime havuzu, tek harf değişimi, komşu kelime arama),
    akış `src/game/chainDirector.ts` (sıra, can, puan — hepsi `ctl` içinde tek atomik işlemde değişir,
    böylece Firebase kurallarına dokunmak gerekmedi), ekranlar `screens/Turn.tsx` ve `screens/ChainFinal.tsx`,
    ayarlar `components/ChainSettings.tsx`. Oyun türü `settings.game` ('isim' | 'siram'); kurulum sayfası
    `/kur/:mode?oyun=siram`.
  - **Ekran düzeni:** `src/styles/app.css` + `game.css` telefon dikey; `tablet.css` 700 px'ten geniş ekranlar;
    `landscape.css` yatay tutulan telefonlar (`orientation: landscape` ve yükseklik ≤ 560 px) — yatayda telefon
    700 px'i geçtiği için tablet ölçüleri devreye giriyor, bu dosya onları küçültüp yazı defteri ile düğmeleri
    yan yana koyar (ekranlar: ana sayfa, lobi, kurulum, harf çevirme, yazma, Sıra Sende, değerlendirme, puanlar).
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
- **Mağaza telifi:** App Store ve Play'de telif satırı **2026 Abdurrahman Kaan Dikeç** — yani hesabın/satıcının
  adıyla aynı (20 Ekim 2026'da değişti; eskiden Ahmet Mesut Erçıkan yazıyordu). Sebep: Apple'ın 4.3/4.2.6
  reddinde satıcı ile telifin farklı isimler olması "başkası adına yayınlanan uygulama" izlenimi veriyordu.
  Alan App Store Connect'te **sürüm sayfasında** durur (Distribution → iOS App <sürüm> → "Version" kutusunun
  sağındaki "Copyright"), App Information'da değil. Ayrıntı ve App Review'a gönderilen cevap:
  `store/app-review-4.3-yanit.md`.
- **iOS imzası:** ekip **AQ2Y664A4Z** (ABDURRAHMAN KAAN DIKEC); paket kimliği Android ile aynı (`com.ahmetercikan.isimsehir`).
- **Android imzası:** Play Uygulama İmzalama açık (mağaza anahtarı Google'da). Yüklenen paket, ilk paketi imzalayan
  **aynı yükleme anahtarıyla** imzalanmak zorunda: Çizio ile ortak `cizio-upload.jks`, Windows bilgisayarda
  (`C:\Users\ahmet.ercikan\.cizio-keys\`). Mac'te derlemek için o dosya + `android/keystore.properties` (git'te yok)
  + bir JDK 21 gerekir. Anahtar kaybolursa Play Console → Uygulama imzalama → "Sıfırlama talep edin".
- **Play durumu (20 Eki 2026):** üretimde **1 (1.0.0)**, tam kullanıma sunuldu, 5 ülke; Play'e yüklenmiş tek paket bu.
  Geliştirici 6262296307859358769, uygulama 4972498643282459948. Sırada bekleyen: **sürüm kodu 2 / 1.0.2**
  (depoda hazır, paket henüz derlenmedi). Adımlar: `store/play-console-adimlar.md`.
