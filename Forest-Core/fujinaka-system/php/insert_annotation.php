<?php //kii-fujinaka変更　type, parent_id を""にしてます．nodeid => commentidに

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');
	$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
	$map_id = $_SESSION['MAPID'];    //シートID
	$user_id = $_SESSION['USERID'];      //ユーザID
	
	$send_annotation_id = $_POST["id"]; //nishida
	$start_char_id = $_POST["start_char_id"]; //nishida
	$end_char_id = $_POST["end_char_id"]; //nishida

	$type = $_POST["type"];
	$paper_content = $_POST["content"];
	$comment_id = $_POST["comment_id"];
	$version_id = $_POST["version_id"];
	
	$sql = "INSERT INTO paper_annotations (id, start_char_id, end_char_id, type, content, created_at, map_id, user_id, comment_id, version_id)
	VALUES ('$send_annotation_id', '$start_char_id', '$end_char_id', '$type', '$paper_content', '$timestamp', '$map_id', '$user_id', '$comment_id', '$version_id')";

	$result = $mysqli->query($sql);

	//php($sql)のエラー処理 
	if($sql == TRUE){
		error_log('$sql:annotation_insert成功', 0);
	}else if($sql == FALSE){
		error_log($sql.'$sql:annotation_insert失敗', 0);
	}else{
		error_log('$sql:annotation_insert不明なエラー', 0);
	}
	
	//php($result)のエラー処理
	if($result == TRUE){
		error_log('$result:annotation_insert成功', 0);
	}else if($result == FALSE){
		error_log($result.'$result:annotation_insert失敗'.$mysqli->error, 0);
	}else{
		error_log('$result:annotation_insert不明なエラー', 0);
	}

?>