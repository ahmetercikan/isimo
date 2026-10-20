# AdMob (reklam) kurulumu — adım adım

Reklam altyapısı hazır ve **gerçek kimliklerle** çalışıyor (yayıncı `pub-8025731390860952`).
Aşağıdaki 1-5. adımlar tamamlandı; güncel durum ve kalan işler en altta **"Durum (20 Eki 2026)"**
başlığında. Kimlikler `src/lib/adsConfig.ts` + `android/app/src/main/res/values/strings.xml`
(`admob_app_id`) + `ios/App/App/Info.plist` (`GADApplicationIdentifier`) içinde.

## Reklamlar nerede çıkıyor?
| Yer | Tür | Not |
|---|---|---|
| Ana sayfa (en alt) | Alt şerit (banner) | Oyun dışı, rahatsız etmez |
| Lobi (en alt) | Alt şerit | Oyuncular arkadaşlarını beklerken |
| Oyun bitince ("Tekrar Oyna" / "Ana Sayfa") | Tam ekran (geçiş reklamı) | Resim ya da 5-30 sn video; en fazla 3 dakikada bir |

Oyun sırasında (harf, yazma, değerlendirme, tur arası) **hiç reklam yok**: çevrimiçi oyunda reklam çıkan oyuncu turu kaçırırdı,
ayrıca düğmelerin yanındaki reklam kazara tıklamaya yol açar (Google kurallarına aykırı).

Hangi reklamın çıkacağını Google seçer; biz yalnızca yerini ve sıklığını belirleriz. Tam ekran reklamda kapatma düğmesinin
ne zaman çıkacağı (hemen ya da 5-30 saniye sonra) reklamın türüne göre Google tarafından belirlenir.

## 1) AdMob hesabı
1. https://admob.google.com → Google hesabınızla **Başlayın**
2. Ülke: **Türkiye**, saat dilimi: **İstanbul**, para birimi: **USD** (ya da TRY) → sözleşmeyi kabul edin

## 2) Uygulamayı ekleyin
1. Sol menü **Uygulamalar** → **Uygulama ekle**
2. Platform: **Android**
3. "Uygulama desteklenen bir uygulama mağazasında listeleniyor mu?" → **Hayır** (Play'e çıkınca bağlarız)
4. Uygulama adı: `İsim Şehir` → **Uygulama ekle**
5. Çıkan **Uygulama kimliği**ni kopyalayın: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY` (ortasında **~** var)

## 3) Reklam birimlerini oluşturun
**Reklam birimleri** → **Reklam birimi ekle**:
1. **Banner** → ad: `Alt şerit` → **Reklam birimi oluştur** → kimliği kopyalayın (`ca-app-pub-…/…`, ortasında **/** var)
2. Tekrar **Reklam birimi ekle** → **Geçiş reklamı** (Interstitial) → ad: `Oyun sonu`
   → "Reklam türü" ayarında **Görüntülü ve video** ikisi de açık kalsın → oluşturun → kimliği kopyalayın

**Bana gönderin:** uygulama kimliği + alt şerit kimliği + oyun sonu kimliği (3 satır). Bu kimlikler gizli değildir.

## 4) Avrupa için onay penceresi (zorunlu)
**Gizlilik ve mesajlaşma** → **Avrupa düzenlemeleri** (GDPR) → **Mesaj oluştur**
→ uygulama: İsim Şehir · dil: Türkçe + İngilizce · "Gizlilik politikası URL'si": `https://ahmetercikan.github.io/isimo/gizlilik.html`
→ **Yayınla**. (Uygulama bu pencereyi Avrupa'daki oyunculara kendisi gösterir; kod hazır.)

## 5) Ödeme bilgileri
**Ödemeler** → ödeme profili: ad, adres, vergi bilgisi, banka (IBAN). Kazanç belli bir eşiği geçince Google ayda bir öder.

## 6) Play'de yayınlandıktan sonra
- AdMob → Uygulamalar → İsim Şehir → **Mağaza ekle** → Google Play'deki uygulamayı seçin
- **app-ads.txt** (önerilir, gelir kaybını önler): aşağıdaki duruma bakın.

## Durum (20 Eki 2026)
| Konu | Durum | Kalan iş |
|---|---|---|
| Reklam kimlikleri (Android + iOS) | ✅ gerçek kimlikler yerinde | — |
| Reklam birimleri | ✅ her platformda 2 etkin (şerit + geçiş) | — |
| Ödeme profili | ✅ AdSense (Türkiye), `pub-8025731390860952` | Kazanç ₺200 eşiğine gelince kimlik doğrulaması istenecek |
| Politika ihlali | ✅ yok | — |
| **Mağaza bağlantısı** | ❌ bağlı değil → **"Sınırlı reklam sunumu"** | AdMob'un Play dizini İsim Şehir'i henüz görmüyor (geliştiricinin diğer 7 uygulaması çıkıyor, bu çıkmıyor). Mağaza kaydı 16 Eki'de yayınlandı; birkaç gün içinde dizine girer, sonra AdMob → Uygulamalar → **Mağaza ekle** |
| **Avrupa onay penceresi (GDPR)** | ⏳ taslak hazır | AdMob → Gizlilik ve mesajlaşma → Avrupa tüzükleri → "İsim Şehir – AB onayı" satırındaki **Yayınla** anahtarını aç |
| **app-ads.txt** | ✅ yayında | Google'ın tarayıcısının görmesi 24 saat - 7 gün sürer; AdMob → Uygulamalar → app-ads.txt'ten durum izlenir |

### "Sınırlı reklam sunumu" ne demek?
Mağaza kaydı bağlanmadan AdMob uygulamanın gerçek olduğunu doğrulayamıyor ve reklam sunumunu kısıtlıyor —
yani reklam çıkıyor ama dolum oranı ve gelir düşük kalıyor. Bağlantı kurulunca kısıtlama kalkıyor.
**iOS için** bu ancak App Store'da yayınlandıktan sonra yapılabilir.

### app-ads.txt nerede
Taranacak adres, mağaza kaydındaki **geliştirici web sitesinin kök alanı**dır. Site
`https://ahmetercikan.github.io/isimo/` olduğu için dosya şurada yayında:

    https://ahmetercikan.github.io/app-ads.txt
    google.com, pub-8025731390860952, DIRECT, f08c47fec0942fa0

GitHub Pages'te kökü yayınlamak için **`ahmetercikan.github.io`** adlı ayrı bir depo gerekti
(kullanıcı sayfası deposu, 20 Eki 2026'da açıldı). Aynı kök alanda oldukları için bu dosya
Çizio ve Sayio'yu da kapsar — yeni uygulama için bir şey yapmaya gerek yok.
Yayıncı kimliği değişirse (olmaz) o depodaki dosya güncellenir.

## Notlar
- Yeni reklam birimleri ilk saatlerde boş dönebilir; bu normaldir.
- **Kendi reklamlarınıza asla tıklamayın** (hesap kapatılabilir). Deneme sırasında uygulama zaten deneme reklamları gösterir.
- Reklam içeriği sınıfı: **en geniş (MA)**: gelir kısıtlanmaz. Yasa dışı reklamlar Google politikasıyla zaten hiç gösterilmez.
  İleride istemediğiniz bir reklam türü olursa AdMob → **Engelleme kontrolleri**'nden o kategoriyi kapatabilirsiniz (uygulamayı güncellemeye gerek yok).
