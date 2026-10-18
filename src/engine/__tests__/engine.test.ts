import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { catById } from '../categories';
import { loadDicts, lookup } from '../dict';
import { judgeCategory, ranking, scoreRound } from '../scoring';
import { availableLetters, capitalize, fixFirstLetter, fold, isAnswer, locative, norm, startsWithLetter } from '../tr';
import { newCtl, rKey, type RoomState } from '../types';
import { LocalTransport } from '../../online/local';
import { applyPatch } from '../../online/transport';
import { direct, FLUSH_MS, letterAt, pickStopper, pressStop, REVEAL_MS, startGame, stopLetter, TICK_MS } from '../../game/director';
import { chooseCandidate, inkToPath } from '../../lib/ink';

beforeAll(async () => {
  await loadDicts(['isim', 'sehir', 'hayvan', 'bitki', 'esya', 'ulke']);
});

describe('Türkçe harfler', () => {
  it('İ/ı ve büyük harf', () => {
    expect(capitalize('istanbul')).toBe('İstanbul');
    expect(capitalize('ılgaz')).toBe('Ilgaz');
    expect(startsWithLetter('ırmak', 'I')).toBe(true);
    expect(startsWithLetter('irmik', 'I')).toBe(false);
    expect(startsWithLetter('irmik', 'İ')).toBe(true);
  });
  it('karşılaştırma anahtarları', () => {
    expect(norm('Kuru Fasulye')).toBe(norm('kurufasulye'));
    expect(fold('Çorum')).toBe(fold('corum'));
  });
  it('ilk harfin noktası/çengeli düzeltilir', () => {
    expect(fixFirstLetter('cilek', 'Ç')).toBe('çilek');
    expect(fixFirstLetter('Sile', 'Ş')).toBe('Şile');
    expect(fixFirstLetter('Kars', 'Ç')).toBe('Kars');
    expect(fixFirstLetter('Izmir', 'İ')).toBe('İzmir');
  });
  it('cevap sayılan kutu: harfi tutan, en az iki harfli', () => {
    expect(isAnswer('Kars', 'K')).toBe(true);
    expect(isAnswer('Ok', 'O')).toBe(true);
    expect(isAnswer('Kuru fasulye', 'K')).toBe(true);
    // düz çizgi "l"/"i" okunur: tek harf cevap sayılmaz
    expect(isAnswer('l', 'K')).toBe(false);
    expect(isAnswer('I', 'I')).toBe(false);
    expect(isAnswer('', 'K')).toBe(false);
    expect(isAnswer('  ', 'K')).toBe(false);
    // yanlış harfle başlayan cevap puan almaz, kutuyu da doldurmaz
    expect(isAnswer('Ankara', 'K')).toBe(false);
  });
  it('isme -de/-da/-te/-ta eki', () => {
    expect(locative('Ali')).toBe("Ali'de");
    expect(locative('Bilge Baykuş')).toBe("Bilge Baykuş'ta");
    expect(locative('Zeynep')).toBe("Zeynep'te");
    expect(locative('Arda')).toBe("Arda'da");
    expect(locative('Robo Ramiz')).toBe("Robo Ramiz'de");
  });
  it('kullanılmış ve zor harfler çıkmaz', () => {
    const a = availableLetters('AB', false);
    expect(a).not.toContain('A');
    expect(a).not.toContain('Ğ');
    expect(a).not.toContain('J');
    expect(availableLetters('', true)).toContain('J');
  });
});

