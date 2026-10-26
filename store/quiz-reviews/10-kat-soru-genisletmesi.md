# Sinema Bilmecesi: 10 kat soru havuzu — 26 Ekim 2026

Her evrenin soru sayısı başlangıç sayısının 10 katına tamamlandı; toplam 9.360. 18 mevcut evrendeki özgün soruların sırası korundu. Recep İvedik'in 300 soruluk evreni 300 soruluk Leyla ile Mecnun evreniyle değiştirildi.

Yeni kartların çoğu iki ayrı, mevcut bir film veya dizi bilgisini tek soruda eşleştirir. Doğru seçenek iki yanıtı sırayla verir; üç yanlış seçenek, her parçanın kaynak sorusundaki yanlış seçeneklerden oluşturulur. Her iki kaynak ayrı ayrı `src` ve `src2` alanında durur. Bu yapı aynı soruyu yalnızca başka kelimelerle kopyalamaz; oyuncunun iki ayrıntıyı birlikte hatırlamasını ister. Ekranda iki bilgi ayrı satırda görünür. Bir turda 4 kolay/3 orta/3 zor kuralı korunur; eşleştirme sorusunun zorluğu iki parçanın zor olanına göre belirlenir.

| Evren | Eski | Yeni seri bilgisi | Eşleştirme | Son |
|---|---:|---:|---:|---:|
| Aslan Kral | 47 | 7 | 416 | 470 |
| Bluey ve Bingo | 49 | 0 | 441 | 490 |
| Buz Devri | 48 | 0 | 432 | 480 |
| Eşkıya | 30 | 0 | 270 | 300 |
| G.O.R.A. | 48 | 0 | 432 | 480 |
| Hababam Sınıfı | 48 | 0 | 432 | 480 |
| Harry Potter | 119 | 10 | 1.061 | 1.190 |
| Karayip Korsanları | 40 | 8 | 352 | 400 |
| Karlar Ülkesi | 49 | 7 | 434 | 490 |
| Matrix | 40 | 10 | 350 | 400 |
| Kayıp Balık Nemo ve Dori | 50 | 0 | 450 | 500 |
| Oyuncak Hikâyesi | 49 | 0 | 441 | 490 |
| Leyla ile Mecnun | 32 | 0 | 268 | 300 |
| Şrek | 50 | 5 | 445 | 500 |
| Ters Yüz | 50 | 0 | 450 | 500 |
| Titanik | 49 | 0 | 441 | 490 |
| Yenilmezler | 40 | 0 | 360 | 400 |
| Yıldız Savaşları | 40 | 24 | 336 | 400 |
| Yüzüklerin Efendisi | 60 | 10 | 530 | 600 |

## Kapsamı genişleyen seriler

- Harry Potter: sekiz ana film ve Fantastic Beasts üçlemesi.
- Yüzüklerin Efendisi: ana üçleme ve Hobbit üçlemesi.
- Matrix: dört sinema filmi.
- Yıldız Savaşları: ana dokuz film ve Rogue One/Solo.
- Karayip Korsanları: ilk beş film.
- Aslan Kral: 1994 ve 2019 filmleri ile 2024 Mufasa.
- Şrek: dört Şrek ve iki Çizmeli Kedi filmi.
- Leyla ile Mecnun: tabii'de listelenen ilk üç sezon; 30 doğrulanmış tekil bilgi, 270 iki bilgili eşleştirme sorusu. Kaynaklar: [TRT 1 dizi ve bölüm özetleri](https://www.trt1.com.tr/diziler/leyla-ile-mecnun), [TRT/tabii dizi tanıtımı](https://www.trt.net.tr/tabii/efsane-asiklarin-dizisi-leyla-ile-mecnunun-tum-bolumleri-tabiide-21001483), [tabii bölüm kayıtları](https://www.tabii.com/tr/detail/6080/leyla-ile-mecnun).

Recep İvedik evreni kaldırıldı; 300 soruluk hedefi Leyla ile Mecnun aldı. Evren sayısı 19 ve toplam soru sayısı 9.360 olarak kaldı.

Yeni tekil bilgiler birincil/resmî sayfalardan ve mevcut araştırma notlarından yazıldı. Bunlara örnek olarak StarWars.com Databank'ın devam/ön üçleme kayıtları; FantasticBeasts.com; TheMatrix.com; Disney'in Mufasa, Frozen 2, Nemo/Dori ve Pirates sayfaları; DreamWorks'ün Puss in Boots film sayfaları kullanıldı. Her yeni bilgi sorusunda ilgili URL bulunur. Eşleştirme sorusunda iki bilgi için de URL saklanır. Wikipedia bağlantılı kaynaklar, ilgili resmî sayfada ayrıntı bulunmayan Hobbit, Matrix olay örgüsü ve Pirates devam filmi ayrıntılarında kullanıldı.

## Doğrulama

`node scripts/expand-quiz-pairs.mjs` aynı kaynak sorularını alıp hedefleri yeniden üretir; eski soru sırasını değiştirmez. `node scripts/quiz-meta.mjs` menü sayılarını günceller. `node scripts/check-quiz-expansion.mjs` tüm 19 hedefi ve toplamı kontrol eder. Bu rapor, Android paketine yalnızca bu kontroller ve derleme tamamlandıktan sonra dahil edilmelidir.
