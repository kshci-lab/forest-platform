<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  $paragraph_id = $_POST["id"]; //パラグラフID

	if($_POST["update"] == "title"){

    $sql = "SELECT title FROM paragraph WHERE paragraph_id = '$paragraph_id'";

    if($result = $mysqli->query($sql)) {
      while($row = mysqli_fetch_assoc($result)){
        $pre_title = $row['title'];
      }
    }

		$title = $_POST["title"];

    if($title != $pre_title){

      $sql = "UPDATE paragraph SET title='$title' WHERE paragraph_id = '$paragraph_id'";
			
			$result = $mysqli->query($sql);

			//php($sql)のエラー処理
			if($sql == TRUE){
				
				error_log('$sql:paragraph_title_update成功', 0);
			}else if($sql == FALSE){
				error_log($sql.'$sql:paragraph_title_update失敗', 0);
			}else{
				error_log('$sql:paragraph_title_update不明なエラー', 0);
			}
		
			//php($result)のエラー処理
			if($result == TRUE){
				
				error_log('$result:paragraph_title_update成功', 0);
			}else if($result == FALSE){
				error_log($result.'$result:paragraph_title_update失敗'.$mysqli->error, 0);
			}else{
				error_log('$result:paragraph_title_update不明なエラー', 0);
			}

		}
		
  }else if($_POST["update"] == "content"){

		$content = $_POST["content"];
		
		$sql = "UPDATE paragraph SET content = '$content' WHERE paragraph_id = '$paragraph_id'";
		
		$result = $mysqli->query($sql);
		
		//php($sql)のエラー処理
		if($sql == TRUE){
			
			error_log('$sql:paragraph_content_update成功', 0);
		}else if($sql == FALSE){
			error_log($sql.'$sql:paragraph_content_update失敗', 0);
		}else{
			error_log('$sql:paragraph_content_update不明なエラー', 0);
		}
	
		//php($result)のエラー処理
		if($result == TRUE){
			
			error_log('$result:paragraph_content_update成功', 0);
		}else if($result == FALSE){
			error_log($result.'$result:paragraph_content_update失敗'.$mysqli->error, 0);
		}else{
			error_log('$result:paragraph_content_update不明なエラー', 0);
		}
	}


?>