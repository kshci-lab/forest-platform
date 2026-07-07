<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  $paragraph_id = $_POST["id"]; //パラグラフID
  
  $sql = "UPDATE paragraph SET deleted = 1 WHERE paragraph_id='$paragraph_id'";
	
	$result = $mysqli->query($sql);

	//php($sql)のエラー処理
	if($sql == TRUE){
		
		error_log('$sql:paragraph_delete成功', 0);
	}else if($sql == FALSE){
		error_log($sql.'$sql:paragraph_delete失敗', 0);
	}else{
		error_log('$sql:paragraph_delete不明なエラー', 0);
	}
	
	//php($result)のエラー処理
	if($result == TRUE){
		
		error_log('$result:paragraph_delete成功', 0);
	}else if($result == FALSE){
		error_log($result.'$result:paragraph_delete失敗'.$mysqli->error, 0);
	}else{
		error_log('$result:paragraph_delete不明なエラー', 0);
	}

?>
