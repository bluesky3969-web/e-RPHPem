const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('index.html','utf8');
function source(name,async=false){
  const prefix=(async?'async function ':'function ')+name+'(';
  const start=html.indexOf(prefix);
  assert(start>=0,`${name} not found`);
  const rest=html.slice(start+prefix.length);
  const next=rest.search(/\n(?:async )?function [A-Za-z]/);
  return html.slice(start,next<0?html.length:start+prefix.length+next);
}
function harness(local,remote){
  const values=new Map(),messages=[],status=[];
  const ctx={
    Object,JSON,Date,Number,String,Array,
    store:local,cloudReady:false,cloudVersion:null,pemasaCloud:null,ralatMuatStore:null,
    localStorage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)},
    sessionSupabase:()=>({user:{id:'user-a'}}),
    rekodCloudSemasa:async()=>remote,
    metaSupabase:()=>null,
    dataUntukCloud:()=>local,
    cloudBadge:()=>{},cloudMsg:(message)=>messages.push(message),
    setStatusSimpan:(message)=>status.push(message),
    kunciSyncPengguna:()=> 'sync-user-a',
    setCloudMeta:()=>{},
    gunaDataCloud:()=>{ctx.loaded=true;},
    hentikanSyncCloud:()=>{ctx.stopped=true;},
    jadualkanCloudSave:()=>{ctx.scheduled=true;},
    simpanCloudSekarang:async()=>{ctx.saved=true;return true;},
    clearTimeout:()=>{},
  };
  vm.createContext(ctx);
  for(const name of ['jsonTersusun','dataCloudSama','adaKandunganUntukCloud'])vm.runInContext(source(name),ctx);
  vm.runInContext(source('mulaSesiCloud',true),ctx);
  return {ctx,values,messages,status};
}
const empty={settings:{classes:[],groups:[{name:'Kumpulan 1',students:[],skillNote:'',note:'',level:''}],timetable:{}},days:[],weekMetadata:{}};
const filled={settings:{classes:[{name:'2 LINUX'}],groups:[],timetable:{}},days:[{tarikh:'2026-09-21'}],weekMetadata:{}};
(async()=>{
  const a=harness(filled,null);await a.ctx.mulaSesiCloud();
  assert.equal(a.ctx.saved,true,'existing local data must upload when cloud is empty');
  assert.equal(a.values.get('sync-user-a'),'true');

  const b=harness(empty,null);await b.ctx.mulaSesiCloud();
  assert.equal(b.ctx.saved,undefined,'empty account must not upload a blank record');
  assert.equal(b.ctx.cloudReady,true,'empty account must be ready for first edit');

  const c=harness(empty,{data:filled,version:3});await c.ctx.mulaSesiCloud();
  assert.equal(c.ctx.loaded,true,'empty new device must download existing cloud data');
  assert.equal(c.ctx.stopped,undefined);

  const d=harness(filled,{data:{days:[{tarikh:'different'}],settings:filled.settings,weekMetadata:{}},version:3});await d.ctx.mulaSesiCloud();
  assert.equal(d.ctx.stopped,true,'different nonempty data must never be overwritten automatically');

  const e=harness(filled,{data:{weekMetadata:{},days:[{tarikh:'2026-09-21'}],settings:{timetable:{},groups:[],classes:[{name:'2 LINUX'}]}},version:3});await e.ctx.mulaSesiCloud();
  assert.equal(e.ctx.stopped,undefined,'Postgres JSONB key order must not create false conflicts');
  assert.equal(e.ctx.cloudReady,true);

  const f=harness(filled,null);f.ctx.cloudReady=true;f.ctx.cloudVersion=0;
  f.ctx.cloudSedangSimpan=false;f.ctx.cloudPerluSimpanLagi=false;
  f.ctx.idPenggunaAktif=()=> 'user-a';f.ctx.simpanSnapshotPemulihan=()=>{};
  f.ctx.responsSupabase=async()=>[{new_version:1}];
  f.ctx.rekodCloudSemasa=async()=>({version:1,data:{weekMetadata:{},days:[{tarikh:'2026-09-21'}],settings:{timetable:{},groups:[],classes:[{name:'2 LINUX'}]}}});
  f.ctx.setCloudMeta=(_,version)=>{f.ctx.confirmedVersion=version;};
  vm.runInContext(source('simpanCloudSekarang',true),f.ctx);
  assert.equal(await f.ctx.simpanCloudSekarang(),true,'RPC and readback must both succeed');
  assert.equal(f.ctx.confirmedVersion,1);
  assert(f.status.at(-1).includes('Disahkan di Supabase'));

  const g=harness(filled,null);g.ctx.cloudReady=true;g.ctx.cloudVersion=0;
  g.ctx.cloudSedangSimpan=false;g.ctx.cloudPerluSimpanLagi=false;
  g.ctx.idPenggunaAktif=()=> 'user-a';g.ctx.simpanSnapshotPemulihan=()=>{};
  g.ctx.responsSupabase=async()=>[{new_version:1}];
  g.ctx.rekodCloudSemasa=async()=>null;
  g.ctx.setCloudMeta=()=>{g.ctx.confirmed=true;};
  vm.runInContext(source('simpanCloudSekarang',true),g.ctx);
  assert.equal(await g.ctx.simpanCloudSekarang(),false,'failed readback must not be shown as saved');
  assert.equal(g.ctx.confirmed,undefined);
  assert(g.status.at(-1).includes('tempatan sahaja'));

  const h=harness(filled,null);h.ctx.cloudReady=true;h.ctx.cloudVersion=0;
  h.ctx.cloudSedangSimpan=false;h.ctx.cloudPerluSimpanLagi=false;
  let activeUser='user-a';h.ctx.idPenggunaAktif=()=>activeUser;
  h.ctx.simpanSnapshotPemulihan=()=>{};
  h.ctx.responsSupabase=async()=>[{new_version:1}];
  h.ctx.rekodCloudSemasa=async()=>{activeUser='user-b';return {version:1,data:filled};};
  h.ctx.setCloudMeta=()=>{h.ctx.wrongAccountConfirmed=true;};
  vm.runInContext(source('simpanCloudSekarang',true),h.ctx);
  assert.equal(await h.ctx.simpanCloudSekarang(),false,'account switch during readback must not confirm wrong user');
  assert.equal(h.ctx.wrongAccountConfirmed,undefined);
  console.log('PASS: auto upload, no empty upload, new-device download, conflict guard, JSONB equality, verified save, failed readback, account switch.');
})().catch(error=>{console.error(error);process.exitCode=1;});
