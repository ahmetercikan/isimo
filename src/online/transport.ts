/**
 * Oda bağlantısı: botlu oyun (LocalTransport, bellekte) ve çevrimiçi oyun (Firebase) aynı arayüzü kullanır.
 * Oyun mantığı (src/game/director.ts) yalnızca bu arayüzü bilir.
 */
import type { Ctl, RoomState } from '../engine/types';

export interface Transport {
  readonly kind: 'local' | 'online';
  /** Bu cihazdaki oyuncunun kimliği. */
  readonly me: string;
  readonly code: string;
  subscribe(cb: (s: RoomState | null) => void): () => void;
  /** Botlar için son bilinen durum (ağa gitmez; henüz hiç gelmediyse null). */
  peek(): RoomState | null;
  /** Herkeste aynı saat (sunucu saatine göre düzeltilmiş). */
  now(): number;
  /** Oda köküne göre çok yollu güncelleme ("answers/r1/pid/isim": "Ali"); null siler. */
  update(patch: Record<string, unknown>): Promise<void>;
  /** Kontrol düğümünde güvenli geçiş: fn undefined dönerse vazgeçilir. Döner: yazıldı mı. */
  transactCtl(fn: (ctl: Ctl) => Ctl | undefined): Promise<boolean>;
  /** El yazısı izleri (ayrı tutulur; yalnızca değerlendirmede indirilir). */
  setInk(round: number, catId: string, path: string | null): Promise<void>;
  getInk(round: number): Promise<Record<string, Record<string, string>>>;
  clearInk(): Promise<void>;
  /** Odadan ayrıl (lobideyse oyuncu silinir; oyundaysa puanı kalır). */
  leave(): Promise<void>;
}

/** "a/b/c" yollarıyla iç içe nesneyi günceller (null/undefined: siler). */
export function applyPatch(root: Record<string, unknown>, patch: Record<string, unknown>) {
  for (const [path, value] of Object.entries(patch)) {
    const parts = path.split('/').filter(Boolean);
    let o = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const k = parts[i];
      if (typeof o[k] !== 'object' || o[k] === null) {
        if (value == null) {
          o = {};
          break;
        }
        o[k] = {};
      }
      o = o[k] as Record<string, unknown>;
    }
    const last = parts[parts.length - 1];
    if (value == null) delete o[last];
    else o[last] = value;
  }
}
