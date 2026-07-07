<?php

	session_start();

	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');

	$user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
	$st_time = $_POST['st_time'];
	$change = $_POST['change'];
	$node_id = $_POST['node_id'];
	$change_thing1 = $_POST['change_thing1'];
	$change_thing2 = $_POST['change_thing2'];
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

	if($change == "point"){
		$sql = "UPDATE network_nodes SET node_x = '$change_thing1', node_y = '$change_thing2', updated_at = '$timestamp' WHERE user_id = '$user_id' AND map_id = '$map_id' AND node_id = '$node_id' AND updated_at > '$st_time'";
		$result = $mysqli->query($sql);
	}
	//ここから変更するものが増えていけばifの中身をいじる
	else{

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
