# Play Console'a yükleme — adım adım (kopyala-yapıştır cevaplarla)

Dosyalar `store/` klasöründe. Yüklenecek paket: `store/release/isim-sehir-1.0.0.aab`
(İmza: Çizio ile aynı yükleme anahtarı — `C:\Users\ahmet.ercikan\.cizio-keys\cizio-upload.jks`.)

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
**Hayır, uygulamamda reklam yok.**

### İçerik derecelendirmesi (IARC anketi)
- E-posta: kendi adresiniz · Kategori: **Oyun**
- Şiddet, korku, cinsellik, küfür, uyuşturucu, kumar: **Hayır**
- "Kullanıcılar birbiriyle etkileşime giriyor ya da içerik paylaşıyor mu?" → **Evet** (çevrimiçi oyunda takma ad ve oyun cevapları görünür; sohbet yok)
- "Kullanıcının konumunu paylaşıyor mu?" → **Hayır** · "Dijital ürün satın alma" → **Hayır**
- Beklenen sonuç: PEGI 3 / Herkes (+ "Kullanıcılar Etkileşimde Bulunur" notu)

### Hedef kitle ve içerik
- Hedef yaş grupları: **13-15, 16-17, 18 ve üzeri**
- "Uygulamanız çocukların ilgisini çekebilir mi?" sorusu gelirse: **Hayır** demek yerine dürüstçe değerlendirin; Google
  renkli tasarımı çocuklara hitap ediyor sayarsa "Aileler" politikası istenir. O durumda bana haber verin, birlikte ayarlarız.

### Veri güvenliği
"Uygulamanız kullanıcı verisi topluyor veya paylaşıyor mu?" → **Evet**
- Veriler aktarım sırasında şifreleniyor mu? → **Evet**
- Kullanıcılar verilerinin silinmesini isteyebilir mi? → **Evet** (geliştirici e-postası; oda, son oyuncu çıkınca silinir)

Toplanan veri türleri (hepsi **Toplanıyor**, **Paylaşılmıyor**, amaç: **Uygulama işlevselliği**, isteğe bağlı: **Evet** — çevrimiçi oyun isteğe bağlı):
| Kategori | Tür | Not |
|---|---|---|
| Kişisel bilgiler | **Ad** | oyuncunun seçtiği takma ad |
| Uygulama etkinliği | **Kullanıcı tarafından oluşturulan diğer içerik** | oyun cevapları ve el yazısı çizgileri |
| Cihaz veya diğer kimlikler | **Cihaz veya diğer kimlikler** | Firebase anonim oyuncu kimliği |
| Uygulama bilgileri ve performansı | **Tanılama** | Google ML Kit (el yazısı) anonim kullanım ölçümleri; amaç: **Analiz** |

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
1. `android/app/build.gradle` içinde `versionCode` +1, `versionName` güncelle (`package.json` → `version` de)
2. `npm run android:aab` → `android/app/build/outputs/bundle/release/app-release.aab` dosyasını yükle
3. Mağaza görselleri: `npm run dev` açıkken `npx tsx scripts/store-shots.mts phone` ve `tablet`, sonra `npx tsx scripts/store-promo.mts`
