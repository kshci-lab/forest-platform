<?php
if(PHP_SAPI!=='cli')exit;
require __DIR__.'/../kagitani-system/php/sharepoint_meetings.php';
function checkSupplement($ok,$msg){if(!$ok)throw new RuntimeException($msg);}
$base=sys_get_temp_dir().'/forest-supplement-'.bin2hex(random_bytes(6));mkdir($base,0700);
foreach(['cache','research','general','meeting-supplements']as$d)mkdir($base.'/'.$d,0700);
$c=['source_mode'=>'onedrive','cache_dir'=>$base.'/cache','roots'=>['research'=>['path'=>$base.'/research'],'general'=>['path'=>$base.'/general']]];
$users=[['user_id'=>1,'name'=>'A'],['user_id'=>2,'name'=>'B'],['user_id'=>3,'name'=>'C']];$f=['user_ids'=>[]];
try{
$s=new SharePointMeetings($c);$s->sync();$candidate=json_decode(file_get_contents($base.'/cache/local_candidate.json'),true);$candidate['observed_at']-=31;file_put_contents($base.'/cache/local_candidate.json',json_encode($candidate));$s->sync();
$data=[];foreach([1,2,3]as$uid)$data[]=['id'=>'jul13-'.$uid,'meeting_date'=>'2026-07-13','user_id'=>$uid,'lesson'=>'確認済みの教訓','evidence_file'=>'evidence-'.$uid.'.png'];
file_put_contents($base.'/meeting-supplements/records.json',json_encode($data));
$s=new SharePointMeetings($c);$a=$s->summary($f,$users);
checkSupplement($a['shared_lessons_total']===0&&$a['supplemental_lessons_total']===3&&$a['verified_lessons_total']===3,'supplements are not fabricated files');
checkSupplement($a['general_mt_sessions']===1,'three people count as one hosting');
$pc=$s->participantCounts($f,$users);checkSupplement($pc['totals']['mt_general_sessions']===3&&$pc['totals']['mt_shared_files']===0&&$pc['totals']['mt_verified_lessons']===3,'person sessions and confirmed supplements');
$selected=['user_ids'=>[2]];checkSupplement($s->summary($selected,$users)['verified_lessons_total']===1,'participant filter');
checkSupplement($s->summary(['user_ids'=>[],'end_date'=>'2026-07-12'],$users)['supplemental_lessons_total']===0,'sharing date not source journal period');
$data[]=$data[0];file_put_contents($base.'/meeting-supplements/records.json',json_encode($data));checkSupplement($s->summary($f,$users)['verified_lessons_total']===3,'stable record IDs deduplicate');
mkdir($base.'/general/2026-07-13');$s->sync();$candidate=json_decode(file_get_contents($base.'/cache/local_candidate.json'),true);$candidate['observed_at']-=31;file_put_contents($base.'/cache/local_candidate.json',json_encode($candidate));$s->sync();
checkSupplement($s->summary($f,$users)['general_mt_sessions']===1,'later synchronized folder does not duplicate manual hosting');
checkSupplement(count($s->records('verified_lessons_total',$f,$users)[0]['files'])===0,'source evidence does not pretend to be a presentation');
echo "PASS: three user-confirmed shares, zero fake files, single hosting, person sessions, date/user filters, stable-ID dedup and preserved supplements after OneDrive sync.\n";
}finally{$remove=function($p)use(&$remove){foreach(scandir($p)as$n){if($n==='.'||$n==='..')continue;$x=$p.'/'.$n;if(is_dir($x))$remove($x);else unlink($x);}rmdir($p);};$remove($base);}
