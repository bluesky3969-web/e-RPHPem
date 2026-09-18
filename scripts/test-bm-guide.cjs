const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const load=text=>{const ctx={window:{}};vm.runInNewContext(text,ctx);return JSON.parse(JSON.stringify(ctx.window.ERPH_MASTER_DATA));};
const current=load(fs.readFileSync('master-data.js','utf8'));
const before=load(execFileSync('git',['show','eb146bf:master-data.js'],{encoding:'utf8',maxBuffer:10e6}));
// Mathematics now has its own official-guide audit and regression suite.
const bm=current.subjects['Bahasa Melayu'];
assert.equal(bm.length,33);
assert.equal(bm.reduce((sum,k)=>sum+k.suggestedObjectives.length,0),476);
const counts={pra:[1,1],abjad:[6,13],suku:[6,12],perkataan:[10,117],ayat:[13,162]};
for(const [n,item] of bm.entries()){
  assert.equal(item.id,before.subjects['Bahasa Melayu'][n].id);
  assert.equal(item.standardContent[0].code,before.subjects['Bahasa Melayu'][n].standardContent[0].code,'legacy SK index preserved');
  assert.deepEqual([item.standardContent.length,item.standardContent.reduce((s,sk)=>s+sk.learning.length,0)],counts[item.sourceMappingGroup]);
  assert.equal(item.objectiveSources.length,item.suggestedObjectives.length);
  for(const sk of item.standardContent){
    assert.equal(sk.learning.length,sk.learningSources.length);
    assert.equal(new Set(sk.learning).size,sk.learning.length);
    sk.learningSources.forEach((s,i)=>{
      assert(s.text.startsWith(sk.code+'.'));
      assert(s.pdfPage>=35&&s.pdfPage<=56);
      assert.equal(sk.learning[i],`Tahun ${s.year} — ${s.text}`);
      assert(!s.text.includes('...'));
    });
  }
  item.objectiveSources.forEach((s,i)=>{assert.equal(s.text,item.suggestedObjectives[i]);assert(s.pdfPage>=58&&s.pdfPage<=121);});
}
const html=fs.readFileSync('index.html','utf8');
for(const [,script] of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(script);
const ctx={esc:v=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;'),itemKumpulan:(day,g)=>bm.find(k=>k.id===g.skillId)};
vm.createContext(ctx);
for(const name of ['standardOptions','spCheckboxes','sumberObjektifRasmi','objektifCheckboxes','semakPanduanRasmi','ringkasPanduan']){
  const start=html.indexOf('function '+name+'(');
  const next=html.indexOf('\nfunction ',start+1);
  vm.runInContext(html.slice(start,next),ctx);
}
const item=bm[5],sk=item.standardContent[0];
const day={mataPelajaran:'Bahasa Melayu'};
const g={skillId:item.id,standardIndex:'0',sp:[sk.learning[0]],objektif:item.suggestedObjectives.slice(6,8).join('\n')};
assert.equal(ctx.semakPanduanRasmi(day,g),'');
assert(ctx.semakPanduanRasmi(day,{...g,objektif:''}));
assert(ctx.semakPanduanRasmi(day,{...g,objektif:'Murid boleh terbang.'}));
assert(ctx.semakPanduanRasmi(day,{...g,sp:['old SP']}));
assert.equal(ctx.semakPanduanRasmi({mataPelajaran:'Lain'},{...g,objektif:''}),'');
assert(ctx.spCheckboxes(item,'0',['old SP']).includes('value="old SP" checked'));
assert.equal((ctx.standardOptions(item,'0').match(/<option/g)||[]).length,11);
const oldObjective=before.subjects['Bahasa Melayu'][5].suggestedObjectives[6];
assert(ctx.objektifCheckboxes(item,{objektifDipilih:[oldObjective]},0).includes(' checked'));
assert.equal((ctx.objektifCheckboxes(item,g,0).match(/ checked/g)||[]).length,2);
assert(html.includes('Jangan tambah, ganti atau reka kod/teks SK, SP atau objektif.'));
console.log('PASS: all 33 BM skills, 476 source objectives, source references, SK/SP prefix/year, legacy SK/SP/objectives, multi-objectives, generation guards, prompt, JS syntax.');
