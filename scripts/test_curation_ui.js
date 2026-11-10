'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'../kagitani-system/js/research_curation.js'),'utf8');
source=source.replace(/\}\)\(\);\s*$/,`globalThis.test={key,showImpact,setBridge(b){bridge=b},setMetadata(m){meta=m}};})();`);
const elements=new Map();function el(id){if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',value:'',open:false,focus(){},showModal(){this.open=true;},close(){this.open=false;},addEventListener(){}});return elements.get(id);}
const ctx={window:{addEventListener(){}},document:{getElementById:el,activeElement:{focus(){}},addEventListener(){}},crypto:{randomUUID:()=> 'operation-12345678'},Map,Set,console};vm.createContext(ctx);vm.runInContext(source,ctx);
assert.equal(ctx.test.key({origin_type:'map',reflection_group_id:'r1',lesson_id:'old'}),'map/reflection/r1');assert.equal(ctx.test.key({origin_type:'map',reflection_group_id:'r1',lesson_id:'new'}),'map/reflection/r1');assert.equal(ctx.test.key({object_node_id:'n1'}),'means/n1');
const summary={participant_count:2,lessons_total:4,lessons_updated:1,nodes_total:2,nodes_completed:1,nodes_with_reason:1,statistics:{lessons_total:{mean:2,variance:1}}};
ctx.test.showImpact({mode:'exclude',keys:['a','b'],representative:'a',reason:'<unsafe>',filter:{user_ids:[1,2]},before:summary,after:{...summary,lessons_total:3,statistics:{lessons_total:{mean:1.5,variance:.25}}}});
assert(el('curationDialog').open);assert.match(el('curationImpact').innerHTML,/1.5/);assert.match(el('curationImpact').innerHTML,/0.25/);assert.match(el('curationImpact').innerHTML,/&lt;unsafe&gt;/);assert.doesNotMatch(el('curationImpact').innerHTML,/<unsafe>/);assert.match(el('curationImpact').innerHTML,/自動反映しません/);
const api=fs.readFileSync(path.join(__dirname,'../kagitani-system/php/curation_api.php'),'utf8');assert.match(api,/if\(!\$admin/);assert.match(api,/hash_equals\(\$csrf/);assert.match(api,/元記録が更新/);assert.match(api,/previewData\(\$actor/);
console.log('PASS: logical identity, impact mean/variance, escaped comparison output, explicit scope, server authentication/CSRF/source guards.');
