import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ platform: 'android', listeners: new Map<string, Set<() => void>>(), show: vi.fn(), remove: vi.fn() }));
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => mock.platform } }));
vi.mock('@capacitor-community/admob', () => ({
  AdmobConsentStatus: { REQUIRED: 'required' }, BannerAdPluginEvents: { SizeChanged: 'size', FailedToLoad: 'banner-fail' },
  BannerAdPosition: {}, BannerAdSize: {}, MaxAdContentRating: {},
  InterstitialAdPluginEvents: { Dismissed: 'dismiss', FailedToShow: 'fail', FailedToLoad: 'load-fail' },
  AdMob: {
    requestConsentInfo: vi.fn(async () => ({})), initialize: vi.fn(async () => {}), prepareInterstitial: vi.fn(async () => {}),
    showInterstitial: mock.show,
    addListener: vi.fn(async (event: string, fn: () => void) => {
      const listeners = mock.listeners.get(event) ?? new Set(); listeners.add(fn); mock.listeners.set(event, listeners);
      return { remove: async () => { listeners.delete(fn); mock.remove(); } };
    }),
  },
}));
const emit = (event: string) => mock.listeners.get(event)?.forEach((fn) => fn());
const ready = async () => { const ads = await import('../ads'); await ads.initAds(); await Promise.resolve(); return ads; };
beforeEach(() => { vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(1_000_000); mock.platform = 'android'; mock.listeners.clear(); mock.show.mockReset().mockResolvedValue(undefined); mock.remove.mockClear(); });
afterEach(() => vi.useRealTimers());
describe('Oyun sonu reklamı', () => {
  it('eşzamanlı sonuç düğmeleri tek reklamın kapanmasını bekler; dinleyiciler temizlenir', async () => {
    const ads = await ready(); const first = ads.maybeInterstitial(); const second = ads.maybeInterstitial();
    expect(second).toBe(first);
    await vi.advanceTimersByTimeAsync(0); expect(mock.show).toHaveBeenCalledTimes(1);
    emit('dismiss'); await first; expect(mock.remove).toHaveBeenCalledTimes(2);
    await ads.maybeInterstitial(); expect(mock.show).toHaveBeenCalledTimes(1);
  });
  it('gösterim hatasında çıkışı serbest bırakır', async () => {
    const ads = await ready(); const done = ads.maybeInterstitial();
    await vi.advanceTimersByTimeAsync(0); emit('fail'); await done;
    expect(mock.remove).toHaveBeenCalledTimes(2);
  });
  it('eklenti olay göndermese de 60 saniyede çıkışı serbest bırakır', async () => {
    const ads = await ready(); const done = ads.maybeInterstitial();
    await vi.advanceTimersByTimeAsync(60_000); await done;
    expect(mock.remove).toHaveBeenCalledTimes(2);
  });
  it('webde tam ekran reklam açmaz', async () => {
    mock.platform = 'web'; const ads = await ready(); await ads.maybeInterstitial();
    expect(mock.show).not.toHaveBeenCalled();
  });
});
