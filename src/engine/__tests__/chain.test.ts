/** Sıra Sende (harf değiştir): kural motoru ve oyun akışı. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  botMove,
  canGo,
  check,
  freeMoves,
  isAddDrop,
  isMove,
  isSwap,
  moves,
  pickCandidate,
  resolve,
  setWords,
  startWord,
} from '../chain';
import { newCtl, type RoomState } from '../types';
import { LocalTransport } from '../../online/local';
import { chainRank, missTurn, playWord, startChain, turnMs } from '../../game/chainDirector';
import { direct } from '../../game/director';

const WORDS = ['kedi', 'kadı', 'kart', 'kara', 'kaya', 'kaza', 'kala', 'kapı', 'kapa', 'çilek', 'kedık', 'kedim', 'kuru', 'kuzu', 'kutu', 'kuru', 'tutu'];

beforeEach(() => setWords(WORDS));

describe('Sıra Sende kuralları', () => {
  it('tek harf değişimi', () => {
    expect(isSwap('kedi', 'kadi')).toBe(true);
    expect(isSwap('kedi', 'kedi')).toBe(false);
    expect(isSwap('kedi', 'kadı')).toBe(false); // iki harf değişti
    expect(isSwap('kedi', 'kedil')).toBe(false);
  });
  it('harf ekleme/çıkarma', () => {
    expect(isAddDrop('kedi', 'kedim')).toBe(true);
    expect(isAddDrop('kedim', 'kedi')).toBe(true);
    expect(isAddDrop('kedi', 'kedi')).toBe(false);
    expect(isAddDrop('kedi', 'kedimi')).toBe(false);
  });
  it('kurala göre hamle', () => {
    expect(isMove('kuru', 'kuzu', 'degis')).toBe(true);
    expect(isMove('kuru', 'kurum', 'degis')).toBe(false);
    expect(isMove('kedi', 'kedim', 'serbest')).toBe(true);
  });
  it('komşu kelimeler sözlükten gelir', () => {
    const n = moves('kuru', 'degis');
    expect(n).toContain('kuzu');
    expect(n).toContain('kutu');
    expect(n).not.toContain('kuru');
    expect(freeMoves('kuru', ['kuzu'], 'degis')).not.toContain('kuzu');
    expect(canGo('kuru', ['kuzu', 'kutu'], 'degis')).toBe(false);
  });
  it('yazılan kelime sözlükte aranır (Türkçe karakter kaçsa da)', () => {
    expect(resolve('KEDİ')).toBe('kedi');
    expect(resolve('cilek')).toBe('çilek');
    expect(resolve('xyz')).toBe(null);
  });
  it('hamle neden kabul edilmez', () => {
    expect(check('kuru', 'kuzu', [], 'degis').why).toBe('ok');
    expect(check('kuru', '', [], 'degis').why).toBe('bos');
    expect(check('kuru', 'zzzz', [], 'degis').why).toBe('yok');
    expect(check('kuru', 'kuru', [], 'degis').why).toBe('ayni');
    expect(check('kuru', 'kuzu', ['kuzu'], 'degis').why).toBe('kullanildi');
    expect(check('kuru', 'kedi', [], 'degis').why).toBe('kural');
  });
  it('başlangıç kelimesinin yolu açıktır', () => {
    const w = startWord(4, 'degis');
    expect(w.length).toBe(4);
    expect(freeMoves(w, [w], 'degis').length).toBeGreaterThan(0);
  });
  it('bot hamle bulur, yol yoksa bulamaz', () => {
    expect(moves('kuru', 'degis')).toContain(botMove('kuru', ['kutu'], 'degis', 3)!);
    expect(botMove('kuru', ['kuzu', 'kutu'], 'degis', 2)).toBe(null);
  });
  it('el yazısı adaylarından kurala uyan seçilir', () => {
    const r = pickCandidate(['kedi', 'kuzu'], 'kuru', [], 'degis');
    expect(r.text).toBe('kuzu');
    expect(r.alts).toContain('kedi');
  });
});

describe('Sıra Sende akışı', () => {
  const settings = {
    cats: [{ id: 'kelime', label: 'Kelime', emoji: '' }],
    rounds: 1,
    time: 20,
    stop: false,
    grace: 0,
    hard: false,
    manualStop: false,
    game: 'siram' as const,
    len: 4,
    lives: 2,
    free: false,
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

  it('hamle, sıra, can ve oyun sonu', async () => {
    const t = new LocalTransport(room(), 'me');
    let s = room();
    t.subscribe((x) => x && (s = x));
    const flush = () => vi.advanceTimersByTimeAsync(0);

    await startChain(t, s);
    await flush();
    expect(s.ctl.phase).toBe('turn');
    expect(s.ctl.turn).toBe('me');
    expect(s.ctl.lives).toEqual({ me: 2, you: 2 });
    const word = s.ctl.word!;

    // Kuralsız hamle kabul edilmez
    expect(await playWord(t, s, 'zzzz')).toBe(false);
    // Geçerli hamle: puan, sıra karşıya geçer
    const good = freeMoves(word, [word], 'degis')[0];
    expect(await playWord(t, s, good)).toBe(true);
    await flush();
    expect(s.ctl.pts?.me).toBe(10);
    expect(s.ctl.turn).toBe('you');
    expect(s.ctl.chain?.split(',')).toContain(good);

    // Sırası olmayan oynayamaz
    expect(await playWord(t, s, freeMoves(s.ctl.word!, [], 'degis')[0] ?? 'kedi')).toBe(false);

    // Süre dolunca sıra kapanır: bir can gider
    vi.setSystemTime(s.ctl.endAt + 1000);
    await direct(t, s);
    await flush();
    expect(s.ctl.lives?.you).toBe(1);
    expect(s.ctl.turn).toBe('me');

    // Pas geçmek de can götürür
    expect(await missTurn(t, s, 'me', 'pass')).toBe(true);
    await flush();
    expect(s.ctl.lives?.me).toBe(1);

    // Canı biten elenir, tek kişi kalınca oyun biter
    vi.setSystemTime(s.ctl.endAt + turnMs(s) + 5000);
    await direct(t, s);
    await flush();
    expect(s.ctl.phase).toBe('final');
    expect(s.ctl.out).toBe('you');
    expect(chainRank(s)[0].pid).toBe('me');
  });
});
