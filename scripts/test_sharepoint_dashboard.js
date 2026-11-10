'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const elements = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id, {
    id, style: {}, textContent: '', innerHTML: '', disabled: false, value: '',
    classList: { add(name) { this[name] = true; }, remove(name) { delete this[name]; } },
    querySelectorAll() { return []; }
  });
  return elements.get(id);
};
const context = {
  document: { getElementById: element, querySelectorAll: () => [], addEventListener() {} },
  URL, URLSearchParams, Date, console, alert(message) { throw new Error(message); }
};
vm.createContext(context);
const filename = path.join(__dirname, '../kagitani-system/js/admin_dashboard.js');
let source = fs.readFileSync(filename, 'utf8');
source = source.replace(/\}\)\(\);\s*$/, `globalThis.testApi = { initDom, state, renderSummary, renderMeetingSummary, renderAggregationView, showMeetingSources, exportMeetingSourcesCsv, exportAggregationCsv, meetingLink, captureCsv(fn) { downloadCsv = fn; } };})();`);
vm.runInContext(source, context, { filename });
const api = context.testApi;
api.initDom();
const status = { configured: false, available: false, message: '未接続', last_success_at: null };
api.renderMeetingSummary({ sync: status, research_mt_total: null, research_mt_days: null, research_mt_files: null, general_mt_sessions: null, shared_lessons_total: null });
assert.equal(element('kpiResearchMtTotal').textContent, '—');
assert.equal(element('btnSyncMeetings').disabled, true);
api.renderMeetingSummary({ sync: status, research_mt_total: 2, research_mt_days: 1, research_mt_files: 4, general_mt_sessions: 3, shared_lessons_total: 5 });
assert.equal(element('kpiResearchMtTotal').textContent, '2 件');
assert.equal(element('kpiResearchMtDays').textContent, '1 日');
assert.equal(element('kpiGeneralMtSessions').textContent, '3 回');
assert.equal(element('kpiSharedLessonsTotal').textContent, '5 件');
api.renderMeetingSummary({ sync: { ...status, available: true }, research_mt_total: 0, research_mt_days: 0, research_mt_files: 0, general_mt_sessions: 0, shared_lessons_total: 0, excluded_unmatched: {research_mt: 12, shared_lessons: 3} });
assert.match(element('meetingUnmatchedStatus').textContent, /研究MT 12 件・資料共有 3 件/);
assert.equal(element('btnIncludeUnmatchedMeetings').style.display, 'inline-block');
assert.match(element('meetingSyncStatus').textContent, /未同期/);
api.state.aggregationData = { metric: 'research_mt_total', meeting_sync: status };
api.renderAggregationView();
assert.match(element('pivotContainer').textContent, /正常な同期データがありません/);
assert.equal(element('chartContainer').style.display, 'none');
const file = { id: 'f1', name: '=SUM(1).pdf', web_url: 'https://example.sharepoint.com/file/f1' };
const record = { record_id: 'd:r:A', meeting_date: '2026-04-20', name: 'A', user_id: 1, user_name: 'A',
  file_count: 1, folder: { id: 'r', drive_id: 'd', name: '2026-04-20', web_url: 'https://example.sharepoint.com/r' },
  files: [file], row_key: '2026年04月', col_key: 'A (ID:1)' };
const other = { ...record, record_id: 'd:r:B', name: 'B', user_name: 'B', user_id: 2, col_key: 'B (ID:2)', files: [{...file, id: 'f2', name: 'B.pdf'}] };
const agg = { metric: 'research_mt_total', row_axis: 'month', col_axis: 'user',
  row_keys: ['2026年04月'], col_keys: ['A (ID:1)', 'B (ID:2)'],
  matrix: [{ row_key: '2026年04月', cells: { 'A (ID:1)': 1, 'B (ID:2)': 1 }, row_total: 2 }],
  col_totals: { 'A (ID:1)': 1, 'B (ID:2)': 1 }, grand_total: 2,
  source_records: [record, other], meeting_sync: { configured: true, available: true } };
