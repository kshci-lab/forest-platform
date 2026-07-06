<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  $chapter_id = $_POST["id"]; //章ID

  $sql = "SELECT title FROM chapter WHERE chapter_id = '$chapter_id'";

  if($result = $mysqli->query($sql)) {
    while($row = mysqli_fetch_assoc($result)){
      $pre_title = $row['title'];
    }
  }

	$title = $_POST["title"]; //章タイトル

  if($title != $pre_title){	//変更があれば更新

    $sql = "UPDATE chapter SET title='$title' WHERE chapter_id='$chapter_id'";
			
		$result = $mysqli->query($sql);

		//php($sql)のエラー処理
		if($sql == TRUE){
			
			error_log('$sql:chapter_update成功', 0);
		}else if($sql == FALSE){
			error_log($sql.'$sql:chapter_update失敗', 0);
		}else{
			error_log('$sql:chapter_update不明なエラー', 0);
		}
	
		//php($result)のエラー処理
		if($result == TRUE){
			
			error_log('$result:chapter_update成功', 0);
		}else if($result == FALSE){
			error_log($result.'$result:chapter_update失敗'.$mysqli->error, 0);
		}else{
			error_log('$result:chapter_update不明なエラー', 0);
		}
	}

?>