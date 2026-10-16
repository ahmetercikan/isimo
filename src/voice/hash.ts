/**
 * Seslendirme satırlarının anahtarı: normalleştirilmiş metnin FNV-1a (32 bit) özeti.
 * Hem Node (scripts/generate-voice.ts) hem tarayıcıda aynı sonucu verir; DOM gerektirmez.
 */

/** Baştaki/sondaki boşlukları atar, iç boşlukları tek boşluğa indirir (Unicode NFC). */
export function normalizeLine(text: string): string {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}

const encoder = new TextEncoder();

/** Normalleştirilmiş metnin UTF-8 baytları üzerinden FNV-1a 32 bit, 8 haneli küçük harf hex. */
export function lineKey(text: string): string {
  const bytes = encoder.encode(normalizeLine(text));
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
