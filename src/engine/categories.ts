/** Kategoriler: sözlüğü olanlar (src/data/dict/{id}.json) ve oyuncunun eklediği özel kategoriler. */
export interface Category {
  id: string;
  label: string;
  emoji: string;
  /** Oyuncunun eklediği kategori (sözlük yok; geçerliliğe oylama karar verir). */
  custom?: boolean;
}

export const CATEGORIES: (Category & { hint: string; color: string })[] = [
  { id: 'isim', label: 'İsim', emoji: '🧒', hint: 'bir kişi adı', color: '#ff6b4a' },
  { id: 'sehir', label: 'Şehir', emoji: '🏙️', hint: 'bir şehir ya da ilçe', color: '#14a89a' },
  { id: 'hayvan', label: 'Hayvan', emoji: '🦁', hint: 'bir hayvan', color: '#ff9f1c' },
  { id: 'bitki', label: 'Bitki', emoji: '🌿', hint: 'çiçek, ağaç, meyve, sebze', color: '#2bb673' },
  { id: 'esya', label: 'Eşya', emoji: '🪑', hint: 'bir eşya ya da nesne', color: '#7c5cff' },
  { id: 'ulke', label: 'Ülke', emoji: '🌍', hint: 'bir ülke', color: '#3ea6f0' },
  { id: 'meslek', label: 'Meslek', emoji: '👩‍🍳', hint: 'bir meslek', color: '#e9487d' },
  { id: 'yemek', label: 'Yemek', emoji: '🍲', hint: 'yemek ya da içecek', color: '#f2711c' },
  { id: 'unlu', label: 'Ünlü', emoji: '⭐', hint: 'ünlü bir kişi', color: '#e8a200' },
  { id: 'marka', label: 'Marka', emoji: '🏷️', hint: 'bir marka', color: '#5b6cff' },
  { id: 'dizi', label: 'Film/Dizi', emoji: '🎬', hint: 'bir film ya da dizi', color: '#d6336c' },
  { id: 'spor', label: 'Spor/Oyun', emoji: '⚽', hint: 'spor dalı ya da oyun', color: '#0ca678' },
  { id: 'renk', label: 'Renk', emoji: '🎨', hint: 'bir renk', color: '#f06595' },
  { id: 'vucut', label: 'Vücut', emoji: '💪', hint: 'vücudun bir parçası', color: '#c2410c' },
];

export const DEFAULT_CATS = ['isim', 'sehir', 'hayvan', 'bitki', 'esya', 'ulke'];
export const MIN_CATS = 3;
export const MAX_CATS = 10;

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function catInfo(c: Category): { hint: string; color: string } {
  const b = BY_ID.get(c.id);
  return b ? { hint: b.hint, color: b.color } : { hint: c.label.toLocaleLowerCase('tr-TR'), color: '#14a89a' };
}

export const hasDict = (id: string) => BY_ID.has(id);

export const catById = (id: string): Category | undefined => {
  const c = BY_ID.get(id);
  return c && { id: c.id, label: c.label, emoji: c.emoji };
};
