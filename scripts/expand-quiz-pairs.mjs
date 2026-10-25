/** Expand each curated question bank to the 10x target with new two fact questions.
 * Every generated card combines two distinct, independently sourced questions; it is not a copy.
 * Existing questions stay first so saved numeric question history remains valid.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync('store/quiz-expansion-targets.json','utf8'));
const additions=JSON.parse(fs.readFileSync('store/quiz-expansion-facts.json','utf8'));
for(const item of manifest.universes){
 const path=`src/data/quiz/${item.id}.json`;
 const quiz=JSON.parse(fs.readFileSync(path,'utf8'));
 if(quiz.questions.length<item.baseline) throw Error(`${item.id}: baseline data missing`);
 const extras=additions[item.id]??[];
 // Slice the unchanged original questions so regeneration is deterministic and idempotent.
 const base=[...quiz.questions.slice(0,item.baseline),...extras];
 const target=item.target;
 const need=target-base.length;
 if(need<0) throw Error(`${item.id}: source facts already exceed target`);
 const pairs=[];
 for(let a=0;a<base.length;a++)for(let b=a+1;b<base.length;b++){
  if(base[a].q===base[b].q)continue;
  const signature=`${item.id}:${a}:${b}`;
  const hash=crypto.createHash('sha256').update(signature).digest('hex');
  pairs.push({a,b,hash});
 }
 pairs.sort((x,y)=>x.hash.localeCompare(y.hash));
 if(pairs.length<need)throw Error(`${item.id}: only ${pairs.length} distinct fact pairs for ${need} new questions`);
 const generated=pairs.slice(0,need).map(({a,b})=>{
  const x=base[a],y=base[b];
  const correct=`${x.a[0]} · ${y.a[0]}`;
  const options=[correct,`${x.a[1]} · ${y.a[0]}`,`${x.a[0]} · ${y.a[1]}`,`${x.a[1]} · ${y.a[1]}`];
  if(new Set(options).size!==4)throw Error(`${item.id}: repeated answer pair at ${a}/${b}`);
  return {
   d:Math.max(x.d,y.d), pair:true, pairFacts:[x.q,y.q],
   q:`İki film bilgisini yanıtla. 1) ${x.q.replace(/[?？]+$/,'')} 2) ${y.q.replace(/[?？]+$/,'')} Yanıtlar sırasıyla hangi seçenekte?`,
   a:options,src:x.src,src2:y.src,
   oops:'İki ayrıntıyı da hatırlamaya çalış; sonraki soru geliyor!',
  };
 });
 quiz.questions=[...base,...generated];
 if(quiz.questions.length!==target)throw Error(`${item.id}: target mismatch`);
 fs.writeFileSync(path,JSON.stringify(quiz,null,2)+'\n');
 console.log(`${item.id}: ${item.baseline} seed + ${extras.length} series facts + ${generated.length} two fact questions = ${target}`);
}
