<?php

//指定した日時だけ取得・マッチングするバージョン
session_start();
require("connect_db.php");

$user_id = $_SESSION["USERID"];//"26943"; //
$map_id = $_SESSION["MAPID"];//"102774749"; //

//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');
$today_date = date("Y-m-d");

$imageID = $_GET['imageID'];

if($imageID == '1'){
    $sql = "SELECT image_id,image_name FROM images ORDER BY created_at DESC LIMIT 1";

    $data = array();
    if($result = $mysqli->query($sql)){
      while($row = mysqli_fetch_assoc($result)){
        array_push($data, $row);
      }
    }
    
    $json=json_encode($data, JSON_UNESCAPED_UNICODE);
    echo $json;
}else{
    $sql = "SELECT image_id,image_name FROM images WHERE image_id='$imageID'";

    $data = array();
    if($result = $mysqli->query($sql)){
      while($row = mysqli_fetch_assoc($result)){
        array_push($data, $row);
      }
    }
    
    $json=json_encode($data, JSON_UNESCAPED_UNICODE);
    echo $json;
}

?>