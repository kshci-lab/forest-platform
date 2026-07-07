<?php

	session_start();
	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");
	//タイムゾーンの設定
	date_default_timezone_set('Asia/Tokyo');


	$user_id = $_SESSION['USERID'];      //ユーザID
	$map_id = $_SESSION['MAPID'];    //シートID
	$content_id = $_POST["id"];             //コンテントID
	$node_id = $_POST["node_id"];             //ノードID
	$concept_id = $_POST["concept_id"];         //コンセプトID
	$content = $_POST["content"];             //コンテント
	$slide_id = $_POST["slide_id"];             //スライドID
	$type = $_POST["type"];                 //ノードのタイプ
	$activity_id = uniqid();

	$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);


	$sql = "INSERT INTO slide_content (id, map_id, node_id, concept_id, content, type, user_id, slide_id, created_at, updated_at, deleted, from_slide_content)
	VALUES ('$content_id', '$map_id', '$node_id', '$concept_id','$content', '$type', '$user_id', '$slide_id', '$timestamp', '$timestamp', 0, NULL)";


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
		echo "false";
		error_log($result.'$result失敗です'.$mysqli->error, "3", "error_log.txt");
		// error_log('失敗しました。'.mysqli_error($link), 0);
	}else{
		error_log('$result不明なエラーです', 0);
	}

    //==============================activityログ===============================//

	// $sql = "INSERT INTO slide_content_activity (id, map_id, slide_content_id, node_id, concept_id, content, type, user_id, slide_id, act, date, from_slide_content)
	// VALUES ('$activity_id', '$map_id', '$content_id', '$node_id', '$concept_id', '$content', '$type', '$user_id', '$slide_id', 'add', '$timestamp', NULL)";

	// $result = $mysqli->query($sql);

    // //クエリ($sql)のエラー処理
    // if($sql == TRUE){
	// 		echo "true";
	// 		error_log('$sql成功しています！'.$timestamp, 0);
	// 	}else if($sql == FALSE){
	// 		error_log($sql.'$sql失敗です', 0);
	// 		// error_log('失敗しました。'.mysqli_error($link), 0);
	// 	}else{
	// 		error_log('$sql不明なエラーです', 0);
	// 	}

    // //php($result)のエラー処理
    // if($result == TRUE){
	// 		echo "true";
	// 		error_log('$result成功しています！'.$timestamp, 0);
	// 	}else if($result == FALSE){
	// 		error_log($result.'$result失敗です'.$mysqli->error, 0);
	// 		// error_log('失敗しました。'.mysqli_error($link), 0);
	// 	}else{
	// 		error_log('$result不明なエラーです', 0);
	// 	}


?>
