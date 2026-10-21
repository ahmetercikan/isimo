/**
 * Telefon bildirimleri (yalnız Android/iOS uygulamasında; tarayıcıda sessizce hiçbir şey yapmaz).
 *
 * Bunlar **yerel** bildirimlerdir: uygulamanın kendisi, Firebase'den gelen bir değişikliği görünce
 * telefona bildirim düşürür. Uygulama tamamen kapalıyken bildirim gelmez — onun için sunucu
 * (Firebase Cloud Functions + Blaze paketi) gerekir; bilerek öyle kurulmadı (bkz. CLAUDE.md).
 *
 * İzin: Android 13+ ve iOS izin ister. İzni uygulama ilk açılışta değil, oyuncu "Arkadaşlar"
 * ekranına girince isteriz — Google ve Apple bağlamsız izin isteğini hoş karşılamıyor,
 * oyuncu da neden istendiğini bilmeden reddediyor.
 */
import { Capacitor } from '@capacitor/core';

/** Bildirim kanalı/çeşidi: hangi ayarın kapattığını bilmek için. */
export type NotifyKind = 'davet' | 'istek' | 'cevrimici';

const native = () => Capacitor.isNativePlatform();

type Plugin = typeof import('@capacitor/local-notifications').LocalNotifications;
let plugin: Plugin | null = null;

/** Eklenti yalnız gerektiğinde (ilk bildirimde) yüklenir. */
async function load(): Promise<Plugin | null> {
  if (!native()) return null;
  if (!plugin) {
    try {
      plugin = (await import('@capacitor/local-notifications')).LocalNotifications;
    } catch {
      return null;
    }
  }
  return plugin;
}

/** Bildirim izni verilmiş mi (sormadan bakar). */
export async function notifyAllowed(): Promise<boolean> {
  const p = await load();
  if (!p) return false;
  try {
    return (await p.checkPermissions()).display === 'granted';
  } catch {
    return false;
  }
}

/** İzin ister. Döner: izin verildi mi. Oyuncu daha önce reddettiyse sistem yeniden sormaz. */
export async function askNotify(): Promise<boolean> {
  const p = await load();
  if (!p) return false;
  try {
    if ((await p.checkPermissions()).display === 'granted') return true;
    return (await p.requestPermissions()).display === 'granted';
  } catch {
    return false;
  }
}

let nextId = 1;

/** Bildirimi gösterir (izin yoksa ya da tarayıcıdaysa sessizce hiçbir şey yapmaz). */
export async function notify(title: string, body: string, kind: NotifyKind = 'davet') {
  const p = await load();
  if (!p) return;
  try {
    if ((await p.checkPermissions()).display !== 'granted') return;
    await p.schedule({
      notifications: [
        {
          id: nextId++,
          title,
          body,
          // Oyuncu bildirime dokununca uygulama açılır; hangi tür olduğunu da taşıyalım.
          extra: { kind },
        },
      ],
    });
  } catch {
    /* bildirim gösterilemezse oyun etkilenmesin */
  }
}
