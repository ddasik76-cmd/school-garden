(function(root){
  "use strict";

  // 사용자는 행정구역을 검색하고, 앱은 내부적으로 대표 ASOS 관측지점을 자동 연결합니다.
  // stations 배열의 첫 번째 값이 기본 관측지점이며, 뒤 값은 사용자가 수동 변경할 때 참고할 후보입니다.
  const REGIONS = Object.freeze([
    // 충청남도
    {label:"충청남도 서산시",aliases:["서산","서산시","팔봉","팔봉면","팔봉중학교"],stations:[129]},
    {label:"충청남도 당진시",aliases:["당진","당진시"],stations:[129,177]},
    {label:"충청남도 태안군",aliases:["태안","태안군"],stations:[129]},
    {label:"충청남도 홍성군",aliases:["홍성","홍성군"],stations:[177]},
    {label:"충청남도 예산군",aliases:["예산","예산군"],stations:[177,129]},
    {label:"충청남도 천안시",aliases:["천안","천안시","천안동남구","천안서북구","동남구","서북구"],stations:[232]},
    {label:"충청남도 아산시",aliases:["아산","아산시"],stations:[232]},
    {label:"충청남도 공주시",aliases:["공주","공주시"],stations:[239,133]},
    {label:"충청남도 보령시",aliases:["보령","보령시","대천"],stations:[235]},
    {label:"충청남도 논산시",aliases:["논산","논산시"],stations:[236,133]},
    {label:"충청남도 계룡시",aliases:["계룡","계룡시"],stations:[133]},
    {label:"충청남도 금산군",aliases:["금산","금산군"],stations:[238]},
    {label:"충청남도 부여군",aliases:["부여","부여군"],stations:[236]},
    {label:"충청남도 서천군",aliases:["서천","서천군"],stations:[235,140]},
    {label:"충청남도 청양군",aliases:["청양","청양군"],stations:[235,236]},

    // 서울특별시
    ...["종로구","중구","용산구","성동구","광진구","동대문구","중랑구","성북구","강북구","도봉구","노원구","은평구","서대문구","마포구","양천구","강서구","구로구","금천구","영등포구","동작구","관악구","서초구","강남구","송파구","강동구"].map(name=>({label:`서울특별시 ${name}`,aliases:[name,`서울 ${name}`],stations:[108]})),
    {label:"서울특별시",aliases:["서울","서울시","서울특별시"],stations:[108]},

    // 부산광역시
    ...["중구","서구","동구","영도구","부산진구","동래구","남구","북구","해운대구","사하구","금정구","강서구","연제구","수영구","사상구","기장군"].map(name=>({label:`부산광역시 ${name}`,aliases:[`부산${name}`,`부산 ${name}`],stations:[159]})),
    {label:"부산광역시",aliases:["부산","부산시","부산광역시"],stations:[159]},

    // 대구광역시
    ...["중구","동구","서구","남구","북구","수성구","달서구","달성군","군위군"].map(name=>({label:`대구광역시 ${name}`,aliases:[`대구${name}`,`대구 ${name}`],stations:[143]})),
    {label:"대구광역시",aliases:["대구","대구시","대구광역시"],stations:[143]},

    // 인천광역시
    ...["중구","동구","미추홀구","연수구","남동구","부평구","계양구","서구","옹진군"].map(name=>({label:`인천광역시 ${name}`,aliases:[`인천${name}`,`인천 ${name}`],stations:[112]})),
    {label:"인천광역시 강화군",aliases:["강화","강화군","인천강화"],stations:[201,112]},
    {label:"인천광역시",aliases:["인천","인천시","인천광역시"],stations:[112]},

    // 광주·대전·울산·세종
    ...["동구","서구","남구","북구","광산구"].map(name=>({label:`광주광역시 ${name}`,aliases:[`광주${name}`,`광주 ${name}`],stations:[156]})),
    {label:"광주광역시",aliases:["광주","광주시","광주광역시"],stations:[156]},
    ...["동구","중구","서구","유성구","대덕구"].map(name=>({label:`대전광역시 ${name}`,aliases:[`대전${name}`,`대전 ${name}`],stations:[133]})),
    {label:"대전광역시",aliases:["대전","대전시","대전광역시"],stations:[133]},
    ...["중구","남구","동구","북구","울주군"].map(name=>({label:`울산광역시 ${name}`,aliases:[`울산${name}`,`울산 ${name}`],stations:[152]})),
    {label:"울산광역시",aliases:["울산","울산시","울산광역시"],stations:[152]},
    {label:"세종특별자치시",aliases:["세종","세종시","세종특별자치시"],stations:[239]},

    // 경기도
    {label:"경기도 수원시",aliases:["수원","수원시"],stations:[119]},
    {label:"경기도 용인시",aliases:["용인","용인시"],stations:[119,203]},
    {label:"경기도 화성시",aliases:["화성","화성시"],stations:[119]},
    {label:"경기도 성남시",aliases:["성남","성남시"],stations:[119,203]},
    {label:"경기도 안양시",aliases:["안양","안양시"],stations:[119,112]},
    {label:"경기도 과천시",aliases:["과천","과천시"],stations:[119,108]},
    {label:"경기도 안산시",aliases:["안산","안산시"],stations:[119,112]},
    {label:"경기도 시흥시",aliases:["시흥","시흥시"],stations:[112,119]},
    {label:"경기도 부천시",aliases:["부천","부천시"],stations:[112,108]},
    {label:"경기도 김포시",aliases:["김포","김포시"],stations:[112,201]},
    {label:"경기도 고양시",aliases:["고양","고양시"],stations:[99,108]},
    {label:"경기도 의정부시",aliases:["의정부","의정부시"],stations:[98,108]},
    {label:"경기도 남양주시",aliases:["남양주","남양주시"],stations:[98,202]},
    {label:"경기도 구리시",aliases:["구리","구리시"],stations:[108,202]},
    {label:"경기도 하남시",aliases:["하남","하남시"],stations:[108,203]},
    {label:"경기도 광명시",aliases:["광명","광명시"],stations:[108,112]},
    {label:"경기도 군포시",aliases:["군포","군포시"],stations:[119]},
    {label:"경기도 의왕시",aliases:["의왕","의왕시"],stations:[119]},
    {label:"경기도 평택시",aliases:["평택","평택시"],stations:[119,232]},
    {label:"경기도 오산시",aliases:["오산","오산시"],stations:[119]},
    {label:"경기도 안성시",aliases:["안성","안성시"],stations:[119,232]},
    {label:"경기도 이천시",aliases:["이천","이천시"],stations:[203]},
    {label:"경기도 여주시",aliases:["여주","여주시"],stations:[203,202]},
    {label:"경기도 양주시",aliases:["양주","양주시"],stations:[98,99]},
    {label:"경기도 포천시",aliases:["포천","포천시"],stations:[98,101]},
    {label:"경기도 동두천시",aliases:["동두천","동두천시"],stations:[98]},
    {label:"경기도 파주시",aliases:["파주","파주시"],stations:[99]},
    {label:"경기도 광주시",aliases:["경기광주","경기도광주","경기도광주시","광주시"],stations:[203]},
    {label:"경기도 연천군",aliases:["연천","연천군"],stations:[98,95]},
    {label:"경기도 가평군",aliases:["가평","가평군"],stations:[101,202]},
    {label:"경기도 양평군",aliases:["양평","양평군"],stations:[202]},

    // 충청북도
    {label:"충청북도 청주시",aliases:["청주","청주시"],stations:[131]},
    {label:"충청북도 충주시",aliases:["충주","충주시"],stations:[127]},
    {label:"충청북도 제천시",aliases:["제천","제천시"],stations:[221]},
    {label:"충청북도 진천군",aliases:["진천","진천군"],stations:[131,127]},
    {label:"충청북도 음성군",aliases:["음성","음성군"],stations:[127,131]},
    {label:"충청북도 괴산군",aliases:["괴산","괴산군"],stations:[226,127]},
    {label:"충청북도 증평군",aliases:["증평","증평군"],stations:[131,226]},
    {label:"충청북도 단양군",aliases:["단양","단양군"],stations:[221,121]},
    {label:"충청북도 영동군",aliases:["영동","영동군"],stations:[135,226]},
    {label:"충청북도 옥천군",aliases:["옥천","옥천군"],stations:[133,226]},
    {label:"충청북도 보은군",aliases:["보은","보은군"],stations:[226]},

    // 전북특별자치도
    {label:"전북특별자치도 전주시",aliases:["전주","전주시"],stations:[146]},
    {label:"전북특별자치도 군산시",aliases:["군산","군산시"],stations:[140]},
    {label:"전북특별자치도 익산시",aliases:["익산","익산시"],stations:[140,146]},
    {label:"전북특별자치도 김제시",aliases:["김제","김제시"],stations:[140,146]},
    {label:"전북특별자치도 완주군",aliases:["완주","완주군"],stations:[146,243]},
    {label:"전북특별자치도 무주군",aliases:["무주","무주군"],stations:[248,238]},
    {label:"전북특별자치도 진안군",aliases:["진안","진안군"],stations:[248,146]},
    {label:"전북특별자치도 장수군",aliases:["장수","장수군"],stations:[248]},
    {label:"전북특별자치도 임실군",aliases:["임실","임실군"],stations:[244]},
    {label:"전북특별자치도 순창군",aliases:["순창","순창군"],stations:[254]},
    {label:"전북특별자치도 남원시",aliases:["남원","남원시"],stations:[247]},
    {label:"전북특별자치도 정읍시",aliases:["정읍","정읍시"],stations:[245]},
    {label:"전북특별자치도 고창군",aliases:["고창","고창군"],stations:[251,172]},
    {label:"전북특별자치도 부안군",aliases:["부안","부안군"],stations:[243]},

    // 전라남도
    {label:"전라남도 목포시",aliases:["목포","목포시"],stations:[165]},
    {label:"전라남도 여수시",aliases:["여수","여수시"],stations:[168]},
    {label:"전라남도 순천시",aliases:["순천","순천시"],stations:[174]},
    {label:"전라남도 광양시",aliases:["광양","광양시"],stations:[266]},
    {label:"전라남도 나주시",aliases:["나주","나주시"],stations:[156,165]},
    {label:"전라남도 담양군",aliases:["담양","담양군"],stations:[156,254]},
    {label:"전라남도 곡성군",aliases:["곡성","곡성군"],stations:[174,247]},
    {label:"전라남도 구례군",aliases:["구례","구례군"],stations:[174,266]},
    {label:"전라남도 화순군",aliases:["화순","화순군"],stations:[156,258]},
    {label:"전라남도 장흥군",aliases:["장흥","장흥군"],stations:[260]},
    {label:"전라남도 강진군",aliases:["강진","강진군"],stations:[259]},
    {label:"전라남도 해남군",aliases:["해남","해남군"],stations:[261]},
    {label:"전라남도 영암군",aliases:["영암","영암군"],stations:[165,261]},
    {label:"전라남도 무안군",aliases:["무안","무안군"],stations:[165]},
    {label:"전라남도 함평군",aliases:["함평","함평군"],stations:[165,252]},
    {label:"전라남도 영광군",aliases:["영광","영광군"],stations:[252]},
    {label:"전라남도 장성군",aliases:["장성","장성군"],stations:[156,252]},
    {label:"전라남도 완도군",aliases:["완도","완도군"],stations:[170]},
    {label:"전라남도 진도군",aliases:["진도","진도군"],stations:[268]},
    {label:"전라남도 신안군",aliases:["신안","신안군"],stations:[165,169]},
    {label:"전라남도 고흥군",aliases:["고흥","고흥군"],stations:[262]},
    {label:"전라남도 보성군",aliases:["보성","보성군"],stations:[258]},

    // 경상북도
    {label:"경상북도 포항시",aliases:["포항","포항시"],stations:[138]},
    {label:"경상북도 경주시",aliases:["경주","경주시"],stations:[283]},
    {label:"경상북도 김천시",aliases:["김천","김천시"],stations:[279,137]},
    {label:"경상북도 안동시",aliases:["안동","안동시"],stations:[136]},
    {label:"경상북도 구미시",aliases:["구미","구미시"],stations:[279]},
    {label:"경상북도 영주시",aliases:["영주","영주시"],stations:[272]},
    {label:"경상북도 영천시",aliases:["영천","영천시"],stations:[281]},
    {label:"경상북도 상주시",aliases:["상주","상주시"],stations:[137]},
    {label:"경상북도 문경시",aliases:["문경","문경시"],stations:[273]},
    {label:"경상북도 경산시",aliases:["경산","경산시"],stations:[143,281]},
    {label:"경상북도 의성군",aliases:["의성","의성군"],stations:[278]},
    {label:"경상북도 청송군",aliases:["청송","청송군"],stations:[276]},
    {label:"경상북도 영양군",aliases:["영양","영양군"],stations:[271,277]},
    {label:"경상북도 영덕군",aliases:["영덕","영덕군"],stations:[277]},
    {label:"경상북도 청도군",aliases:["청도","청도군"],stations:[143,281]},
    {label:"경상북도 고령군",aliases:["고령","고령군"],stations:[143,285]},
    {label:"경상북도 성주군",aliases:["성주","성주군"],stations:[279,143]},
    {label:"경상북도 칠곡군",aliases:["칠곡","칠곡군"],stations:[279,143]},
    {label:"경상북도 예천군",aliases:["예천","예천군"],stations:[136,272]},
    {label:"경상북도 봉화군",aliases:["봉화","봉화군"],stations:[271]},
    {label:"경상북도 울진군",aliases:["울진","울진군"],stations:[130]},
    {label:"경상북도 울릉군",aliases:["울릉","울릉군","울릉도"],stations:[115]},

    // 경상남도
    {label:"경상남도 창원시",aliases:["창원","창원시"],stations:[155,255]},
    {label:"경상남도 진주시",aliases:["진주","진주시"],stations:[192]},
    {label:"경상남도 통영시",aliases:["통영","통영시"],stations:[162]},
    {label:"경상남도 사천시",aliases:["사천","사천시"],stations:[192,162]},
    {label:"경상남도 김해시",aliases:["김해","김해시"],stations:[253]},
    {label:"경상남도 밀양시",aliases:["밀양","밀양시"],stations:[288]},
    {label:"경상남도 거제시",aliases:["거제","거제시"],stations:[294]},
    {label:"경상남도 양산시",aliases:["양산","양산시"],stations:[257]},
    {label:"경상남도 의령군",aliases:["의령","의령군"],stations:[263]},
    {label:"경상남도 함안군",aliases:["함안","함안군"],stations:[255,263]},
    {label:"경상남도 창녕군",aliases:["창녕","창녕군"],stations:[288,155]},
    {label:"경상남도 고성군",aliases:["경남고성","고성군경남"],stations:[162,192]},
    {label:"경상남도 남해군",aliases:["남해","남해군"],stations:[295]},
    {label:"경상남도 하동군",aliases:["하동","하동군"],stations:[192,295]},
    {label:"경상남도 산청군",aliases:["산청","산청군"],stations:[289]},
    {label:"경상남도 함양군",aliases:["함양","함양군"],stations:[264]},
    {label:"경상남도 거창군",aliases:["거창","거창군"],stations:[284]},
    {label:"경상남도 합천군",aliases:["합천","합천군"],stations:[285]},

    // 강원특별자치도
    {label:"강원특별자치도 춘천시",aliases:["춘천","춘천시"],stations:[101,93]},
    {label:"강원특별자치도 원주시",aliases:["원주","원주시"],stations:[114]},
    {label:"강원특별자치도 강릉시",aliases:["강릉","강릉시"],stations:[105,104]},
    {label:"강원특별자치도 동해시",aliases:["동해","동해시"],stations:[106]},
    {label:"강원특별자치도 태백시",aliases:["태백","태백시"],stations:[216]},
    {label:"강원특별자치도 속초시",aliases:["속초","속초시"],stations:[90]},
    {label:"강원특별자치도 삼척시",aliases:["삼척","삼척시"],stations:[106]},
    {label:"강원특별자치도 홍천군",aliases:["홍천","홍천군"],stations:[212]},
    {label:"강원특별자치도 횡성군",aliases:["횡성","횡성군"],stations:[114,212]},
    {label:"강원특별자치도 영월군",aliases:["영월","영월군"],stations:[121]},
    {label:"강원특별자치도 평창군",aliases:["평창","평창군","대관령"],stations:[100,114]},
    {label:"강원특별자치도 정선군",aliases:["정선","정선군"],stations:[217]},
    {label:"강원특별자치도 철원군",aliases:["철원","철원군"],stations:[95]},
    {label:"강원특별자치도 화천군",aliases:["화천","화천군"],stations:[101,95]},
    {label:"강원특별자치도 양구군",aliases:["양구","양구군"],stations:[93,211]},
    {label:"강원특별자치도 인제군",aliases:["인제","인제군"],stations:[211]},
    {label:"강원특별자치도 고성군",aliases:["강원고성","고성군강원"],stations:[90,104]},
    {label:"강원특별자치도 양양군",aliases:["양양","양양군"],stations:[90,104]},

    // 제주특별자치도
    {label:"제주특별자치도 제주시",aliases:["제주","제주시","제주도 제주시"],stations:[184,185]},
    {label:"제주특별자치도 서귀포시",aliases:["서귀포","서귀포시"],stations:[189,188]},
    {label:"제주특별자치도",aliases:["제주도","제주특별자치도"],stations:[184,185,188,189]}
  ]);

  function normalize(value){
    return String(value||"").toLowerCase().replace(/[\s,.\-·()]/g,"");
  }

  function searchRegions(query,stations,limit=12){
    const q=normalize(query);
    if(!q)return [];
    const scored=[];
    REGIONS.forEach(region=>{
      const candidates=[region.label,...region.aliases];
      let score=0,match="";
      candidates.forEach(text=>{
        const n=normalize(text);
        let s=0;
        if(q===n)s=120;
        else if(n.startsWith(q))s=90-Math.max(0,n.length-q.length);
        else if(n.includes(q))s=70-Math.max(0,n.length-q.length);
        else if(q.includes(n)&&n.length>=2)s=55+n.length;
        if(s>score){score=s;match=text;}
      });
      const validStations=region.stations.map(String).filter(id=>Object.prototype.hasOwnProperty.call(stations,id));
      if(score>0&&validStations.length)scored.push({label:region.label,stations:validStations,score,match});
    });
    return scored.sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label,"ko")).slice(0,limit);
  }

  // 이전 테스트 코드와의 호환용: 지역 검색 결과의 기본 관측지점을 반환합니다.
  function search(query,stations,limit=10){
    return searchRegions(query,stations,limit).map(region=>({
      id:region.stations[0],name:stations[region.stations[0]],match:region.label,label:region.label,stations:region.stations
    }));
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

    input.placeholder="예: 서산시, 홍성군, 서울 강남구";
    button.textContent="🔎 시군구 검색";
    const stationLabel=document.querySelector('label[for="asosStation"]');
    if(stationLabel)stationLabel.textContent="연결된 기상 관측지점 (필요하면 변경)";

    function clear(){results.replaceChildren();}
    function setStatus(message,type=""){
      status.textContent=message;
      status.className=`location-search-status${type?` ${type}`:""}`;
    }
    function choose(region){
      const stationId=region.stations[0];
      input.value=region.label;
      select.value=stationId;
      select.dispatchEvent(new Event("change",{bubbles:true}));
      clear();
      setStatus(`✅ ${region.label} 설정 · ${stations[stationId]} (${stationId}) 관측지점이 자동 연결되었습니다.`,"ok");
      input.dataset.regionConfirmed="true";
    }
    function runSearch(){
      clear();
      const query=input.value.trim();
      if(query.length<2&&!/^\d+$/.test(query)){
        setStatus("시·군·구 이름을 2글자 이상 입력해 주세요.","error");
        return;
      }
      const matches=searchRegions(query,stations);
      if(!matches.length){
        setStatus("검색 결과가 없습니다. 예: 서산시, 홍성군, 서울 강남구처럼 검색해 주세요.");
        return;
      }
      setStatus(`지역 ${matches.length}개를 찾았습니다. 텃밭이 있는 지역을 선택하세요.`);
      matches.forEach(region=>{
        const stationId=region.stations[0];
        const choice=document.createElement("button");
        choice.type="button";
        choice.className="location-result";
        choice.innerHTML=`<strong>${region.label}</strong><span style="display:block;font-size:11px;opacity:.72;margin-top:2px">기상관측: ${stations[stationId]} (${stationId}) 자동 연결</span>`;
        choice.addEventListener("click",()=>choose(region));
        results.appendChild(choice);
      });
    }

    button.addEventListener("click",runSearch);
    input.addEventListener("keydown",event=>{
      if(event.key==="Enter"){
        event.preventDefault();
        const matches=searchRegions(input.value.trim(),stations,2);
        if(matches.length===1)choose(matches[0]); else runSearch();
      }
    });
    input.addEventListener("input",()=>{
      clear();
      input.dataset.regionConfirmed="false";
      select.value="";
      const query=input.value.trim();
      if(query.length>=2){
        const matches=searchRegions(query,stations,8);
        if(matches.length){
          setStatus(`지역 ${matches.length}개를 찾았습니다. 아래에서 선택하세요.`);
          matches.forEach(region=>{
            const stationId=region.stations[0];
            const choice=document.createElement("button");
            choice.type="button";
            choice.className="location-result";
            choice.innerHTML=`<strong>${region.label}</strong><span style="display:block;font-size:11px;opacity:.72;margin-top:2px">${stations[stationId]} (${stationId}) 자동 연결</span>`;
            choice.addEventListener("click",()=>choose(region));
            results.appendChild(choice);
          });
          return;
        }
      }
      setStatus("시·군·구를 검색해 선택하면 가장 적합한 ASOS 관측지점이 자동 연결됩니다.");
    });

    controller=Object.freeze({clear,runSearch,searchRegions});
    return controller;
  }

  function clear(){if(controller)controller.clear();}
  root.GardenLocationSearch=Object.freeze({search,searchRegions,normalize,mount,clear});
})(typeof globalThis!=="undefined"?globalThis:this);
