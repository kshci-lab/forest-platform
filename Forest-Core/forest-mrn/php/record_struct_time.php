<?php

session_start();

/*ノード情報をDBに格納する際に使用*/
require("connect_db.php");

//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');

// $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);//日時をマイクロ秒まで取得するようにしてみる

//ここ未完成（ノードにもっと情報追加しないといけないかも）
$user_id = $_SESSION['USERID'];      //ユーザID
$map_id = $_SESSION['MAPID'];    //シートID
$type = $_POST["type"];             //開始終了どっちか
$network_map_id = uniqid();
$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);


$result1 = $mysqli->query("SELECT MAX(start_time) FROM network_maps WHERE map_id = '$map_id' AND situation = 'start'");
$row1 = $result1->fetch_assoc();
$maxStartTime = $row1['MAX(start_time)'];
$sql1 = "UPDATE network_maps SET end_time = '$timestamp', situation = '$type' WHERE map_id = '$map_id' AND situation = 'start' AND start_time = '$maxStartTime'";
$result = $mysqli->query($sql1);

$sql2 = "INSERT INTO network_maps (network_map_id, map_id, start_time, end_time, situation) VALUES ('$network_map_id', '$map_id', '$timestamp', NULL, 'start')";
$result2 = $mysqli->query($sql2);

echo json_encode(["start_time" => $timestamp]);

?>