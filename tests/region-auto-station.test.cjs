"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const html=fs.readFileSync("index.html","utf8");
const sw=fs.readFileSync("service-worker.js","utf8");
const start=html.indexOf("  // 기상청 ASOS 일자료.");
const end=html.indexOf("  function renderWeatherTo(prefix,w){",start);
assert.ok(start>0&&end>start,"ASOS + region lookup block exists");

const state={project:{stationId:"129"},observations:[]};
const context=vm.createContext({
  state,URLSearchParams,AbortSignal,Intl,Date,Number,String,Object,Array,Set,Map,
  fetch:async()=>{throw new Error("network should not be used by region search");},
  console
});
vm.runInContext(html.slice(start,end),context);
const run=expr=>vm.runInContext(expr,context);

assert.equal(run('findNearestStationByRegion("충남 서산시").station'),"129");
assert.equal(run('findNearestStationByRegion("서산시 팔봉면").station'),"129");
assert.equal(run('findNearestStationByRegion("아산시").station'),"232");
assert.equal(run('findNearestStationByRegion("서울 강남구").station'),"108");
assert.equal(run('findNearestStationByRegion("부산 해운대구").station'),"159");
assert.equal(run('findNearestStationByRegion("경남 고성군").station'),"162");
assert.equal(run('findNearestStationByRegion("강원 고성군").station'),"90");
assert.equal(run('findNearestStationByRegion("광주시").station'),"203");
assert.equal(run('findNearestStationByRegion("광주").reason'),"ambiguous");
assert.equal(run('findNearestStationByRegion("중구").reason'),"ambiguous");
assert.equal(run('findNearestStationByRegion("없는지역").reason'),"not-found");
assert.ok(run('REGION_STATION_AREAS.reduce((n,x)=>n+x[3].length,0)')>180);
console.log("PASS: nationwide city/county/district search and ambiguous-name handling");

assert.ok(html.includes('id="findNearestStationBtn"'));
assert.ok(html.includes('id="savePlaceBtn"'));
assert.ok(html.includes('<input id="asosStation" type="hidden">'));
assert.ok(!html.includes('<select id="asosStation"'));
assert.ok(!html.includes('replaceChildren(new Option("관측지점 선택"'));
assert.ok(html.includes('const project={...state.project,gardenPlace:place,stationId:station,locationConfirmed:true};'));
assert.ok(html.includes('verifiedCommit({...state,project}'));
assert.ok(html.includes('지역 저장 확인 완료'));
console.log("PASS: no manual station selector; explicit search + region save UI");

assert.ok(html.includes('const APP_VERSION = "1.14.1";'));
assert.ok(html.includes('service-worker.js?v=27'));
assert.ok(sw.includes('const CACHE = "school-garden-v18";'));
assert.ok(html.includes('const STORAGE_KEY = "gardenClimateJournal.v1";'));
assert.ok(html.includes('const DB_NAME = "gardenClimateJournalDB";'));
assert.ok(html.includes('const PHOTO_STORE = "photos";'));
assert.ok(html.includes('void syncPendingObservationWeather();'));
assert.ok(html.includes('copyStorageDiagnostics'));
assert.ok(html.includes('id="backupReminder"'));
console.log("PASS: cache/version bump, storage diagnostics and existing local data/weather-finalize contracts preserved");

assert.ok(!html.includes('geocoding-api.open-meteo.com'));
assert.ok(html.includes('GPS와 외부 지역검색 API는 사용하지 않습니다.'));
console.log("PASS: region lookup is local and does not restore blocked geocoding dependency");
