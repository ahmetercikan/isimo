# App Store'a gönderme — İsim Şehir 1.0.1 (sade adımlar)

Bu dosya **senin yapacağın** işleri anlatır. Teknik taraf (iOS sürümü, imzalı paket) hazır:
`store/release/ios/App.ipa`. Ayrıntılar: `IOS.md`.

Apple hesabı: **ABDURRAHMAN KAAN DIKEC** (Çizio'yu da bu hesapla yayınlıyoruz).
Uygulama iPhone'da dikey, iPad'de hem dikey hem yatay çalışıyor.

---

## Adım 1 — AdMob (tamamlandı ✅)

iOS için AdMob'da ayrı uygulama ve iki reklam birimi açıldı, kimlikler uygulamaya işlendi.
Senin yapacağın bir şey yok; bilgi olsun diye:

| Ne | Kimlik |
|---|---|
| Uygulama (iOS) | `ca-app-pub-8025731390860952~9852483361` |
| Alt şerit | `ca-app-pub-8025731390860952/5370312876` |
| Oyun sonu | `ca-app-pub-8025731390860952/3878846817` |

AdMob'da uygulama şu an "İnceleme gerekli" diyor: bu normal. Uygulama App Store'da yayınlandıktan
sonra AdMob'daki uygulamaya **Mağaza ekle** ile App Store bağlantısını eklersen Google onaylar ve
reklamlar tam kapasite çalışmaya başlar.

## Adım 2 — App Store Connect'te uygulamayı kaydet

https://appstoreconnect.apple.com → **Uygulamalar → + → Yeni Uygulama**

| Alan | Yazılacak |
|---|---|
| Platform | iOS |
| Ad (en çok 30 karakter) | `İsim Şehir: Kelime Oyunu` |
| Ana dil | Türkçe |
| Paket kimliği | `com.ahmetercikan.isimsehir` |
| SKU | `isimsehir-ios` |
| Kullanıcı erişimi | Tam erişim |

**Uygulama Bilgileri** bölümünde:
- Alt başlık (en çok 30 karakter): `Harfi çevir, yaz, STOP de!`
- Kategori: **Oyunlar** → alt tür **Kelime**, ikinci alt tür **Aile**
- Gizlilik politikası adresi: `https://ahmetercikan.github.io/isimo/gizlilik.html`
- Destek adresi: `https://github.com/ahmetercikan/isimo/issues`

---

## Adım 3 — Mağaza metinleri

**Tanıtım metni** (en çok 170 karakter):
> Arkadaşlarınla online İsim Şehir! Harfi çevir, cevapları parmağınla yaz, ilk sen STOP de. 14 kategori, el yazısı tanıma, otomatik puan tablosu.

**Açıklama:** `store/listing-tr.md` → "Tam açıklama" bölümünü olduğu gibi yapıştır.
İçinde "Google Play" geçen bir yer varsa çıkar.

**Anahtar kelimeler** (en çok 100 karakter, virgülle):
```
isim şehir,kelime,harf,stop,online,arkadaş,parti,aile,türkçe,el yazısı,oyun
```

**Sürüm notları:** `store/listing-tr.md` → "Sürüm notları".

---

## Adım 4 — Yaş derecelendirmesi ve gizlilik formu

**Yaş derecelendirme anketi:** şiddet, korku, cinsellik, kumar → hepsine **Yok/Hayır**.
- "Sınırsız web erişimi" → **Hayır**
- "Kullanıcılar birbiriyle iletişim kurabiliyor mu" → **Evet** (oyun içinde takma ad, cevaplar ve
  hazır emoji tepkileri paylaşılıyor; **mesajlaşma yok**)
- Reklam içeriği → **Evet, sık olmayan/hafif** (AdMob reklamları)

**Uygulama Gizliliği (App Privacy):** "Veri topluyor musunuz?" → **Evet**. Toplananlar:

| Apple veri türü | Neden | Kimliğe bağlı mı? | İzleme? |
|---|---|---|---|
| İletişim bilgisi → **Ad** (oyuncunun takma adı) | Uygulama İşlevselliği | Evet (anonim hesaba) | Hayır |
| Kullanıcı İçeriği → **Diğer Kullanıcı İçeriği** (cevaplar, el yazısı çizgileri, tepkiler) | Uygulama İşlevselliği | Evet | Hayır |
| Tanımlayıcılar → **Kullanıcı Kimliği** (Firebase anonim kimlik) | Uygulama İşlevselliği | Evet | Hayır |
| Tanımlayıcılar → **Cihaz Kimliği** (reklam kimliği) | Üçüncü Taraf Reklamcılığı | Hayır | **Evet** |
| Kullanım Verileri → **Reklam Verileri** | Üçüncü Taraf Reklamcılığı | Hayır | **Evet** |

> Son iki satır reklamlarla (AdMob) ilgili; reklamlar açık olduğu için işaretlenecek.
> Konum, kişiler, sağlık, satın alma, arama geçmişi: **toplanmıyor**.

---

## Adım 5 — Ekran görüntüleri

Apple'ın istediği boyutlar:

| Cihaz | Piksel | Durum |
|---|---|---|
| iPhone (Dynamic Island, orta) | 1206×2622 | **zorunlu** |
| iPad 13" | 2064×2752 | iPad'i desteklediğimiz için **zorunlu** |

Hazır görüntüler: `store/screenshots/ios/` (iPhone ve iPad). Saydamlık yok, PNG.
Yenilemek gerekirse: `IOS.md` → "Komutlar".

---

## Adım 6 — Paketi yükle ve gönder

1. Paket hazır: `store/release/ios/App.ipa` (reklam kimlikleri işlenmiş, imzalı).
2. **Transporter** uygulamasını Mac App Store'dan indir, ABDURRAHMAN KAAN DIKEC hesabıyla gir,
   `store/release/ios/App.ipa` dosyasını sürükle → **Deliver**.
   (Ya da Xcode → Organizer → Distribute App → App Store Connect.)
3. 10-30 dakika sonra App Store Connect → **TestFlight**'ta derleme "Test için hazır" olur.
   Kendi iPhone'unda TestFlight ile dene.
4. **App Store** sekmesi → sürüm **1.0.1** → **Derleme** bölümünden bu derlemeyi seç.
5. **İnceleme bilgileri** → "Oturum açma gerekli değil". Not olarak:
   > Klasik İsim Şehir oyunu. Hesap/giriş yok, takma ad yeterli. Arkadaşlarla oyun 5 haneli oda
   > koduyla kurulur; mesajlaşma yoktur, yalnızca oyun cevapları ve hazır emoji tepkileri paylaşılır.
   > Cevaplar parmakla yazılır ve cihaz üzerinde (Apple Vision) tanınır. Uygulama içi satın alma yoktur.
   > Reklamlar Google AdMob'dandır.
6. Fiyat: **Ücretsiz**. Ülkeler: hepsi (ya da yalnızca Türkiye).
7. **İncelemeye Gönder.**

Reddedilirse Apple'ın e-postasındaki madde numarasını bana ilet; düzeltip yeni derleme göndeririz.
