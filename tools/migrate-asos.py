#!/usr/bin/env python3
"""One-time migration of the verified school-garden v1.10 source.
Does not read or modify browser storage, photographs, or backup files.
"""
from pathlib import Path
import hashlib
import re
import json

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = 'dda3bbb083c21bfe9de35198a2ddfbe69ea49279'


def replace_once(text, old, new):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'Expected one anchor, found {count}: {old[:100]!r}')
    return text.replace(old, new, 1)


def replace_between(text, start, end, replacement):
    if text.count(start) != 1 or text.count(end) != 1:
        raise RuntimeError(f'Unsafe source anchors: {start!r} / {end!r}')
    a = text.index(start)
    b = text.index(end, a + len(start))
    return text[:a] + replacement + text[b:]


STATIONS = {
    '90':'속초','93':'북춘천','95':'철원','98':'동두천','99':'파주','100':'대관령',
    '101':'춘천','102':'백령도','104':'북강릉','105':'강릉','106':'동해','108':'서울',
    '112':'인천','114':'원주','115':'울릉도','119':'수원','121':'영월','127':'충주',
    '129':'서산','130':'울진','131':'청주','133':'대전','135':'추풍령','136':'안동',
    '137':'상주','138':'포항','140':'군산','143':'대구','146':'전주','152':'울산',
    '155':'창원','156':'광주','159':'부산','162':'통영','165':'목포','168':'여수',
    '169':'흑산도','170':'완도','172':'고창','174':'순천','177':'홍성','184':'제주',
    '185':'고산','188':'성산','189':'서귀포','192':'진주','201':'강화','202':'양평',
    '203':'이천','211':'인제','212':'홍천','216':'태백','217':'정선군','221':'제천',
    '226':'보은','232':'천안','235':'보령','236':'부여','238':'금산','239':'세종',
    '243':'부안','244':'임실','245':'정읍','247':'남원','248':'장수','251':'고창군',
    '252':'영광군','253':'김해시','254':'순창군','255':'북창원','257':'양산시',
    '258':'보성군','259':'강진군','260':'장흥','261':'해남','262':'고흥','263':'의령군',
    '264':'함양군','266':'광양시','268':'진도군','271':'봉화','272':'영주','273':'문경',
    '276':'청송군','277':'영덕','278':'의성','279':'구미','281':'영천','283':'경주시',
    '284':'거창','285':'합천','288':'밀양','289':'산청','294':'거제','295':'남해'
}


