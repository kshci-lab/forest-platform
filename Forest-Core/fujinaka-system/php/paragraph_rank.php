<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

	$section_id = $_POST["section_id"]; //節ID
	$paragraph_id = $_POST["id"];     		//パラグラフID
  $rank = $_POST["rank"];							//パラグラフ順番

  $sql = "UPDATE paragraph SET section_id = '$section_id', rank = '$rank' WHERE paragraph_id = '$paragraph_id'";

	$result = $mysqli->query($sql);
	
	//php($sql)のエラー処理
	if($sql == TRUE){
		
		error_log('$sql:paragraph_rank成功', 0);
	}else if($sql == FALSE){
		error_log($sql.'$sql:paragraph_rank失敗', 0);
	}else{
		error_log('$sql:paragraph_rank不明なエラー', 0);
	}
	
	//php($result)のエラー処理
	if($result == TRUE){
		
		error_log('$result:paragraph_rank成功', 0);
	}else if($result == FALSE){
		error_log($result.'$result:paragraph_rank失敗'.$mysqli->error, 0);
	}else{
		error_log('$result:paragraph_rank不明なエラー', 0);
	}

?>