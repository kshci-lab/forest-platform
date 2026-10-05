<?php
	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

	//タイムゾーンの設定
	date_default_timezone_set('Asia/Tokyo');
	// $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);//日時をマイクロ秒まで取得するようにしてみる
	$user_id = $_SESSION['USERID'];      //ユーザID
	$map_id = $_SESSION['MAPID'];    //シートID
	$slide_id = $_POST["id"];             //スライドID
	$activity_id = uniqid();

	$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

	// $sql = "INSERT INTO slide (id, map_id, slide_title, user_id, created_at, updated_at, deleted, from_slide)
	// VALUES ('$slide_id', '$map_id', '研究目的', '$user_id','$timestamp', '$timestamp', 0, '$map_id')";

	$sql = "INSERT INTO slide (id, map_id, slide_title, user_id, created_at, updated_at, deleted, from_slide)
	VALUES ('$slide_id', '$map_id', NULL, '$user_id','$timestamp', '$timestamp', 0, '$map_id')";


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

	//==============================activityログ===============================//

	$sql = "INSERT INTO slide_activity (id, map_id, slide_id, slide_title, user_id, act, date, from_slide)
	VALUES ('$activity_id', '$map_id', '$slide_id', NULL, '$user_id', 'add', '$timestamp', NULL)";

	$result = $mysqli->query($sql);




?>
