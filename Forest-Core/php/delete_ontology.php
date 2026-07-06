<?php

	session_start();

	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');

	$user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
	$st_time = $_POST['st_time'];
	$nodeid = $_POST['nodeid'];
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

	$sql1 = "DELETE FROM network_ontology_connects WHERE node_id = '$nodeid' AND time > '$st_time'";
	$result1 = $mysqli->query($sql1);
	$sql2 = "DELETE FROM network_mindmap_connects WHERE network_node_id = '$nodeid' AND time > '$st_time'";
	$result2 = $mysqli->query($sql2);

	//クエリ($sql)のエラー処理
    if($sql1 == TRUE){
		echo "true";
		error_log('$sql成功しています！'.$timestamp, 0);
	}else if($sql1 == FALSE){
		error_log($sql1.'$sql失敗です', 0);
		// error_log('失敗しました。'.mysqli_error($link), 0);
	}else{
		error_log('$sql不明なエラーです', 0);
	}
    //php($result)のエラー処理
    if($result1 == TRUE){
		echo "true";
		error_log('$result成功しています！'.$timestamp, 0);
	}else if($result1 == FALSE){
		error_log($result1.'$result失敗です'.$mysqli->error, 0);
		// error_log('失敗しました。'.mysqli_error($link), 0);
	}else{
		error_log('$result不明なエラーです', 0);
	}
	//クエリ($sql)のエラー処理
    if($sql2 == TRUE){
		echo "true";
		error_log('$sql成功しています！'.$timestamp, 0);
	}else if($sql2 == FALSE){
		error_log($sql2.'$sql失敗です', 0);
		// error_log('失敗しました。'.mysqli_error($link), 0);
	}else{
		error_log('$sql不明なエラーです', 0);
	}
    //php($result)のエラー処理
    if($result2 == TRUE){
		echo "true";
		error_log('$result成功しています！'.$timestamp, 0);
	}else if($result2 == FALSE){
		error_log($result2.'$result失敗です'.$mysqli->error, 0);
		// error_log('失敗しました。'.mysqli_error($link), 0);
	}else{
		error_log('$result不明なエラーです', 0);
	}
?>
