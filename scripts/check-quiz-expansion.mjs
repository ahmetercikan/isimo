/** 10 kat soru talebinin evren bazında kabul kontrolü. Mevcut soruların sırası korunmalıdır. */
import fs from 'node:fs';
const plan=JSON.parse(fs.readFileSync('store/quiz-expansion-targets.json','utf8'));
let failed=0,total=0;
for(const universe of plan.universes){
 const quiz=JSON.parse(fs.readFileSync(`src/data/quiz/${universe.id}.json`,'utf8'));
 const actual=quiz.questions.length;total+=actual;
 if(actual!==universe.target){console.error(`${universe.title}: ${actual}/${universe.target}`);failed++;}
}
console.log(`Toplam: ${total}/${plan.totalTarget}; ${failed} evren henüz hedefte değil.`);
process.exitCode=failed?1:0;
