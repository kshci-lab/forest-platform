'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map();function el(id){if(!elements.has(id))elements.set(id,{style:{},textContent:'',innerHTML:'',disabled:false,dataset:{},value:'',classList:{toggle(){}},setAttribute(){}});return elements.get(id);}
const context={document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){}},URL,URLSearchParams,Date,console,setTimeout:()=>1,clearTimeout(){}};vm.createContext(context);
let source=fs.readFileSync(path.join(__dirname,'../kagitani-system/js/admin_dashboard.js'),'utf8');source=source.replace(/\}\)\(\);\s*$/,`globalThis.api={audioTime,renderAudioStatus,renderAudioTranscript,exportAudioTranscript,setCurrent(value){currentAudio=value;},captureCsv(fn){downloadCsv=fn;}};})();`);vm.runInContext(source,context);
const api=context.api;assert.equal(api.audioTime(2235.136),'00:37:15');assert.equal(api.audioTime(null),'時刻不明');
api.renderAudioStatus({state:'transcribing',processed_seconds:1140,duration:2235.136,done:0,total:1,message:'文字起こし中'});
assert.match(el('meetingAudioProgress').textContent,/00:19:00 \/ 00:37:15/);assert.equal(el('meetingAudioProgressBar').value,1140);assert.equal(el('btnProcessMeetingAudio').disabled,true);
const recording={id:'a'.repeat(32),name:'voice.m4a',kind:'general',meeting_date:'2026-07-27',context:{lessons:[{id:'lesson1',title:'Aの教訓',text:'目的を確認する'}]}};
const transcript={state:'complete',context_signature:'context',duration:60,blocks:[{id:'b1',start:10,end:30,text:'<script>発言</script>',candidates:[{lesson_id:'lesson1',score:.2}]}]};
api.setCurrent({recording,transcript});api.renderAudioTranscript();assert.match(el('meetingAudioMessage').textContent,/L3の判定基準は未設定/);assert.match(el('meetingAudioBlocks').innerHTML,/対応未確認/);assert.match(el('meetingAudioBlocks').innerHTML,/&lt;script&gt;/);assert.match(el('meetingAudioBlocks').innerHTML,/select multiple/);
let csv;api.captureCsv((name,rows)=>{csv={name,rows};});api.exportAudioTranscript();assert.equal(csv.rows[1][5],'unconfirmed');assert.equal(csv.rows[1][8],'判定基準未設定');
transcript.blocks[0].review={decision:'none',lesson_ids:[],start:11,end:29};api.renderAudioTranscript();assert.match(el('meetingAudioBlocks').innerHTML,/教訓との対応なしを確認済み/);api.exportAudioTranscript();assert.equal(csv.rows[1][2],11);assert.equal(csv.rows[1][6],'');
console.log('PASS: measured audio progress, timecoded transcript UI, no automatic assignment/L3 confirmation, multiple selection, safe text, no-association state and transcript CSV.');
