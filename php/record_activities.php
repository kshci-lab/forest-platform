<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  //タイムゾーンの設定
  date_default_timezone_set('Asia/Tokyo');




		// $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);//日時をマイクロ秒まで取得するようにしてみる
		$user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
    $node_id = $_POST["id"];             //ノードID
		$type = $_POST["type"];              //タイプ
		$concept_id = $_POST["concept_id"];  //法造コンセプトID
		$text = $_POST["text"];              //テキスト
		$parent_id = $_POST["parent_id"];    //親ノードID
		$activity = $_POST["activity"];      //操作
    $primary_id = $_POST["primary"];     //primary_id


		//用意された問いの追加だった場合，微調整を行う
		if($type==='prepared_question' and $activity==='add'){
			//0.5秒速く登録する
			$timestamp = date("Y-m-d H:i:s", strtotime(' - 1 seconds ')) . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
		}else{
			//普通に登録する
			$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
		}


		$sql = "INSERT INTO activities (id, timestamp, node_id, act, type, concept_id, text, parent_id, user_id, map_id)
		VALUES ('$primary_id', '$timestamp', '$node_id','$activity', '$type','$concept_id','$text','$parent_id','$user_id','$map_id')";

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
