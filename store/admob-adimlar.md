# AdMob (reklam) kurulumu — adım adım

Uygulamada reklam altyapısı hazır; şu an Google'ın **deneme reklamları** çıkıyor (para kazandırmaz).
Gerçek reklam için aşağıdaki adımlarla 3 kimlik alıp bana gönderin; ben `src/lib/adsConfig.ts` ve
`android/app/src/main/res/values/strings.xml` dosyalarına yazıp yeni paket çıkarırım.

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
- AdMob → Uygulamalar → İsim Şehir → **Uygulama ayarları** → **Mağaza ekle** → Google Play'deki uygulamayı seçin
- **app-ads.txt** (önerilir, gelir kaybını önler): AdMob → Uygulamalar → app-ads.txt → çıkan satırı bana gönderin; geliştirici web
  sitesine ben yerleştiririm.

## Notlar
- Yeni reklam birimleri ilk saatlerde boş dönebilir; bu normaldir.
- **Kendi reklamlarınıza asla tıklamayın** (hesap kapatılabilir). Deneme sırasında uygulama zaten deneme reklamları gösterir.
- Reklam içeriği sınıfı: **Gençler (T)**: kumar, alkol gibi yetişkin reklamlar gösterilmez. AdMob → Engelleme kontrolleri'nden
  istemediğiniz kategorileri ayrıca kapatabilirsiniz.
