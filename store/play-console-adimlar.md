# Play Console'a yükleme — adım adım (kopyala-yapıştır cevaplarla)

Dosyalar `store/` klasöründe. Yüklenecek paket: `store/release/isim-sehir-1.0.0.aab`
(İmza: Çizio ile aynı yükleme anahtarı — `C:\Users\ahmet.ercikan\.cizio-keys\cizio-upload.jks`.
**Bu dosya Windows bilgisayarda; Mac'te yok.** Mac'te imzalı paket üretmek için aşağıdaki "Yeni sürüm çıkarmak" bölümüne bak.)

## 1) Uygulama oluştur
Play Console → **Uygulama oluştur**
- Uygulama adı: `İsim Şehir Online Kelime Oyunu`
- Varsayılan dil: **Türkçe (tr-TR)**
- Uygulama / Oyun: **Oyun**
- Ücretsiz / Ücretli: **Ücretsiz**
- Beyanları işaretle → **Uygulama oluştur**

## 2) Kontrol paneli → "Uygulamanızı kurun"

### Gizlilik politikası
`https://ahmetercikan.github.io/isimo/gizlilik.html`

### Uygulama erişimi
**Tüm işlevler özel erişim olmadan kullanılabilir** (hesap/giriş yok).

### Reklamlar
**Evet, uygulamamda reklam var.** (Google AdMob; mağazada "Reklam içerir" etiketi görünür.)

### İçerik derecelendirmesi (IARC anketi)
- E-posta: kendi adresiniz · Kategori: **Oyun**
- Şiddet, korku, cinsellik, küfür, uyuşturucu, kumar: **Hayır**
- "Kullanıcılar birbiriyle etkileşime giriyor ya da içerik paylaşıyor mu?" → **Evet** (çevrimiçi oyunda takma ad ve oyun cevapları görünür; sohbet yok)
- "Kullanıcının konumunu paylaşıyor mu?" → **Hayır** · "Dijital ürün satın alma" → **Hayır**
- Beklenen sonuç: PEGI 3 / Herkes (+ "Kullanıcılar Etkileşimde Bulunur" notu)

### Hedef kitle ve içerik
- Hedef yaş grupları: **13-15, 16-17, 18 ve üzeri**
- Not: Bu ayar uygulamayı kimseden gizlemez. Mağazada kimin görebileceğini **içerik derecelendirmesi** belirler
  (PEGI 3 / Herkes: herkes görür ve indirebilir; çocuklar dahil).
- "Uygulamanız çocukların ilgisini çekebilir mi?" sorusu gelirse: **Hayır**; açıklama olarak:
  `Her yaştan oyuncunun oynayabileceği, gençlere ve yetişkinlere yönelik bir kelime ve parti oyunudur; çevrimiçi oyun ve reklam içerir.`
- 13 yaş altını seçmeyin: seçilirse "Aileler" politikası devreye girer (yaş sorusu, çocuklara özel reklam, daha uzun inceleme).

### Veri güvenliği
"Uygulamanız kullanıcı verisi topluyor veya paylaşıyor mu?" → **Evet**
- Veriler aktarım sırasında şifreleniyor mu? → **Evet**
- Kullanıcılar verilerinin silinmesini isteyebilir mi? → **Evet** (geliştirici e-postası; oda, son oyuncu çıkınca silinir)

