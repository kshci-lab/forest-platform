<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  	$comment_id = $_POST["comment_id"]; //コメントID
	$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

	if($_POST["update"] == "add_templete"){

		$templete_id = $_POST["templete_id"];	//コメントID

		$sql = "INSERT INTO comment_templete (comment_id, templete_id, created_at) 
		VALUES ('$comment_id', '$templete_id', '$timestamp')";
	
		$result = $mysqli->query($sql);
	
		//php($sql)のエラー処理
		if($sql == TRUE){
			error_log('$sql:comment_templete_insert成功', 0);
		}else if($sql == FALSE){
			error_log($sql.'$sql:comment_templete_insert失敗', 0);
		}else{
			error_log('$sql:comment_templete_insert不明なエラー', 0);
		}
		
		//php($result)のエラー処理
		if($result == TRUE){
			error_log('$result:comment_templete_insert成功', 0);
		}else if($result == FALSE){
			error_log($result.'$result:comment_templete_insert失敗'.$mysqli->error, 0);
		}else{
			error_log('$result:comment_templete_insert不明なエラー', 0);
		}

  }else if($_POST["update"] == "content"){

		$content = $_POST["content"];
		
		$sql = "UPDATE comment SET content = '$content' WHERE comment_id = '$comment_id'";
		
		$result = $mysqli->query($sql);
		
		//php($sql)のエラー処理
		if($sql == TRUE){
			
			error_log('$sql:comment_content_update成功', 0);
		}else if($sql == FALSE){
			error_log($sql.'$sql:comment_content_update失敗', 0);
		}else{
			error_log('$sql:comment_content_update不明なエラー', 0);
		}
	
		//php($result)のエラー処理
		if($result == TRUE){
			
			error_log('$result:comment_content_update成功', 0);
		}else if($result == FALSE){
			error_log($result.'$result:comment_content_update失敗'.$mysqli->error, 0);
		}else{
			error_log('$result:comment_content_update不明なエラー', 0);
		}
	}


?>