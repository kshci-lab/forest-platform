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
$node_id = $_POST["node_id"];             //ノードID
$label = $_POST["label"];              //ラベル
$x = $_POST["x"];  //x座標
$y = $_POST["y"];  //y座標
$color = $_POST["color"];  //色
$shape = $_POST["shape"];  //形
$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);


	$sql = "INSERT INTO network_nodes (user_id, map_id, node_id, label, node_x, node_y, color, shape, time, updated_at)
	VALUES ('$user_id', '$map_id', '$node_id', '$label', '$x', '$y', '$color', '$shape', '$timestamp',  '$timestamp')";
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