<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  //タイムゾーンの設定
  date_default_timezone_set('Asia/Tokyo');

	$user_id = $_SESSION['USERID'];     //ユーザID
  $map_id = $_SESSION['MAPID'];   //シートID
	$section_id = $_POST["section_id"];	//節ID
  $paragraph_id = $_POST["id"];         //パラグラフID
	$rank = $_POST["rank"]; 						//パラグラフ順番
	$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

	$sql = "INSERT INTO paragraph (paragraph_id, user_id, map_id, section_id, rank, created_at)
	VALUES ('$paragraph_id', '$user_id', '$map_id', '$section_id', '$rank', '$timestamp')";

	$result = $mysqli->query($sql);

	//php($sql)のエラー処理
	if($sql == TRUE){
		error_log('$sql:paragraph_insert成功', 0);
	}else if($sql == FALSE){
		error_log($sql.'$sql:paragraph_insert失敗', 0);
	}else{
		error_log('$sql:paragraph_insert不明なエラー', 0);
	}
	
	//php($result)のエラー処理
	if($result == TRUE){
		error_log('$result:paragraph_insert成功', 0);
	}else if($result == FALSE){
		error_log($result.'$result:paragraph_insert失敗'.$mysqli->error, 0);
	}else{
		error_log('$result:paragraph_insert不明なエラー', 0);
	}

	$sql = "INSERT INTO slide_content_activity (id, map_id, slide_content_id, node_id, concept_id, content, type, user_id, slide_id, act, date, from_slide_content)
	VALUES ('$activity_id', '$map_id', '$content_id', '$node_id', '$concept_id', '$content', '$type', '$user_id', '$slide_id', 'add', '$timestamp', NULL)";

	$result = $mysqli->query($sql);

//クエリ($sql)のエラー処理
if($sql == TRUE){
		
		error_log('$sql成功しています！'.$timestamp, 0);
	}else if($sql == FALSE){
		error_log($sql.'$sql失敗です', 0);
		// error_log('失敗しました。'.mysqli_error($link), 0);
	}else{
		error_log('$sql不明なエラーです', 0);
	}

//php($result)のエラー処理
if($result == TRUE){
		
		error_log('$result成功しています！'.$timestamp, 0);
	}else if($result == FALSE){
		error_log($result.'$result失敗です'.$mysqli->error, 0);
		// error_log('失敗しました。'.mysqli_error($link), 0);
	}else{
		error_log('$result不明なエラーです', 0);
	}


?>