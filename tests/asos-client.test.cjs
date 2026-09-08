"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const html = fs.readFileSync("index.html", "utf8");
const start = html.indexOf("  // 기상청 ASOS 일자료. 관측지점은 학생이 직접 선택합니다.");
const end = html.indexOf("  function renderWeatherTo(prefix,w){", start);
assert.ok(start > 0 && end > start, "ASOS adapter is present");
const state = {project: {stationId: "129"}};
let mock = async () => {throw new Error("unmocked request");};
const context = vm.createContext({state, URLSearchParams, AbortSignal, Intl, Date, Number, String, Object, Array, fetch: (...args) => mock(...args)});
vm.runInContext(html.slice(start, end), context);
const call = (expr) => vm.runInContext(expr, context);
(async () => {
  assert.equal(call('asosStationLabel("129")'), "서산 (129)");
  assert.equal(call('validAsosStation("999")'), false);
  assert.equal(call('latestAsosDate(new Date("2026-09-08T01:59:00Z"))'), "2026-09-06");
  assert.equal(call('latestAsosDate(new Date("2026-09-08T02:00:00Z"))'), "2026-09-07");
  assert.equal(call('latestAsosDate(new Date("2026-01-01T00:00:00Z"))'), "2025-12-30");
  assert.equal(call('asosDateValid("2020-02-30")'), false);
  assert.equal(call('asosDateValid("2020-04-23")'), true);
  console.log("PASS: station selection and KST date validation");

  mock = async (url) => {
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("station"), "129");
    assert.equal(parsed.searchParams.get("date"), "2020-04-23");
    assert.equal(parsed.searchParams.size, 2);
    return {ok: true, json: async () => ({date:"2020-04-23",stationId:"129",stationName:"서산",dataType:"observation",mean:7.9,max:12.8,min:2.9,rain:0,sun:11.8})};
  };
  let weather = await call('fetchWeather("2020-04-23")');
  assert.equal(weather.rain, 0);
  assert.equal(weather.sun, 11.8);
  assert.equal(weather.stationName, "서산");
  assert.equal(weather.source, "기상청 ASOS");
  console.log("PASS: API request and five weather fields");

  weather = call('normalizeAsosWeather({date:"2020-04-23",stationId:"129",dataType:"observation",mean:-2,max:1,min:-5,rain:null,sun:""},"2020-04-23","129")');
  assert.equal(weather.rain, null);
  assert.equal(weather.sun, null);
  assert.equal(weather.mean, -2);
  assert.throws(() => call('normalizeAsosWeather({date:"2020-04-23",stationId:"129",dataType:"observation",mean:null},"2020-04-23","129")'));
  console.log("PASS: missing values are not converted to zero");

  mock = async () => ({ok:false,json:async()=>({error:"NO_DATA",message:"자료 없음"})});
  await assert.rejects(call('fetchWeather("2020-04-23")'), /자료 없음/);
  state.project.stationId = "999";
  await assert.rejects(call('fetchWeather("2020-04-23")'), /관측지점/);
  console.log("PASS: API errors and invalid station are handled");

  assert.ok(html.includes('const STORAGE_KEY = "gardenClimateJournal.v1";'));
  assert.ok(html.includes('const DB_NAME = "gardenClimateJournalDB";'));
  assert.ok(html.includes('const PHOTO_STORE = "photos";'));
  assert.ok(html.includes('async function backupZip(){'));
  assert.ok(html.includes('async function restoreZip(file){'));
  assert.ok(html.includes('async function photoPut(id, blob){'));
  assert.ok(!html.includes('geocoding-api.open-meteo.com'));
  assert.ok(!html.includes('api.open-meteo.com/v1/forecast'));
  assert.ok(html.includes('id="asosStation"'));
  assert.ok(html.includes('weatherRequestSerial++'));
  assert.ok(html.includes('currentWeatherForObservation?.date===document.getElementById("obsDate").value'));
  console.log("PASS: existing storage/backup compatibility and stale-weather guard");
  console.log("All 5 ASOS client test groups passed.");
})().catch(err => {console.error(err);process.exitCode=1;});
