<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  $chapter_id = $_POST["chapter_id"]; //章ID
  $section_id = $_POST["id"]; //節ID
  $rank = $_POST["rank"];			//章順番

  $sql = "UPDATE section SET chapter_id = '$chapter_id', rank = '$rank' WHERE section_id='$section_id'";
	
	$result = $mysqli->query($sql);

	//php($sql)のエラー処理
	if($sql == TRUE){
		
		error_log('$sql:section_rank成功', 0);
	}else if($sql == FALSE){
		error_log($sql.'$sql:section_rank失敗', 0);
	}else{
		error_log('$sql:section_rank不明なエラー', 0);
	}
	
	//php($result)のエラー処理
	if($result == TRUE){
		
		error_log('$result:section_rank成功', 0);
	}else if($result == FALSE){
		error_log($result.'$result:section_rank失敗'.$mysqli->error, 0);
	}else{
		error_log('$result:section_rank不明なエラー', 0);
	}

?>