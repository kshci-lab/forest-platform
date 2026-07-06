<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  //タイムゾーンの設定
  date_default_timezone_set('Asia/Tokyo');

    $user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
    $status = $_POST["status"];         //スライドのアップデートかコンテントかの判別


    $sql = "UPDATE slide_rank SET updated_at='$timestamp', deleted=1 WHERE map_id='$map_id' AND deleted=0";

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
