<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  //タイムゾーンの設定
  date_default_timezone_set('Asia/Tokyo');

	$user_id = $_SESSION['USERID'];		//ユーザID
  $map_id = $_SESSION['MAPID'];	//シートID
  $section_id = $_POST["id"];				//節ID
  $chapter_id = $_POST["chapter_id"];	//章ID
	$rank = $_POST["rank"];						//章順番
	$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

	$sql = "INSERT INTO section (section_id, user_id, map_id, chapter_id, rank, created_at)
	VALUES ('$section_id', '$user_id', '$map_id','$chapter_id', '$rank', '$timestamp')";

	$result = $mysqli->query($sql);

	//php($sql)のエラー処理
	if($sql == TRUE){
		
		error_log('$sql:section_insert成功', 0);
	}else if($sql == FALSE){
		error_log($sql.'$sql:section_insert失敗', 0);
	}else{
		error_log('$sql:section_insert不明なエラー', 0);
	}
	
	//php($result)のエラー処理
	if($result == TRUE){
		
		error_log('$result:section_insert成功', 0);
	}else if($result == FALSE){
		error_log($result.'$result:section_insert失敗'.$mysqli->error, 0);
	}else{
		error_log('$result:section_insert不明なエラー', 0);
	}

?>