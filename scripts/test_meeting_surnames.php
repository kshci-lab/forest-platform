<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/../kagitani-system/php/sharepoint_meetings.php';
$users = ['1'=>'山内太郎','2'=>'江川太郎','3'=>'川花子','4'=>'白木太郎','5'=>'田中太郎','6'=>'田中花子'];
$aliases = ['1'=>['山内','yamauchi'],'2'=>['江川','egawa'],'3'=>['川','kawa'],'4'=>['白木','shiraki'],'5'=>['田中','tanaka'],'6'=>['田中','tanaka']];
$cases = [
 ['2026-06-01_yamauchi_ver_3','1'],['2026-06-17 egawa','2'],['2026-06-17_Shiraki','4'],
 ['2026-04-20_kawa','3'],['2026-11-05_江川','2'],['2026-11-05_川','3'],
 ['2026-11-05_江川_川',null],['山内_白木_共同資料',null],['2026_tanaka',null],['2026_田中',null],
 ['2026_nakagawa',null],['研究室用資料',null],['2026_議論資料egawa','2'],['yamauchi2026','1'],
 ['江川egawa','2'],['2026_Ｓｈｉｒａｋｉ','4']
];
foreach ($cases as [$name,$expected]) {
 $actual=SharePointMeetings::surnameParticipant($name,$aliases,$users);
 if ($actual!==$expected) throw new RuntimeException('Surname mismatch: '.$name);
}
if(SharePointMeetings::surnameParticipant('yamauchi',['999'=>['yamauchi']],$users)!==null)throw new RuntimeException('Nonexistent user');
if(SharePointMeetings::surnameParticipant('tanaka',['5'=>['田中','tanaka']],$users)!==null)throw new RuntimeException('Roman alias identity');
if(SharePointMeetings::surnameParticipant('田中',['5'=>['田中','tanaka']],$users)!==null)throw new RuntimeException('Same surname registered without alias');
echo "PASS: Japanese/romanized surnames, case/width variants, dates and suffixes, longest overlapping surname, duplicate surnames, multiple people, unknown files and invalid users.\n";
