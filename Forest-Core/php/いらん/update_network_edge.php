<?php

	session_start();

	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');

	$user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
	$st_time = $_POST['st_time'];
	$start = $_POST['start'];
	$end = $_POST['end'];

	//時間設定はいる
	if($start == 0){
		$sql = "DELETE FROM network_edges WHERE user_id = '$user_id' AND map_id = '$map_id' AND edge_end = '$end' AND time > '$st_time'";
		$result = $mysqli->query($sql);
	}else if($end == 0){
		$sql = "DELETE FROM network_edges WHERE user_id = '$user_id' AND map_id = '$map_id' AND edge_start = '$start' AND time > '$st_time'";
		$result = $mysqli->query($sql);
	}else{
		$sql = "DELETE FROM network_edges WHERE user_id = '$user_id' AND map_id = '$map_id' AND edge_start = '$start' AND edge_end = '$end' AND time > '$st_time'";
		$result = $mysqli->query($sql);
	}
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
