# İsim Şehir — iOS (App Store) rehberi

> **Durum (17 Ekim 2026):** iOS sürümü hazır ve çalışıyor. İmzalı App Store paketi (IPA) üretildi:
> sertifika **Apple Distribution: ABDURRAHMAN KAAN DIKEC (AQ2Y664A4Z)**, paket kimliği
> `com.ahmetercikan.isimsehir` (Android ile aynı), sürüm **1.0.1**, derleme **1**.
> iPhone ve iPad simülatöründe denendi: oyun, el yazısı tanıma ve düzen sorunsuz.
> AdMob'da iOS uygulaması ve iki reklam birimi açıldı, kimlikler koda işlendi; reklamlar iOS'ta açık.
> iPad'de yatay yön de açık.
> **Kalan iş:** App Store Connect'te uygulama kaydı ve yükleme. Sade adımlar: `store/app-store-1.0.1.md`.

## 1. Ne yapıldı

| Konu | Durum |
|---|---|
| iOS projesi (`ios/`) | Capacitor 8 ile oluşturuldu, depoya eklendi |
| Paket kimliği | `com.ahmetercikan.isimsehir` — Android ile aynı (Apple'da boştu, ekibe alındı) |
| Sürüm | 1.0.1 (build 1) — `package.json` ve Android ile aynı |
| İmza | Otomatik; ekip **AQ2Y664A4Z** (ABDURRAHMAN KAAN DIKEC). Kullanıcının kendi hesabı yalnızca ücretsiz *Personal Team* (`K5AVKBUJ8R`) olduğu için App Store'a yükleyemiyor |
| El yazısı tanıma | **Apple Vision** ile cihazda, internetsiz (aşağıda) |
| Reklamlar | Açık — AdMob iOS uygulaması `ca-app-pub-8025731390860952~9852483361` |
| Simge ve açılış ekranı | `assets/` klasöründen üretildi (saydamlık yok — Apple şartı) |
| Ekran yönü | iPhone dikey (Android ile aynı); **iPad'de yatay da açık** |
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

## 3. Reklamlar

AdMob'da iOS için **ayrı** bir uygulama gerekiyordu (Android'inki iOS'ta çalışmaz); 17 Ekim 2026'da açıldı:

| Ne | Kimlik |
|---|---|
| Uygulama | `ca-app-pub-8025731390860952~9852483361` |
| Alt şerit (banner) | `ca-app-pub-8025731390860952/5370312876` |
| Oyun sonu (geçiş) | `ca-app-pub-8025731390860952/3878846817` |

Kimlikler iki yerde, **aynı** olmak zorunda:
- `src/lib/adsConfig.ts` → `ADMOB_IOS`
- `ios/App/App/Info.plist` → `GADApplicationIdentifier` (yalnızca uygulama kimliği)

`Info.plist`teki bu anahtar **boş bırakılamaz**: Google'ın reklam kütüphanesi anahtar yoksa uygulamayı
açılışta çökertiyor (geliştirme sırasında yaşandı).

Reklamlar Android'dekiyle aynı yerlerde: ana sayfa ve lobi altında şerit, oyun bitince tam ekran
(3 dakikada en fazla bir). iOS'ta ek olarak Apple'ın **izleme izni** penceresi çıkar (metni
`Info.plist` → `NSUserTrackingUsageDescription`); izin verilmezse reklamlar kişiselleştirilmeden gösterilir.

AdMob uygulaması "İnceleme gerekli" durumunda: mağazada yayınlandıktan sonra App Store bağlantısı
eklenince Google onaylıyor, o zamana kadar reklam sunumu sınırlı olabilir.

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
- **iPad:** dikey ve yatay açık. Yatay düzen `src/styles/tablet.css` içinde
  (`@media (min-width: 980px) and (orientation: landscape)`): yazma ekranında solda cevap, sağda yazı
  defteri; harf ekranında harf ve DUR yan yana. Lobi, değerlendirme, puanlar ve final ekranları da
  yatayda denendi. iPhone dikey kilitli (Android ile aynı).
- **Ekran yönü tuzağı:** Yönü yalnızca `Info.plist`e yazmak yetmiyor. Capacitor'ın
  `CAPBridgeViewController`ı `supportedInterfaceOrientations`u kendisi hesaplıyor ve bunu
  Info.plist'in **genel** `UISupportedInterfaceOrientations` anahtarından okuyor; iPad'e özel
  `UISupportedInterfaceOrientations~ipad` anahtarını görmüyor. Bu yüzden yön `ViewController.swift`
  içinde cihaza göre belirleniyor (iPad'de yatay dahil, iPhone'da yalnızca dikey).
  Simülatörde doğrulandı: iPad'de yön maskesi 30 (dikey + ters dikey + iki yatay), iPhone'da dikey.
- **Simülatörde çevirme:** iPadOS 26 uygulamanın kendi kendine dönmesine izin vermiyor
  ("window mode does not allow programmatic changes"), Mac'te de betikle ⌘+← gönderilemiyor
  (erişilebilirlik izni). Yatayı görmek için simülatörde **⌘ + sol ok**'a basmak ya da gerçek iPad'de
  denemek gerekiyor. Yatay düzenin kendisi tarayıcıda tam iPad yatay ölçüsünde (2064×1548) denendi.
