/**
 * Türkçe metin yardımcıları: büyük/küçük harf (İ/ı), karşılaştırma için sadeleştirme ve harf kontrolü.
 * Oyunun puanlaması bu fonksiyonlara dayanır; hepsi saf (testler: __tests__/tr.test.ts).
 */

/** Oyunda çekilebilen harfler (Ğ ile başlayan Türkçe kelime yok). */
export const ALPHABET = ['A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'H', 'I', 'İ', 'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P', 'R', 'S', 'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z'] as const;

/** Zor harfler: "Zor harfler" ayarı kapalıyken çekilmez. */
export const HARD_LETTERS = new Set(['I', 'J', 'Ö', 'Ü', 'V', 'Ç', 'Ş', 'Z']);

export const trUpper = (s: string) => s.toLocaleUpperCase('tr-TR');
export const trLower = (s: string) => s.toLocaleLowerCase('tr-TR');

/** İlk harfi büyütür (Türkçe kurala göre: istanbul → İstanbul, ılgaz → Ilgaz). */
export function capitalize(s: string): string {
  const t = s.trim();
  return t ? trUpper(t[0]) + t.slice(1) : t;
}

/** Karşılaştırma anahtarı: küçük harf, boşluk/noktalama yok. "Kuru Fasulye" ve "kurufasulye" aynı. */
export function norm(s: string): string {
  return trLower(s.normalize('NFC')).replace(/[^a-zçğıöşüâîû0-9]/g, '');
}

const FOLD: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };

/** Daha gevşek anahtar: Türkçe karakterler de sadeleşir (el yazısı tanıma noktaları kaçırabilir). */
export function fold(s: string): string {
  return norm(s).replace(/[çğıöşüâîû]/g, (c) => FOLD[c] ?? c);
}

/** Cevabın ilk harfi (büyük). */
export function firstLetter(s: string): string {
  const t = s.trim();
  return t ? trUpper(t[0]) : '';
}

/** Cevap bu harfle mi başlıyor? */
export function startsWithLetter(answer: string, letter: string): boolean {
  return firstLetter(answer) === letter;
}

/**
 * Bu kutu gerçekten dolduruldu mu: turun harfiyle başlayan, en az iki harfli bir cevap.
 * Tek harf cevap olmaz (tanıyıcı düz bir çizgiyi "l"/"i" okuyabilir), yanlış harf de puan almaz;
 * STOP hakkı ve "doldu" işaretleri buna göre verilir.
 */
export function isAnswer(text: string, letter: string): boolean {
  const t = (text ?? '').trim();
  return norm(t).length >= 2 && startsWithLetter(t, letter);
}

/**
 * Tanıyıcı ilk harfin noktasını/çengelini kaçırdıysa (C/Ç, S/Ş, I/İ, O/Ö, U/Ü) turun harfine düzeltir.
 * "cilek" + Ç → "çilek". Farklı bir harfse dokunmaz.
 */
export function fixFirstLetter(answer: string, letter: string): string {
  const t = answer.trim();
  if (!t) return t;
  const f = firstLetter(t);
  if (f === letter) return t;
  if (fold(f) === fold(letter)) {
    const isUpper = t[0] === trUpper(t[0]) && t[0] !== trLower(t[0]);
    return (isUpper ? letter : trLower(letter)) + t.slice(1);
  }
  return t;
}

/**
 * Ada "-de/-da/-te/-ta" ekini doğru getirir: "Ali'de", "Bilge Baykuş'ta", "Zeynep'te".
 * Son sesliye (kalın/ince) ve son harfin sertliğine bakar.
 */
export function locative(name: string): string {
  const t = (name ?? '').trim();
  const harfler = trLower(t).replace(/[^a-zçğıiöşü]/g, '');
  if (!t || !harfler) return t;
  let sesli = 'e';
  for (const c of harfler) if ('aeıioöuü'.includes(c)) sesli = c;
  const kalin = 'aıou'.includes(sesli);
  const sert = 'fstkçşhp'.includes(harfler[harfler.length - 1]);
  return `${t}'${sert ? 't' : 'd'}${kalin ? 'a' : 'e'}`;
}

/** Levenshtein uzaklığı (küçük kelimeler için; erken çıkışlı). */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < best) best = cur[j];
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** Harfler arasında rastgele seçim (kullanılmış ve gerekirse zor harfler hariç). */
export function availableLetters(used: string, hard: boolean): string[] {
  const out = ALPHABET.filter((l) => !used.includes(l) && (hard || !HARD_LETTERS.has(l)));
  // Bütün harfler bittiyse (çok uzun oyun) en azından zor olmayanlar yeniden açılır.
  return out.length ? out : ALPHABET.filter((l) => hard || !HARD_LETTERS.has(l));
}
