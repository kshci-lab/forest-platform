<?php

//指定した日時だけ取得・マッチングするバージョン
session_start();
require("connect_db.php");

//$user_id = $_SESSION["USERID"];//"26943"; //
// $user_id = $_GET["USER_ID"];//"26943"; //


//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');
$today_date = date("Y-m-d");
$map_id = $_SESSION['MAPID'];    //シートID


/* and user_id=${user_id} */

$sql = "SELECT pa.annotation_id, pa.start_char_id, pa.end_char_id, pa.content, nl.type FROM paper_annotations pa JOIN node_latest nl ON pa.node_id = nl.node_id 
        WHERE node_id IN (SELECT node_id WHERE map_node_links WHERE map_id='$map_id') ORDER BY created_at DESC"; 

$reflections = array();

if($result = $mysqli->query($sql)){


  //$reflections
  while($row = mysqli_fetch_assoc($result)){
    
    $reflections[] = array(
      'id'=> (int) $row["annotation_id"],
      'start_char_id'=> (int) $row["start_char_id"],
      'end_char_id'=> (int) $row["end_char_id"],
      'type' => $row["type"],
      'node_id' => $row["node_id"],
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