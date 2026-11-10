<?php
if (PHP_SAPI !== 'cli') exit;
require __DIR__.'/../kagitani-system/php/sharepoint_meetings.php';
function okReview($value,$message){if(!$value)throw new RuntimeException($message);}
$base=sys_get_temp_dir().'/forest-review-'.bin2hex(random_bytes(6));mkdir($base,0700);
foreach(['research','general','cache'] as $d)mkdir($base.'/'.$d,0700);
mkdir($base.'/general/2026-01-01');file_put_contents($base.'/general/2026-01-01/A.pdf','fixture');
$c=['source_mode'=>'onedrive','cache_dir'=>$base.'/cache','roots'=>['research'=>['path'=>$base.'/research'],'general'=>['path'=>$base.'/general']]];
$c['participants']=['stems'=>['A'=>'1']];
$f=['user_ids'=>[]];$users=[['user_id'=>1,'name'=>'A']];
try{
$s=new SharePointMeetings($c);$s->sync();$candidate=json_decode(file_get_contents($base.'/cache/local_candidate.json'),true);$candidate['observed_at']-=31;file_put_contents($base.'/cache/local_candidate.json',json_encode($candidate));$s->sync();
$snapshot=json_decode(file_get_contents($base.'/cache/snapshot.json'),true);$key=array_key_first($snapshot['files']);$file=$snapshot['files'][$key];$path=$file['local_path'];
$entry=['signature'=>'sig-1','rules_version'=>'test','auto_status'=>'yes','reason'=>'fixture evidence','evidence'=>[['location'=>'1ページ','text'=>'教訓：事前に確認することが重要。']],'file_size'=>filesize($path),'file_mtime'=>filemtime($path)];
file_put_contents($base.'/cache/analysis-results.json',json_encode(['source_fingerprint'=>$snapshot['source_fingerprint'],'files'=>[$key=>$entry]]));
$s=new SharePointMeetings($c);$summary=$s->summary($f,$users);okReview($summary['shared_lessons_total']===1&&$summary['lesson_candidates_total']===1&&$summary['verified_lessons_total']===0,'automatic is not human-confirmed');
$s->saveLessonReview($key,'sig-1','yes',123);$summary=$s->summary($f,$users);okReview($summary['verified_lessons_total']===1&&$summary['lesson_candidates_total']===0,'human yes counted once');
$pc=$s->participantCounts($f,$users);okReview($pc['per_user'][1]['mt_verified_lessons']===1&&$pc['per_user'][1]['mt_lesson_candidates']===0,'confirmed counts in participant table');
$s->saveLessonReview($key,'sig-1','no',123);okReview($s->summary($f,$users)['verified_lessons_total']===0,'human no removes confirmation');
$s->saveLessonReview($key,'sig-1','clear',123);okReview($s->summary($f,$users)['lesson_candidates_total']===1,'clear restores automatic status');
try{$s->saveLessonReview($key,'stale','yes',123);throw new RuntimeException('expected stale rejection');}catch(RuntimeException $e){okReview($e->getMessage()!=='expected stale rejection','stale rejected');}
$s->saveLessonReview($key,'sig-1','yes',123);touch($path,time()+10);$s=new SharePointMeetings($c);$summary=$s->summary($f,$users);okReview($summary['verified_lessons_total']===0&&$summary['lesson_review_total']===1,'changed file invalidates human confirmation');
echo "PASS: cached automatic evidence, human yes/no/clear, confirmed-only counts, stale-save protection and changed-document invalidation.\n";
}finally{
$remove=function($p)use(&$remove){foreach(scandir($p)as$n){if($n==='.'||$n==='..')continue;$x=$p.'/'.$n;if(is_dir($x))$remove($x);else unlink($x);}rmdir($p);};$remove($base);
}
