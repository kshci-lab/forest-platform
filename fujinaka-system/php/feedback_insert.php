<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  //タイムゾーンの設定
  date_default_timezone_set('Asia/Tokyo');

	$user_id = $_SESSION['USERID'];     //ユーザID
  $map_id = $_SESSION['MAPID'];   //シートID
	$feedback_id = $_POST["feedback_id"];	//フィードバックID
  $node_id = $_POST["node_id"];         //ノードID
	$node_concept = $_POST["node_concept"]; 	//ノード概念
	$content = $_POST["content"]; 	//フィードバック文
	$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
	$feedback_status = $_POST["feedback_status"]; //考える（0），考えない（1）

	$sql = "INSERT INTO feedback (feedback_id, user_id, map_id, node_id, node_concept, content, created_at, feedback_status)
	VALUES ('$feedback_id', '$user_id', '$map_id', '$node_id', '$node_concept', '$content', '$timestamp', '$feedback_status')";

	$result = $mysqli->query($sql);

	//php($sql)のエラー処理
	if($sql == TRUE){
		error_log('$sql:feedback_insert成功', 0);
	}else if($sql == FALSE){
		error_log($sql.'$sql:feedback_insert失敗', 0);
	}else{
		error_log('$sql:feedback_insert不明なエラー', 0);
	}
	
	//php($result)のエラー処理
	if($result == TRUE){
		error_log('$result:feedback_insert成功', 0);
	}else if($result == FALSE){
		error_log($result.'$result:feedback_insert失敗'.$mysqli->error, 0);
	}else{
		error_log('$result:feedback_insert不明なエラー', 0);
	}

?>