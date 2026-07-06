<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  $section_id = $_POST["id"]; //章ID
  
  $sql = "UPDATE section SET deleted = 1 WHERE section_id='$section_id'";
	
	$result = $mysqli->query($sql);

	//php($sql)のエラー処理
	if($sql == TRUE){
		
		error_log('$sql:section_delete成功', 0);
	}else if($sql == FALSE){
		error_log($sql.'$sql:section_delete失敗', 0);
	}else{
		error_log('$sql:section_delete不明なエラー', 0);
	}
	
	//php($result)のエラー処理
	if($result == TRUE){
		
		error_log('$result:section_delete成功', 0);
	}else if($result == FALSE){
		error_log($result.'$result:section_delete失敗'.$mysqli->error, 0);
	}else{
		error_log('$result:section_delete不明なエラー', 0);
	}

?>