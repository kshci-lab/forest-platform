'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map();
function el(id){if(!elements.has(id))elements.set(id,{style:{},textContent:'',disabled:false,classList:{toggle(){}},setAttribute(){}});return elements.get(id);}
const ctx={document:{getElementById:el,querySelector:()=>el('main'),querySelectorAll:()=>[],addEventListener(){}},URL,URLSearchParams,AbortController,DOMException,Date,console,setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){}};
vm.createContext(ctx);
let source=fs.readFileSync(path.join(__dirname,'../kagitani-system/js/admin_dashboard.js'),'utf8');
source=source.replace(/\}\)\(\);\s*$/,`globalThis.api={trackedFetch,renderAnalysisStatus};})();`);
vm.runInContext(source,ctx);
(async()=>{
 let resolve;
 ctx.fetch=()=>new Promise(r=>{resolve=r;});
 const pending=ctx.api.trackedFetch('php/admin_api.php?action=get_summary');
 assert.equal(el('dashboardProcessing').style.display,'flex');assert.match(el('dashboardProcessingText').textContent,/概要を集計中/);
 resolve({ok:true,status:200,json:async()=>({success:true})});await pending;
 assert.equal(el('dashboardProcessing').style.display,'none');
 ctx.fetch=()=>Promise.reject(new Error('offline'));
 await assert.rejects(ctx.api.trackedFetch('php/admin_api.php?action=get_nodes'));
 assert.match(el('dashboardProcessingText').textContent,/失敗/);assert.equal(el('dashboardRetry').style.display,'inline-block');
 const waiting=[];
 ctx.fetch=(url,opt)=>new Promise((resolve,reject)=>{waiting.push(resolve);opt.signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')));});
 const first=ctx.api.trackedFetch('php/admin_api.php?action=get_aggregation').catch(e=>e);
 const second=ctx.api.trackedFetch('php/admin_api.php?action=get_aggregation');
 assert.equal((await first).name,'AbortError');assert.match(el('dashboardProcessingText').textContent,/集計表/);
 waiting[1]({ok:true,status:200,json:async()=>({success:true})});await second;assert.equal(el('dashboardProcessing').style.display,'none');
 ctx.api.renderAnalysisStatus({state:'running',done:12,total:75,current_file:'fixture.pdf',message:'解析中'});
 assert.match(el('lessonAnalysisProgress').textContent,/12 \/ 75/);assert.equal(el('lessonAnalysisBar').value,12);assert.equal(el('btnAnalyzeMeetingLessons').disabled,true);
 console.log('PASS: visible loading and elapsed labels, network-error retry, superseded request cancellation, latest-request tracking and explicit background progress.');
})().catch(e=>{console.error(e);process.exitCode=1;});
