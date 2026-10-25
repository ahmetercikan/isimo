# Sen Ne Kadar…? soru havuzları

Her JSON bir film veya seri evrenidir: `id`, `title`, `ask`, `scope`, altı `tiers` ve `questions` içerir.
Soruda `d` (1/2/3), `q`, `a`, kaynak URL’si `src`, isteğe bağlı `tf` ve `oops` bulunur.
Dosyada **ilk seçenek doğrudur**; motor seçenekleri karıştırır. Doğru/yanlışta iki seçenek bulunur.
Kitap ayrıntıları filmde yoksa sorulmaz; birden fazla doğru seçenek veya doğrulanamayan ayrıntı çıkarılır.

Dosya veya soru sayısı değiştikten sonra:

```sh
node scripts/quiz-meta.mjs
npm test
npm run build
```

`meta.ts` üretilir; elle düzenlenmez. Menü bu küçük listeyi, oyun ilgili JSON’u yükler.
Doğrulama ve devralma raporları: `store/quiz-reviews/`.
