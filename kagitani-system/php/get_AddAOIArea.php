<?php

//指定した日時だけ取得・マッチングするバージョン
session_start();
require("connect_db.php");

$user_id = $_SESSION["USERID"];//"26943"; //
$map_id = $_SESSION["MAPID"];//"102774749"; //2139911719

//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');
$today_date = date("Y-m-d");


$sql = "SELECT id, slide_id, node_id, logic_ontology_id, X, Y, Width, Height FROM Area_on_Image WHERE map_id='$map_id' AND deleted=0";

$reflections = array();

if($result = $mysqli->query($sql)){
  //$reflections
  while($row = mysqli_fetch_assoc($result)){
    $reflections[] = array(
    'id'=> $row["id"],
    'slide_id' => $row["slide_id"],
    'node_id' => $row["node_id"],
    'logic_ontology_id' => $row["logic_ontology_id"],
    'left' => $row["X"],
    'top' => $row["Y"],
    'Width' => $row["Width"],
    'Height' => $row["Height"]);
  }
}

echo json_encode($reflections);

?>
