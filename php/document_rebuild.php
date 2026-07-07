<?php

//指定した日時だけ取得・マッチングするバージョン
session_start();
require("connect_db.php");

$user_id = $_SESSION["USERID"];//"26943"; //
$map_id = $_SESSION["MAPID"];//"102774749"; //

//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');
$today_date = date("Y-m-d");


$sql = "SELECT item_id, brother_id, logic_option, title, node_id FROM item_latest WHERE map_id='$map_id'";

$reflections = array();

if($result = $mysqli->query($sql)){
  //$reflections
  while($row = mysqli_fetch_assoc($result)){
    $reflections[] = array(
    'item_id'=> $row["item_id"],
    'brother_id' => $row["brother_id"],
    'logic_option' => $row["logic_option"],
    'title' => $row["title"],
    'node_id' => $row["node_id"]);
  }
}

echo json_encode($reflections);

?>
