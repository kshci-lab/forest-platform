<?php

//指定した日時だけ取得・マッチングするバージョン
session_start();
require("connect_db.php");

$user_id = $_SESSION["USERID"];//"26943"; //
$map_id = $_SESSION["MAPID"];//"102774749"; //

//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');
$today_date = date("Y-m-d");


$sql = "SELECT item_content_id, item_id, indent, item_content_bro_id, node_id, concept_id, logic_option, title, type, map_id FROM item_content_latest WHERE map_id='$map_id'";

$reflections = array();

if($result = $mysqli->query($sql)){

  //$reflections
  while($row = mysqli_fetch_assoc($result)){
    $reflections[] = array(
    'item_content_id'=> $row["item_content_id"],
    'node_id'=> $row["node_id"],
    'concept_id'=> $row["concept_id"],
    'brother_id' => $row["item_content_bro_id"],
    'content' => $row["title"],
    'item_id'=> $row["item_id"],
    'type'=> $row["type"],
    'indent'=> $row["indent"],
    'logic_option'=> $row["logic_option"]);
  }
}

echo json_encode($reflections);

?>
