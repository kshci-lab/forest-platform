<?php

//指定した日時だけ取得・マッチングするバージョン
session_start();
require("connect_db.php");

// $user_id = $_SESSION["USERID"];//"26943"; //
$map_id = $_SESSION["MAPID"];//"102774749"; //
// $doc_id = $_GET["doc_id"];
//$doc_id = $_POST["doc_id"];

//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');

// $sql = "SELECT scenario_title FROM maps WHERE map_id='$map_id'";
$sql = "SELECT * FROM item_relations WHERE map_id='$map_id' AND deleted='0'";

$data = array();
if($result = $mysqli->query($sql)){
  while($row = mysqli_fetch_assoc($result)){
    array_push($data, $row);
  }
}

// $sql2 = "SELECT * FROM item_relations WHERE map_id='$map_id' AND deleted='0'";
// if($result2 = $mysqli->query($sql2)){
//   while($row2 = mysqli_fetch_assoc($result2)){
//     array_push($data, $row2);
//   }
// }

$json=json_encode($data, JSON_UNESCAPED_UNICODE);
echo $json;

?>
