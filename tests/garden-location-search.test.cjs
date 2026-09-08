"use strict";
const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const source=fs.readFileSync("garden-location-search.js","utf8");
class Element {
  constructor(id=""){this.id=id;this.value="";this.textContent="";this.className="";this.children=[];this.dataset={};this.listeners={};}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  dispatchEvent(event){for(const fn of this.listeners[event.type]||[])fn(event);return true;}
  replaceChildren(...children){this.children=children;}
  appendChild(child){this.children.push(child);}
}
const ids=["gardenPlace","searchPlaceBtn","asosStation","placeSearchResults","placeSearchStatus"];
const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
const context=vm.createContext({
  document:{getElementById:id=>elements[id]||null,createElement:()=>new Element()},
  Event:class {constructor(type,options){this.type=type;this.bubbles=options?.bubbles;}},
  console
});
vm.runInContext(source,context);
const api=context.GardenLocationSearch;
const stations={"108":"서울","119":"수원","129":"서산","177":"홍성","203":"이천","232":"천안","239":"세종","133":"대전","156":"광주"};
const rows=q=>Array.from(api.search(q,stations),x=>x.id);
assert.deepEqual(rows("서산"),["129"]);
assert.deepEqual(rows("충남 서산시 팔봉면"),["129"]);
assert.deepEqual(rows("팔봉중학교 텃밭"),["129"]);
assert.deepEqual(rows("Seosan"),["129"]);
assert.deepEqual(rows("당진"),["129","177"]);
console.log("PASS: Korean, English, school/locality aliases and station candidates");
assert.deepEqual(rows("광주광역시"),["156"]);
assert.deepEqual(rows("경기도 광주시"),["203"]);
assert.deepEqual(rows("광주시"),["156","203"]);
assert.deepEqual(rows("129"),["129"]);
assert.deepEqual(rows("알수없는지역"),[]);
console.log("PASS: ambiguous regions, station code and unknown place");
const controller=api.mount(stations);
assert.strictEqual(api.mount(stations),controller);
const input=elements.gardenPlace,select=elements.asosStation,button=elements.searchPlaceBtn;
const results=elements.placeSearchResults,status=elements.placeSearchStatus;
input.value="충남 서산시 팔봉면";
button.dispatchEvent({type:"click"});
assert.equal(results.children.length,1);
assert.equal(results.children[0].textContent.includes("서산 (129)"),true);
results.children[0].dispatchEvent({type:"click"});
assert.equal(select.value,"129");
assert.equal(input.value,"충남 서산시 팔봉면");
assert.equal(results.children.length,0);
assert.equal(status.className,"location-search-status ok");
console.log("PASS: search button, result selection and exact garden text preservation");
input.value="당진시";
input.dispatchEvent({type:"input"});
assert.equal(select.value,"");
button.dispatchEvent({type:"click"});
assert.equal(results.children.length,2);
input.value="서산";
let prevented=false;
input.dispatchEvent({type:"keydown",key:"Enter",preventDefault(){prevented=true;}});
assert.equal(prevented,true);
assert.equal(results.children.length,1);
api.clear();
assert.equal(results.children.length,0);
console.log("PASS: changed location invalidates draft station, Enter search and result cleanup");
assert.equal(source.includes("fetch("),false);
assert.equal(source.includes("localStorage"),false);
assert.equal(source.includes("KMA_ASOS_SERVICE_KEY"),false);
console.log("PASS: offline search has no network, storage mutation or credential dependency");
console.log("All 5 region-search test groups passed.");
