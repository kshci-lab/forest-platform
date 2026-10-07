<?php

ini_set("memory_limit", "1000M");

//指定した日時だけ取得・マッチングするバージョン
session_start();
require("connect_db.php");

$user_id = $_SESSION["USERID"];//"26943"; //
$map_id = $_SESSION["MAPID"];//"102774749"; //

//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');
$today_date = date("Y-m-d");

$fbdgbsf = $_POST["start_date"]; //"2019-1-18"; //
$sdfssdvd = $_POST["finish_date"]; //"2019-1-18"; //
$start_time =  $fbdgbsf  .' ' .'00:00:00.000000';
$finish_time = $sdfssdvd .' ' .'23:59:59.999999';

//not_record以外のもの
// $sql = "SELECT *  FROM reflections
//         WHERE activity NOT IN ('not_record')
//                AND user_id = '$user_id'
//                AND map_id = '$map_id'
//                AND timestamp BETWEEN '$start_time' AND '$finish_time'";

$sql = "SELECT timestamp,reflection_text,activity,activity_later,ref_reason FROM reflections WHERE timestamp BETWEEN '$start_time' AND '$finish_time' AND activity NOT IN ('not_record') AND user_id = '$user_id' AND map_id = '$map_id'";

// var_dump($sql);
// echo nl2br("\n");
// echo nl2br("\n");
// echo nl2br("\n");
// echo nl2br("\n");
// echo nl2br("\n");
$reflections = array();


if($result = $mysqli->query($sql)){

    //$reflections
    while($row = mysqli_fetch_assoc($result)){
      $reflections[] = array(
      'timestamp'=> $row["timestamp"],
      'activity' => $row["activity"],
      'later_activity' => $row["activity_later"],
      'reflection_text' => $row["reflection_text"],
      'reflection_reason' => $row["ref_reason"]);
  }

  //
  // var_dump($row["timestamp"]);
  // echo nl2br("\n");
  // echo nl2br("\n");
  // echo nl2br("\n");
  // echo nl2br("\n");
  // echo nl2br("\n");
  // var_dump($reflections[1]);
  // echo nl2br("\n");
  // echo nl2br("\n");
  // echo nl2br("\n");
  // echo nl2br("\n");
  // echo nl2br("\n");
  // var_dump($reflections[2]);
  // echo nl2br("\n");
  // echo nl2br("\n");
  // echo nl2br("\n");
  // echo nl2br("\n");
  // echo nl2br("\n");
  // var_dump($reflections[3]);
  // echo nl2br("\n");
  // echo nl2br("\n");
  // echo nl2br("\n");
  // echo nl2br("\n");
  // echo nl2br("\n");
  // var_dump($reflections[4]);
  // echo nl2br("\n");
  // echo nl2br("\n");
  // echo nl2br("\n");
  // echo nl2br("\n");
  // echo nl2br("\n");






  // echo nl2br("\n");


  //activityについて ... recordは「記録する」,thinkは「考えた」，not_thinkは「考えなかった」に書き換え
  //activity_laterについて  ...  0は「今後も考えない」1は「今後考える」に書き換え
  $u=0;
  for($u=0; $u<count($reflections); $u++){
    // echo $u;
    // echo "個目";
    // echo nl2br("\n");
    // echo nl2br("\n");
    // echo nl2br("\n");
    // echo nl2br("\n");
    // echo nl2br("\n");

    if($reflections[$u]['activity'] =="record"){
      $reflections[$u]['activity'] = "記録する";
    }else if ($reflections[$u]['activity'] =="think") {
      $reflections[$u]['activity'] = "考えた";
    }else if ($reflections[$u]['activity'] =="not_think") {
      $reflections[$u]['activity'] = "考えなかった";
    }

    if($reflections[$u]['later_activity'] =="0"){
      $reflections[$u]['later_activity'] = "今後も考えない";
    }else if ($reflections[$u]['later_activity'] =="1") {
      $reflections[$u]['later_activity'] = "今後考える";
    }



  }



}


// var_dump($reflections);
// echo nl2br("\n");
// echo nl2br("\n");
// echo nl2br("\n");
// echo nl2br("\n");
// echo nl2br("\n");



echo json_encode($reflections);

?>
