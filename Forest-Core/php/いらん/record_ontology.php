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
$ontology_id = $_POST["ontology_id"];   //オントロジーのノードID
$label = $_POST["label"];              //ラベル
$x = $_POST["x"];  //x座標
$y = $_POST["y"];  //y座標
$color = $_POST["color"];  //色
$shape = $_POST["shape"];  //形
$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);


	$sql1 = "INSERT INTO network_nodes (user_id, map_id, node_id, label, node_x, node_y, color, shape, time, updated_at)
	VALUES ('$user_id', '$map_id', '$ontology_id', '$label', '$x', '$y', '$color', '$shape', '$timestamp', '$timestamp')";
	$sql2 = "INSERT INTO network_ontology_connects (user_id, map_id, ontology_id, node_id, time)
	VALUES ('$user_id', '$map_id', '$ontology_id', '$node_id', '$timestamp')";
	$result1 = $mysqli->query($sql1);
	$result2 = $mysqli->query($sql2);

//クエリ($sql)のエラー処理
if($sql1 == TRUE){
		echo "true";
		error_log('$sql成功しています！'.$timestamp, 0);
	}else if($sql1 == FALSE){
		error_log($sql1.'$sql失敗です', 0);
		// error_log('失敗しました。'.mysqli_error($link), 0);
	}else{
		error_log('$sql不明なエラーです', 0);
	}

//php($result)のエラー処理
if($result1 == TRUE){
		echo "true";
		error_log('$result成功しています！'.$timestamp, 0);
	}else if($result1 == FALSE){
		error_log($result1.'$result失敗です'.$mysqli->error, 0);
		// error_log('失敗しました。'.mysqli_error($link), 0);
	}else{
		error_log('$result不明なエラーです', 0);
	}
//クエリ($sql)のエラー処理
if($sql2 == TRUE){
	echo "true";
	error_log('$sql成功しています！'.$timestamp, 0);
}else if($sql2 == FALSE){
	error_log($sql2.'$sql失敗です', 0);
	// error_log('失敗しました。'.mysqli_error($link), 0);
}else{
	error_log('$sql不明なエラーです', 0);
}

//php($result)のエラー処理
if($result2 == TRUE){
	echo "true";
	error_log('$result成功しています！'.$timestamp, 0);
}else if($result2 == FALSE){
	error_log($result2.'$result失敗です'.$mysqli->error, 0);
	// error_log('失敗しました。'.mysqli_error($link), 0);
}else{
	error_log('$result不明なエラーです', 0);
}

?>