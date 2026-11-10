<?php
if(PHP_SAPI!=='cli')exit;
require __DIR__.'/../kagitani-system/php/sharepoint_meetings.php';
function historyCheck($ok,$msg){if(!$ok)throw new RuntimeException($msg);}
$base=sys_get_temp_dir().'/forest-history-'.bin2hex(random_bytes(6));mkdir($base,0700);
foreach(['cache','research','general','meeting-supplements']as$d)mkdir($base.'/'.$d,0700);
mkdir($base.'/research/2026-06-10');touch($base.'/research/2026-06-10/A.pdf');
$c=['source_mode'=>'onedrive','cache_dir'=>$base.'/cache','roots'=>['research'=>['path'=>$base.'/research'],'general'=>['path'=>$base.'/general']],'participants'=>['stems'=>['A'=>'1']]];
$users=[['user_id'=>1,'name'=>'A'],['user_id'=>2,'name'=>'B'],['user_id'=>3,'name'=>'Zero']];$f=['user_ids'=>[],'date_basis'=>'created_at','start_date'=>null,'end_date'=>null];
try{
$s=new SharePointMeetings($c);$s->sync();$candidate=json_decode(file_get_contents($base.'/cache/local_candidate.json'),true);$candidate['observed_at']-=31;file_put_contents($base.'/cache/local_candidate.json',json_encode($candidate));$s->sync();
$data=[];foreach([1,2]as$uid)$data[]=['id'=>'share-'.$uid,'meeting_kind'=>'research','record_type'=>'lesson_share_assumption','meeting_date'=>'2026-06-10','user_id'=>$uid,'title'=>'Assumed share','source_note'=>'User assumption'];
foreach([1=>'2026-06-10',2=>'2026-06-11']as$uid=>$date)$data[]=['id'=>'recorded-'.$uid,'meeting_kind'=>'research','record_type'=>'recorded_discussion','meeting_date'=>$date,'user_id'=>$uid,'title'=>'Recorded discussion','reframing_assumed'=>true];
$path=$base.'/meeting-supplements/records.json';file_put_contents($path,json_encode($data));
$s=new SharePointMeetings($c);$v=$s->summary($f,$users);
historyCheck($v['research_lesson_shares_assumed_total']===2&&$v['recorded_discussions_total']===2&&$v['reframing_discussions_assumed_total']===2,'three evidence categories');
historyCheck($v['verified_lessons_total']===0&&$v['shared_lessons_total']===0&&$v['general_mt_sessions']===0,'research assumptions not general meetings or verified bodies');
historyCheck($v['lesson_shares_with_assumptions_total']===2,'combined shares explicitly include assumptions');
$counts=$s->participantCounts($f,$users);
historyCheck($counts['per_user'][1]['mt_research_sessions']===1&&$counts['per_user'][2]['mt_research_sessions']===1,'recorded discussion overlaps existing session once and fills missing session');
historyCheck($counts['totals']['mt_research_presentations']===1,'do not invent presentation files');
$selected=array_merge($f,['user_ids'=>[1],'start_date'=>'2026-06-10','end_date'=>'2026-06-10']);historyCheck(count($s->records('recorded_discussions_total',$selected,$users))===1,'date and participant filtering');
file_put_contents($path,json_encode(array_merge($data,$data)));historyCheck($s->summary($f,$users)['recorded_discussions_total']===2,'same IDs do not accumulate');
// Existing database fixture verifies participant means/variances without touching MySQL.
$historyService=$s;require __DIR__.'/test_lesson_summary.php';$p->exec("INSERT INTO users VALUES(3,'Zero')");
$library=new AdminWorkbenchLib($p,$historyService);$summary=$library->getSummary(['user_ids'=>[],'date_basis'=>'created_at','start_date'=>null,'end_date'=>null]);
historyCheck(abs($summary['statistics']['mt_recorded_discussions']['mean']-2/3)<1e-10,'mean includes zero participants');
historyCheck(abs($summary['statistics']['mt_recorded_discussions']['variance']-2/9)<1e-10,'population variance');
echo "PASS: historical lesson assumptions, recorded discussions and assumed reframing stay separate; no fake files/general sessions/verified lessons; existing research sessions deduplicated; filtering, idempotency and participant statistics.\n";
}finally{$remove=function($p)use(&$remove){foreach(scandir($p)as$n){if($n==='.'||$n==='..')continue;$x=$p.'/'.$n;if(is_dir($x))$remove($x);else unlink($x);}rmdir($p);};$remove($base);}
