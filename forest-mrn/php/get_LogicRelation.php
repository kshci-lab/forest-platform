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
$sql = "SELECT icr.*, icl1.title AS title1, icl2.title AS title2 FROM item_content_relations icr LEFT JOIN item_content_latest icl1 ON icr.item_content1_id = icl1.item_content_id LEFT JOIN item_content_latest icl2 ON icr.item_content2_id = icl2.item_content_id WHERE icr.deleted = '0' AND (icl1.item_id IN (SELECT item_id FROM item_latest WHERE  map_id = '$map_id') OR icl2.item_id IN (SELECT item_id FROM item_latest WHERE  map_id = '$map_id'));";

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
