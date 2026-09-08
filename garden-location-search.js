(function(root){
  "use strict";
  // Offline search hints. These are station candidates, not a distance ranking.
  const HINTS = Object.freeze({
    "서산":[129], "서산시":[129], "팔봉":[129], "팔봉면":[129], "팔봉중학교":[129],
    "당진":[129,177], "당진시":[129,177], "태안":[129], "태안군":[129],
    "홍성":[177], "홍성군":[177], "예산":[177,129], "예산군":[177,129],
    "천안":[232], "천안시":[232], "아산":[232], "아산시":[232],
    "공주":[239,133], "공주시":[239,133], "논산":[236,133], "논산시":[236,133],
    "계룡":[133], "계룡시":[133], "청양":[235,236], "청양군":[235,236],
    "서천":[235,140], "서천군":[235,140],
    "서울특별시":[108], "서울시":[108], "강남구":[108], "서초구":[108],
    "부산광역시":[159], "부산시":[159], "대구광역시":[143], "대구시":[143],
    "인천광역시":[112], "인천시":[112], "대전광역시":[133], "대전시":[133],
    "울산광역시":[152], "울산시":[152], "광주광역시":[156],
    "경기도광주시":[203], "광주시":[156,203], "광주":[156,203],
    "세종특별자치시":[239], "세종시":[239],
    "제주시":[184], "제주특별자치도":[184,185,188,189],
    "서귀포시":[189], "제주도":[184,185,188,189],
    "수원시":[119], "용인시":[119,203], "화성시":[119],
    "성남시":[119,203], "안양시":[119,112], "과천시":[119,108],
    "안산시":[119,112], "시흥시":[112,119], "부천시":[112,108],
    "김포시":[112,201], "고양시":[99,108], "의정부시":[98,108],
    "남양주시":[98,202], "구리시":[108,202], "하남시":[108,203],
    "광명시":[108,112], "군포시":[119], "의왕시":[119],
    "평택시":[119,232], "오산시":[119], "안성시":[119,232],
    "이천시":[203], "여주시":[203,202], "양주시":[98,99],
    "포천시":[98,101], "동두천시":[98], "파주시":[99],
    "연천군":[98,95], "가평군":[101,202], "양평군":[202],
    "청주시":[131], "충주시":[127], "제천시":[221],
    "진천군":[131,127], "음성군":[127,131], "괴산군":[226,127],
    "증평군":[131,226], "단양군":[221,121], "영동군":[135,226],
    "옥천군":[133,226], "보은군":[226], "증평":[131,226],
    "전주시":[146], "군산시":[140], "익산시":[140,146],
    "김제시":[140,146], "완주군":[146,243], "무주군":[248,238],
    "진안군":[248,146], "장수군":[248], "임실군":[244], "순창군":[254],
    "남원시":[247], "정읍시":[245], "고창군":[251,172], "부안군":[243],
    "목포시":[165], "여수시":[168], "순천시":[174], "나주시":[156,165],
    "담양군":[156,254], "곡성군":[174,247], "구례군":[174,266],
    "화순군":[156,258], "장흥군":[260], "강진군":[259], "해남군":[261],
    "영암군":[165,261], "무안군":[165], "함평군":[165,252],
    "영광군":[252], "장성군":[156,252], "완도군":[170], "진도군":[268],
    "신안군":[165,169], "고흥군":[262], "보성군":[258],
    "포항시":[138], "경주시":[283], "김천시":[279,137],
    "안동시":[136], "구미시":[279], "영주시":[272], "영천시":[281],
    "상주시":[137], "문경시":[273], "경산시":[143,281],
    "군위군":[278,143], "의성군":[278], "청송군":[276], "영양군":[271,277],
    "영덕군":[277], "청도군":[143,281], "고령군":[143,285],
    "성주군":[279,143], "칠곡군":[279,143], "예천군":[136,272],
    "봉화군":[271], "울진군":[130], "울릉군":[115],
    "창원시":[155,255], "진주시":[192], "통영시":[162],
    "사천시":[192,162], "김해시":[253], "밀양시":[288], "거제시":[294],
    "양산시":[257], "의령군":[263], "함안군":[255,263],
    "창녕군":[288,155], "고성군경남":[162,192], "남해군":[295],
    "하동군":[192,295], "산청군":[289], "함양군":[264],
    "거창군":[284], "합천군":[285],
    "춘천시":[101,93], "원주시":[114], "강릉시":[105,104],
    "동해시":[106], "태백시":[216], "속초시":[90], "삼척시":[106],
    "홍천군":[212], "횡성군":[114,212], "영월군":[121], "평창군":[100,114],
    "정선군":[217], "철원군":[95], "화천군":[101,95],
    "양구군":[93,211], "인제군":[211], "고성군강원":[90,104],
    "양양군":[90,104],
    "seosan":[129], "seoul":[108], "busan":[159], "daegu":[143],
    "incheon":[112], "daejeon":[133], "ulsan":[152],
    "gwangju":[156,203], "sejong":[239], "jeju":[184,185,188,189],
    "cheonan":[232], "asan":[232], "gongju":[239,133],
    "nonsan":[236,133], "dangjin":[129,177], "taean":[129],
    "hongseong":[177], "yesan":[177,129], "boryeong":[235]
  });

  function normalize(value){
    return String(value||"").toLowerCase().replace(/[\s,.\-·()]/g,"");
  }
  function search(query,stations,limit=10){
    const q=normalize(query);
    if(!q)return [];
    const found=new Map();
    function add(id,score,match){
      id=String(id);
      if(!Object.prototype.hasOwnProperty.call(stations,id))return;
      const previous=found.get(id);
      if(!previous||score>previous.score)
        found.set(id,{id,name:stations[id],score,match});
    }
    const exactHints=Object.entries(HINTS).filter(([alias])=>normalize(alias)===q);
    if(exactHints.length){
      exactHints.forEach(([alias,ids])=>ids.forEach((id,i)=>add(id,100-i,alias)));
    }else{
      Object.entries(HINTS).forEach(([alias,ids])=>{
        const a=normalize(alias);
        if(a.length>=2 && q.includes(a))
          ids.forEach((id,i)=>add(id,40+a.length*2-i,alias));
      });
      Object.entries(stations).forEach(([id,name])=>{
        const n=normalize(name);
        if(q===id||q===n)add(id,110,name);
        else if(n.length>=2&&(q.includes(n)||n.includes(q)))
          add(id,50+n.length,name);
      });
    }
    return [...found.values()].sort((a,b)=>b.score-a.score||Number(a.id)-Number(b.id))
      .slice(0,Math.max(1,Math.min(20,limit))).map(({id,name,match})=>({id,name,match}));
  }
  let controller=null;
  function mount(stations){
    if(controller)return controller;
    const input=document.getElementById("gardenPlace");
    const button=document.getElementById("searchPlaceBtn");
    const select=document.getElementById("asosStation");
    const results=document.getElementById("placeSearchResults");
    const status=document.getElementById("placeSearchStatus");
    if(!input||!button||!select||!results||!status)throw new Error("지역 검색 화면을 찾지 못했습니다.");
    function clear(){results.replaceChildren();}
    function runSearch(){
      clear();
      const query=input.value.trim();
      if(query.length<2&&!/^\d+$/.test(query)){
        status.textContent="지역명을 2글자 이상 입력해 주세요.";
        status.className="location-search-status error";
        return;
      }
      const matches=search(query,stations);
      if(!matches.length){
        status.textContent="검색 결과가 없습니다. 시·군 이름으로 다시 검색하거나 아래에서 관측지점을 직접 선택해 주세요.";
        status.className="location-search-status";
        return;
      }
      status.textContent=`관측지점 후보 ${matches.length}개입니다. 텃밭과 가까운 지점을 확인해 선택하세요.`;
      status.className="location-search-status";
      matches.forEach(match=>{
        const choice=document.createElement("button");
        choice.type="button";
        choice.className="location-result";
        choice.textContent=`${match.name} (${match.id}) · 관측지점 선택`;
        choice.addEventListener("click",()=>{
          select.value=match.id;
          select.dispatchEvent(new Event("change",{bubbles:true}));
          clear();
          status.textContent=`✅ ${match.name} (${match.id}) 선택 · 텃밭 지역명은 그대로 유지됩니다. 저장 버튼을 눌러 확정하세요.`;
          status.className="location-search-status ok";
        });
        results.appendChild(choice);
      });
    }
    button.addEventListener("click",runSearch);
    input.addEventListener("keydown",event=>{
      if(event.key==="Enter"){event.preventDefault();runSearch();}
    });
    input.addEventListener("input",()=>{
      clear();
      select.value="";
      status.textContent="지역명이 변경되었습니다. 대표 관측지점을 다시 선택해 주세요.";
      status.className="location-search-status";
    });
    controller=Object.freeze({clear,runSearch});
    return controller;
  }
  function clear(){if(controller)controller.clear();}
  root.GardenLocationSearch=Object.freeze({search,normalize,mount,clear});
})(typeof globalThis!=="undefined"?globalThis:this);