describe('Sözlük', () => {
  it('tam, Türkçe karaktersiz ve tek harf hatalı eşleşme', () => {
    expect(lookup('sehir', 'Ankara')).toBeTruthy();
    expect(lookup('sehir', 'canakkale')).toBeTruthy();
    expect(lookup('hayvan', 'zürafa')).toBeTruthy();
    expect(lookup('hayvan', 'kaplumbga')).toBeTruthy();
    expect(lookup('sehir', 'Qwerty')).toBe(null);
    expect(lookup('yokboyle', 'x')).toBe(undefined);
  });
  it('el yazısı adaylarından sözlükteki ve harfi tutan seçilir', () => {
    const r = chooseCandidate(['Kors', 'Kars', 'kars'], 'K', 'sehir');
    expect(r.text).toBe('Kars');
    expect(r.alts).toContain('Kors');
    expect(chooseCandidate(['Cankırı'], 'Ç', 'sehir').text).toBe('Çankırı');
    expect(chooseCandidate(['ALI', 'Ali'], 'A', 'isim').text).toBe('Ali');
    expect(chooseCandidate(['TOKAT'], 'T', 'sehir').text).toBe('Tokat');
    expect(chooseCandidate(['ZXQWE'], 'Z', 'sehir').text).toBe('Zxqwe');
  });
  it('çizgi/nokta (tek harflik adaylar) cevap olarak alınmaz', () => {
    // düz çizgi için tanıyıcının döndürdükleri
    expect(chooseCandidate(['1', '|', 'l', 'i', 'I', "'", '.'], 'K', 'isim').text).toBe('');
    expect(chooseCandidate(['1', '|', 'l', 'i', 'I'], 'I', 'isim').text).toBe('');
    // gerçek kelime varsa o seçilir
    expect(chooseCandidate(['l', 'Kars'], 'K', 'sehir').text).toBe('Kars');
  });
});

describe('Puanlama', () => {
  const judge = (answers: Record<string, string>, votes?: Record<string, Record<string, true>>, catId = 'sehir', letter = 'K') =>
    judgeCategory({ catId, letter, pids: Object.keys(answers), answers, votes, voters: Object.keys(answers) });

  it('tek harflik cevap puan almaz', () => {
    const v = judge({ a: 'K', b: 'Kars' });
    expect(v.a.reason).toBe('short');
    expect(v.a.pts).toBe(0);
    expect(v.b.pts).toBe(20);
  });
  it('tek: 10, aynı: 5, tek geçerli: 20, boş/yanlış harf: 0', () => {
    const v = judge({ a: 'Kars', b: 'kars', c: 'Konya', d: '', e: 'Ankara' });
    expect(v.a.pts).toBe(5);
    expect(v.b.pts).toBe(5);
    expect(v.c.pts).toBe(10);
    expect(v.d.pts).toBe(0);
    expect(v.e.reason).toBe('letter');
    const solo = judge({ a: 'Kars', b: '', c: 'Ankara' });
    expect(solo.a.pts).toBe(20);
  });
  it('çoğunluk oyu iptal eder; sözlükteki cevap tek oyla iptal olmaz', () => {
    const made = judge({ a: 'Kıpkıp', b: 'Kars', c: 'Konya' }, { a: { b: true, c: true } });
    expect(made.a.reason).toBe('voted');
    const one = judge({ a: 'Kıpkıp', b: 'Kars', c: 'Konya' }, { a: { b: true } });
    expect(one.a.valid).toBe(true);
    const two = judge({ a: 'Kars', b: 'Konya' }, { a: { b: true } });
    expect(two.a.valid).toBe(true); // sözlükte: 2 kişilik oyunda iptal edilemez
    const twoMade = judge({ a: 'Kıpkıp', b: 'Konya' }, { a: { b: true } });
    expect(twoMade.a.valid).toBe(false);
  });
});

describe('Yol yaması', () => {
  it('iç içe yazar ve siler', () => {
    const o: Record<string, unknown> = {};
    applyPatch(o, { 'a/b/c': 1, 'a/d': 2 });
    expect(o).toEqual({ a: { b: { c: 1 }, d: 2 } });
    applyPatch(o, { 'a/b': null, 'x/y': null });
    expect(o).toEqual({ a: { d: 2 } });
  });
});

