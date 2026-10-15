// Sözlükleri .txt kaynaklardan üretir: node scripts/dict-src/build.cjs [kategori]
const fs=require('fs'),path=require('path');
const SRC=__dirname, OUT=path.join(__dirname,'..','..','src','data','dict');
const LET='A B C Ç D E F G H I İ J K L M N O Ö P R S Ş T U Ü V Y Z'.split(' ');
const only=process.argv.slice(2);
for(const f of fs.readdirSync(SRC).filter(f=>f.endsWith('.txt'))){
  const cat=f.replace('.txt','');
  if(only.length && !only.includes(cat)) continue;
  const lines=fs.readFileSync(path.join(SRC,f),'utf8').split(/\r?\n/).flatMap(l=>l.split('|')).map(s=>s.trim().replace(/\s+/g,' ')).filter(s=>s&&!s.startsWith('#')&&!s.includes('?')).map(s=>s.split('<Q>').join('?'));
  const seen=new Map(), dups=[];
  for(const s of lines){const k=s.toLocaleLowerCase('tr'); if(seen.has(k)) dups.push(s); else seen.set(k,s);}
  const arr=[...seen.values()].sort((a,b)=>a.localeCompare(b,'tr'));
  fs.writeFileSync(path.join(OUT,cat+'.json'),JSON.stringify(arr,null,1)+'\n','utf8');
}
// validate
for(const f of fs.readdirSync(OUT).filter(f=>f.endsWith('.json'))){
  const cat=f.replace('.json','');
  if(only.length && !only.includes(cat)) continue;
  const arr=JSON.parse(fs.readFileSync(path.join(OUT,f),'utf8'));
  const keys=new Set(); let d=0; for(const s of arr){const k=s.toLocaleLowerCase('tr'); if(keys.has(k)) d++; keys.add(k);}
  const c={}; for(const s of arr){const L=s[0].toLocaleUpperCase('tr'); c[L]=(c[L]||0)+1;}
  const other=Object.keys(c).filter(k=>!LET.includes(k));
  console.log(`${cat}: ${arr.length} dups=${d}`+(other.length?` OTHER=${other.map(k=>k+':'+c[k]).join(',')}`:''));
  console.log('  '+LET.map(L=>`${L}${c[L]||0}`).join(' '));
}
