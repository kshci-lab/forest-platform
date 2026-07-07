<?php

//指定した日時だけ取得・マッチングするバージョン
session_start();
require("connect_db.php");

//$user_id = $_SESSION["USERID"];//"26943"; //
// $user_id = $_GET["USER_ID"];//"26943"; //


//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');
//$today_date = date("Y-m-d");
$map_id = $_SESSION['MAPID'];    //シートID


/* and user_id=${user_id} */

$sql = "SELECT id, start_char_id, end_char_id, type, content, comment_id  FROM paper_annotations 
        WHERE deleted=0 and map_id='$map_id' 
        ORDER BY 'created_at' DESC";

$reflections = array();

if($result = $mysqli->query($sql)){


  //$reflections
  while($row = mysqli_fetch_assoc($result)){
    
    $reflections[] = array(
      'id'=> (int) $row["id"],
      'start_char_id'=> (int) $row["start_char_id"],
      'end_char_id'=> (int) $row["end_char_id"],
      'type' => $row["type"],
      'comment_id' => $row["comment_id"],
      'content' => $row["content"],
      
    );
  }
}else if($result == FALSE){
  echo "false";
      error_log($result.'$result失敗です'.$mysqli->error, "3", "error_log.txt");
      // error_log('失敗しました。'.mysqli_error($link), 0);
    }else{
      error_log('$result不明なエラーです', 0);
    }

echo json_encode($reflections);



?>