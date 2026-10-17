# App Store'a gönderme — İsim Şehir 1.0.1 (sade adımlar)

Bu dosya **senin yapacağın** işleri anlatır. Teknik taraf (iOS sürümü, imzalı paket) hazır:
`store/release/ios/App.ipa`. Ayrıntılar: `IOS.md`.

Apple hesabı: **ABDURRAHMAN KAAN DIKEC** (Çizio'yu da bu hesapla yayınlıyoruz).
Mağazada "Satıcı" olarak bu hesap görünür, ama **telif satırı uygulamanın sahibini yazar:
2026 Ahmet Mesut Erçıkan**. Yeni sürümlerde de böyle kalmalı.
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
| Telif (Copyright) | 2026 Ahmet Mesut Erçıkan — **uygulamanın sahibi**, Apple hesabının sahibi değil |
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

## Adım 6 — İncelemeye gönderildi ✅

17 Ekim 2026, 20:11'de gönderildi. Durum: **Waiting for Review**.
İnceleme iletişim bilgileri: Ahmet Mesut Erçıkan · +90 543 970 76 03 · ahmetmesutercikan@hotmail.com
(giriş şifresi gerekmiyor; inceleme notu İngilizce yazıldı).

**Bundan sonra ne olacak:**
- Apple genelde 24-48 saatte bakar, sonucu e-posta ile bildirir.
- Onaylanırsa uygulama App Store'da yayına girer (175 ülke, ücretsiz).
- Beklerken **TestFlight**'tan kendi iPhone'una kurup deneyebilirsin.
- Yayınlandıktan sonra AdMob'da iOS uygulamasına **Mağaza ekle** ile App Store bağlantısını
  eklemeyi unutma; Google o zaman onaylıyor ve reklamlar tam kapasite çalışıyor.

**Reddedilirse:** Apple'ın e-postasındaki madde numarasını bana ilet (ör. 2.1, 4.3, 5.1.1).
Düzeltip yeni derleme (build 3) göndeririz: `npm run ios:ipa` ve derleme numarasını artırmak yeterli.
