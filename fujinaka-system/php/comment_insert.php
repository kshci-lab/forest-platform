<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  //タイムゾーンの設定
  date_default_timezone_set('Asia/Tokyo');

	$user_id = $_SESSION['USERID'];     //ユーザID
	$user_name = $_SESSION['USERNAME'];	//ユーザ名
  	$map_id = $_SESSION['MAPID'];   //シートID
	$comment_id = $_POST["comment_id"];	//コメントID
	$version_id = $_POST["version_id"];	//バージョンID
	$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

	$sql = "INSERT INTO comment (comment_id, version_id, user_id, user_name, map_id, created_at)
	VALUES ('$comment_id', '$version_id', '$user_id', '$user_name', '$map_id', '$timestamp')";

	$result = $mysqli->query($sql);

	//php($sql)のエラー処理
	if($sql == TRUE){
		error_log('$sql:comment_insert成功', 0);
	}else if($sql == FALSE){
		error_log($sql.'$sql:comment_insert失敗', 0);
	}else{
		error_log('$sql:comment_insert不明なエラー', 0);
	}
	
	//php($result)のエラー処理
	if($result == TRUE){
		error_log('$result:comment_insert成功', 0);
	}else if($result == FALSE){
		error_log($result.'$result:comment_insert失敗'.$mysqli->error, 0);
	}else{
		error_log('$result:comment_insert不明なエラー', 0);
	}

?>