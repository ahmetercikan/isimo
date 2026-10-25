/** Sinema Bilmecesi: cevap eşleştirme, ipuçları ve oyun akışı. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DECOYS, FILMS } from '../../data/films';
import { CLUE_PTS, CLUES, clueAt, clues, filmById, isRight, matchFilm, pickCandidate, poolFilms, setFilms, skeleton, suggest } from '../film';
import { newCtl, type RoomState } from '../types';
import { LocalTransport } from '../../online/local';
import { filmRank, filmStep, GRACE_MS, LEAD_MS, REVEAL_MS, guessFilm, startFilm } from '../../game/filmDirector';

beforeEach(() => setFilms(FILMS, DECOYS));

describe('Film listesi', () => {
  it('kimlikler tekil, her filmin altı ipucu var, konu cümlesinde filmin adı geçmiyor', () => {
    expect(new Set(FILMS.map((f) => f.id)).size).toBe(FILMS.length);
    for (const f of FILMS) {
      expect(clues(f)).toHaveLength(CLUES);
      const name = f.t.toLocaleLowerCase('tr-TR').split(/[\s:]+/)[0];
      if (name.length > 3) expect(f.k.toLocaleLowerCase('tr-TR')).not.toContain(name);
    }
  });

  it('yem adlar sorulan filmlerle çakışmıyor', () => {
    for (const d of DECOYS) expect(matchFilm(d)?.id ?? null).toBeNull();
  });

  it('yerli/yabancı ayrımı', () => {
    expect(poolFilms('yerli').every((f) => f.c === 'Türkiye')).toBe(true);
    expect(poolFilms('yabanci').some((f) => f.c === 'Türkiye')).toBe(false);
    expect(poolFilms('yerli').length + poolFilms('yabanci').length).toBe(FILMS.length);
  });
});

describe('Cevap eşleştirme', () => {
  const f = (id: string) => filmById(id)!;

  it('Türkçe karakter, büyük harf, boşluk ve noktalama farkı yok sayılır', () => {
    expect(isRight(f('shawshank'), 'esaretin bedeli')).toBe(true);
    expect(isRight(f('shawshank'), 'ESARETİN BEDELİ')).toBe(true);
    expect(isRight(f('gora'), 'gora')).toBe(true);
    expect(isRight(f('eskiya'), 'eskiya')).toBe(true);
    expect(isRight(f('kisuykusu'), 'Kis uykusu')).toBe(true);
  });

  it('orijinal ve kısa adlar da olur', () => {
    expect(isRight(f('shawshank'), 'The Shawshank Redemption')).toBe(true);
    expect(isRight(f('yuzuk'), 'Yüzüklerin Efendisi')).toBe(true);
    expect(isRight(f('harrypotter'), 'harry potter')).toBe(true);
    expect(isRight(f('titanik'), 'titanic')).toBe(true);
  });

  it('uzun adda küçük yazım hatası olur, kısa adda olmaz', () => {
    expect(isRight(f('shawshank'), 'esaretin bedli')).toBe(true);
    expect(isRight(f('selvi'), 'selvi boylum al yazmalim')).toBe(true);
    expect(isRight(f('godfather'), 'bab')).toBe(false);
    expect(isRight(f('godfather'), 'babam')).toBe(false);
  });

  it('başka filmin adı yanlış sayılır', () => {
    expect(isRight(f('godfather'), 'Babam ve Oğlum')).toBe(false);
    expect(isRight(f('babamveoglum'), 'Baba')).toBe(false);
    expect(isRight(f('matrix'), 'Avatar')).toBe(false);
    expect(isRight(f('matrix'), 'Joker')).toBe(false);
    expect(isRight(f('matrix'), '')).toBe(false);
  });

  it('öneri listesi: baştan ya da bir kelimesi uyanlar, yem adlar da çıkar', () => {
    expect(suggest('esa')).toContain('Esaretin Bedeli');
    expect(suggest('efendi')).toContain('Yüzüklerin Efendisi: Yüzük Kardeşliği');
    expect(suggest('ka').length).toBeLessThanOrEqual(4);
    expect(suggest('k')).toEqual([]);
    expect(suggest('jok')).toContain('Joker');
  });

  it('el yazısı adaylarından film adına denk geleni seçer', () => {
    expect(pickCandidate(['tltanik', 'titanik', 'titanlk']).text).toBe('titanik');
    expect(pickCandidate(['xq', 'esar']).text).toBe('esar');
    expect(pickCandidate([]).text).toBe('');
  });
});

describe('İpuçları', () => {
  it('iskelet: her kelimenin ilk harfi açık', () => {
    expect(skeleton('Esaretin Bedeli')).toEqual(['E_______', 'B_____']);
    expect(skeleton('Yüzüklerin Efendisi: Yüzük')).toEqual(['Y_________', 'E_______:', 'Y____']);
  });

  it('ipucu zamanı ve puanı', () => {
    expect(clueAt(1000, 10_000, 999)).toBe(0);
    expect(clueAt(1000, 10_000, 1000)).toBe(1);
    expect(clueAt(1000, 10_000, 11_000)).toBe(2);
    expect(clueAt(1000, 10_000, 999_999)).toBe(CLUES);
  });

  it('çizgi filmde oyuncu yerine seslendiren yazar', () => {
    expect(clues(filmById('aslankral')!).map((c) => c.label)).toContain('Seslendiren');
  });
});

describe('Sinema Bilmecesi akışı', () => {
  const settings = {
    cats: [{ id: 'film', label: 'Film', emoji: '' }],
    rounds: 2,
    time: 10,
    stop: false,
    grace: 0,
    hard: false,
    manualStop: false,
    game: 'film' as const,
    pool: 'hepsi' as const,
  };
  const room = (): RoomState => ({
    code: 'BOT',
    host: 'me',
    created: 1_000_000,
    settings,
    players: {
      me: { name: 'Ben', avatar: 'robot', color: '#f00', joined: 1, on: true },
      you: { name: 'Bot', avatar: 'tilki', color: '#0f0', joined: 2, on: true, bot: 2 },
    },
    ctl: newCtl(),
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
  });
  afterEach(() => vi.useRealTimers());

  it('ipucuna göre puan, yanlış tahmin, açıklama, sıradaki film ve final', async () => {
    const t = new LocalTransport(room(), 'me');
    let s = room();
    t.subscribe((x) => x && (s = x));
    const flush = () => vi.advanceTimersByTimeAsync(0);
    const wait = async (ms: number) => {
      vi.setSystemTime(Date.now() + ms);
      await flush();
    };

    expect(await startFilm(t, s)).toBe(true);
    await flush();
    expect(s.ctl.phase).toBe('clue');
    expect(s.ctl.round).toBe(1);
    const first = filmById(s.ctl.film)!;
    expect(s.ctl.pts).toEqual({ me: 0, you: 0 });

    // Tur başlamadan tahmin olmaz
    expect(await guessFilm(t, s, first.t)).toBe('late');

    // İkinci ipucunda bilen 80 alır; yanlış tahmin puan değiştirmez
    await wait(LEAD_MS + 10_000 + 100);
    const other = FILMS.find((f) => f.id !== first.id)!;
    expect(await guessFilm(t, s, other.t)).toBe('wrong');
    expect(await guessFilm(t, s, first.t)).toBe('ok');
    await flush();
    expect(s.ctl.got).toEqual({ me: CLUE_PTS[1] });
    // Aynı oyuncu ikinci kez puan almaz
    expect(await guessFilm(t, s, first.t)).toBe('late');

    // Bot dördüncü ipucunda bilir; herkes bilince tur kapanır (film açıklanır)
    await wait(20_000);
    expect(await guessFilm(t, s, first.t, 'you')).toBe('ok');
    await flush();
    await filmStep(t, s);
    await flush();
    expect(s.ctl.nextAt).toBeGreaterThan(0);
    expect(await guessFilm(t, s, first.t, 'you')).toBe('late');

    // Açıklama bitince sıradaki film (aynısı gelmez)
    await wait(REVEAL_MS + 10);
    await filmStep(t, s);
    await flush();
    expect(s.ctl.round).toBe(2);
    expect(s.ctl.film).not.toBe(first.id);
    expect(s.ctl.got ?? {}).toEqual({});
    expect(s.ctl.films?.split(',')).toHaveLength(2);

    // Kimse bilemezse süre dolunca kapanır; son film de bitince final
    await wait(LEAD_MS + CLUES * 10_000 + GRACE_MS + 10);
    await filmStep(t, s);
    await flush();
    expect(s.ctl.nextAt).toBeGreaterThan(0);
    await wait(REVEAL_MS + 10);
    await filmStep(t, s);
    await flush();
    expect(s.ctl.phase).toBe('final');
    expect(filmRank(s).map((r) => [r.pid, r.pts])).toEqual([
      ['me', CLUE_PTS[1]],
      ['you', CLUE_PTS[3]],
    ]);
  });
});
