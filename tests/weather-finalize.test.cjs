"use strict";
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const before=new Date('2026-09-17T01:59:59Z');
const after=new Date('2026-09-17T02:00:00Z');
const plain=x=>JSON.parse(JSON.stringify(x));
const sample=(extra={})=>({id:'obs1',date:'2026-09-16',stationId:'129',weatherStatus:'pending',weather:null,heightCm:'18',leafCount:'7',photoId:'photo1',note:'잎이 자랐어요',weatherThought:'햇빛 덕분일까?',createdAt:'original',updatedAt:'original',...extra});
const weather=(date='2026-09-16',stationId='129')=>({date,stationId,dataType:'observation',source:'기상청 ASOS',mean:22,max:27,min:18,rain:0,sun:5});
function setup(observations=[sample()]){
  const writes=[]; const requests=[]; let response=async(date,station)=>weather(date,station); let failStorage=false;
  const elements=new Map();
  const el=id=>{if(!elements.has(id))elements.set(id,{value:'',classList:{add(){},remove(){}},textContent:'',className:''});return elements.get(id);};
  const context=vm.createContext({Date,Intl,URLSearchParams,AbortSignal,console:{warn(){}},
    state:{project:{stationId:'108'},observations,reflections:[],version:'1.11.0'},
    STORAGE_KEY:'gardenClimateJournal.v1',renderAll(){},
    localStorage:{setItem(key,value){if(failStorage)throw Error('quota');writes.push({key,value});}},
    document:{getElementById:el},uid:()=> 'new-id',selectedPhotoBlob:null,removePhotoOnSave:false,
    currentWeatherForObservation:null,resetObservationForm(){},setStatus(){},toast(){},alert(){},
    saveState(){writes.push({key:'gardenClimateJournal.v1',value:JSON.stringify(context.state)});}
  });
  const start=html.indexOf('  // 기상청 ASOS 일자료.');
  vm.runInContext(html.slice(start,html.indexOf('  function renderWeatherTo(',start)),context);
  context.fetchWeather=async(date,station)=>{requests.push({date,station});return response(date,station);};
  const run=expression=>vm.runInContext(expression,context);
  return {context,run,writes,requests,el,setResponse:fn=>response=fn,setFailStorage:v=>failStorage=v};
}
test('all inline and external JavaScript parses',()=>{
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(match[1]);
  for(const file of ['service-worker.js','garden-location-search.js'])new vm.Script(fs.readFileSync(file,'utf8'));
});
test('KST 11:00 boundary, year rollover and leap day',()=>{
  const h=setup();
  for(const [input,expected] of [['2026-09-17T01:59:59Z','2026-09-15'],['2026-09-17T02:00:00Z','2026-09-16'],['2026-01-01T02:00:00Z','2025-12-31'],['2024-03-01T02:00:00Z','2024-02-29']])assert.equal(h.run(`latestAsosDate(new Date('${input}'))`),expected);
});
test('pending until next day 11; final changes only weather/status with original station',async()=>{
  const original=sample();const h=setup([original]);
  await h.context.syncPendingObservationWeather(before);assert.equal(h.requests.length,0);
  await h.context.syncPendingObservationWeather(after);
  assert.deepEqual(h.requests,[{date:original.date,station:'129'}]);
  assert.deepEqual(plain(h.context.state.observations[0]),{...original,weather:weather(),weatherStatus:'final'});
  assert.equal(h.writes[0].key,'gardenClimateJournal.v1');
  assert.deepEqual(JSON.parse(h.writes[0].value),plain(h.context.state));
  await h.context.syncPendingObservationWeather(after);assert.equal(h.requests.length,1);
});
test('failures retain complete record and retry on next visit',async()=>{
  const h=setup();const original=plain(h.context.state);
  h.setResponse(async()=>{throw Error('offline');});
  await h.context.syncPendingObservationWeather(after);
  assert.deepEqual(plain(h.context.state),original);assert.equal(h.writes.length,0);
  h.setResponse(async()=>weather());h.setFailStorage(true);
  await h.context.syncPendingObservationWeather(after);assert.deepEqual(plain(h.context.state),original);
  h.setFailStorage(false);await h.context.syncPendingObservationWeather(after);
  assert.equal(h.context.state.observations[0].weatherStatus,'final');assert.equal(h.requests.length,3);
});
test('legacy weather and missing-station pending records are never inferred or overwritten',async()=>{
  const records=[sample({weather:{mean:30,rain:2,source:'legacy'},weatherStatus:undefined,stationId:undefined}),sample({id:'no-weather',weatherStatus:undefined,stationId:undefined}),sample({id:'no-station',stationId:undefined}),sample({id:'final',weatherStatus:'final',weather:weather()})];
  const h=setup(records);const original=plain(h.context.state);
  await h.context.syncPendingObservationWeather(after);
  assert.deepEqual(plain(h.context.state),original);assert.equal(h.requests.length,0);
  const fields=h.context.observationWeatherFields(records[0].date,records[0],null,after);
  assert.deepEqual(plain(fields.weather),records[0].weather);assert.equal(fields.weatherStatus,undefined);
});
test('save selection rejects stale date/station and non-ASOS data; preserves finalized edit',()=>{
  const h=setup();
  assert.equal(h.context.observationWeatherFields('2026-09-17',null,weather(),after).weatherStatus,'pending');
  assert.equal(h.context.observationWeatherFields('2026-09-16',null,weather(),after).weatherStatus,'pending');
  assert.equal(h.context.observationWeatherFields('2026-09-16',null,weather('2026-09-16','108'),after).weatherStatus,'final');
  assert.equal(h.context.observationWeatherFields('2026-09-16',sample(),weather(),before).weatherStatus,'pending');
  const finalized=sample({weather:weather(),weatherStatus:'final'});
  assert.deepEqual(plain(h.context.observationWeatherFields(finalized.date,finalized,null,after)),{weather:weather(),stationId:'129',weatherStatus:'final'});
  assert.equal(h.context.isFinalAsosWeather({...weather(),source:'legacy'},'2026-09-16','129',after),false);
});
test('single flight and duplicate day/station share request; edited/deleted/restored records stay intact',async()=>{
  for(const action of ['edit','delete','restore']){
    const h=setup();let resolve;
    h.setResponse(()=>new Promise(r=>resolve=r));
    const first=h.context.syncPendingObservationWeather(after);
    assert.equal(h.context.syncPendingObservationWeather(after),first);
    if(action==='delete')h.context.state.observations=[];
    else if(action==='edit')h.context.state.observations[0]={...sample(),note:'edited'};
    else h.context.state={...h.context.state,observations:[sample()]};
    const expected=plain(h.context.state);resolve(weather());await first;
    assert.deepEqual(plain(h.context.state),expected);assert.equal(h.writes.length,0);
  }
  const h=setup([sample(),sample({id:'obs2'})]);await h.context.syncPendingObservationWeather(after);
  assert.equal(h.requests.length,1);assert.ok(h.context.state.observations.every(x=>x.weatherStatus==='final'));
});
test('wrong response, empty data and future records stay pending',async()=>{
  for(const response of [weather('2026-09-15'),weather('2026-09-16','108'),{...weather(),mean:null,max:null,min:null,rain:null,sun:null}]){
    const h=setup();h.setResponse(async()=>response);await h.context.syncPendingObservationWeather(after);assert.equal(h.writes.length,0);
  }
  const h=setup([sample({date:'2026-09-17'})]);await h.context.syncPendingObservationWeather(after);assert.equal(h.requests.length,0);
});
test('actual save handler persists student fields and station without awaiting API',async()=>{
  const h=setup([]);const start=html.indexOf('  async function saveObservation(e){');
  vm.runInContext(html.slice(start,html.indexOf('  async function deleteObservation(',start)),h.context);
  h.el('obsDate').value='2099-09-16';h.el('heightCm').value='18';h.el('leafCount').value='7';h.el('obsNote').value='관찰';h.el('weatherThought').value='생각';
  await h.context.saveObservation({preventDefault(){}});
  const saved=JSON.parse(h.writes[0].value).observations[0];
  assert.equal(saved.stationId,'108');assert.equal(saved.weatherStatus,'pending');assert.equal(saved.weather,null);
  assert.equal(saved.heightCm,'18');assert.equal(saved.leafCount,'7');assert.equal(saved.note,'관찰');assert.equal(saved.weatherThought,'생각');assert.equal(h.requests.length,0);
});
test('exact timeline text, startup and foreground hooks, storage/photo/ZIP contract',()=>{
  const h=setup();
  assert.equal(h.context.observationWeatherStatusText(sample()),'🕒 기상자료 집계 중 · 다음날 11시 이후 자동 확정');
  assert.equal(h.context.observationWeatherStatusText(sample({weatherStatus:'final'})),'✅ 기상청 확정 일자료');
  assert.equal(h.context.observationWeatherStatusText({weather:{mean:20}}),'');
  assert.match(html,/visibilitychange[\s\S]*?visibilityState==="visible"\)void syncPendingObservationWeather/);
  assert.match(html,/else loadTodayWeather\(\);\s+void syncPendingObservationWeather\(\);/);
  for(const text of ['const STORAGE_KEY = "gardenClimateJournal.v1";','const DB_NAME = "gardenClimateJournalDB";','const DB_VERSION = 1;','const PHOTO_STORE = "photos";','zip.file("data.json",JSON.stringify(payload,null,2))','folder.file(`${p.id}.jpg`,p.blob)','state=Object.assign(defaultState(),payload.state','objectStore(PHOTO_STORE).put({id,blob,'])assert.ok(html.includes(text),text);
  // Existing and additive metadata both survive the JSON envelope used in ZIP backups.
  const records=[sample(),sample({weatherStatus:undefined,stationId:undefined,weather:{mean:8}})];
  const payload={app:'garden-climate-journal',version:'1.12.0',state:{observations:records}};
  assert.deepEqual(JSON.parse(JSON.stringify(payload)).state.observations,plain(records));
});
