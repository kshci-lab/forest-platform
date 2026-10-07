<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  //タイムゾーンの設定
  date_default_timezone_set('Asia/Tokyo');

  		$content_id = $_POST["id"];             //コンテントID
		$node1_id = $_POST["node1_id"]; 
		$node2_id = $_POST["node2_id"]; 
		$doc_con1_id = $_POST["doc_con1_id"];      //ユーザID
		$doc_con2_id = $_POST["doc_con2_id"];
		$doc_con1_label = $_POST["doc_con1_label"];      
		$doc_con2_label = $_POST["doc_con2_label"];
		$ont1_id = $_POST["ont1_id"];
		$ont2_id = $_POST["ont2_id"];
		$map_id = $_SESSION['MAPID'];    //スライドID
		$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

		$sql = "INSERT INTO document_content_relation (id, node1_id, doc_con1_id, doc_con1_label, ont1_id, node2_id, doc_con2_id, doc_con2_label, ont2_id, deleted, created_at, updated_at, map_id) VALUES ('$content_id', '$node1_id','$doc_con1_id', '$doc_con1_label', '$ont1_id',  '$node2_id', '$doc_con2_id', '$doc_con2_label', '$ont2_id', 0, '$timestamp', '$timestamp' , '$map_id')";

		$result = $mysqli->query($sql);
		echo($sql);

    //==============================activityログ===============================//

	// 	$sql = "INSERT INTO slide_content_activity (id, map_id, slide_content_id, node_id, concept_id, content, type, user_id, slide_id, act, date, from_slide_content)
	// 	VALUES ('$activity_id', '$map_id', '$content_id', '$node_id', '$concept_id', '$content', '$type', '$user_id', '$slide_id', 'add', '$timestamp', NULL)";

	// 	$result = $mysqli->query($sql);

    // //クエリ($sql)のエラー処理
    // if($sql == TRUE){
	// 		echo "true";
	// 		error_log('$sql成功しています！'.$timestamp, 0);
	// 	}else if($sql == FALSE){
	// 		error_log($sql.'$sql失敗です', 0);
	// 		// error_log('失敗しました。'.mysqli_error($link), 0);
	// 	}else{
	// 		error_log('$sql不明なエラーです', 0);
	// 	}

    // //php($result)のエラー処理
    // if($result == TRUE){
	// 		echo "true";
	// 		error_log('$result成功しています！'.$timestamp, 0);
	// 	}else if($result == FALSE){
	// 		error_log($result.'$result失敗です'.$mysqli->error, 0);
	// 		// error_log('失敗しました。'.mysqli_error($link), 0);
	// 	}else{
	// 		error_log('$result不明なエラーです', 0);
	// 	}


?>
