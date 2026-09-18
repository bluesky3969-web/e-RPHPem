const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const load=text=>{const ctx={window:{}};vm.runInNewContext(text,ctx);return JSON.parse(JSON.stringify(ctx.window.ERPH_MASTER_DATA));};
const data=load(fs.readFileSync('master-data.js','utf8'));
const baseline=load(execFileSync('git',['show','fdb2977:master-data.js'],{encoding:'utf8',maxBuffer:10e6}));
assert.deepEqual(data.subjects['Bahasa Melayu'],baseline.subjects['Bahasa Melayu'],'BM unchanged');
const mm=data.subjects.Matematik,counts=[1,4,11,5,14,16,8,6,8,4,5,8,8,8,29,28,5,7,9,29];
assert.equal(mm.length,20);
assert.equal(mm.reduce((sum,k)=>sum+k.suggestedObjectives.length,0),213);
for(const [i,item] of mm.entries()){
  assert.equal(item.id,baseline.subjects.Matematik[i].id);
  assert.deepEqual(item.standardContent.map(s=>s.code),baseline.subjects.Matematik[i].standardContent.map(s=>s.code),'ALL saved SK indices preserved');
  assert.equal(item.suggestedObjectives.length,counts[i]);
  assert.equal(item.objectiveSources.length,counts[i]);
  item.objectiveSources.forEach((s,j)=>{assert.equal(s.text,item.suggestedObjectives[j]);assert(s.pdfPage>=47&&s.pdfPage<=232);});
  for(const sk of item.standardContent){
    if(sk.notApplicable){assert.equal(item.id,'MM-K01');assert.equal(sk.code,'');assert.equal(sk.learning.length,0);continue;}
    assert.equal(sk.learningSources.length,sk.learning.length);
    assert(sk.content.startsWith(`Tahun ${sk.year} — ${sk.code}`));
    sk.learningSources.forEach((s,j)=>{
      assert.equal(s.year,sk.year,'no mixing years');assert(s.text.startsWith(sk.code+'.'));
      assert.equal(sk.learning[j],`Tahun ${sk.year} — ${s.text}`);
      assert(s.pdfPage>=38&&s.pdfPage<=45);assert(!s.text.includes('...'));
    });
  }
}
const time=mm.find(k=>k.id==='MM-K09'),darab=mm.find(k=>k.id==='MM-K06');
assert.deepEqual(time.standardContent.filter(s=>s.code==='5.1').map(s=>s.learning.length),[4,4,2]);
assert.deepEqual(darab.standardContent.filter(s=>s.code==='2.3').map(s=>s.learning.length),[2,1]);
assert(time.suggestedObjectives.includes('4. Membaca kalendar'));
assert(mm.find(k=>k.id==='MM-K07').suggestedObjectives.some(o=>o.includes('bahagi (÷) dan sama dengan (=)')));
const html=fs.readFileSync('index.html','utf8'),ctx={esc:v=>String(v),itemKumpulan:(day,g)=>mm.find(k=>k.id===g.skillId)};
vm.createContext(ctx);
for(const name of ['standardOptions','spCheckboxes','sumberObjektifRasmi','objektifCheckboxes','semakPanduanRasmi','ringkasPanduan']){
  const start=html.indexOf('function '+name+'('),next=html.indexOf('\nfunction ',start+1);
  vm.runInContext(html.slice(start,next),ctx);
}
vm.runInContext(html.match(/function kumpulanSedia\(g\)\{[^\n]+/)[0],ctx);
const day={mataPelajaran:'Matematik'},item=mm[8],g={skillId:item.id,standardIndex:'0',sp:[item.standardContent[0].learning[0]],objektif:item.suggestedObjectives.slice(0,2).join('\n')};
assert.equal(ctx.semakPanduanRasmi(day,g),'');
assert(ctx.semakPanduanRasmi(day,{...g,sp:['old SP']}));
assert(ctx.semakPanduanRasmi(day,{...g,objektif:'Invented objective'}));
assert.equal((ctx.objektifCheckboxes(item,g,0).match(/ checked/g)||[]).length,2);
const timeYearIndex=year=>String(time.standardContent.findIndex(s=>s.code==='5.1'&&s.year===year));
assert.equal(ctx.sumberObjektifRasmi(time,{standardIndex:timeYearIndex(1)}).length,8);
assert.equal(ctx.sumberObjektifRasmi(time,{standardIndex:timeYearIndex(2)}).length,5);
assert.equal(ctx.sumberObjektifRasmi(time,{standardIndex:timeYearIndex(3)}).length,16);
assert(ctx.semakPanduanRasmi(day,{skillId:time.id,standardIndex:timeYearIndex(1),sp:[time.standardContent[+timeYearIndex(1)].learning[0]],objektif:'4. Membaca kalendar'}),'year-mismatched objective blocked');
const pra={skillId:'MM-K01',standardIndex:'0',sp:[],objektif:mm[0].suggestedObjectives[0]};
assert(ctx.kumpulanSedia(pra));assert.equal(ctx.semakPanduanRasmi(day,pra),'');
assert(ctx.semakPanduanRasmi(day,{...pra,sp:['old placeholder']}));
assert(ctx.spCheckboxes(mm[0],'0',[]).includes('tidak menetapkan SK/SP'));
assert(ctx.spCheckboxes(mm[0],'0',['old placeholder']).includes('value="old placeholder" checked'));
const darabYearIndex=year=>String(darab.standardContent.findIndex(s=>s.code==='2.3'&&s.year===year));
assert.equal((ctx.objektifCheckboxes(darab,{standardIndex:darabYearIndex(2),objektif:''},0).match(/class="objektif-cb"/g)||[]).length,14,'Year 2 repeated source objective shown once');
assert.equal((ctx.objektifCheckboxes(darab,{standardIndex:darabYearIndex(3),objektif:''},0).match(/class="objektif-cb"/g)||[]).length,14,'Year 3 objectives isolated');
console.log('PASS: 20 Mathematics entries, 213 source objective occurrences, year isolation, all legacy indices, source symbols, multi-objectives, Pra Nombor workflow, BM unchanged.');
