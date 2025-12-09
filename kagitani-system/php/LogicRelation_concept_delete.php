<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

	//タイムゾーンの設定
	date_default_timezone_set('Asia/Tokyo');

    $user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
    $id = $_POST["id"]; //スライドID
    $activity_id = uniqid();
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

    $sql_i = "UPDATE item_relations SET updated_at='$timestamp', deleted=1 WHERE (item1_id='$id' OR item2_id='$id')";
	$result_i = $mysqli->query($sql_i);
	if ($mysqli->error) {
		echo "Error delete item_relations: " . $mysqli->error;
	}

	$sql_ic = "UPDATE item_content_relations SET updated_at='$timestamp', deleted=1 WHERE (item_content1_id='$id' OR item_content2_id='$id')";
	$result_ic = $mysqli->query($sql_ic);
	if ($mysqli->error) {
		echo "Error delete item_content_relations: " . $mysqli->error;
	}

    //=================================activityログ===================================//

		// $sql = "INSERT INTO slide_activity (id, map_id, slide_id, slide_title, user_id, act, date, from_slide)
		// VALUES ('$activity_id', '$map_id', '$slide_id', NULL, '$user_id', 'delete', '$timestamp', '$map_id')";

		// $result = $mysqli->query($sql);

?>