# İsim Şehir — iOS (App Store) rehberi

> **Durum (17 Ekim 2026):** iOS sürümü hazır ve çalışıyor. İmzalı App Store paketi (IPA) üretildi:
> sertifika **Apple Distribution: ABDURRAHMAN KAAN DIKEC (AQ2Y664A4Z)**, paket kimliği
> `com.ahmetercikan.isimsehir` (Android ile aynı), sürüm **1.0.1**, derleme **1**.
> iPhone ve iPad simülatöründe denendi: oyun, el yazısı tanıma ve düzen sorunsuz.
> **Kalan iş:** (1) AdMob'da iOS uygulaması ve reklam kimlikleri, (2) App Store Connect'te uygulama kaydı,
> (3) ekran görüntüleri, (4) yükleme. Sade adımlar: `store/app-store-1.0.1.md`.

## 1. Ne yapıldı

| Konu | Durum |
|---|---|
| iOS projesi (`ios/`) | Capacitor 8 ile oluşturuldu, depoya eklendi |
| Paket kimliği | `com.ahmetercikan.isimsehir` — Android ile aynı (Apple'da boştu, ekibe alındı) |
| Sürüm | 1.0.1 (build 1) — `package.json` ve Android ile aynı |
| İmza | Otomatik; ekip **AQ2Y664A4Z** (ABDURRAHMAN KAAN DIKEC). Kullanıcının kendi hesabı yalnızca ücretsiz *Personal Team* (`K5AVKBUJ8R`) olduğu için App Store'a yükleyemiyor |
| El yazısı tanıma | **Apple Vision** ile cihazda, internetsiz (aşağıda) |
| Reklamlar | Kod hazır, kimlikler girilince açılır (aşağıda) |
| Simge ve açılış ekranı | `assets/` klasöründen üretildi (saydamlık yok — Apple şartı) |
| Ekran yönü | Yalnızca dikey (Android ile aynı) |
| Ekran kararması | Oyun sırasında kapalı (`AppDelegate.swift`) |

## 2. El yazısı tanıma iOS'ta nasıl çalışıyor

Android'de Google ML Kit Digital Ink var; **iOS'ta yok**. Bunun yerine **Apple Vision** kullanıldı:

- `ios/App/App/InkVision.swift` — çizgileri beyaz zemine siyah kalemle çizer, Vision'ın Türkçe
  (`tr-TR`) yazı tanıyıcısına okutur. Cihazda çalışır, **indirilecek model yok, internet gerekmez**.
- `ios/App/App/InkPlugin.swift` — Capacitor köprüsü (Android'deki `InkPlugin.java` ile aynı arayüz).
- `ios/App/App/ViewController.swift` — eklentiyi tanıtır (eklenti listesi `cap sync` ile üretildiği için
  oraya elle eklenmez; ekran `SceneDelegate.swift` içinde bu sınıftan açılır).
- Vision bir şey okuyamazsa `src/lib/ink.ts` eskisi gibi Google'ın web servisine düşer.

**Denemek için:** `npm run ios:ink` — Hershey el yazısı fontundan sahte parmak yazısı üretip tanıtır.
Son ölçüm: 10 kelimenin 10'u doğru okundu (çoğunda ilk aday). Uygulamanın içinde de denendi
(Kemal, elma, Ankara → doğru).

Türkçe harfler (ç ş ğ ı ö ü) kaçarsa sorun olmaz: oyun sözlüğü `fold()` ile zaten eşliyor
("cilek" → "Çilek"), `fixFirstLetter` de turun harfine göre ilk harfi düzeltiyor.

## 3. Reklamlar (yapılacak — senin adımların)

iOS'ta reklam gösterebilmek için AdMob'da **ayrı bir iOS uygulaması** gerekiyor (Android'inki kullanılamaz):

1. https://admob.google.com → **Uygulamalar → Uygulama ekle → iOS → Hayır (mağazada değil)** → ad: `İsim Şehir`
2. Açılan uygulamanın **Uygulama kimliği**ni not et (`ca-app-pub-…~…`).
3. **Reklam birimleri → Reklam birimi ekle** ile iki tane oluştur:
   - **Banner** (ad: `Alt şerit`)
   - **Geçiş reklamı / Interstitial** (ad: `Oyun sonu`)
4. Üç kimliği bana ver; şu iki yere yazılacak:
   - `src/lib/adsConfig.ts` → `ADMOB_IOS`
   - `ios/App/App/Info.plist` → `GADApplicationIdentifier`

**Şu an:** `ADMOB_IOS` boş olduğu için iOS'ta reklam gösterilmiyor (oyunun geri kalanı normal çalışıyor).
`Info.plist`teki `GADApplicationIdentifier` şimdilik Google'ın **deneme** kimliği — bu anahtar boş olursa
Google'ın reklam kütüphanesi uygulamayı **açılışta çökertiyor**, bu yüzden hep dolu olmalı.
Gerçek kimlik gelmeden mağazaya gönderilmemeli.

Reklamlar açılınca iOS'ta Apple'ın **izleme izni** penceresi de çıkar (metni `Info.plist` →
`NSUserTrackingUsageDescription`); izin verilmezse reklamlar kişiselleştirilmeden gösterilir.

## 4. Komutlar

```bash
npm run ios:sync    # web'i derle + iOS'a kopyala
npm run ios:open    # Xcode'da aç
npm run ios:ipa     # App Store paketi üret → store/release/ios/App.ipa
npm run ios:ink     # el yazısı tanımayı Mac'te dene
npm test            # 11 test geçmeli
```

Simge/açılış ekranını yenilemek için:
`npx capacitor-assets generate --ios --iconBackgroundColor '#16a6c4' --splashBackgroundColor '#cfeee6'`
(sonra `ios/App/App/Assets.xcassets/Splash.imageset/` içindeki eski `splash-2732x2732*.png` dosyaları silinmeli.)

## 5. Yeni sürüm çıkarma

1. Ortak kodda değişiklik → `npm run ios:sync`
2. `ios/App/App.xcodeproj/project.pbxproj` → `CURRENT_PROJECT_VERSION` (build) bir artır;
   sürüm adı değiştiyse `MARKETING_VERSION` (Android `versionName` ile aynı tutulur).
3. `npm run ios:ipa` → `store/release/ios/App.ipa`
4. Xcode → Organizer ya da Transporter ile App Store Connect'e yükle.
5. `ios/` değişikliklerini commit edip gönder (kullanıcı Windows'ta da çalışıyor).

## 6. Bilinen konular

- **Paket boyutu:** ~8,6 MB (Android'e benzer; sesler `public/voice` içinde).
- **Çevrimiçi oyun:** Firebase anonim giriş WKWebView'da çalışıyor; gerçek cihazda iki telefonla
  bir kez denenmeli.
- **Ses:** iOS'ta ilk dokunuştan sonra açılır (tarayıcı kuralı); sessize alma düğmesi açıkken
  Web Audio sesleri susar — bu iOS'un davranışı.
- **Durum çubuğu:** iOS'ta görünür bırakıldı (Android'de gizli). Düzen `env(safe-area-inset-*)` ile
  zaten doğru yerleşiyor.
- **iPad:** dikey düzen kullanılıyor (`src/styles/tablet.css`). Android da dikey kilitli.
