<?php
require __DIR__.'/../kagitani-system/php/qualitative_store.php';
function check($ok,$message){if(!$ok)throw new RuntimeException($message);}
function rejects($fn,$message,$code=null){try{$fn();throw new RuntimeException('NOT_REJECTED');}catch(Throwable$e){check($e->getMessage()!=='NOT_REJECTED',$message);if($code)check($e->getCode()===$code,$message.' code');}}
$dir=sys_get_temp_dir().'/qa-test-'.bin2hex(random_bytes(5));mkdir($dir,0700);$store=new QualitativeStore($dir.'/test.sqlite');$owner='user:1';
$raw=['origin_type'=>'map','lesson_id'=>'row-1','reflection_group_id'=>'ref-1','object_node_id'=>'node-1','lesson_learned'=>'終了条件を決める','why_important'=>'範囲を絞るため','opportunity'=>'着手時','user_id'=>1,'user_name'=>'架空A','created_at'=>'2026-06-01','updated_at'=>'2026-06-01'];
try{
 $other=array_merge($raw,['lesson_id'=>'row-2','reflection_group_id'=>'ref-2','lesson_learned'=>'問い直す','user_id'=>2,'user_name'=>'架空B']);
 $r=$store->create($owner,'試験','目的',[$raw,$raw,$other],[]);$id=$r['id'];$ids=array_keys($r['state']['items']);check(count($ids)===2,'source dedup');
 check(QualitativeStore::snapshot($raw)['source_key']===QualitativeStore::snapshot(array_merge($raw,['lesson_id'=>'new-version']))['source_key'],'logical identity survives version change');
 rejects(fn()=>$store->get('user:2',$id),'owner isolation',404);
 $r=$store->change($owner,$id,$r['revision'],'label',['name'=>'計画','definition'=>'開始前の計画']);$lid=array_key_first($r['state']['labels']);
 rejects(fn()=>$store->change($owner,$id,1,'metadata',['purpose'=>'stale']),'revision conflict',409);
 $r=$store->change($owner,$id,$r['revision'],'items',['item_ids'=>$ids,'labels'=>[$lid]]);check(count($r['state']['items'][$ids[0]]['codes'])===1,'bulk labels');
 $release=$store->release($owner,$id,$r['revision'],'第1版');
 $b=$store->batch($owner,$id,$r['revision'],'計画に分類',$ids,[])[0];check(!isset($b['items'][0]['person']),'no participant in export by default');check(count($b['items'])===2,'batch count');
 $r=$store->change($owner,$id,$r['revision'],'items',['item_ids'=>[$ids[0]],'labels'=>[$lid],'mode'=>'remove']);
 $result=['schema_version'=>'qualitative-result-1','batch_id'=>$b['batch_id'],'part'=>1,'scheme_revision'=>$b['scheme_revision'],'results'=>array_map(fn($i)=>['lesson_id'=>$i['lesson_id'],'source_hash'=>$i['source_hash'],'labels'=>[$lid],'reason'=>'架空分類理由','state'=>'proposed'],$b['items']),'new_labels'=>[]];$json=QualitativeStore::json($result);
 $p=$store->preview($owner,$id,$json);check(count($p['rows'][0]['warnings'])===1,'manual change warning');check(!$p['rows'][0]['errors'],'valid input');
 rejects(fn()=>$store->preview($owner,$id,'not JSON'),'malformed input');
 $bad=$result;$bad['results'][]=$bad['results'][0];$p=$store->preview($owner,$id,QualitativeStore::json($bad));check(in_array('重複ID',$p['rows'][0]['errors'],true),'all duplicate occurrences rejected');
 $bad=$result;$bad['results'][0]['lesson_id']='unknown';$p=$store->preview($owner,$id,QualitativeStore::json($bad));check(count($p['missing'])===1,'missing results detected');check(count($p['rows'][0]['errors'])>0,'unknown id rejected');
 $r=$store->import($owner,$id,$r['revision'],$json,[0],false);check(isset($r['state']['items'][$ids[0]]['proposals'][$b['batch_id']]),'proposal import');check(!$r['state']['items'][$ids[0]]['codes'],'not automatically adopted');
 $r=$store->import($owner,$id,$r['revision'],$json,[1],false);check(isset($r['state']['items'][$ids[1]]['proposals'][$b['batch_id']]),'partial response can complete later');
 $same=$store->import($owner,$id,$r['revision'],$json,[0,1],false);check($same['revision']===$r['revision'],'idempotent reimport');
 $r=$store->change($owner,$id,$r['revision'],'accept',['item_ids'=>$ids,'batch_id'=>$b['batch_id']]);check($r['state']['items'][$ids[0]]['codes'][$lid]['origin']==='AI_import','adoption provenance');check($r['state']['items'][$ids[1]]['codes'][$lid]['origin']==='manual','existing manual classification not overwritten');
 check(count($store->releaseData($owner,$id,$release['id'])['state']['items'][$ids[0]]['codes'])===1,'frozen release survives changes');
 rejects(fn()=>$store->change($owner,$id,$r['revision'],'items',['item_ids'=>[$ids[0]],'excluded'=>true]),'exclusion requires reason');
 $r=$store->change($owner,$id,$r['revision'],'items',['item_ids'=>[$ids[0]],'excluded'=>true,'reason'=>'対象外のため']);check($r['state']['items'][$ids[0]]['excluded'],'exclude');
 $r=$store->change($owner,$id,$r['revision'],'undo',[]);check(!$r['state']['items'][$ids[0]]['excluded'],'undo retains history');
 $r=$store->change($owner,$id,$r['revision'],'label',['label_id'=>$lid,'name'=>'計画','definition'=>'新しい意味']);check($r['state']['items'][$ids[0]]['review']==='review_required','semantic revision marks review');
 $dup=$store->change($owner,$id,$r['revision'],'duplicate',['name'=>'別案']);check($dup['id']!==$id&&count($dup['state']['items'])===2,'independent duplicate');
 $nb=$store->batch($owner,$id,$r['revision'],'新しい観点',$ids,[])[0];
 $nr=['schema_version'=>'qualitative-result-1','batch_id'=>$nb['batch_id'],'part'=>1,'scheme_revision'=>$nb['scheme_revision'],'new_labels'=>[['temporary_id'=>'new-x','name'=>'新観点','definition'=>'架空の定義']], 'results'=>array_map(fn($i)=>['lesson_id'=>$i['lesson_id'],'source_hash'=>$i['source_hash'],'labels'=>['new-x'],'reason'=>'提案','state'=>'proposed'],$nb['items'])];$nj=QualitativeStore::json($nr);
 rejects(fn()=>$store->import($owner,$id,$r['revision'],$nj,[0],false),'new definitions require approval');
 $r=$store->import($owner,$id,$r['revision'],$nj,[0],true);$labelCount=count($r['state']['labels']);
 $r=$store->import($owner,$id,$r['revision'],$nj,[1],true);check(count($r['state']['labels'])===$labelCount,'new-label map reused in partial imports');
 $r=$store->change($owner,$id,$r['revision'],'metadata',['archived'=>true]);check(count($store->list($owner))===1&&count($store->list($owner,true))===2,'archive hides without deletion');
 $r=$store->change($owner,$id,$r['revision'],'metadata',['archived'=>false]);
 $reopened=new QualitativeStore($dir.'/test.sqlite');check($reopened->get($owner,$id)['revision']===$r['revision'],'durable reload');
 check($raw['lesson_learned']==='終了条件を決める','source fixture untouched');
 $beforeItem=$r['state']['items'][$ids[0]];
 $r=$store->change($owner,$id,$r['revision'],'curation',['curation_revision'=>7,'items'=>[['item_id'=>$ids[0],'source_key'=>$beforeItem['source_key'],'reason'=>'架空の重複','group_id'=>'g1','representative'=>'map/reflection/other']]]);
 check($r['state']['items'][$ids[0]]['excluded'],'explicit global curation excludes');
 check($r['state']['items'][$ids[0]]['content']===$beforeItem['content']&&$r['state']['items'][$ids[0]]['codes']===$beforeItem['codes'],'curation preserves snapshot and codes');
 check(!$store->releaseData($owner,$id,$release['id'])['state']['items'][$ids[0]]['excluded'],'frozen release not curated retroactively');
 $r=$store->change($owner,$id,$r['revision'],'undo',[]);check(!$r['state']['items'][$ids[0]]['excluded'],'curation application can be undone');

 echo "PASS: private persistence, stable source identity, owner isolation, conflicts, multi-label edits, frozen releases, AI validation, partial/idempotent imports, provenance, undo and definition revision.\n";
}finally{foreach(glob($dir.'/*')as$f)unlink($f);rmdir($dir);}
