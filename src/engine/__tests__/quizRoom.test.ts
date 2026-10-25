import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { newCtl, type RoomState } from '../types';
import { QUESTION_MS, type Quiz } from '../quiz';
import { answerQuiz, QUIZ_LEAD_MS, QUIZ_REVEAL_MS, quizRank, quizStep, startQuiz } from '../../game/quizDirector';
import { LocalTransport } from '../../online/local';
import type { Transport } from '../../online/transport';
import { actingHost, backToLobby } from '../../game/director';

const quiz: Quiz = { id: 't', title: 'T', ask: 'A', tiers: Array.from({ length: 6 }, (_, i) => ({ name: `${i}`, line: 'L' })), questions: Array.from({ length: 30 }, (_, i) => ({ d: (i % 3 + 1) as 1 | 2 | 3, q: `Soru ${i}`, a: ['A', 'B', 'C', 'D'] })) };
let base: LocalTransport;
const snap = () => structuredClone(base.peek());
function player(pid: string): Transport {
  return new Proxy(base, { get: (obj, key) => key === 'kind' ? 'online' : key === 'me' ? pid : typeof Reflect.get(obj, key) === 'function' ? Reflect.get(obj, key).bind(obj) : Reflect.get(obj, key) }) as unknown as Transport;
}
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(100000);
  const p = { name: 'A', avatar: 'kaplan', color: '#123456', joined: 1, on: true };
  const s: RoomState = { code: 'TEST', host: 'a', created: 1, settings: { cats: [], rounds: 10, time: 20, stop: false, grace: 0, hard: false, manualStop: false, game: 'quiz', quizId: 't' }, players: { a: p, b: { ...p, name: 'B', joined: 2 } }, ctl: newCtl() };
  base = new LocalTransport(s, 'a');
});
afterEach(() => vi.useRealTimers());
const start = async () => { expect(await startQuiz(player('a'), snap(), quiz)).toBe(true); vi.setSystemTime(100000 + QUIZ_LEAD_MS); };

describe('Arkadaşlarla Sen Ne Kadar…?', () => {
  it('en az iki bağlı insan gerekir; bot ve yerel mod başlatamaz', async () => {
    expect(await startQuiz(base, snap(), quiz)).toBe(false);
    base.peek().players.b.on = false;
    base.peek().players['bot-0'] = { ...base.peek().players.a, bot: 2 };
    expect(await startQuiz(player('a'), snap(), quiz)).toBe(false);
  });
  it('tek ortak soru planı kurar, eşzamanlı başlatmalar tek kez işler', async () => {
    const s = snap();
    expect(await Promise.all([startQuiz(player('a'), s, quiz), startQuiz(player('a'), s, quiz)])).toEqual([true, false]);
    expect(snap().ctl.quiz?.questions).toHaveLength(10);
    expect(new Set(snap().ctl.quiz?.questions.map((q) => q.key)).size).toBe(10);
  });
  it('erken, geç, geçersiz ve seyirci cevapları kabul edilmez', async () => {
    await startQuiz(player('a'), snap(), quiz);
    expect(await answerQuiz(player('a'), snap(), 0)).toBe(false);
    vi.setSystemTime(100000 + QUIZ_LEAD_MS);
    expect(await answerQuiz(player('a'), snap(), 7)).toBe(false);
    base.peek().players.c = { ...base.peek().players.a, name: 'C' };
    expect(await answerQuiz(player('c'), snap(), 0)).toBe(false);
    vi.setSystemTime(snap().ctl.endAt);
    expect(await answerQuiz(player('a'), snap(), 0)).toBe(false);
  });
  it('eşzamanlı cevaplar kaybolmaz, bir oyuncu ikinci kez puan alamaz', async () => {
    await start(); const s = snap(), right = s.ctl.quiz!.questions[0].right;
    expect(await Promise.all([answerQuiz(player('a'), s, right), answerQuiz(player('b'), s, right)])).toEqual([true, true]);
    expect(await answerQuiz(player('a'), s, right)).toBe(false);
    expect(snap().ctl.pts).toEqual({ a: 150, b: 150 });
    expect(snap().ctl.quizCorrect).toEqual({ a: 1, b: 1 });
    expect(quizRank(snap()).map((r) => r.rank)).toEqual([1, 1]);
  });
  it('herkes yanıtlamadan doğru cevap açıklanmaz; sonra ortak sonraki soru gelir', async () => {
    await start(); await answerQuiz(player('a'), snap(), 0);
    await quizStep(player('a'), snap()); expect(snap().ctl.nextAt).toBe(0);
    await answerQuiz(player('b'), snap(), 1);
    await quizStep(player('a'), snap()); expect(snap().ctl.nextAt).toBe(Date.now() + QUIZ_REVEAL_MS);
    const old = snap(); vi.setSystemTime(old.ctl.nextAt);
    await quizStep(player('a'), snap()); expect(snap().ctl.round).toBe(2);
    expect(snap().ctl.quizPicks).toEqual({});
    expect(await answerQuiz(player('a'), old, 0)).toBe(false);
  });
  it('cevap vermeyen veya bağlantısı kesilen oyuncu oyunu kilitlemez; ev sahibi devredilir', async () => {
    await start(); base.peek().players.a.on = false;
    expect(actingHost(snap())).toBe('b');
    await answerQuiz(player('b'), snap(), 0);
    await quizStep(player('b'), snap()); expect(snap().ctl.nextAt).toBeGreaterThan(0);
  });
  it('süre dolunca cevapsızları beklemeden finale kadar ilerler; yeni oyunda puanlar sıfırlanır', async () => {
    await start();
    for (let i = 1; i <= 10; i++) {
      vi.setSystemTime(snap().ctl.endAt + QUESTION_MS);
      await quizStep(player('a'), snap());
      vi.setSystemTime(snap().ctl.nextAt);
      await quizStep(player('a'), snap());
    }
    expect(snap().ctl.phase).toBe('final');
    const old = snap(); await backToLobby(player('a'));
    expect(await startQuiz(player('a'), snap(), quiz)).toBe(true);
    expect(snap().ctl.quiz?.run).not.toBe(old.ctl.quiz?.run);
    expect(snap().ctl.pts).toEqual({ a: 0, b: 0 });
    expect(await answerQuiz(player('a'), old, 0)).toBe(false);
  });
});