api.state.aggregationData = agg;
api.state.aggConfig.viewMode = 'pivot';
api.renderAggregationView();
assert.match(element('pivotContainer').innerHTML, /対象データ総数: <strong>2 件/);
assert.equal(element('btnExportMeetingSources').style.display, 'inline-block');
api.showMeetingSources(agg, '2026年04月', 'A (ID:1)');
assert.match(element('modalTitle').textContent, /1 件/);
assert.match(element('modalBody').innerHTML, /f1/);
assert.doesNotMatch(element('modalBody').innerHTML, /f2/);
assert.equal(element('modalOverlay').classList.active, true);
api.showMeetingSources(agg, '2026年04月', null);
assert.match(element('modalTitle').textContent, /2 件/);
assert.equal(api.meetingLink('javascript:alert(1)', '<script>'), '&lt;script&gt;');
assert.match(api.meetingLink('https://example.sharepoint.com/a', '資料'), /rel="noopener noreferrer"/);
let csv;
api.captureCsv((name, rows) => { csv = {name, rows}; });
api.exportMeetingSourcesCsv();
assert.equal(csv.rows.length, 3);
assert.equal(csv.rows[1][12], "'=SUM(1).pdf");
assert.equal(csv.rows[1][1], record.record_id);
api.exportAggregationCsv();
assert.match(csv.name, /aggregation_research_mt_total/);
assert.equal(csv.rows.at(-1).at(-1), 2);
for (const type of ['bar', 'line']) {
  api.state.aggConfig.viewMode = type;
  api.renderAggregationView();
  assert.match(element('chartContainer').innerHTML, /data-row-index="0"/);
}
console.log('PASS: dashboard unavailable state, four KPI values, existing pivot/graphs/CSV integration, exact cell/row evidence, modal visibility, safe links and CSV formula escaping.');

const summaryKeys=['maps_total','lessons_total','lessons_map','lessons_journal','nodes_total','nodes_completed','nodes_with_reason','journals_total','reflections_total','lessons_updated','mt_research_presentations','mt_research_sessions','mt_general_sessions','mt_shared_files','mt_supplemental_lessons','mt_verified_lessons','mt_lesson_candidates','mt_lesson_review','mt_research_lesson_shares_assumed','mt_recorded_discussions','mt_reframing_discussions_assumed','mt_lesson_shares_with_assumptions','mt_audio_confirmed_lessons'];
const tableSummary=Object.fromEntries(summaryKeys.map(k=>[k,0]));
tableSummary.participant_count=1;
tableSummary.statistics=Object.fromEntries(summaryKeys.map(k=>[k,{mean:0,variance:0}]));
tableSummary.per_user=[{user_id:1,user_name:'Test',...Object.fromEntries(summaryKeys.map(k=>[k,0]))}];
tableSummary.meetings={sync:status};
api.renderSummary(tableSummary);
assert.equal(element('kpiMapsMean').textContent, '0 件 / 人');
assert.equal(element('kpiLessonsTotal').textContent, '0 件 / 人');
assert.equal(element('kpiResearchMtTotal').textContent, '—');
assert.equal(element('kpiLessonsTotalStatistics').textContent, '合計 0 件 ／ 分散 0');
assert.equal(element('kpiAudioFiles').textContent, '—');
assert.match(element('summaryStatisticsTable').innerHTML,/問いから作成したマップ数/);
assert.match(element('summaryStatisticsTable').innerHTML,/研究MT回数/);
assert.match(element('summaryStatisticsTable').innerHTML,/全体MT回数/);
assert.match(element('summaryStatisticsTable').innerHTML,/教訓記載確認済み数/);
console.log('PASS: participant table includes all seven MT columns and existing population statistics.');

const supplement={id:'supplement-test',lesson:'教訓の本文',why_important:'理由',opportunity:'活用場面'};
const manual={...record,record_id:'supplement:supplement-test',name:'ファイルなし共有',files:[],file_count:0,supplemental:supplement};
api.state.aggregationData={...agg,metric:'supplemental_lessons_total',source_records:[manual]};
api.showMeetingSources(api.state.aggregationData,manual.row_key,manual.col_key);
assert.match(element('modalBody').innerHTML,/教訓の本文/);
assert.match(element('modalBody').innerHTML,/preview_supplement_evidence/);
api.exportMeetingSourcesCsv();
assert.equal(csv.rows.length,2);
assert.equal(csv.rows[1][csv.rows[0].indexOf('共有種別')],'ファイルなし共有');
assert.equal(csv.rows[1][csv.rows[0].indexOf('補足教訓')],'教訓の本文');
assert.equal(csv.rows[1][csv.rows[0].indexOf('ファイルID')],undefined);
console.log('PASS: supplemental evidence and CSV preserve shared lessons without inventing files.');

const historical={...manual,record_id:'historical:test',supplemental:undefined,historical:{record_type:'lesson_share_assumption',source_note:'利用者の仮定'}};
api.state.aggregationData={...agg,metric:'research_lesson_shares_assumed_total',source_records:[historical]};
api.showMeetingSources(api.state.aggregationData,historical.row_key,historical.col_key);
assert.match(element('modalBody').innerHTML,/利用者指定の仮定/);
api.exportMeetingSourcesCsv();
assert.equal(csv.rows[1][csv.rows[0].indexOf('記録区分')],'lesson_share_assumption');
assert.equal(csv.rows[1][csv.rows[0].indexOf('人による確認済み')],'いいえ');
console.log('PASS: assumed historical shares remain explicitly separate from confirmed lessons in evidence and CSV.');