def migrate(html):
    html = replace_once(html, 'const APP_VERSION = "1.10.0";', 'const APP_VERSION = "1.11.0";')
    html = replace_once(html, '        locationConfirmed:false,', '        locationConfirmed:false,\n        stationId:"",')
    html = replace_once(html, '  let currentWeatherForObservation = null;', '  let currentWeatherForObservation = null;\n  let weatherRequestSerial = 0;')
    html = replace_once(html, 'service-worker.js?v=22', 'service-worker.js?v=23')
    html = replace_once(html, '<h2>오늘의 날씨</h2><p>설정한 텃밭 위치 기준</p>', '<h2>최근 확정 기상자료</h2><p>선택한 ASOS 관측지점 기준 · 오늘의 실시간 날씨가 아닙니다.</p>')
    html = replace_once(html, '날씨를 불러오려면 설정에서 위치를 확인하세요.', '날씨를 불러오려면 설정에서 ASOS 관측지점을 선택하세요.')

    old_location_start = '          <label for="gardenPlace">텃밭 지역 *</label>'
    html = replace_between(html, old_location_start, '        <div class="field"><label for="tempMin">', '''          <label for="gardenPlace">텃밭 지역 *</label>
          <input id="gardenPlace" required placeholder="예: 팔봉중학교 텃밭, 서산시 팔봉면">
          <label for="asosStation">대표 기상 관측지점 *</label>
          <select id="asosStation" required aria-describedby="placeSearchStatus"><option value="">관측지점 선택</option></select>
          <div id="placeSearchStatus" class="location-search-status">텃밭과 가까운 ASOS 관측지점을 직접 선택하세요. 관측소 자료는 텃밭에서 직접 측정한 값이 아닙니다. GPS와 외부 지역검색을 사용하지 않습니다.</div>
          <input id="latitude" type="hidden"><input id="longitude" type="hidden">
        </div>
''')

    adapter = r'''  // 기상청 ASOS 일자료. 관측지점은 학생이 직접 선택합니다.
  const ASOS_URL="https://asia-northeast3-school-garden-weather.cloudfunctions.net/asosDaily";
  const ASOS_STATIONS=Object.freeze(STATION_JSON);
  const ASOS_FIELDS=["mean","max","min","rain","sun"];

  function validAsosStation(id){return Object.prototype.hasOwnProperty.call(ASOS_STATIONS,String(id||""));}
  function asosStationLabel(id){return validAsosStation(id)?`${ASOS_STATIONS[String(id)]} (${id})`:"관측지점 미설정";}
  function asosDateValid(date){
    if(typeof date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
    const d=new Date(date+"T00:00:00Z");
    return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===date;
  }
  function latestAsosDate(now=new Date()){
    const parts=Object.fromEntries(new Intl.DateTimeFormat("en-US",{
      timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"
    }).formatToParts(now).filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
    const back=Number(parts.hour)<11?2:1;
    return new Date(Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day))-back*86400000).toISOString().slice(0,10);
  }
  function asosNumber(value){
    if(value===null||value===undefined||String(value).trim()==="")return null;
    const n=Number(value);return Number.isFinite(n)?n:null;
  }
  function normalizeAsosWeather(json,date,station){
    if(!json||typeof json!=="object"||json.date!==date||String(json.stationId)!==station||json.dataType!=="observation")
      throw new Error("기상자료 응답을 확인하지 못했습니다.");
    const w={date,source:"기상청 ASOS",dataType:"observation",stationId:station,stationName:ASOS_STATIONS[station]};
    ASOS_FIELDS.forEach(key=>w[key]=asosNumber(json[key]));
    if(ASOS_FIELDS.every(key=>w[key]===null))throw new Error("사용 가능한 기상 관측값이 없습니다.");
    return w;
  }
  async function fetchWeather(date){
    const station=String(state.project.stationId||"");
    if(!validAsosStation(station))throw new Error("설정에서 ASOS 관측지점을 먼저 선택해 주세요.");
    if(!asosDateValid(date))throw new Error("조회 날짜를 확인해 주세요.");
    if(date>latestAsosDate())throw new Error("해당 날짜의 확정 일자료가 아직 없습니다. 오늘 관찰은 먼저 기록하고, 자료가 발표된 뒤 날씨를 추가해 주세요.");
    const params=new URLSearchParams({station,date});
    let res;
    try{
      res=await fetch(`${ASOS_URL}?${params}`,{signal:AbortSignal.timeout(15000)});
    }catch(error){throw new Error("기상청 날씨 서버에 연결하지 못했습니다. 네트워크를 확인하거나 잠시 후 다시 시도해 주세요.");}
    let json;
    try{json=await res.json();}catch{throw new Error("기상자료 응답을 읽지 못했습니다.");}
    if(!res.ok)throw new Error(typeof json.message==="string"?json.message:"기상자료를 불러오지 못했습니다.");
    return normalizeAsosWeather(json,date,station);
  }

'''.replace('STATION_JSON', json.dumps(STATIONS,ensure_ascii=False,separators=(',',':')))
    html = replace_between(html, '  // 지역명은 외부 지오코딩 서비스에서', '  function renderWeatherTo(prefix,w){', adapter)

    old_fill = '  function fillSetup(){'
    new_fill = '''  function fillSetup(){
    const p=state.project;
    const ack=document.getElementById("privacyAck"); if(ack && p.cropName) ack.checked=true;
    ["studentName","studentClass","cropName","variety","plantDate","gardenPlace","tempMin","tempMax","sunHours","rainWeekly","latitude","longitude","cropNotes"].forEach(id=>{
      const el=document.getElementById(id);if(el)el.value=p[id]??"";
    });
    document.getElementById("asosStation").value=validAsosStation(p.stationId)?String(p.stationId):"";
    const status=document.getElementById("placeSearchStatus");
    status.textContent=validAsosStation(p.stationId)?`선택된 관측지점: ${asosStationLabel(p.stationId)} · 텃밭 현장 측정값과 다를 수 있습니다.`:"텃밭과 가까운 ASOS 관측지점을 선택해 주세요. 기존 지역명과 기록은 그대로 유지됩니다.";
    status.className=validAsosStation(p.stationId)?"location-search-status ok":"location-search-status";
  }

'''
    html = replace_between(html, old_fill, '  function showSetup(force=false){', new_fill)

    new_setup = '''  document.getElementById("asosStation").replaceChildren(new Option("관측지점 선택",""),...Object.entries(ASOS_STATIONS).map(([id,name])=>new Option(`${name} (${id})`,id)));
  document.getElementById("asosStation").addEventListener("change",e=>{
    const status=document.getElementById("placeSearchStatus");
    status.textContent=e.target.value?`선택된 관측지점: ${asosStationLabel(e.target.value)} · 텃밭 현장 측정값과 다를 수 있습니다.`:"관측지점을 선택해 주세요.";
    status.className=e.target.value?"location-search-status ok":"location-search-status";
  });
  document.getElementById("setupForm").addEventListener("submit",e=>{
    e.preventDefault();
    const station=document.getElementById("asosStation").value;
    if(!validAsosStation(station)){
      document.getElementById("placeSearchStatus").textContent="ASOS 관측지점을 선택해 주세요.";
      document.getElementById("asosStation").focus();return;
    }
    const ids=["studentName","studentClass","cropName","variety","plantDate","gardenPlace","tempMin","tempMax","sunHours","rainWeekly","latitude","longitude","cropNotes"];
    ids.forEach(id=>state.project[id]=document.getElementById(id).value);
    state.project.stationId=station;
    state.project.locationConfirmed=true;
    weatherRequestSerial++;
    currentWeatherForObservation=null;
    renderWeatherTo("ow",null);
    saveState();hideSetup();toast("프로젝트 설정을 저장했습니다.");
    requestPersistentStorage();loadTodayWeather();
  });

'''
    html = replace_between(html, '  document.getElementById("searchPlaceBtn").addEventListener', '  async function handlePhotoSelection(file, sourceLabel){', new_setup)

    new_weather_events = '''  document.getElementById("obsDate").addEventListener("change",()=>{
    weatherRequestSerial++;
    currentWeatherForObservation=null;
    renderWeatherTo("ow",null);
    setStatus("obsStatus","관찰 날짜가 바뀌었습니다. 해당 날짜의 날씨를 다시 가져와 주세요.","warn");
  });
  document.getElementById("fetchObsWeather").addEventListener("click",async()=>{
    const date=document.getElementById("obsDate").value;
    if(!date){setStatus("obsStatus","관찰 날짜를 먼저 선택해 주세요.","warn");return;}
    const serial=++weatherRequestSerial;
    const station=String(state.project.stationId||"");
    currentWeatherForObservation=null;renderWeatherTo("ow",null);
    try{
      setStatus("obsStatus","기상청 확정 일자료를 불러오는 중입니다.","warn");
      const w=await fetchWeather(date);
      if(serial!==weatherRequestSerial||document.getElementById("obsDate").value!==date||String(state.project.stationId||"")!==station)return;
      currentWeatherForObservation=w;
      renderWeatherTo("ow",w);
      setStatus("obsStatus",`${date} · ${asosStationLabel(station)} · 기상청 ASOS 관측자료`,"ok");
    }catch(err){if(serial===weatherRequestSerial)setStatus("obsStatus",err.message,"error");}
  });

  async function loadTodayWeather(){
    const date=latestAsosDate();
    try{
      document.getElementById("todayWeatherStatus").textContent="최근 확정 기상자료를 불러오는 중…";
      const w=await fetchWeather(date);
      renderWeatherTo("w",w);
      document.getElementById("todayWeatherStatus").textContent=`${asosStationLabel(w.stationId)} · ${w.date} · 기상청 ASOS 확정 일자료`;
    }catch(err){
      document.getElementById("todayWeatherStatus").textContent=err.message;
      renderWeatherTo("w",null);
    }
  }
'''
    html = replace_between(html, '  document.getElementById("fetchObsWeather").addEventListener', '  document.getElementById("refreshTodayWeather").addEventListener', new_weather_events)
    html = replace_once(html, '        weather:currentWeatherForObservation,', '        weather:currentWeatherForObservation?.date===document.getElementById("obsDate").value?currentWeatherForObservation:null,')
    html = replace_once(html, '  if(!state.project.cropName || !state.project.plantDate) showSetup(true);', '  if(!state.project.cropName || !state.project.plantDate || !validAsosStation(state.project.stationId)) showSetup(true);')
    html = replace_once(html, '날씨 조회 시 학생이 직접 설정한 텃밭 지역의 좌표와 날짜만 Open‑Meteo로 전송됩니다. 개인의 현재 위치(GPS)는 사용하지 않습니다.', '날씨 조회 시 선택한 ASOS 관측지점 번호와 날짜만 Firebase 날씨 함수로 전송됩니다. 기상청 인증키는 서버에 보관하며 GPS는 사용하지 않습니다.')
    html = replace_once(html, '날씨 조회에는 설정한 텃밭의 위도·경도와 조회 날짜가 외부 날씨 서비스로 전송됩니다. 호스팅·CDN 사업자는 일반적인 접속정보를 처리할 수 있습니다.', '날씨 조회에는 선택한 ASOS 관측지점 번호와 날짜만 Firebase 날씨 함수로 전송됩니다. 기상청 인증키는 서버에 보관합니다. 호스팅·CDN 사업자는 일반적인 접속정보를 처리할 수 있습니다.')
    html = replace_once(html, '날씨 기능을 이용할 때에는 이용자가 지정한 <strong>텃밭 지역의 좌표와 조회 날짜</strong>가 Open‑Meteo에 전송됩니다. 학생 이름·사진·관찰 내용은 날씨 요청에 포함하지 않으며 개인의 현재 위치(GPS)는 사용하지 않습니다.', '날씨 기능은 선택한 <strong>ASOS 관측지점 번호와 조회 날짜</strong>를 Firebase Functions로 전송하고, 서버에서 기상청 API를 호출합니다. 학생 이름·사진·관찰 내용은 날씨 요청에 포함하지 않으며 개인의 현재 위치(GPS)는 사용하지 않습니다.')
    html = replace_once(html, 'GitHub Pages, jsDelivr, Open‑Meteo와 같은 외부 서비스를 이용하며', 'GitHub Pages, jsDelivr, Firebase Functions, 기상청 API와 같은 외부 서비스를 이용하며')
    html = replace_once(html, '<li>Open‑Meteo: 지역 검색 및 날씨 데이터 조회</li>', '<li>Firebase Functions / Google Cloud: 기상청 API 호출 및 인증키 보관</li>\n          <li>기상청: ASOS 관측지점의 일자료 제공</li>')
    html = replace_once(html, '<div><strong>개발자:</strong> 이 제중</div>', '<div><strong>개발자:</strong> 이제중</div>')
    html = replace_once(html, '<div class="maker">만든 사람 이 제중 · 팔봉중학교</div>', '<div class="maker">만든 사람 이제중 · 팔봉중학교</div>')
    html = replace_once(html, '시행일: 2026년 9월 5일', '시행일: 2026년 9월 8일')
    assert 'geocoding-api.open-meteo.com' not in html
    assert 'api.open-meteo.com/v1/forecast' not in html
    assert 'archive-api.open-meteo.com' not in html
    assert 'searchPlaceBtn' not in html
    assert 'KMA_ASOS_SERVICE_KEY' not in html
    return html


def main():
    path=ROOT/'index.html'
    original=path.read_bytes()
    actual=hashlib.sha1(b'blob '+str(len(original)).encode()+b'\\0'+original).hexdigest()
    if actual!=EXPECTED:
        raise RuntimeError(f'Unexpected source SHA: {actual}; no files changed')
    # Correct the Git blob header explicitly, rather than using a plain content hash.
    html=migrate(original.decode('utf-8'))
    sw=ROOT/'service-worker.js'
    sw_text=replace_once(sw.read_text(encoding='utf-8'),'school-garden-v13','school-garden-v14')
    sw_text=replace_once(sw_text,'mobile-fixes.css?v=22','mobile-fixes.css?v=22') if False else sw_text
    # Prepare all outputs before writing, so any failed anchor leaves the repository untouched.
    path.write_text(html,encoding='utf-8')
    sw.write_text(sw_text,encoding='utf-8')
    print('ASOS migration prepared; original browser storage keys and photo APIs preserved.')

if __name__=='__main__':
    main()
