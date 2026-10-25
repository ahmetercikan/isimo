# Android 1.0.12 — tamamlanmamış çalışma

25 Ekim 2026. Dal: `work/quiz-expansion-1.0.12`. Play Console'a yüklenmedi; web'e gönderilmedi.

## Tamamlanan kod

- Sen Ne Kadar arkadaş odaları her katılımcının kalıcı soru geçmişini dikkate alır. Seçilen evrenin geçmişleri eşitlenmeden başlanamaz.
- Turun 10 sorusu oyun başında cihazda saklanır: yarıda çıkış, yeniden açılış, yeni oda ve ev sahibi değişimi geçmişi sıfırlamaz.
- 40 soru sınırı kaldırıldı. Görülmemiş sorular bitmeden eski soru seçilmez; zorluk kotası gerekirse esner. Havuz bitince eski sorular önce gelir.
- Sen Ne Kadar sonuç ekranında Tekrar Oyna ve Ana Sayfa mevcut geçiş reklamını bekler. Filmi Bil sonuç reklamları korunur; ortak sonuç ekranından geri/çıkış yolu da kapsanır.
- Eski doğrudan tek oyunculu quiz bağlantısının sonuç düğmeleri de aynı reklamı kullanır.
- Aynı anda gelen reklam çağrıları tek kapanışı bekler; geçici dinleyiciler kaldırılır. Web'de reklam yok; mevcut üç dakika aralığı korunur.

## Eksik: soru içeriği

Kullanıcı her evrende mevcut sayının **10 katını**, toplam **9.360** soruyu istedi ve devam filmlerinin kapsama alınmasını onayladı.
**Hiçbir evrenin soru sayısı bu çalışmada artırılmadı; mevcut toplam 936.** 8.424 yeni soru ve kaynak kontrolleri henüz tamamlanmadı. Tekrar yazım veya soru kopyasıyla sayı şişirilmemeli.

Evren başına başlangıç ve hedef sayılar `store/quiz-expansion-targets.json` dosyasında. Kabul kontrolü:

```
node scripts/check-quiz-expansion.mjs
```

Bu kontrol şu an beklenen şekilde başarısızdır (936/9.360). Mevcut sorulara yeni soruları **sona ekle**; soru anahtarları dosyadaki indeks olduğundan eski sıralama değişmemeli. Yeni `scope` bilgilerini ve `node scripts/quiz-meta.mjs` çıktısını güncelle.

## Derleme

- `versionCode=12`, `versionName=1.0.12`.
- Java 21 ile çevrimdışı `assembleRelease bundleRelease` başarılı.
- APK ve AAB imzaları doğrulandı; mevcut Play yükleme anahtarı kullanılıyor.
- `store/release/isim-sehir-1.0.12-TASLAK.apk` / `.aab` **936 soruluk taslaklardır**, 9.360 soruluk sürüm olarak yüklenmemeli.
- APK SHA256: `af95690f420c20198d2b78807fdf0e6f19ae6cda49c6271754750cc3cd646691`
- AAB SHA256: `a7ca4e019be389a5d22e716b9fd8512eb368f1045b1a967ca5ef1ecee696f3e6`

## Doğrulama

- 83 Vitest testi geçti; TypeScript kontrolü geçti.
- 48 Firebase kural testi geçti (demo emülatörü).
- `scripts/quiz-history-smoke.mjs`: iki cihaz, misafirin eski soruları, yarıda çıkış, yeniden açılış, farklı ev sahibiyle yeni oda; tekrar olmadan geçti.
- `scripts/quiz-room-smoke.mjs`: üç cihazla 10 soruluk tam oyun, puanlama, seyirci, ev sahibi devri ve tekrarsız yeni oyun geçti. İlk denemelerde eşzamanlı Android derlemesinin dev sunucusuna sayfa yenilemesi göndermesi testi bozdu; derleme bittikten sonra aynı tam test başarılı oldu.
- Reklam eklentisi testleri taklit kullanır; fiziksel Android cihazda gerçek reklam gösterimi bu çalışmada denenmedi.
- Play üretim ekranında son etkin sürüm 11 (1.0.11) doğrulandı. Konsolda yeni sürüm taslağı oluşturulmadı.

## Kalan teslim

9.360 kaynaklı, farklı soruyu tamamla; format/cevap/tekrar kontrolleri yap; tüm testleri ve Android derlemesini içerik sonrasında yenile. Ardından web'i main üzerinden yayımla, son imzalı 1.0.12 AAB'yi üretime yükle ve incelemeye gönder. `TASLAK` dosyalarını bitmiş sürüm diye kullanma.
