<?php

//指定した日時だけ取得・マッチングするバージョン
session_start();
require("connect_db.php");

$user_id = $_SESSION["USERID"];//"26943"; //
$map_id = $_SESSION["MAPID"];//"102774749"; //

//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');
$today_date = date("Y-m-d");


$sql = "SELECT rationality_id, node_id FROM rationality_nodes WHERE map_id='$map_id'";

$reflections = array();

if($result = $mysqli->query($sql)){

  //$reflections
  while($row = mysqli_fetch_assoc($result)){
    $reflections[] = array(
    'rationality_id'=> $row["rationality_id"],
    'node_id' => $row["node_id"]);
  }
}

echo json_encode($reflections);

?>
