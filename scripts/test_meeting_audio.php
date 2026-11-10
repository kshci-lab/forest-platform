<?php
if(PHP_SAPI!=='cli')exit;
require __DIR__.'/../kagitani-system/php/sharepoint_meetings.php';
function audioCheck($ok,$message){if(!$ok)throw new RuntimeException($message);}
$base=sys_get_temp_dir().'/forest-audio-'.bin2hex(random_bytes(6));mkdir($base,0700);foreach(['cache','research','general','meeting-audio']as$d)mkdir($base.'/'.$d,0700);
mkdir($base.'/general/2026-07-27');foreach(['A.pdf','A.m4a','B.mp3','movie.mp4']as$n)file_put_contents($base.'/general/2026-07-27/'.$n,'fixture');
$c=['source_mode'=>'onedrive','cache_dir'=>$base.'/cache','roots'=>['research'=>['path'=>$base.'/research'],'general'=>['path'=>$base.'/general']],'participants'=>['stems'=>['A'=>'1']]];$users=[['user_id'=>1,'name'=>'A'],['user_id'=>2,'name'=>'B']];$f=['user_ids'=>[]];
try{
$s=new SharePointMeetings($c);$s->sync();$candidate=json_decode(file_get_contents($base.'/cache/local_candidate.json'),true);$candidate['observed_at']-=31;file_put_contents($base.'/cache/local_candidate.json',json_encode($candidate));$s->sync();
$v=$s->summary($f,$users);audioCheck($v['shared_lessons_total']===1&&$v['lesson_review_total']===1,'audio/video excluded from materials and lesson analysis');
$inventory=$s->audioInventory();audioCheck(count($inventory['source_files'])===2&&$inventory['source_files'][0]['meeting_date']==='2026-07-27','audio bound to folder date');
audioCheck(count($s->audioInventory(['start_date'=>'2026-07-28'])['source_files'])===0,'audio date filter');
$id=str_repeat('a',32);$hash=str_repeat('b',64);$asset=$hash.'.m4a';mkdir($base.'/meeting-audio/assets');mkdir($base.'/meeting-audio/transcripts');file_put_contents($base.'/meeting-audio/assets/'.$asset,'audiofixture');
$snap=json_decode(file_get_contents($base.'/cache/snapshot.json'),true);$context=['signature'=>'ctx','lessons'=>[['id'=>'lesson1','title'=>'Shared lesson','text'=>'教訓','owner_id'=>'1','owner_name'=>'A'],['id'=>'lesson2','title'=>'Another lesson','text'=>'別の教訓','owner_id'=>'2','owner_name'=>'B']]];
$rec=['id'=>$id,'name'=>'A.m4a','meeting_id'=>'mt1','meeting_date'=>'2026-07-27','kind'=>'general','folder_key'=>array_key_first($snap['folders']),'source_fingerprint'=>$snap['source_fingerprint'],'context'=>$context,'asset_name'=>$asset,'state'=>'complete'];
file_put_contents($base.'/meeting-audio/catalog.json',json_encode(['recordings'=>[$id=>$rec]]));
file_put_contents($base.'/meeting-audio/transcripts/'.$id.'.json',json_encode(['state'=>'complete','duration'=>60,'context_signature'=>'ctx','blocks'=>[['id'=>'b1','start'=>0,'end'=>30,'text'=>'発言','candidates'=>[]]],'segments'=>[]]));
$s=new SharePointMeetings($c);
$s->saveAudioReview($id,'b1','ctx',['lesson1','lesson2'],1,25,'confirmed',1);$t=$s->audioTranscript($id);audioCheck($t['transcript']['blocks'][0]['review']['lesson_ids']===['lesson1','lesson2'],'multiple human links saved');
audioCheck(count($s->records('audio_confirmed_lessons_total',$f,$users))===2,'multiple lessons count independently after confirmation');
$counts=$s->participantCounts($f,$users);audioCheck($counts['per_user'][1]['mt_audio_confirmed_lessons']===1&&$counts['per_user'][2]['mt_audio_confirmed_lessons']===1,'audio-confirmed lesson participant statistics');
$s->saveAudioReview($id,'b1','ctx',[],0,30,'none',1);audioCheck($s->audioTranscript($id)['transcript']['blocks'][0]['review']['decision']==='none','explicit no lesson association');
$s->saveAudioReview($id,'b1','ctx',[],0,30,'clear',1);audioCheck(!isset($s->audioTranscript($id)['transcript']['blocks'][0]['review']),'clear restores unconfirmed');
foreach([['badctx',['lesson1'],0,30],['ctx',['unrelated'],0,30],['ctx',['lesson1'],-1,30],['ctx',['lesson1'],0,100]]as[$ctx,$ids,$start,$end]){
 try{$s->saveAudioReview($id,'b1',$ctx,$ids,$start,$end,'confirmed',1);throw new RuntimeException('Expected invalid review rejection');}catch(RuntimeException $e){audioCheck($e->getMessage()!=='Expected invalid review rejection','invalid ranges/contexts rejected');}
}
audioCheck($s->audioAsset($id)['mime']==='audio/mp4','private audio asset resolved');
try{$s->audioAsset('../config');throw new RuntimeException('Expected traversal rejection');}catch(RuntimeException $e){audioCheck($e->getMessage()!=='Expected traversal rejection','path traversal rejected');}
echo "PASS: audio/video classification, date-bound inventory, document counts unaffected by recordings, cached transcript, multiple-lesson confirmation/no-association/clear history, invalid ranges/context/IDs rejected and private archive lookup.\n";
}finally{$remove=function($p)use(&$remove){foreach(scandir($p)as$n){if($n==='.'||$n==='..')continue;$x=$p.'/'.$n;if(is_dir($x))$remove($x);else unlink($x);}rmdir($p);};$remove($base);}
