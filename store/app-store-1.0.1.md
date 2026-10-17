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

## Adım 2 — App Store Connect kaydı (tamamlandı ✅)

Uygulama kaydı açıldı ve mağaza sayfası dolduruldu:

| Alan | Değer |
|---|---|
| Ad | İsim Şehir: Kelime Oyunu |
| Alt başlık | Harfi çevir, yaz, STOP de! |
| Apple ID | 6824006144 |
| Paket kimliği | com.ahmetercikan.isimsehir |
| SKU | isimsehir-ios |
| Kategori | Oyunlar → Kelime, Aile |
| Yaş | 4+ |
| Fiyat | Ücretsiz, 175 ülke |
| Gizlilik | Form dolduruldu ve yayımlandı |
| Ekran görüntüleri | iPhone 8 + iPad 8 (geçişli/panoramik) |
| Derleme | 1.0.1 (2) seçildi |

## Adım 3 — Mağaza metinleri (tamamlandı ✅)

Tanıtım metni, açıklama, anahtar kelimeler, destek ve pazarlama adresleri girildi.
Açıklamada emoji kullanılamıyor (App Store "geçersiz karakter" diyor), o yüzden emojisiz sürüm yazıldı.

## Adım 4 — Yaş ve gizlilik (tamamlandı ✅)

Yaş derecelendirmesi **4+**. Gizlilik formunda bildirilenler: Ad (takma ad), Diğer Kullanıcı İçeriği
(cevaplar ve el yazısı), Kullanıcı Kimliği — uygulama işlevi için, kimliğe bağlı, izleme yok;
Cihaz Kimliği ve Reklam Verileri — üçüncü taraf reklamcılık için, kimliğe bağlı değil, **izleme var**
(bu yüzden uygulama Apple'ın izleme izni penceresini gösteriyor).

## Adım 5 — Ekran görüntüleri (tamamlandı ✅)

iPhone (1206×2622) ve iPad 13" (2064×2752) için sekizer görsel yüklendi. Görseller **geçişli
(panoramik)**: arka plan, lekeler, harf karoları ve kalem çizgisi bir görselden diğerine akıyor,
mağazada yan yana bakıldığında tek bir resim gibi görünüyor (Çizio'daki gibi).
Kaynak: `store/promo/ios/`, üretim: `IOS.md` → Komutlar.

## Adım 6 — Son iki iş (sende)

1. **İnceleme iletişim bilgileri.** App Store Connect → uygulama → sürüm sayfası → en altta
   *App Review Information* → *Contact Information*: ad, soyad, telefon ve e-posta. Apple inceleme
   ekibi gerekirse buradan ulaşıyor; bu bilgileri senin vermen gerekiyor (bana yazarsan ben de girerim).
   Giriş bilgisi gerekmiyor ("Sign-in required" kapalı) ve inceleme notu yazıldı.

2. **İncelemeye gönder.** Aynı sayfanın sağ üstündeki **Add for Review** → sonra **Submit to App Review**.
   Bu adımı senin onayınla yapacağım: gönderdikten sonra Apple incelemesi başlar (genelde 1-3 gün).

Reddedilirse Apple'ın e-postasındaki madde numarasını bana ilet; düzeltip yeni derleme göndeririz.