Toplanan veriler (Google AdMob'un resmi beyan rehberine göre reklam satırları "paylaşılıyor" işaretlenir):
| Kategori | Tür | Toplanıyor | Paylaşılıyor | Amaç | İsteğe bağlı |
|---|---|---|---|---|---|
| Kişisel bilgiler | **Ad** (takma ad) | Evet | Hayır | Uygulama işlevselliği | Evet (yalnız çevrimiçi oyun) |
| Uygulama etkinliği | **Kullanıcı tarafından oluşturulan diğer içerik** (cevaplar, el yazısı) | Evet | Hayır | Uygulama işlevselliği | Evet |
| Uygulama etkinliği | **Uygulama etkileşimleri** | Evet | Evet | Reklam veya pazarlama, Analiz | Hayır |
| Konum | **Yaklaşık konum** (IP'den) | Evet | Evet | Reklam veya pazarlama, Sahtekârlığı önleme | Hayır |
| Cihaz veya diğer kimlikler | **Cihaz veya diğer kimlikler** (reklam kimliği, Firebase anonim kimliği) | Evet | Evet | Reklam veya pazarlama, Uygulama işlevselliği, Sahtekârlığı önleme | Hayır |
| Uygulama bilgileri ve performansı | **Kilitlenme günlükleri**, **Tanılama** (AdMob, ML Kit) | Evet | Evet | Analiz | Hayır |

### Haber / COVID-19 / Devlet / Finans / Sağlık
Hepsi **Hayır / geçerli değil**.

## 3) Mağaza girişi (Büyüme → Mağaza varlığı → Ana mağaza girişi)
- Uygulama adı, kısa açıklama, tam açıklama: `store/listing-tr.md` (karakter sınırları kontrol edildi)
- Uygulama simgesi (512×512): `store/icon-512.png`
- Öne çıkan görsel (1024×500): `store/feature-graphic.png`
- Telefon ekran görüntüleri (8 adet, 1080×1920): `store/promo/phone-01.png` … `phone-08.png` (bu sırayla)
- 7 inç tablet ve 10 inç tablet (8 adet, 1920×1200): `store/promo/tablet-01.png` … `tablet-08.png` (ikisine de aynıları)
- Mağaza ayarları → Uygulama kategorisi: **Oyun → Kelime**; etiketler: Kelime, Çok oyunculu, Parti, Aile, Gündelik
- İletişim e-postası: kendi adresiniz · Web sitesi: `https://ahmetercikan.github.io/isimo/`

## 4) Sürüm yükleme
Test et ve yayınla → **Kapalı test** (önerilir) ya da **Üretim** → Yeni sürüm oluştur
- Play Uygulama İmzalama: **Google tarafından oluşturulan anahtar** (varsayılan) ile devam
- Paket: `store/release/isim-sehir-1.0.0.aab` dosyasını sürükleyin
- Sürüm notları: `store/listing-tr.md` → "Sürüm notları"
- Kaydet → İncele → Yayına başla

Not: Kişisel geliştirici hesaplarında yeni uygulama için üretimden önce **kapalı test: en az 12 test kullanıcısı, 14 gün**
şartı olabilir. Böyle bir uyarı görürseniz kapalı test kanalına yükleyip arkadaş/aile e-postalarını test listesine ekleyin —
İsim Şehir zaten arkadaşlarla oynanan bir oyun, test için ideal 🙂

## 5) Ülkeler
Sürüm → Ülkeler/bölgeler → **Türkiye** (isteğe bağlı: Kuzey Kıbrıs, Azerbaycan, Almanya, Hollanda gibi Türkçe konuşulan yerler)

## 6) Olası uyarılar
- "Hedef API düzeyi": targetSdk 36, sorun yok.
- "Firebase / ML Kit üçüncü taraf SDK": veri güvenliği bölümünde beyan edildi.

## 7) Yeni sürüm çıkarmak

### Mağazada ne var (20 Eki 2026)
- Üretim kanalında **1 (1.0.0)**, tam kullanıma sunuldu, 5 ülke. Play'e bugüne kadar yüklenen tek paket bu.
- Sıradaki yükleme: **sürüm kodu 2, sürüm adı 1.0.2** (`package.json`, `android/app/build.gradle` → hazır).
- Play Console'daki uygulama adresi:
  `https://play.google.com/console/u/0/developers/6262296307859358769/app/4972498643282459948/tracks/production`

### Adımlar
1. `android/app/build.gradle` içinde `versionCode` +1, `versionName` güncelle (`package.json` → `version` de).
2. `npm run android:aab` → paket `android/app/build/outputs/bundle/release/app-release.aab`.
   (Windows'ta `npm run android:aab:win`.)
3. Play Console → Test et ve yayınla → **Üretim** → **Yeni sürüm oluştur** → paketi sürükle →
   sürüm notlarını `store/listing-tr.md` → "Sürüm notları" bölümünden yapıştır → Kaydet → İncele → **Yayına başla**.
   Google incelemesi birkaç saat ile birkaç gün arası sürer.
4. Mağaza görselleri değişecekse: `npm run dev` açıkken `npx tsx scripts/store-shots.mts phone` ve `tablet`,
   sonra `npx tsx scripts/store-promo.mts`.

### Mac'te imzalı paket üretmek için gereken iki şey
Bu Mac'te şu an ikisi de yok, bu yüzden `npm run android:aab` çalışmaz:
1. **Java (JDK 21).** Android Studio kurulursa içinde gelir; ayrıca kurulacaksa Temurin 21 yeterli.
2. **Yükleme anahtarı.** Play Uygulama İmzalama açık: Google mağaza anahtarını kendi tutuyor ama yüklediğimiz
   paket, ilk paketi imzalayan **aynı yükleme anahtarıyla** imzalanmak zorunda. O anahtar Windows bilgisayarda:
   `C:\Users\ahmet.ercikan\.cizio-keys\cizio-upload.jks`.
   Dosyayı bu Mac'e kopyalayıp yanına `android/keystore.properties` yazılır (git'e girmez):
   ```
   storeFile=/Users/ahmetmesutercikan/.cizio-keys/cizio-upload.jks
   storePassword=...
   keyAlias=...
   keyPassword=...
   ```
   Anahtar kaybolursa Play Console → Test et ve yayınla → Uygulama bütünlüğü → **yükleme anahtarı sıfırlama**
   istenebilir; Google onayı birkaç iş günü sürer.

### Bekleyen uyarı
Üretim sürüm kontrol panelinde "uçtan uca ekran" (edge-to-edge) uyarısı var: Android 15+ cihazlarda
durum çubuğu/gezinme çubuğu altındaki alan. Yayını engellemiyor, sonraki sürümde ele alınacak.
