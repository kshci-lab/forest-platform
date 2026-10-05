<?php

//指定した日時だけ取得・マッチングするバージョン
session_start();
require("connect_db.php");

$user_id = $_SESSION["USERID"];//"26943"; //
$map_id = $_SESSION["MAPID"];//"102774749"; //

//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');
$today_date = date("Y-m-d");


$sql = "SELECT content_id, node_id, concept_id, rank, content, slide_id, type, indent FROM slide_content_rank WHERE map_id='$map_id' AND deleted=0";

$reflections = array();

if($result = $mysqli->query($sql)){

  //$reflections
  while($row = mysqli_fetch_assoc($result)){
    $reflections[] = array(
    'content_id'=> $row["content_id"],
    'node_id'=> $row["node_id"],
    'concept_id'=> $row["concept_id"],
    'rank' => $row["rank"],
    'content' => $row["content"],
    'slide_id'=> $row["slide_id"],
    'type'=> $row["type"],
    'indent'=> $row["indent"]);
  }
}

echo json_encode($reflections);

?>
