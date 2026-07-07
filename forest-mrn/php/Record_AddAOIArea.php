<?php

session_start();

/*ノード情報をDBに格納する際に使用*/
require("connect_db.php");

//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');

// $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);//日時をマイクロ秒まで取得するようにしてみる
$user_id = $_SESSION['USERID'];         //ユーザID
$map_id = $_SESSION['MAPID'];       //シートID
$slide_id = $_POST["slide_id"];         //スライドID
$id = $_POST["id"];                     //ID
$X = $_POST["Left"];                    //X座標の割合
$Y = $_POST["Top"];                     //Y座標の割合
$Width = $_POST["Width"];               //横幅の割合
$Height = $_POST["Height"];             //縦幅の割合

$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

$sql = "INSERT INTO Area_on_Image (id, user_id, map_id, slide_id, X, Y, Width, Height, deleted, created_at, updated_at)
VALUES ('$id', '$user_id', '$map_id', '$slide_id', '$X', '$Y', '$Width', '$Height', 0, '$timestamp', '$timestamp')";


$result = $mysqli->query($sql);

//クエリ($sql)のエラー処理
if($sql == TRUE){
        echo "true";
        error_log('$sql成功しています！'.$timestamp, 0);
    }else if($sql == FALSE){
        error_log($sql.'$sql失敗です', 0);
        // error_log('失敗しました。'.mysqli_error($link), 0);
    }else{
        error_log('$sql不明なエラーです', 0);
    }

//php($result)のエラー処理
if($result == TRUE){
        echo "true";
        error_log('$result成功しています！'.$timestamp, 0);
    }else if($result == FALSE){
        error_log($result.'$result失敗です'.$mysqli->error, 0);
        // error_log('失敗しました。'.mysqli_error($link), 0);
    }else{
        error_log('$result不明なエラーです', 0);
}

?>
