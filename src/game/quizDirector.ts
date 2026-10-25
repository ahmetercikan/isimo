/** Aynı sorular, ortak saat, tek cevap; her değişiklik ctl üzerinde atomiktir. */
import { loadQuiz } from '../data/quiz';
import { pickRound, QUESTION_MS, questionPoints, ROUND, type Quiz } from '../engine/quiz';
import { newCtl, type Ctl, type RoomState } from '../engine/types';
import type { Transport } from '../online/transport';

export const QUIZ_LEAD_MS = 2500;
export const QUIZ_REVEAL_MS = 4000;
export const quizHumans = (s: RoomState) => Object.keys(s.players).filter((p) => !s.players[p].left && !s.players[p].bot && !p.startsWith('bot-') && s.players[p].on);
export const quizHistoryReady = (s: RoomState) => quizHumans(s).every((pid) => s.players[pid].quizHistory?.id === (s.settings.quizId ?? 'harrypotter'));
export const currentQuizQuestion = (c: Ctl) => c.quiz?.questions[c.round - 1];

export async function startQuiz(t: Transport, s: RoomState, data?: Quiz): Promise<boolean> {
  if (t.kind !== 'online' || s.settings.game !== 'quiz') return false;
  const players = quizHumans(s);
  if (players.length < 2 || !quizHistoryReady(s)) return false;
  const quiz = data ?? await loadQuiz(s.settings.quizId ?? 'harrypotter');
  if (!quiz || quiz.id !== (s.settings.quizId ?? 'harrypotter')) return false;
  const seen = players.flatMap((pid) => s.players[pid].quizHistory?.id === quiz.id ? s.players[pid].quizHistory!.seen ?? [] : []);
  const questions = pickRound(quiz, seen);
  if (questions.length !== ROUND) return false;
  const now = t.now();
  return t.transactCtl((c) => c.seq === s.ctl.seq && (c.phase === 'lobby' || c.phase === 'final') ? {
    ...newCtl(), phase: 'quiz', seq: c.seq + 1, round: 1,
    startAt: now + QUIZ_LEAD_MS, endAt: now + QUIZ_LEAD_MS + QUESTION_MS,
    quiz: { id: quiz.id, title: quiz.title, ask: quiz.ask, tiers: quiz.tiers, questions, players, run: `${now}-${c.seq + 1}` },
    pts: Object.fromEntries(players.map((p) => [p, 0])),
    quizCorrect: Object.fromEntries(players.map((p) => [p, 0])), quizPicks: {},
  } : undefined);
}

export async function answerQuiz(t: Transport, s: RoomState, pick: number): Promise<boolean> {
  if (t.kind !== 'online' || s.settings.game !== 'quiz' || !quizHumans(s).includes(t.me)) return false;
  return t.transactCtl((c) => {
    const now = t.now(), q = currentQuizQuestion(c);
    if (c.phase !== 'quiz' || c.round !== s.ctl.round || c.quiz?.run !== s.ctl.quiz?.run || c.nextAt || !q) return undefined;
    if (!c.quiz?.players.includes(t.me) || c.quizPicks?.[t.me] !== undefined || now < c.startAt || now >= c.endAt) return undefined;
    if (!Number.isInteger(pick) || pick < 0 || pick >= q.options.length) return undefined;
    const ok = pick === q.right;
    return {
      ...c, seq: c.seq + 1,
      quizPicks: { ...c.quizPicks, [t.me]: pick },
      pts: { ...c.pts, [t.me]: (c.pts?.[t.me] ?? 0) + questionPoints(ok, c.endAt - now) },
      quizCorrect: { ...c.quizCorrect, [t.me]: (c.quizCorrect?.[t.me] ?? 0) + (ok ? 1 : 0) },
    };
  });
}

export async function quizStep(t: Transport, s: RoomState) {
  const c = s.ctl, now = t.now();
  if (c.phase !== 'quiz' || !c.quiz) return;
  if (!c.nextAt) {
    const waiting = c.quiz.players.filter((p) => quizHumans(s).includes(p));
    const all = waiting.length > 0 && waiting.every((p) => c.quizPicks?.[p] !== undefined);
    if (now >= c.endAt || all) await t.transactCtl((x) => x.seq === c.seq && x.phase === 'quiz' && !x.nextAt ? { ...x, nextAt: now + QUIZ_REVEAL_MS, seq: x.seq + 1 } : undefined);
  } else if (now >= c.nextAt) {
    await t.transactCtl((x) => x.seq === c.seq && x.phase === 'quiz' ? c.round >= c.quiz!.questions.length
      ? { ...x, phase: 'final', seq: x.seq + 1 }
      : { ...x, round: x.round + 1, quizPicks: {}, nextAt: 0, startAt: now + 1000, endAt: now + 1000 + QUESTION_MS, seq: x.seq + 1 }
      : undefined);
  }
}

export function quizRank(s: RoomState) {
  const rows = (s.ctl.quiz?.players ?? []).filter((p) => !!s.players[p]).map((pid) => ({ pid, pts: s.ctl.pts?.[pid] ?? 0, correct: s.ctl.quizCorrect?.[pid] ?? 0, rank: 0 }))
    .sort((a, b) => b.pts - a.pts || s.players[a.pid].joined - s.players[b.pid].joined);
  rows.forEach((r, i) => r.rank = i > 0 && r.pts === rows[i - 1].pts ? rows[i - 1].rank : i + 1);
  return rows;
}
