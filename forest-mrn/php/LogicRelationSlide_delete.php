<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

	//タイムゾーンの設定
	date_default_timezone_set('Asia/Tokyo');

    $user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
    $item_id = $_POST["id"]; //スライドID
    $activity_id = uniqid();
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

    $sql = "UPDATE item_relations SET updated_at='$timestamp', deleted=1 WHERE item1_id='$item_id' OR item2_id='$item_id'";
	$result = $mysqli->query($sql);
	if ($mysqli->error) {
		echo "Error delete item_relations: " . $mysqli->error;
	}

    //=================================activityログ===================================//

		// $sql = "INSERT INTO slide_activity (id, map_id, slide_id, slide_title, user_id, act, date, from_slide)
		// VALUES ('$activity_id', '$map_id', '$slide_id', NULL, '$user_id', 'delete', '$timestamp', '$map_id')";

		// $result = $mysqli->query($sql);

?>