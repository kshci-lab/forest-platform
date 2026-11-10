// Read-only audit: source is loaded into an isolated VM with synthetic DOM/network.
// This script does not start a browser, call a real API, or write analysis data.
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const sourcePath=process.env.QUALITATIVE_JS || require('path').join(__dirname,'../kagitani-system/js/qualitative_analysis.js');
let source=fs.readFileSync(sourcePath,'utf8').replace(/\}\)\(\);\s*$/,`globalThis.audit={init,render,renderRows,labelForm,mutate,openSet,sourceKeys,saveNote,compute,setCurrent(v){current=v},current(){return current},drafts,dirty,selected,selectedSource,bridge(v){bridge=v}};})();`);
const clone=v=>JSON.parse(JSON.stringify(v));
function item(id){return {id,content:'架空の教訓 '+id,reason:'架空の理由',opportunity:'架空の状況',person:'参加者A',person_id:'p1',origin:'map',created_at:'2026-06-01',updated_at:'2026-06-01',source_hash:'hash-'+id,source_row_id:'row-'+id,context:{},codes:{},proposals:{},review:'unreviewed',excluded:false,note:''};}
function set(id){return {id,name:'架空セット'+id,revision:1,state:{purpose:'架空の目的',selection_reason:'',interpretation:'',evidence:[],items:{i1:item('i1'),i2:item('i2')},labels:{l1:{id:'l1',name:'計画',definition:'元の定義A',include:'',exclude:'',version:1},l2:{id:'l2',name:'実行',definition:'元の定義B',include:'',exclude:'',version:1}},scheme_revision:1}};}
async function harness(){
 const elements=new Map(),docHandlers={};let confirms=0,fetcher=null;
 function el(id){if(elements.has(id))return elements.get(id);let value='',html='';const e={id,hidden:false,disabled:false,checked:false,textContent:'',dataset:{},classList:{toggle(){},add(){},remove(){}},handlers:{},addEventListener(k,fn){(this.handlers[k]??=[]).push(fn)},setAttribute(){},focus(){}};
 Object.defineProperty(e,'innerHTML',{get:()=>html,set:v=>{html=v;e.options=[...v.matchAll(/<option value="([^"]*)"[^>]*>([^<]*)<\/option>/g)].map(m=>({value:m[1],textContent:m[2]}));}});Object.defineProperty(e,'value',{get:()=>value,set:v=>value=v});e.options=[];elements.set(id,e);return e;}
 const response=data=>({ok:true,json:async()=>data});
 const ctx={console,structuredClone,URLSearchParams,Map,Set,JSON,Date,setTimeout,clearTimeout,window:{addEventListener(){}},document:{getElementById:el,querySelectorAll:()=>[],addEventListener(k,fn){(docHandlers[k]??=[]).push(fn)}},confirm(){confirms++;return true},prompt(){return '架空の入力'},fetch:async(url,opt)=>{if(fetcher)return fetcher(url,opt);return response({success:true,sets:[],csrf_token:'fake-csrf',batches:[]});}};
 vm.createContext(ctx);vm.runInContext(source,ctx);const a=ctx.audit;
 el('qaFilter').value='included';el('qaSort').value='manual';el('qaIncludeProposals').value='accepted';el('qaStatsScope').value='set';el('qaAxis').value='label';await a.init();
 return {a,el,ctx,response,setFetch(fn){fetcher=fn},confirms:()=>confirms,async fire(id,event){for(const f of el(id).handlers[event]||[])await f({target:el(id)});}};
}
(async()=>{
 const findings=[];
 // U01: unsaved label definition is replaced by selecting another label.
 {const h=await harness();h.a.setCurrent(set('A'));h.a.render();h.el('qaEditLabel').value='l1';h.a.labelForm();h.el('qaDefinition').value='失いたくない未保存の定義';await h.fire('qaDefinition','input');h.el('qaEditLabel').value='l2';await h.fire('qaEditLabel','change');assert.equal(h.el('qaDefinition').value,'元の定義B');assert.equal(h.confirms(),1);findings.push('U01: 未保存のラベル定義が切替で失われ、離脱確認なし。');}
 // U02: a late save response to A replaces a more recently opened B.
 {const h=await harness();h.a.setCurrent(set('A'));let resolve;const deferred=new Promise(r=>resolve=r);h.setFetch(async(url,opt)=>deferred);const work=h.a.mutate('items',{item_ids:['i1'],note:'架空メモ'});await Promise.resolve();await Promise.resolve();h.a.setCurrent(set('B'));const saved=set('A');saved.revision=2;resolve(h.response({success:true,set:saved}));await work;assert.equal(h.a.current().id,'B');findings.push('U02: Aの保存中にBへ移ると、遅れたAの応答がcurrentをAへ戻す。');}
 // U03: create bypasses dirty checks; interpretation draft remains associated with new set.
 {const h=await harness();h.a.setCurrent(set('A'));h.a.render();h.el('qaInterpretation').value='Aについての未保存の考察';h.a.dirty.add('interpretation');h.a.bridge({lessons:()=>[{origin_type:'map',lesson_id:'r1'}],filter:()=>({})});h.a.selectedSource.add('map:r1');h.el('qaName').value='B';h.setFetch(async(url,opt)=>h.response(opt?{success:true,set:set('B')}:{success:true,sets:[],csrf_token:'fake'}));await h.fire('qaCreate','click');assert.equal(h.a.current().id,'B');assert.equal(h.el('qaInterpretation').value,'');assert.equal(h.confirms(),1);findings.push('U03: 新規作成時の未保存確認なし。Aの未保存考察がBの画面に残る。');}
 // U04: source count can exceed the effective selection sent to create.
 {const h=await harness();h.a.bridge({lessons:()=>[{origin_type:'map',lesson_id:'new'}]});h.a.selectedSource.add('map:old');h.a.selectedSource.add('map:new');assert.equal(h.a.selectedSource.size,2);assert.throws(()=>h.a.sourceKeys(),/現在の読込結果/);findings.push('U04: 選択表示2件でも現在の読込結果と交差した1件だけが送信対象。');}
 // U05: missing cells/new edit may remain while global status says saved.
 {const h=await harness();h.a.setCurrent(set('A'));h.a.render();h.a.drafts.set('i1','まだ保存していないメモ');h.setFetch(async()=>h.response({success:true,set:{...set('A'),revision:2}}));await h.a.mutate('items',{item_ids:['i2'],labels:['l1']});assert.equal(h.a.drafts.size,1);assert.match(h.el('qaStatus').textContent,/未保存/);findings.push('U05: 他行のメモが未保存でも、ラベル保存後の全体表示は「保存済み」。');}
 // U07: persisted API errors are reported as a save-location instruction even if response is lost after commit.
 // This last item is reviewed statically, not asserted as a reproduced failure.
 console.log('PASS: five qualitative usability regressions checked using synthetic state.');
})().catch(e=>{console.error(e);process.exitCode=1});
