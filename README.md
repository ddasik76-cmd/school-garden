# 텃밭 기후 탐구노트

중학생이 텃밭 작물의 성장과 날씨를 함께 기록하며 기후·생태 탐구를 할 수 있도록 만든 교육용 웹앱입니다.

## 핵심 특징

- 로그인 없음, 별도 학생 데이터베이스 없음
- 텍스트·설정·관찰·성찰: 브라우저 `localStorage`
- 사진: 브라우저 `IndexedDB`
- 카메라 촬영 / 앨범 선택 및 사진 압축
- 작물 성장·기상자료 그래프, 탐구 미션과 배지
- ZIP 전체 백업·복원, A4 PDF 보고서
- 모바일·PC 반응형, PWA 지원

## 날씨 데이터 (v1.11.0)

기상청 ASOS 일자료를 사용합니다. 기존 Open-Meteo 지오코딩과 날씨 직접 호출은 제거했습니다. 텃밭 지역명을 입력하고 대표 ASOS 관측지점을 직접 선택합니다. 서산 관측지점은 129입니다. 관측소 자료는 텃밭 현장에서 직접 측정한 값이 아니며, 지역에 따라 차이가 있을 수 있습니다.

현재 날씨 화면에는 오늘의 실시간 날씨가 아니라 최근 확정 일자료가 표시됩니다. 일자료 발표 시점을 고려해 한국시간 오전 11시 이전에는 이틀 전, 이후에는 전날을 기본 조회합니다. 실제 자료가 아직 없으면 오류를 안내합니다. 관찰 날짜가 오늘이거나 확정 자료가 없는 경우에도 관찰 기록은 저장할 수 있으며, 자료가 발표된 뒤 해당 기록을 수정해 날씨를 추가할 수 있습니다.

조회 항목은 평균기온, 최고기온, 최저기온(℃), 강수량(mm), 일조시간(h)입니다. 누락된 값은 0으로 바꾸지 않고 비어 있는 값으로 유지합니다. 기존에 저장한 Open-Meteo 날씨와 관찰기록은 자동 삭제하거나 ASOS 자료로 재분류하지 않습니다.

### Firebase 날씨 함수

프로젝트: `school-garden-weather`

함수: `asosDaily` (리전 `asia-northeast3`)

```text
https://asia-northeast3-school-garden-weather.cloudfunctions.net/asosDaily?station=129&date=2020-04-23
```

함수는 `station`과 `date`만 받으며, 기상청 인증키는 Firebase Secret Manager의 `KMA_ASOS_SERVICE_KEY`에 보관합니다. 공개 HTML이나 GitHub 저장소에 인증키를 넣지 마세요. 함수는 지정된 관측지점 목록과 날짜만 조회하며, 학생 이름·사진·관찰 내용은 전송하지 않습니다. Firebase와 Google Cloud는 일반적인 접속정보 및 운영 로그를 처리할 수 있습니다.

실제 사용 전 학교망에서 함수 주소에 접속되는지 확인해야 합니다. 다른 날씨 API로 교체했다고 학교망 접근이 자동으로 보장되는 것은 아닙니다.

### 함수 배포

Firebase Functions 소스는 별도 프로젝트의 `functions/index.js`에 있습니다. 공개 GitHub Pages 저장소에는 비밀키를 저장하지 않습니다. 인증키를 이미 등록한 경우 다시 입력할 필요가 없습니다.

```bash
firebase deploy --only functions:asosDaily --project school-garden-weather
```

이 저장소의 `tests/asos-client.test.cjs`는 관측지점 선택, 날짜 검증, 응답값 변환, 누락값 처리, 기존 저장소 호환성을 확인합니다. 실제 기상청 서버 응답과 학교망 연결은 별도로 확인해야 합니다.

## GitHub Pages 배포

저장소 `ddasik76-cmd/school-garden`의 `main` 브랜치 루트에서 배포합니다.

https://ddasik76-cmd.github.io/school-garden/

기존 앱과 동일한 주소를 사용해야 브라우저에 저장된 기록을 계속 이용할 수 있습니다. 사이트 데이터나 캐시를 삭제하지 마세요.

## ZIP 백업·복원

`보고서 → ZIP 백업`을 누르면 `data.json`과 사진이 ZIP 하나에 저장됩니다.

```text
garden-backup-YYYY-MM-DD.zip
├─ data.json
├─ README.txt
└─ photos/
   ├─ photo_xxx.jpg
   └─ ...
```

새 기기에서는 ZIP을 풀지 않고 앱의 `ZIP 복원`에서 그대로 선택합니다. 복원은 현재 데이터를 대체하므로 먼저 기존 데이터를 백업해야 합니다. 브라우저 데이터 삭제·기기 교체 전에도 ZIP 백업을 권장합니다.

## PDF

보고서 메뉴에서 관찰·사진·성찰과 기상자료를 A4 보고서로 생성합니다. 기존 저장 기록의 출처와 측정값은 그대로 유지합니다.

## 외부 서비스

GitHub Pages, jsDelivr(Chart.js, JSZip, html2canvas, jsPDF), Firebase Functions / Google Cloud, 기상청 ASOS API를 사용합니다. 학생 기록과 사진을 Firebase 데이터베이스에 업로드하는 기능은 없습니다.