describe('Oyun akışı', () => {
  afterEach(() => vi.useRealTimers());

  const room = (): RoomState => ({
    code: 'BOT',
    host: 'me',
    created: 0,
    settings: { cats: ['isim', 'sehir', 'hayvan'].map((id) => catById(id)!), rounds: 2, time: 60, stop: true, grace: 10, hard: false, manualStop: true },
    players: {
      me: { name: 'Ben', avatar: '🦊', color: '#f00', joined: 1, on: true },
      you: { name: 'Sen', avatar: '🐼', color: '#0f0', joined: 2, on: true },
    },
    ctl: newCtl(),
  });

  it('harf → yazma → STOP → değerlendirme → puan → final', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const t = new LocalTransport(room(), 'me');
    let s = room();
    t.subscribe((x) => x && (s = x));
    const flush = async () => {
      await vi.advanceTimersByTimeAsync(0);
    };

    await startGame(t, s);
    await flush();
    expect(s.ctl.phase).toBe('spin');
    expect(s.ctl.stopper).toBe(pickStopper(s, 1));

    // Sayaçta görünen harf seçilir
    vi.setSystemTime(1_000_000 + TICK_MS * 3 + 5);
    const shown = letterAt(s.ctl, false, Date.now());
    await stopLetter(t, s);
    await flush();
    expect(s.ctl.phase).toBe('write');
    expect(s.ctl.letter).toBe(shown);
    const L = s.ctl.letter;

    // Yazma başlamadan STOP yok
    expect(await pressStop(t, s)).toBe(false);
    vi.setSystemTime(s.ctl.startAt + 5000);
    const word = (cat: string) => ({ isim: { A: 'Ali', B: 'Burak', C: 'Can', D: 'Deniz', E: 'Emre' }[L] ?? `${L}xx`, sehir: `${L}şehir`, hayvan: '' }[cat] ?? '');
    await t.update({ [`answers/${rKey(1)}/me/isim`]: word('isim'), [`answers/${rKey(1)}/you/isim`]: word('isim'), [`answers/${rKey(1)}/me/sehir`]: word('sehir') });
    await flush();
    expect(await pressStop(t, s)).toBe(true);
    await flush();
    expect(s.ctl.stopBy).toBe('me');
    expect(s.ctl.endAt).toBeLessThanOrEqual(Date.now() + 10_000);

    // Süre + son gönderimler → değerlendirme
    vi.setSystemTime(s.ctl.endAt + FLUSH_MS + 10);
    await direct(t, s);
    await flush();
    expect(s.ctl.phase).toBe('review');

    // Herkes "tamam" deyince kategoriler ilerler, sonunda puanlar
    for (let i = 0; i < 3; i++) {
      await t.update({ [`ready/r1/me`]: s.ctl.cat, [`ready/r1/you`]: s.ctl.cat });
      await flush();
      await direct(t, s);
      await flush();
    }
    expect(s.ctl.phase).toBe('scores');
    expect(s.results?.r1).toBeTruthy();
    expect(s.results!.r1.sum.me).toBe(scoreRound({ ...s, ctl: { ...s.ctl, letter: L } }, 1).sum.me);
    expect(s.results!.r1.pts.me.isim).toBe(5); // aynı isim
    expect(s.results!.r1.pts.me.sehir).toBe(20); // tek geçerli

    // Otomatik sonraki tur: başka harf, sıradaki durdurucu
    vi.setSystemTime(s.ctl.nextAt + 1);
    await direct(t, s);
    await flush();
    expect(s.ctl.phase).toBe('spin');
    expect(s.ctl.round).toBe(2);
    expect(s.ctl.stopper).toBe('you');
    expect(s.ctl.used).toBe(L);

    // Durdurucu basmazsa sayaç kendi durur; harf tekrar etmez
    vi.setSystemTime(s.ctl.spinAt + 9500);
    await direct(t, s);
    await flush();
    expect(s.ctl.phase).toBe('write');
    expect(s.ctl.letter).not.toBe(L);
    expect(s.ctl.startAt - Date.now()).toBe(REVEAL_MS);

    expect(ranking(s)[0].pid).toBe('me');
  });
});

describe('El yazısı izi', () => {
  it('kısa SVG yolu üretir', () => {
    const p = inkToPath([{ x: [0, 10, 20, 30], y: [0, 40, 0, 40], t: [0, 1, 2, 3] }]);
    expect(p).toMatch(/^\d+\|M/);
    expect(p.length).toBeLessThan(200);
  });
});
