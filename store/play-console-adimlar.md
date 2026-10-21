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
- 20 Eki: **sürüm kodu 2 (1.0.2)** yüklendi, incelemeye gönderildi.
- 21 Eki: **sürüm kodu 3 (1.0.3)** `store/release/isim-sehir-1.0.3.aab` yüklendi, incelemeye gönderildi (Windows'ta imzalandı); üretime çıktı.
- 21 Eki: **sürüm kodu 4 (1.0.4)** `store/release/isim-sehir-1.0.4.aab` yüklendi, incelemeden geçti, üretimde yayında.
- 21 Eki: **sürüm kodu 5 (1.0.5)** Mac'te derlendi ve incelemeye gönderildi, sonra **geri çekildi**. Sebep: 1.0.4
  Windows'tan yayınlanmıştı, o commit'ler bu bilgisayara çekilmemişti; paket 1.0.4'ün konfeti/kalem sesi
  düzeltmelerini geri alıyordu. **Derlemeden önce `git pull` yap** ve Play'deki sürüm kodunu Paket Gezgini'nden
  doğrula (Test et ve yayınla → Paket Gezgini → Tüm uygulama paketleri) — depodaki numara eskimiş olabilir.
- 21 Eki 23:50: **sürüm kodu 6 (1.0.6)** `store/release/isim-sehir-1.0.6.aab` yüklendi ve incelemeye gönderildi
  (tam kullanıma sunma) — arkadaşlar, bildirimler, 14.057 kelimelik havuz ve 1.0.4'ün düzeltmeleri bir arada.
  Sıradaki yükleme: sürüm kodu 7.
- **Not:** 1.0.5 incelemeden dakikalar içinde geçti (23:32'de yayına çıktı). İnceleme bazen çok hızlı
  bitiyor, yani yanlış bir paket gönderildiğinde geri çekmeye vakit kalmayabilir.
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

### Mac'te derleme ortamı (20 Eki 2026'da kuruldu)
- **Java:** Temurin JDK 21.0.12.1 → `~/Library/Java/JavaVirtualMachines/jdk-21.0.12.1+1`.
  `~/.zshrc` içinde `JAVA_HOME` ve `ANDROID_HOME`, Gradle için `~/.gradle/gradle.properties` → `org.gradle.java.home`.
- **Android SDK:** `~/Library/Android/sdk` (platform 36, build-tools 36) zaten kuruluydu.
- `./gradlew bundleRelease` baştan sona denendi: 1 dk 22 sn'de 25 MB'lık paket üretti. Yani derleme zinciri çalışıyor.
  (Deneme geçici bir anahtarla yapıldı, çıkan paket ve geçici anahtar silindi — o paket mağazaya yüklenemez.)

### Yükleme anahtarı (çözüldü, 20 Eki 2026)
Play Uygulama İmzalama açık: mağaza anahtarını Google saklıyor, bizim yüklediğimiz paket ise ilk paketi
imzalayan **aynı yükleme anahtarıyla** imzalanmak zorunda. O anahtar Çizio ile ortak. Windows'tan getirildi,
artık bu Mac'te: `~/.cizio-keys/cizio-upload.jks` (takma ad `cizio`, sertifika sahibi `CN=Cizio, O=Ahmet Ercikan, C=TR`,
SHA-256 `2E:93:71:35:A5:9F:84:47:E2:9A:91:6B:06:B3:52:40:D0:B1:1F:A4:BD:CD:10:61:3B:97:4A:A5:BA:A3:6A:E1`).
Parola ve yol `android/keystore.properties` içinde (git'e girmez; örneği `.example` dosyasında).
Bu ikisi yerinde olduğu sürece `npm run android:aab` imzalı paketi üretir, başka hazırlık gerekmez.

Anahtar tamamen kaybolursa: Play Console → Test et ve yayınla → Uygulama imzalama → **Sıfırlama talep edin**.
Yeni anahtar üretip sertifikasını yüklersin; Google'ın onayı birkaç iş günü sürer ve o süre boyunca yeni sürüm
yayınlanamaz. Bu yüzden anahtarı yedekli tut.

### Paketi Play'e yüklerken (önemli)
Paket 25 MB; tarayıcı otomasyonunun dosya köprüsünde 10 MB sınırı var, yani AAB oradan geçmiyor. Yerel bir
HTTP sunucusundan tarayıcıya çektirmek de işe yaramadı (Chrome yerel ağ izni beklemesinde takılıyor).
Pratik yol: `open -R <aab yolu>` ile dosyayı Finder'da göster, kullanıcı onu Play Console'daki bırakma
kutusuna sürüklesin. Gerisi (sürüm notları, önizleme, incelemeye gönderme) tarayıcıdan yapılabiliyor.

### Bekleyen uyarı
Üretim sürüm kontrol panelinde "uçtan uca ekran" (edge-to-edge) uyarısı var: Android 15+ cihazlarda
durum çubuğu/gezinme çubuğu altındaki alan. Yayını engellemiyor, sonraki sürümde ele alınacak.
