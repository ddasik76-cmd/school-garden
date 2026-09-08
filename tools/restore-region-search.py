#!/usr/bin/env python3
from pathlib import Path
import hashlib

ROOT = Path(__file__).resolve().parent.parent
EXPECTED = "165cb9f26aa50202e9a19e6cc660f04498d31539"

def replace_once(text, old, new):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one anchor, found {count}: {old[:100]!r}")
    return text.replace(old, new, 1)

OLD_UI = '''          <input id="gardenPlace" required placeholder="예: 팔봉중학교 텃밭, 서산시 팔봉면">
          <label for="asosStation">대표 기상 관측지점 *</label>'''
NEW_UI = '''          <div class="location-search-row">
            <input id="gardenPlace" required placeholder="예: 서산시, 팔봉면, 팔봉중학교 텃밭" autocomplete="off">
            <button class="btn secondary" type="button" id="searchPlaceBtn">🔎 지역 찾기</button>
          </div>
          <div id="placeSearchResults" class="location-search-results" role="group" aria-label="지역 검색 결과"></div>
          <label for="asosStation">대표 기상 관측지점 *</label>'''

def migrate(html):
    html = replace_once(html, 'const APP_VERSION = "1.11.0";', 'const APP_VERSION = "1.11.1";')
    html = replace_once(html, OLD_UI, NEW_UI)
    html = replace_once(html,
        '텃밭과 가까운 ASOS 관측지점을 직접 선택하세요. 관측소 자료는 텃밭에서 직접 측정한 값이 아닙니다. GPS와 외부 지역검색을 사용하지 않습니다.',
        '지역명을 입력하고 ‘지역 찾기’를 누르세요. 검색 결과에서 대표 관측지점을 선택할 수 있습니다. 검색은 기기에서 처리하며 GPS를 사용하지 않습니다.')
    html = replace_once(html,
        '<script>\n(() => {\n  "use strict";',
        '<script src="./garden-location-search.js?v=1"></script>\n<script>\n(() => {\n  "use strict";')
    html = replace_once(html,
        '''  function fillSetup(){
    const p=state.project;''',
        '''  function fillSetup(){
    window.GardenLocationSearch.clear();
    const p=state.project;''')
    html = replace_once(html,
        '''  document.getElementById("setupForm").addEventListener("submit",e=>{
    e.preventDefault();
    const station=document.getElementById("asosStation").value;''',
        '''  window.GardenLocationSearch.mount(ASOS_STATIONS);
  document.getElementById("setupForm").addEventListener("submit",e=>{
    e.preventDefault();
    const station=document.getElementById("asosStation").value;''')
    html = replace_once(html,
        '텃밭과 가까운 ASOS 관측지점을 선택해 주세요. 기존 지역명과 기록은 그대로 유지됩니다.',
        '지역명을 검색하거나 아래에서 대표 관측지점을 선택해 주세요. 기존 지역명과 기록은 그대로 유지됩니다.')
    html = replace_once(html,
        'navigator.serviceWorker.register("/school-garden/service-worker.js?v=23"',
        'navigator.serviceWorker.register("/school-garden/service-worker.js?v=24"')
    assert 'KMA_ASOS_SERVICE_KEY' not in html
    assert 'https://geocoding-api.open-meteo.com' not in html
    assert 'GardenLocationSearch.mount(ASOS_STATIONS)' in html
    assert 'gardenClimateJournal.v1' in html
    assert 'gardenClimateJournalDB' in html
    return html

def main():
    path = ROOT / "index.html"
    original = path.read_bytes()
    actual = hashlib.sha1(b"blob " + str(len(original)).encode() + bytes([0]) + original).hexdigest()
    if actual != EXPECTED:
        raise RuntimeError(f"Unexpected source SHA {actual}; no files changed")
    html = migrate(original.decode("utf-8"))
    sw = ROOT / "service-worker.js"
    sw_text = sw.read_text(encoding="utf-8")
    sw_text = replace_once(sw_text, 'school-garden-v14', 'school-garden-v15')
    sw_text = replace_once(sw_text,
        'BASE + "mobile-fixes.css?v=22"]',
        'BASE + "mobile-fixes.css?v=22", BASE + "garden-location-search.js?v=1"]')
    path.write_text(html, encoding="utf-8")
    sw.write_text(sw_text, encoding="utf-8")
    print("Region search restored; ASOS backend and browser data stores preserved.")

if __name__ == "__main__":
    main()
