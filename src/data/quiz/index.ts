/** "Sen Ne Kadar…?" soruları: evren açılınca kendi dosyası iner (her biri ayrı parça). */
import type { Quiz } from '../../engine/quiz';
export { QUIZZES, type QuizMeta } from './meta';

const files = import.meta.glob<{ default: Quiz }>('./*.json');

export async function loadQuiz(id: string): Promise<Quiz | null> {
  const f = files[`./${id}.json`];
  return f ? (await f()).default : null;
}

/** Menüde "Yakında" olarak görünen evrenler. */
export const SOON = ['Yıldız Savaşları', 'Yenilmezler', 'Matrix', 'Karayip Korsanları', 'Recep İvedik', 'Eşkıya'];
