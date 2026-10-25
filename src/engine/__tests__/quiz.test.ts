/** "Sen Ne Kadar…?": tur seçimi, unvan basamakları ve soru dosyalarının biçimi. */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pickRound, QUESTION_MS, questionPoints, ROUND, tierIndex, type Quiz } from '../quiz';
import { QUIZZES } from '../../data/quiz/meta';

const dir = 'src/data/quiz';
const quizzes: Quiz[] = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')));

describe('Sen Ne Kadar… motoru', () => {
  const q: Quiz = {
    id: 't', title: 'T', ask: 'A', tiers: Array.from({ length: 6 }, (_, i) => ({ name: `u${i}`, line: '' })),
    questions: Array.from({ length: 30 }, (_, i) => ({ d: ((i % 3) + 1) as 1 | 2 | 3, q: `s${i}`, a: ['doğru', 'b', 'c', 'd'] })),
  };
  it('10 soru, kolaydan zora, doğru şık yerinde', () => {
    const r = pickRound(q);
    expect(r).toHaveLength(ROUND);
    for (let i = 1; i < r.length; i++) expect(r[i].d).toBeGreaterThanOrEqual(r[i - 1].d);
    for (const x of r) expect(x.options[x.right]).toBe('doğru');
    expect(new Set(r.map((x) => x.key)).size).toBe(ROUND);
  });
  it('son sorulanlar mümkünse tekrar gelmez', () => {
    const first = pickRound(q).map((x) => x.key);
    const second = pickRound(q, first).map((x) => x.key);
    expect(second.filter((k) => first.includes(k))).toHaveLength(0);
  });
  it('unvan basamakları', () => {
    expect(tierIndex(0)).toBe(0);
    expect(tierIndex(3)).toBe(1);
    expect(tierIndex(5)).toBe(2);
    expect(tierIndex(7)).toBe(3);
    expect(tierIndex(9)).toBe(4);
    expect(tierIndex(10)).toBe(5);
  });
  it('süre bonusu soru başına 150 puanı aşmaz', () => {
    expect(questionPoints(true, QUESTION_MS + 600)).toBe(150);
    expect(questionPoints(true, QUESTION_MS)).toBe(150);
    expect(questionPoints(true, QUESTION_MS / 2)).toBe(125);
    expect(questionPoints(true, -500)).toBe(100);
    expect(questionPoints(false, QUESTION_MS)).toBe(0);
  });
  it('doğru/yanlış şıkları doğru sırada ve doğru cevapla gelir', () => {
    const data: Quiz = { ...q, questions: q.questions.map((x, i) => ({ ...x, tf: true, a: i % 2 ? ['Yanlış', 'Doğru'] : ['Doğru', 'Yanlış'] })) };
    for (const x of pickRound(data)) {
      expect(x.options).toEqual(['Doğru', 'Yanlış']);
      expect(x.options[x.right]).toBe(x.a[0]);
    }
  });
});

describe('Soru dosyaları', () => {
  it('menü gerçek dosyalarla ve soru sayılarıyla eşleşir; deneme seti yoktur', () => {
    expect(QUIZZES.map((x) => x.id).sort()).toEqual(quizzes.map((x) => x.id).sort());
    expect(QUIZZES.some((x) => x.id === 'ornek')).toBe(false);
    for (const x of QUIZZES) expect(x.count).toBe(quizzes.find((q) => q.id === x.id)?.questions.length);
  });
  for (const z of quizzes)
    it(`${z.id}: biçim doğru`, () => {
      expect(z.title && z.ask).toBeTruthy();
      expect(z.tiers).toHaveLength(6);
      expect(z.questions.length).toBeGreaterThanOrEqual(ROUND);
      const seen = new Set<string>();
      for (const x of z.questions) {
        expect(x.src).toMatch(/^https:\/\//);
        expect([1, 2, 3]).toContain(x.d);
        expect(x.q.trim().length).toBeGreaterThan(5);
        expect(seen.has(x.q)).toBe(false);
        seen.add(x.q);
        if (x.tf) expect([...x.a].sort()).toEqual(['Doğru', 'Yanlış']);
        else {
          expect(x.a).toHaveLength(4);
          expect(new Set(x.a.map((o) => o.trim().toLocaleLowerCase('tr-TR'))).size).toBe(4);
        }
      }
      // her zorluktan tura yetecek kadar soru olsun
      for (const [d, n] of [[1, 4], [2, 3], [3, 3]]) expect(z.questions.filter((x) => x.d === d).length).toBeGreaterThanOrEqual(n);
    });
});
