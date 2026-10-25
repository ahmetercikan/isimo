// "Sen Ne Kadar…?" evren listesini üretir: src/data/quiz/*.json → src/data/quiz/meta.ts
// (menü yalnız bu küçük listeyi yükler; sorular evren açılınca iner). Yeni evren eklenince: node scripts/quiz-meta.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const dir = 'src/data/quiz';
const ORDER = ['harrypotter', 'yuzuklerinefendisi', 'hababam', 'gora', 'titanik', 'aslankral', 'tersyuz', 'bluey', 'karlarulkesi', 'oyuncakhikayesi', 'shrek', 'nemo', 'buzdevri', 'yildizsavaslari', 'yenilmezler', 'matrix', 'karayipkorsanlari', 'recepivedik', 'eskiya'];
const metas = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
  const q = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  return { id: q.id, title: q.title, ask: q.ask, scope: q.scope ?? '', count: q.questions.length };
});
metas.sort((a, b) => (ORDER.indexOf(a.id) + 1 || 99) - (ORDER.indexOf(b.id) + 1 || 99));
writeFileSync(`${dir}/meta.ts`, `// Üretildi: node scripts/quiz-meta.mjs — elle düzenleme.\nexport interface QuizMeta { id: string; title: string; ask: string; scope: string; count: number }\nexport const QUIZZES: QuizMeta[] = ${JSON.stringify(metas, null, 2)};\n`);
console.log(metas.map((m) => `${m.id} ${m.count}`).join('\n'));
