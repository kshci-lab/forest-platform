<?php

//指定した日時だけ取得・マッチングするバージョン
session_start();
require("connect_db.php");

$user_name = $_SESSION["USERNAME"];//"26943"; //
// $map_id = $_SESSION["MAPID"];//"102774749"; //

// //タイムゾーンの設定
// date_default_timezone_set('Asia/Tokyo');

// // $sql = "SELECT scenario_title FROM maps WHERE id='$map_id'";
// $sql = "SELECT * FROM docum WHERE map_id='$map_id' AND deleted='0'";

// $data = array();
// if($result = $mysqli->query($sql)){
//   while($row = mysqli_fetch_assoc($result)){
//     array_push($data, $row);
//   }
// }

// $json=json_encode($data, JSON_UNESCAPED_UNICODE);
echo $user_name;

?>