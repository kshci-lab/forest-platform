<?php
	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

	//タイムゾーンの設定
	date_default_timezone_set('Asia/Tokyo');
	// $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);//日時をマイクロ秒まで取得するようにしてみる
	$user_id = $_SESSION['USERID'];      //ユーザID
	$map_id = $_SESSION['MAPID'];    //シートID
	$item_id = $_POST["id"];             //スライドID
	$node_id = $_POST["node_id"];
	$title = $_POST["title"];
	$brother_id = $_POST["brother_id"];
	$item_version_id = uniqid();
	$item_history_id = uniqid();
	$activity_id = uniqid();

	$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

	// $sql = "INSERT INTO slide (id, map_id, slide_title, user_id, created_at, updated_at, deleted, from_slide)
	// VALUES ('$item_id', '$map_id', '研究目的', '$user_id','$timestamp', '$timestamp', 0, '$map_id')";

	$sql_it = "INSERT INTO items (item_id, map_id, created_at, updated_at, deleted)
		VALUES ('$item_id', '$map_id', '$timestamp', '$timestamp', 0)";
	$result_it = $mysqli->query($sql_it);
	if ($mysqli->error) {
		echo "Error items: " . $mysqli->error;
	}

	$sql_it_v = "INSERT INTO item_versions (item_version_id, item_id, item_bro_id, node_id, logic_option, title, appeared_at, disappeared_at)
		VALUES ('$item_version_id', '$item_id', '$brother_id', '$node_id', 0, '$title', '$timestamp', NULL)";
	$result_it_v = $mysqli->query($sql_it_v);
	if ($mysqli->error) {
		echo "Error item_versions: " . $mysqli->error;
	}

	$sql_it_h = "INSERT INTO item_histories (item_history_id, item_version_id, item_bro_id, node_id, logic_option, title, appeared_at, disappeared_at)
		VALUES ('$item_history_id', '$item_version_id', '$brother_id', '$node_id', 0, '$title', '$timestamp', NULL)";
	$result_it_h = $mysqli->query($sql_it_h);
	if ($mysqli->error) {
		echo "Error item_histories: " . $mysqli->error;
	}

    // //クエリ($sql)のエラー処理
    // if($sql == TRUE){
	// 	echo "true";
	// 	error_log('$sql成功しています！'.$timestamp, 0);
	// }else if($sql == FALSE){
	// 	error_log($sql.'$sql失敗です', 0);
	// 	// error_log('失敗しました。'.mysqli_error($link), 0);
	// }else{
	// 	error_log('$sql不明なエラーです', 0);
	// }

    // //php($result)のエラー処理
    // if($result == TRUE){
	// 	echo "true";
	// 	error_log('$result成功しています！'.$timestamp, 0);
	// }else if($result == FALSE){
	// 	error_log($result.'$result失敗です'.$mysqli->error, 0);
	// 	// error_log('失敗しました。'.mysqli_error($link), 0);
	// }else{
	// 	error_log('$result不明なエラーです', 0);
	// }

	//==============================activityログ===============================//

	// $sql = "INSERT INTO slide_activity (id, map_id, item_id, slide_title, user_id, act, date, from_slide)
	// VALUES ('$activity_id', '$map_id', '$item_id', NULL, '$user_id', 'add', '$timestamp', NULL)";

	// $result = $mysqli->query($sql);




?>
