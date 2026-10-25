import { QUIZZES } from '../data/quiz';
import type { Settings } from '../engine/types';

export function QuizSettings({ value, onChange }: { value: Settings; onChange: (s: Settings) => void }) {
  return <div className="quiz-settings">
    <label htmlFor="quiz-universe">Hangi evrende yarışacaksınız?</label>
    <select id="quiz-universe" value={value.quizId ?? 'harrypotter'} onChange={(e) => onChange({ ...value, quizId: e.target.value })}>
      {QUIZZES.map((q) => <option key={q.id} value={q.id}>{q.title} · {q.count} soru</option>)}
    </select>
    <p>{QUIZZES.find((q) => q.id === value.quizId)?.scope}</p>
    <p>2–10 arkadaş · 10 ortak soru · soru başına 20 saniye</p>
    <p>Herkes cevapladıktan sonra doğru şık açıklanır. Doğru cevaplar ve hız puanı sıralamayı belirler.</p>
  </div>;
}
