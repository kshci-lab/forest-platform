<?php

//指定した日時だけ取得・マッチングするバージョン
session_start();

require("php/function.php");
$pdo = connectDB_Test();

// $user_id = $_SESSION["USERID"];//"26943"; //
// $map_id = $_SESSION["MAPID"];//"102774749"; //

// //タイムゾーンの設定
// date_default_timezone_set('Asia/Tokyo');
// $today_date = date("Y-m-d");
$imageID = $_GET['imageID'];

if($imageID == '1'){
    $sql = "SELECT * FROM images ORDER BY created_at DESC LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();   
    $images = $stmt->fetch(PDO::FETCH_ASSOC);
    // 画像ヘッダとしてjpegを指定（取得データがjpegの場合）
    header("Content-Type: image/jpeg");
    echo $images['image_content'];
}else{
    $sql = "SELECT * FROM images WHERE image_id='$imageID'";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();   
    $images = $stmt->fetch(PDO::FETCH_ASSOC);
    // 画像ヘッダとしてjpegを指定（取得データがjpegの場合）
    header("Content-Type: image/jpeg");
    echo $images['image_content'];
}


// echo $images;
// header('Content-Type: application/json');
// echo json_encode($images);

?>