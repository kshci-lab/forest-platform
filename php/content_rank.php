<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

	//タイムゾーンの設定
	date_default_timezone_set('Asia/Tokyo');


		// $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);//日時をマイクロ秒まで取得するようにしてみる
		$user_id = $_SESSION['USERID'];      //ユーザID
		$map_id = $_SESSION['MAPID'];    //シートID
		$id = $_POST["id"];             //ID
		$content_id = $_POST["content_id"];            //コンテントID
		$rank = $_POST["rank"];            //順番
		$slide_id = $_POST["slide_id"];     //スライドID
		$content = $_POST["content"];     //コンテンツの中身
		$node_id = $_POST["node_id"];     //ノードID
		$type = $_POST["type"];     //タイプ
		$indent = $_POST["indent"];     //インデント情報
		$concept_id = $_POST["concept_id"];     //コンセプトID


		$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

		// $ssql = "UPDATE slide_content_rank SET updated_at='$timestamp', deleted=1 WHERE map_id='$map_id' AND deleted=0";
		// $rst = $mysqli->query($ssql);

		$sql = "INSERT INTO slide_content_rank (id, content_id, node_id, concept_id, rank, content, slide_id, type, indent, created_at, updated_at, user_id, map_id, deleted)
		VALUES ('$id', '$content_id', '$node_id', '$concept_id', '$rank', '$content', '$slide_id', '$type', '$indent', '$timestamp', '$timestamp', '$user_id','$map_id', 0)";
		$result = $mysqli->query($sql);

    //クエリ($sql)のエラー処理
    if($sql == TRUE){
			echo "true";
			error_log('$sql成功しています！'.$timestamp, 0);
		}else if($sql == FALSE){
			error_log($sql.'$sql失敗です', 0);
			// error_log('失敗しました。'.mysqli_error($link), 0);
		}else{
			error_log('$sql不明なエラーです', 0);
		}

    //php($result)のエラー処理
    if($result == TRUE){
			echo "true";
			error_log('$result成功しています！'.$timestamp, 0);
		}else if($result == FALSE){
			error_log($result.'$result失敗です'.$mysqli->error, 0);
			// error_log('失敗しました。'.mysqli_error($link), 0);
		}else{
			error_log('$result不明なエラーです', 0);
		}

?>
