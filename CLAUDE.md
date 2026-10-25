# İsim Şehir — Claude için proje notları

- **Ne:** Üç oyun bir arada (ana sayfada üç kart):
  1. **İsim Şehir** — klasik oyun, harf çevirip kategorileri doldurma, STOP.
  2. **Sıra Sende** — masadaki kelimede tek harf değiştirip yeni kelime yapma (sırayla, canlı/elemeli).
  3. **Sinema Bilmecesi** — ipuçları birer birer açılır, filmi erken bilen çok puan alır (herkes aynı anda).
  Hepsi en fazla 10 kişi, herkes kendi telefonundan (oda kodu) ya da botlara karşı.
  Cevaplar parmakla yazılır; el yazısı tanınır. Tasarım Çizio (../simple-Draw) ile aynı dil.
  React 18 + TypeScript + Vite 5 (HashRouter), zustand, Capacitor 8 (Android + iOS), Firebase Realtime Database.
- **Kullanıcı** teknik değil: her zaman **Türkçe ve sade** yaz. Mağaza/konsol adımlarını ekranda göreceği adlarla anlat.
- **Komutlar:**
  - geliştirme: `npm run dev` (port 5290); çevrimiçi deneme: `npm run emulators` + `VITE_FIREBASE_EMULATOR=1 npx vite --port 5291`
  - test: `npm test` · tip kontrolü + derleme: `npm run build`
  - Android: `npm run android:apk` (debug), `npm run android:aab` (mağaza; Windows'ta `android:aab:win`).
    Mac'te Temurin JDK 21 kurulu (`~/.zshrc`, `~/.gradle/gradle.properties`); derleme denendi, çalışıyor.
    **Eksik olan tek şey yükleme anahtarı**, bkz. aşağıdaki "Android imzası".
  - iOS (yalnızca Mac'te): `npm run ios:sync`, `npm run ios:open`, `npm run ios:ipa` (imzalı App Store paketi).
    Ayrıntılar ve mağaza adımları: `IOS.md`, `store/app-store-1.0.1.md`.
  - uygulama ikonu: `npx tsx scripts/make-icons.mts && npx capacitor-assets generate --android --iconBackgroundColor '#16a6c4' --splashBackgroundColor '#cfeee6'`
    (25 Eki 2026'dan beri: parlak 3B kırmızı "A" kutusu + arkada beyaz "C" kutusu + derinlikli STOP tabelası, kodla çizilir.
    Fredoka'nın B ve Ş harfleri küçük boyutta bozuk okunuyor, kullanma.) Android uyarlanabilir ikon (`fg`) ve maskable
    **sıkı yerleşim** kullanır (`art(true)`: ışık çizgisi yok, C/STOP A'ya yakın, ölçek 0.74): telefon ön planın yalnız
    ortadaki ~%67'sini daire/damla maskeyle gösterdiği için geniş yerleşimde harfler masaüstünde küçük kalıyordu. `capacitor-assets` AndroidManifest.xml'i yeniden
    biçimlendiriyor, `git checkout` ile geri al. Açılış simgesi `res/drawable-*/splash_icon.png` ayrıca
    `assets/icon-foreground.png`'den 288-1152 px küçültülür (sharp ile).
  - uygulama içi simgeler: `src/art/icons.ts` (Çizio'nun el çizimi simge dili; emoji kullanılmaz)
  - sunucu sesi (Çizio ile aynı Gemini sesi, Sulafat): cümleler `src/voice/lines.ts` → `npx tsx scripts/generate-voice.mts`
    (anahtar: `.env.local` GEMINI_API_KEY); doğrulama: `python scripts/voice-verify.py`
  - mağaza görselleri: `npm run dev` açıkken `npx tsx scripts/store-shots.mts phone|tablet` (sona `ek` yazılırsa yalnız
    Sıra Sende + Sinema Bilmecesi çekilir), sonra **Play için** `npx tsx scripts/store-panorama.mts` → `store/promo/play-{phone,tablet}-01…08.png`
    (Gas Story'deki gibi geçişli şerit: renk, kesik çizgili yol ve harf kutuları görselden görsele akar, her birinde eğik telefon).
    Eski kartlı düzen `store-promo.mts` (App Store ve özellik grafiği hâlâ onunla).
    **Play'e yüklerken sıra:** kitaplığa toplu yüklenen görseller bitiş sırasına göre dizilir; slotu boşaltıp kitaplıktan
    01→08 sırayla "Seç" + "Ekle" yapmak gerekir. Yapay zekâ beyanı: maskot/oyun resimleri YZ üretimi (kullanıcı onayladı),
    mağaza görselleri "YZ ile oluşturulmuş" etiketli; simge ve özellik grafiği değil.
  - sözlükler: `scripts/dict-src/*.txt` düzenle → `node scripts/dict-src/build.cjs` (çıktı `src/data/dict/*.json`;
    tekrarlar atılır, '#' ile başlayan satırlar ve '?' içeren kelimeler alınmaz)
  - Sıra Sende kelime havuzu: `scripts/dict-src/kelime.txt` (3-6 harfli genel Türkçe kelimeler, **14.057**).
    **21 Eki 2026'da büyütüldü** (3.851 → 14.057): kaynak Zemberek kök sözlüğü (`master-dictionary.dict`) +
    TDK türevi açık liste (`mertemin/turkish-word-list`) + eski elle derlenen havuz. Üretici:
    `scripts/dict-src/kelime-uret.py` (indirilen iki kaynak dosya repoda tutulmaz; betiğin başında yolları yazıyor).
    Süzgeç: özel ad, kısaltma, çok kelimeli giriş, argo/küfür (53 kelime) ve **oyunda çekilemeyen harf içerenler**
    (q/w/x, â/î/û) elenir — o kelimelere oyunda ulaşılamaz. Yeni kelime eklenince `node scripts/dict-src/build.cjs kelime`.
    Oyun yalnız 3-5 harflileri kullanır (`LENGTHS` in `src/engine/chain.ts`); 6 harfliler havuzda durur ama oynanmaz.
    Zincirin sağlığı (çıkmaz oranı / ortalama komşu): 3 harfli %1 / 13,1 · 4 harfli %6 / 5,5 · 5 harfli %17 / 3,2 ·
    6 harfli %41 / 1,45. Masaya yeni kelime gelme sıklığı 4 harflide ~37, 5 harflide ~17 hamlede bir
    (eskiden 17 ve 7). 6 harfli havuz artık eski 5 harfli havuz kadar sağlam: istenirse `LENGTHS`'e eklenebilir.
    **Uyarı:** `build.cjs` satırları önce `|` ile bölüp sonra `#` bakıyor — başlık yorumlarında `|` kullanma,
    yoksa kelime sanılır.
    `kelime.json` 150 KB, paketlenince 115 KB (gzip 39 KB); yalnız Sıra Sende açılınca iniyor.
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
  - **Zincirin koptuğu yer (21 Eki 2026):** masadaki kelimeden gidilecek kullanılmamış kelime kalmazsa
    masaya **ilgisiz, yepyeni** bir kelime gelir. Bu kelime `ctl.chain` içinde `*` (`FRESH`) ile işaretlenir
    ve `ctl.last.f` ile duyurulur; `chainList` işareti atar, `chainSteps` ekrana kopuğu söyler.
    Eskiden işaret yoktu: sıra kaçınca (`missTurn`) gelen yeni kelime hiç duyurulmuyordu ve final ekranındaki
    zincir "EZAN → ÖZEN" gibi kurala aykırı görünüyordu (kullanıcı şikâyeti). Sıklık: 4 harfli oyunda
    ~17 hamlede bir, 5 harflide ~7 hamlede bir — yani 5 harfli havuz büyümeden bu ekran çok görülür.
  - **Sinema Bilmecesi (22 Eki 2026, deneme sürümü):** ipuçları (tür·yıl·ülke → yönetmen → oyuncu → başrol → konu →
    adın iskeleti) `settings.time` saniyede bir açılır; erken bilen çok puan alır (`CLUE_PTS` 100…15).
    Motor `src/engine/film.ts` (eşleştirme: Türkçe karakter/boşluk farkı yok, uzun adda 1-3 harf hata; başka filmin
    adı tam yazılırsa o filmdir), akış `src/game/filmDirector.ts` (Sıra Sende gibi hepsi `ctl` içinde: `film`, `films`,
    `got`, `pts`; tur kapanınca `nextAt`'e kadar film açıklanır), ekranlar `screens/FilmRound.tsx`, `FilmFinal.tsx`,
    ayarlar `components/FilmSettings.tsx`, aşama `'clue'`, kurulum `/kur/:mode?oyun=film`. Film listesi
    `src/data/films.ts` (şimdilik 15 yerli + 15 yabancı; `DECOYS` yalnız öneri listesinde çıkan adlar, liste cevabı
    ele vermesin). Afiş yok (telif); konu cümleleri bize ait. Yanlış tahmin 2,5 sn bekletir (yalnız cihazda).
    Defterin üstünde **tek şerit** var (`.alts`): öneriler, okunan yazı ya da yol gösteren metin. Ayrı bir
    cevap kutusu (`.answer`) vardı; iki şerit yazacak alanı daraltıyordu (kullanıcı şikâyeti, 22 Eki 2026).
  - **Yeni ana sayfa (24 Eki 2026, deneme):** kullanıcının getirdiği tasarım görseline göre: selam balonu + maskot
    kaplan, her oyuna renkli kart (resim, iki etiket, "Oyna", ">" = o oyunun "Nasıl oynanır"ı `/nasil?oyun=`),
    "Oyna" → Oda Kur / Odaya Katıl / Botlara Karşı penceresi, alt menü `components/TabBar.tsx`
    (Ana Sayfa · İstatistikler `/istatistik` · Ayarlar = `/profil`). Liderlik bilerek yok (ortak sunucu puanı gerekir).
    Kartlarda tasarımdaki taç yok (anlamı belirlenmedi). Resimler `src/assets/home/*.webp` — ayrı dosyalar
    olmadığı için **tasarım ekran görüntüsünden kesildi** (`~/Downloads/kelime-oyunlari-expo/assets/home-reference.jpg`,
    arka plan kenardan taşma ile silindi); çözünürlük düşük, asıl çizimler gelirse değiştirilmeli.
    İsim Şehir resmindeki yeşil kutu elle "A"dan **"B"ye** çevrildi (kullanıcı isteği: kutular A, B, C).
    Maskot `components/Mascot.tsx`: sallanır ve göz kırpar (`tiger-blink.webp` = kırpan gözün aynası,
    açık gözün üstünde kısa süre görünür; konum yüzdeleri resmin 380×326 piksel ölçüsüne bağlı).
    İlk açılış / profil ekranı da aynı dilde: logo yerine selam balonu + maskot.
  - **İç ekranlar da yeni dilde (25 Eki 2026, kullanıcının getirdiği Sinema Bilmecesi tasarım görseline göre):** zemin
    `components/Doodles.tsx` artık manzara çiziyor (nane gökyüzü, bulutlar, köşelerde parlak yumrulu çalılar, sarı
    yıldızlar; `position: fixed`, içeriğin arkasında). Kartlar kenarlıksız 26 px köşe; sekmeli seçici (`.seg`) hap
    şeklinde, seçili olan beyaz + kırmızı yazı; bütün `.pill` düğmeler parlak; büyük başlat düğmesi kırmızı degrade +
    iki yanında sarı ışık çizgileri (`.page__cta--spark`) + oynat simgesi; avatarlarda camsı parlama.
    Kurulumda `TopBar art=` ile sağ üstte kaplan + oyunun resmi; lobide kurallar kartının köşesinden kaplan bakar;
    Sinema Bilmecesi / Sıra Sende turunda sağ altta oyunun resmi (`.game__deco`). Yatay telefonda kaplanlar ve yan çalı gizli.
  - **Fon müziği kayıtlı parçalar (25 Eki 2026):** `src/lib/music.ts` artık `public/music/*.m4a` çalıyor (Pixabay,
    lisans `public/music/LISANS.txt`): lobi caz, oyun "Quiz Master", gerilim döngüsü, puanlar lo-fi, Sinema Bilmecesi kara film
    cazı (`film` ruh hâli). Hepsi **YouTube Content ID'ye kayıtsız** seçildi — influencer ekran kaydı paylaşınca telif
    uyarısı çıkmasın; yeni parça eklenirse sayfada "Content ID Registered" olmamalı. Parçalar belleğe açılmaz (decode
    ~35 MB/parça), `<audio>` akışı Web Audio müzik kanalına bağlanır, döngü iki kopya arasında 2,5 sn çapraz geçişle.
    Harf rulosu ve dosya yüklenemezse yedek: eski sentez. Kesme/çevirme: afconvert → WAV, Python `wave` ile kes, afconvert AAC 80 kbps.
  - **Sinema Bilmecesi sinema teması (25 Eki 2026, influencer reklamı için):** `game--cinema` (Game.tsx; Sinema Bilmecesi lobi/tur/final),
    zemin `components/CinemaScene.tsx` (spotlar, perde, toz, film greni), stiller `src/styles/cinema.css` (koyu cam kartlar,
    altın vurgular, Bebas Neue başlıklar — `@fontsource/bebas-neue`). Her film eski sinema geri sayımıyla (`FilmLeader`) ve
    klaketle (`sfx.clap`) başlar; açıklama altın çerçeveli film kartı; final "Yılın Sinemaseveri" + altın konfeti +
    **skor kartı** (`src/lib/storyCard.ts`, 1080×1920 hikâye görseli; uygulamada `@capacitor/filesystem` ile önbelleğe
    yazılıp sistem paylaşımıyla gönderilir). Siluet/afiş yok (kullanıcı istemedi; afiş telifli).
  - **Ad değişikliği (25 Eki 2026):** "Film Avı" → **"Sinema Bilmecesi"** (kullanıcı seçti; kod içi kimlikler `film`
    olarak kaldı). Final ödülü "Yılın Sinemaseveri". Mağaza görselleri ve Play metni bir sonraki sürümde yenilenmeli
    (`store-panorama.mts` metni güncellendi, görseller yeniden üretilmedi). Film listesi 119 film (59 yerli + 60 yabancı);
    `film.test.ts` konu cümlesinde adın ilk kelimesi geçmesin diye denetler — yeni film eklerken çalıştır.
  - **Görselli paylaşım (25 Eki 2026):** `src/lib/shareCard.ts` — davet kartı (lobi "Arkadaşlarını çağır": oda kodu harf
    kutularında) ve sonuç kartı (üç final ekranında "Paylaş": avatarlı kürsü), 1080×1350; Sinema Bilmecesi kartları sinema
    temasında. Metne Play bağlantısı eklenir (`PLAY_URL`). Uygulamada `@capacitor/filesystem` ile önbelleğe yazılır.
  - **Zemin çalıları:** alt kenarda kesintisiz şerit (`Hedge`, `slice` ile kırpılır) + iki köşe kümesi; bulutlar ekranın
    içinde. Eskiden köşe kümelerinin arası boş, yan çalının tabanı düz kesik görünüyordu.
  - **CSS tuzağı:** `@property` ile kayıtlı özel değişken adları global; `--a` gibi kısa ad kaydetme (ana sayfa kartları
    `--a`'yı renk olarak kullanıyor, açı olarak kaydedince "Oyna" yazıları kayboldu).
  - **"Harfi oyuncular durdursun"** varsayılan kapalı; profil kaydı sürüm 2'de eski "açık" değer bir kez kapatıldı.
  - **Sesler (25 Eki 2026):** `sfx.tap` (neredeyse her düğme / ekran geçişi) cam zil notasıydı, "oyuncak gibi"
    bulundu → yumuşak, kısa, sıcak bir tık; `sfx.pop` (başlat/onay) yumuşak iki notalı çan; `sfx.whoosh` daha havalı.
    Beğenilmezse geri almak için bu commit'i `git revert` etmek yeter.
  - **Ekran düzeni:** `src/styles/app.css` + `game.css` telefon dikey; `tablet.css` 700 px'ten geniş ekranlar;
    `landscape.css` yatay tutulan telefonlar (`orientation: landscape` ve yükseklik ≤ 560 px) — yatayda telefon
    700 px'i geçtiği için tablet ölçüleri devreye giriyor, bu dosya onları küçültüp yazı defteri ile düğmeleri
    yan yana koyar (ekranlar: ana sayfa, lobi, kurulum, harf çevirme, yazma, Sıra Sende, değerlendirme, puanlar).
  - **Yazma defteri (performans, 20 Eki 2026):** biten çizgilerin `Path2D`'i `InkPad` içinde saklanır —
    her karede baştan hesaplanırsa yazdıkça ekran takılıyor. `.inkpad` `contain: paint`, tuval kendi
    katmanında (`translateZ(0)`): çizgi eklenince kart, 30 px'lik gölgesi ve zemin yeniden boyanmaz.
    Gerçek cihazdaki "ekran titriyor, beyaz sayfa gelip gidiyor" şikâyetinin sebebi buydu.
  - **Konfeti (beyaz ekran, 21 Eki 2026):** `src/lib/confetti.ts` üzerinden, Worker'sız (`useWorker: false`).
    canvas-confetti'nin varsayılanı (Worker + OffscreenCanvas) vivo Y19s'te (Unisoc, Mali-G57) uygulama arka plana
    gidip gelince (ör. reklama dokunup dönünce) GPU'suz çizime düşüyor, WebView tuvali koyamıyor
    (logcat: `CanvasResourceRasterGmbMappable ... 384x857`) ve konfeti sürdükçe bütün ekran bembeyaz kalıyordu
    ("Harfimiz" anında ~4 sn). Doğrudan `canvas-confetti` import etme.
  - **Kalem sesi:** `sfx.scribble` sonsuz döngülü bir hışırtı; hareket 200 ms kesilince kendiliğinden susar,
    defter kapanınca da kapatılır (yoksa parmak ekrandayken ekran değişince ses takılı kalıyordu).
  - **Açılış ekranı süresi ve beyaz şerit (25 Eki 2026):** `MainActivity` → `SplashScreen.installSplashScreen` ile logo
    en az 1,6 sn kalır ve 320 ms'de solar (eskiden ilk karede hemen geçiyordu). Açılıştan sonra üstte bir an beyaz şerit
    görünüyordu: durum çubuğu ancak pencere gelince gizleniyor, tema zemini açık renkti. `AppTheme.NoActionBar` artık
    `windowFullscreen` + nane zemin (`res/values/app_colors.xml` → `app_bg`). Emülatör: `sayio_phone` (Android 16).
    XML yorumlarında `--` yazılamaz (derleme hatası).
  - **Açılış simgesi (Android 12+):** sistem `windowSplashScreenAnimatedIcon` çizer, yaklaşık 290 dp.
    Ana ekran ikonu (en büyüğü 192 piksel) büyütülünce bulanık kalıyordu; bunun için
    `res/drawable-*/splash_icon.png` ayrıca üretildi (`assets/icon-foreground.png` → 288-1152 piksel).
    Simge değişirse bu dosyalar da yenilenmeli.
  - `src/online/`: ortak arayüz (transport.ts), botlu oyun (local.ts), Firebase (firebase.ts, config.ts); kurallar `database.rules.json`
  - **Çevrimiçi odada bot (22 Eki 2026):** ev sahibi lobide "Bot ekle" ile masayı doldurur (üç oyunda da;
    arkadaş azken iki kişi zevksiz oluyordu — kullanıcı isteği). Bot kimlikleri **`bot-0`…`bot-8`**;
    kurallar bot düğümlerini bu **önekten** tanır ve odadaki bir oyuncunun onlar adına yazmasına izin verir
    (`players/bot-*` kurma, `answers`/`votes`/`ready`; Sıra Sende ile Sinema Bilmecesi zaten `ctl` içinde). İzin
    **ev sahibine değil odadakilere** verildi: `ctl` de zaten odadakilere açık, yani güven sınırı aynı;
    ayrıca ev sahibi düşünce yöneten değişiyor, kural bunu hesaplayamaz. Botları **yalnızca yöneten cihaz**
    oynatır (`src/store/useGame.ts` → `attach`: `hasBots(s) && actingHost(s) === t.me`), yoksa iki cihaz
    aynı botu oynatır. `Transport.peek()` bunun için eklendi (botlar ara durumu ağa gitmeden okur).
    Son **insan** çıkınca oda silinir: `firebase.ts` → `leave()` botları "başka oyuncu" saymaz.
  - **Arkadaşlar (21 Eki 2026):** giriş ekranı yok — her cihaz zaten anonim bir Firebase hesabı; oyuncular
    birbirini **6 haneli arkadaş kodu** ile bulur (oda kodu 5 hane, karışmasın diye). Veri katmanı
    `src/online/friends.ts`, durum `src/store/useFriends.ts`, ekran `src/pages/Friends.tsx` (`/arkadaslar`),
    ana sayfadaki giriş başlıktaki rozetli düğme. Yapı: `/{ROOT}/users/{uid}/pub` (açık kart: kod, ad,
    avatar, renk, `on`, `seen`, `room`), `.../f/{uid}` (benim eklediklerim), `.../in/{uid}` (gelen istek /
    "kabul etti"), `.../inv/{uid}` (oyun daveti), `/{ROOT}/codes/{KOD}` → uid.
    **Arkadaşlık karşılıklıdır:** iki tarafın da `f` listesinde diğeri varsa arkadaşsınız. Kurallar
    `f/{uid}` için tek çocuk okuma izni verir ("beni ekledin mi" sorulabilir, listenin tamamı okunamaz).
    Daveti yetkilendiren **alıcının** listesidir: yalnız alıcının eklediği biri onu odaya çağırabilir.
    Çevrimiçi durumu `onDisconnect` ile yazılır, uygulama arka plana geçince de `on: false` olur.
  - **Kural denemesi:** `npm run emulators` + `npm run test:rules` (`scripts/kural-deneme.mjs`, 48 deneme,
    üç oyuncu; arkadaşlar ve oda botları; izin verilmesi *ve* reddedilmesi gerekenleri sınar). İki tuzak: (1) kural dosyasında
    **yorum satırı olamaz** (`"//"` çocuk adı sayılır, emülatör dosyayı hiç yüklemez); (2) veritabanı
    emülatörü tek proje kipinde **`<projectId>-default-rtdb`** ad alanını kullanır — başka ad alanına giden
    istek "sahip" sayılıp **kuralları atlar**. `src/online/firebase.ts`'teki emülatör adresi bu yüzden
    düzeltildi; eskiden yerel denemede kurallar hiç çalışmıyordu.
  - `src/lib/ink.ts`: el yazısı tanıma — Android'de `android/.../InkPlugin.java` (ML Kit Digital Ink, Türkçe model),
    iOS'ta `ios/App/App/InkVision.swift` + `InkPlugin.swift` (Apple Vision, cihazda, internetsiz; denemek: `npm run ios:ink`),
    web'de Google giriş servisi
- **Firebase:** proje `isimo-1ce98` (Realtime Database europe-west1, anonim giriş). `src/online/config.ts` → `FIREBASE_CONFIG` null iken çevrimiçi oyun kapalı (botlu oyun çalışır).
- **Reklam:** Google AdMob (`src/lib/ads.ts`); kimlikler platform başına `src/lib/adsConfig.ts` içinde
  (Android ve iOS'un AdMob'da ayrı uygulaması var; iOS uygulama kimliği `Info.plist` → `GADApplicationIdentifier`
  ile aynı olmalı, bu anahtar boşsa uygulama açılışta çöker). İki platformda da: ana sayfa ve lobi altında şerit, oyun bitince tam ekran
  (3 dk'da en fazla bir). Oyun sırasında reklam yok. Şerit bir kez kurulur, ekran değişince yalnızca gizlenir/yeniden
  gösterilir (`removeBanner` yok): her geçişte kurup yok etmek gerçek telefonda lobiden oyuna geçerken ekranı ~3 sn
  bembeyaz bırakıyordu (21 Eki 2026, kullanıcı videosu; emülatörde çıkmıyor). Yeni şerit isteğini yalnız ana sayfa yapar. Kimlikler `src/lib/adsConfig.ts` + `strings.xml` (admob_app_id);
  gerçek kimlikler (AdMob yayıncı 8025731390860952). Kurulum ve güncel durum: `store/admob-adimlar.md`. **Açık iki iş (20 Eki 2026):** (1) AdMob uygulaması Play mağaza kaydına bağlı değil → "Sınırlı reklam sunumu". 21 Eki'de "uygulama oluştur" bağlantısıyla Play'e bağlı **ikinci** bir AdMob uygulaması açıldı ("İsim Şehir Online Kelime Oyunu", …~7906996822); Play kaydı ona bağlandığı için eski kayda (…~5747527917) "Mağaza ekle" artık yapılamıyor ("Eklendi"). Çözüm: 1.0.3'ten itibaren Android yeni kaydı kullanıyor (birimler "Alt şerit" /9174267458, "Oyun sonu" /6319864241); eski kayıt boşta. Sınır, Google yeni kaydı onaylayınca kalkar. (2) GDPR onay penceresi taslak olarak hazır, yayınlanmayı bekliyor. app-ads.txt yayında: geliştirici sitesinin kökü için `ahmetercikan.github.io` deposu açıldı (Çizio ve Sayio'yu da kapsar). Hedef kitle: 13+ (Play: 13-15, 16-17, 18+; içerik derecelendirmesi Herkes, mağazada herkese görünür); yaş sorusu yok; reklam sınıfı en geniş (MA), yalnızca Google'ın yasakladıkları gelmez.
- **Bildirimler:** `src/lib/notify.ts` (`@capacitor/local-notifications`). Bunlar **yerel** bildirimdir:
  uygulama açıkken (ya da yeni arka plana atılmışken) Firebase'den gelen değişikliği görüp bildirim düşürür.
  **Uygulama tamamen kapalıyken bildirim gelmez** — onun için Cloud Functions + Blaze paketi (kredi kartı)
  gerekirdi, kullanıcı bilerek istemedi. İzin uygulama açılışında değil, oyuncu **Arkadaşlar ekranına
  girince** istenir (bağlamsız izin isteğini Google ve Apple hoş karşılamıyor). Ayarlar: profil →
  `notifyInvite` (davet + istek, varsayılan açık), `notifyOnline` (arkadaş çevrimiçi, varsayılan **kapalı** —
  sık gelir, rahatsız eder). Eklenti manifeste `POST_NOTIFICATIONS`'ı kendisi ekler; ileri tarihli bildirim
  için eklediği `SCHEDULE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED` ve `WAKE_LOCK` ise
  `AndroidManifest.xml`'de `tools:node="remove"` ile çıkarılır (anlık bildirimde gerekmiyor, Play
  tam zamanlı alarmı hassas izin sayıyor). Zamanlanmış bildirim eklenirse o satırlar kaldırılmalı.
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
  **aynı yükleme anahtarıyla** imzalanmak zorunda: Çizio ile ortak `cizio-upload.jks`, takma ad `cizio`.
  Artık bu Mac'te: `~/.cizio-keys/cizio-upload.jks`; parola ve yol `android/keystore.properties` içinde
  (örneği: `android/keystore.properties.example`, git'e girmez). İkisi yerinde, `npm run android:aab` doğrudan
  imzalı paket üretiyor. Anahtar kaybolursa Play Console → Uygulama imzalama → "Sıfırlama talep edin"
  (Google onayı birkaç iş günü). **Paketi Play'e yüklerken:** 25 MB tarayıcı köprüsünün 10 MB sınırını aşıyor,
  AAB'yi kullanıcı sürükleyip bırakmalı (`open -R` ile Finder'da göster); gerisi tarayıcıdan yapılabiliyor.
- **Play durumu (20 Eki 2026):** üretimde **1 (1.0.0)** canlı (tam kullanıma sunuldu, 5 ülke). **2 (1.0.2)**
  aynı gün yüklendi ve incelemeye gönderildi (tam kullanıma sunma; Google incelemesi genelde 7 güne kadar).
  **3 (1.0.3)** 21 Eki'de derlendi (`store/release/isim-sehir-1.0.3.aab`, beyaz ekran düzeltmesi); aynı gün Play'e yüklendi, tam kullanıma sunma olarak incelemeye gönderildi (1.0.2'nin yerini alır); incelemeden geçip üretime çıktı.
  **4 (1.0.4)** 21 Eki'de yüklendi, incelemeden geçti ve üretimde yayında (tam kullanıma sunma; `store/release/isim-sehir-1.0.4.aab`;
  konfeti beyaz ekranı + takılan kalem sesi). Windows'ta `npm run android:aab:win` gradle adımında `gradlew.bat`'ı bulamadı;
  `android` klasöründe `.\gradlew.bat bundleRelease` doğrudan çalıştırıldı (JAVA_HOME = `~/.jdks/jdk-21.0.12.1+1`).
  **5 (1.0.5)** Mac'te derlenip incelemeye gönderildi, sonra **geri çekildi**: 1.0.4'ün düzeltmeleri bu bilgisayara
  çekilmemişti, paket onları geri alıyordu. Yerine **6 (1.0.6)** çıkarıldı (arkadaşlar + bildirimler + 14.057 kelimelik
  havuz + 1.0.4'ün düzeltmeleri), aynı akşam incelemeye gönderildi. 1.0.5 dakikalar içinde incelemeden geçip
  yayına çıkmıştı — inceleme hızlı bittiği için yanlış paketi geri çekmeye vakit kalmayabilir. **Ders: paket derlemeden önce `git pull`** — başka bilgisayardan yapılan yayınlar
  burada görünmüyor; Play'deki sürüm kodunu da Paket Gezgini'nden doğrula, depoya güvenme.
  **7 (1.0.7)** 22 Eki'de derlendi (`store/release/isim-sehir-1.0.7.aab`): Sinema Bilmecesi bölümü, çevrimiçi odaya bot
  ekleme, Sinema Bilmecesi defterinin büyümesi, arkadaş düğmesinin sağa alınması. Bu paketteki çevrimiçi botlar için
  **veritabanı kuralları 22 Eki'de yayınlandı** (bot düğümlerine izin); kurallar yayınlanmadan "Bot ekle" çalışmaz.
  22 Eki 20:52'de incelemeye gönderildi; **mağaza metni de aynı incelemeye katıldı** (kısa ve tam açıklama
  artık üç oyunu da anlatıyor). Mağaza metni ile paketi aynı anda göndermek tek inceleme demek.
  **8 (1.0.8)** 24 Eki'de derlendi (`store/release/isim-sehir-1.0.8.aab`, yeni ana sayfa); 1.0.7 o sırada üretimdeydi.
  Paket kullanıcı tarafından sürüklendi, sürüm notları + yeni geçişli mağaza görselleri (8 telefon, 8 tablet) ile **tek incelemeye**
  gönderildi (tam kullanıma sunma), onaylanıp yayına çıktı. iOS bu sürüme dahil değil (iOS hâlâ 1.0.1).
  **9 (1.0.9)** 25 Eki'de derlendi (`store/release/isim-sehir-1.0.9.aab`: yeni iç ekranlar, sesler, 3B ikon);
  paket yine kullanıcı tarafından sürüklendi; mağaza simgesi (yeni 3B ikon, YZ etiketi yok) + yeni ekranlarla çekilmiş
  8+8 geçişli görsel (YZ etiketli) ile birlikte tek incelemeye gönderildi. Kitaplıkta ad çakışmasın diye görseller
  `v9-phone-0N.png` / `v9-tablet-0N.png`, ikon `isim-sehir-ikon-3b.png` adıyla yüklendi; sırayla seçerken
  seçimler arasında ~1 sn beklemek gerekiyor, yoksa sıra karışıyor. Aynı gün yeni öne çıkan görsel
  (`store/promo/play-feature.png` = `store/feature-graphic.png`, `store-panorama.mts feature`; YZ etiketli) de eklendi;
  inceleme sürerken yeni değişiklik göndermek incelemeyi **baştan başlatıyor** (Play uyarıyor) — kullanıcı onayladı.
  Artık mağazada eski tasarımdan bir şey kalmadı (iOS hariç).
  **Sıradaki iş — 1.0.10:** büyük Android ikonu (sıkı yerleşim) + açılış logosu süresi + beyaz şerit düzeltmesi
  `main`de hazır ama paketlenmedi. Kullanıcı kararı (25 Eki): 1.0.9 incelemeden çıkıp yayına girsin, **sonra** 1.0.10
  derlenip yüklensin (inceleme sürerken göndermek incelemeyi baştan başlatıyor).
  Geliştirici 6262296307859358769, uygulama 4972498643282459948. Adımlar: `store/play-console-adimlar.md`.
