# Arkadaş odaları ve altı yeni evren — 25 Ekim 2026

## Kapsam

Sen Ne Kadar…? girişinde yalnız Oda Kur ve Katıl var. Bilet seçimi ilgili evrende oda kurulumunu açar.
Lobide ev sahibi evreni değiştirebilir ve oda kodunu paylaşabilir. Bot kurma/ekleme/çalıştırma akışı bu oyun için kapalı.
Başlamak için iki bağlı insan gerekir; oda kapasitesi 10 kişidir.

Herkes aynı 10 soruyu ve aynı karıştırılmış seçenekleri görür; süre 20 saniyedir. Cevap tek kez kaydedilir.
Doğru cevap, herkes yanıtlayana veya süre dolana kadar ekranda açıklanmaz. Tur geçişleri ve puan güncellemeleri
ctl üzerinde atomik işlemlerle yapılır. Yeniden işlem denemeleri çift puan vermez. Bu, mevcut uygulamadaki diğer
oyunlar gibi istemci tarafından yönetilen arkadaş odasıdır; rekabetçi, sunucu doğrulamalı bir turnuva sistemi değildir.

Oyun başındaki katılımcılar sabittir; sonradan gelen kişi izler, sonraki oyunda katılır. Bağlantısı kesilen oyuncu
soruyu kilitlemez; mevcut ev sahibi devri mekanizması işler. Sonuçta puan sıralaması, doğrular, kişisel unvan ve
hikâye kartı bulunur. Eşit puanlarda ortak derece verilir. Tekrar Oyna ile aynı oda lobisine dönülür.

## İçerik

| Evren | Kapsam | Soru | Kolay/Orta/Zor |
|---|---|---:|---|
| Yıldız Savaşları | Orijinal üçleme, IV–VI | 40 | 16/14/10 |
| Yenilmezler | Dört Avengers filmi, 2012–2019 | 40 | 16/14/10 |
| Matrix | 1999 filmi | 40 | 16/14/10 |
| Karayip Korsanları | İlk üç film, 2003–2007 | 40 | 16/14/10 |
| Recep İvedik | İlk üç film, 2008–2010 | 30 | 12/10/8 |
| Eşkıya | 1996 filmi | 30 | 12/10/8 |

220 yeni soruyla toplam 19 evren / 936 soru. Her setin altı unvanı, şıkları ve kaynak bağlantıları var.
Sayıyı doldurmak için doğrulanamayan ayrıntılar eklenmedi. Mizah cümleleri yanlış şıkların belirli birinin
seçildiğini varsaymaz. Birebir uzun replik alıntısı, afiş, film karesi veya film müziği kullanılmadı.

Kaynak yaklaşımı: sorular ve çeldiriciler elle ikinci kez okundu; film kapsamları, oyuncu/karakter adları ve
özellikle karışabilecek olay ayrıntıları kaynaklarla karşılaştırıldı. Bu çalışma her bir sorunun farklı bir kişi
tarafından bağımsız doğrulandığı iddiasını taşımaz. JSON içindeki `src` alanı ilgili başvuru kaynağını gösterir.

- Star Wars resmî Databank: https://www.starwars.com/databank/ ; Luke, Darth Vader, Han Solo, C-3PO,
  Endor ve Death Star sayfaları. Ön/ardıl üçleme ve genişletilmiş evren sorulmadı.
- Avengers: dört filmin konu ve oyuncu bilgileri (Wikipedia); Marvel resmî film sayfalarına araç erişimi 403 döndü.
  Yeni duyurular ve çizgi roman evreni dahil edilmedi. Sonraki filmlerdeki değişiklikler bu kapsama ait sayılmaz.
- Matrix: https://www.matrixfans.net/movies/the-matrix/transcript/ ; Tank/Dozer kardeşliği, Mouse'un programı,
  Kâhin'in vazosu ve kurabiyesi, EMP, final ve kaçış olayları film diyaloglarıyla karşılaştırıldı.
- Karayip Korsanları: Disney'in üç resmî film sayfası, üç filmin konu özetleri, Türkçe başlık için
  https://www.sinematurk.com/film/15299-karayip-korsanlari-siyah-incinin-laneti . Norrington'ın kalbi Beckett'e
  götürmesi ve Barbossa'nın dönüşü karşılaştırıldı. Bazı Fandom sayfaları araç erişimini engelledi;
  temel film olayları diğer konu özetleriyle karşılaştırıldı. Tekrarlanan elma sorusunun biri oyuncu sorusuyla değişti.
- Recep İvedik: MSGSÜ film incelemesindeki ilk film özeti; https://www.rtuk.gov.tr/UstKurulKarar/Detay/6255 ;
  https://www.startv.com.tr/film/recep-ivedik-3 ; Box Office Türkiye serinin tarih bilgileri.
  Zeynep'in akrabalık derecesi gibi kaynakların çeliştiği ayrıntılar sorulmadı. Argo replikler kullanılmadı.
- Eşkıya: yapımcı https://filmacass.com.tr/sinema/eskiya/ ; SinemaTürk oyuncu/ekip listesi;
  https://dergipark.org.tr/en/download/article-file/178030 . Baran'ın süresi, köy, Berfo'nun İstanbul adı,
  tren karşılaşması ve Keje'nin sessizliği karşılaştırıldı. Oyuncu adı Şermin Hürmeriç (eski kredilerde Şermin Şen).

## Doğrulama

- 74 birim testi: mevcut oyunlar, JSON biçimi, menü sayıları; oda başlangıcı, çift cevap, eşzamanlı yanıt,
  erken/geç/geçersiz cevap, seyirci, süre bitimi, tam oyun, puan sıfırlama ve eski turun reddi.
- 48 Firebase kural denemesi geçti. Kurallar değişmedi; emülatör doğru demo projesi ve ad alanıyla çalıştırıldı.
- Üç ayrı Chrome oturumuyla Firebase emülatörü: oda kur/katıl, aynı soru/şık sırası, cevap açıklamasının beklemesi,
  geç katılan seyirci, ev sahibi ayrılması, 10 sorunun tamamı, ortak final, tekrar oyna ve seyircinin yeni oyuna katılması geçti.
- 320/390/768 px: giriş butonları ve evren listesi taşmıyor; bot URL'si bile bot kurulumunu açmıyor.
- TypeScript/Vite/PWA üretim derlemesi geçti. Yeni veri ayrı parçalar halinde yüklenir.

Bu çalışma Play'e gönderilmiş 1.0.11 AAB'yi değiştirmez. Android yayını için yeni sürüm paketi gerekir.
