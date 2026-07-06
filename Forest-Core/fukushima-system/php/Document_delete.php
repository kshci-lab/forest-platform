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
    $timestamp = date("Y-m-d H:i:s");

    $sql_item = "UPDATE items SET updated_at='$timestamp', deleted=1 WHERE item_id='$item_id' AND deleted = 0";
	$result = $mysqli->query($sql_item);
    //クエリ($sql)のエラー処理
    if ($mysqli->error) {
		echo "Error items: " . $mysqli->error;
	}

    $sql_item_v = "UPDATE item_versions SET disappeared_at='$timestamp' WHERE item_id='$item_id' AND disappeared_at IS NULL";
	$result = $mysqli->query($sql_item_v);
    //クエリ($sql)のエラー処理
    if ($mysqli->error) {
		echo "Error item_versions: " . $mysqli->error;
	}

	$sql_item_h = "UPDATE item_histories SET disappeared_at='$timestamp' WHERE item_version_id = (SELECT item_version_id FROM item_versions WHERE item_id='$item_id' order by appeared_at DESC LIMIT 1) AND disappeared_at IS NULL";
	$result = $mysqli->query($sql_item_h);
    //クエリ($sql)のエラー処理
    if ($mysqli->error) {
		echo "Error item_histories: " . $mysqli->error;
	}

    //=================================activityログ===================================//

		// $sql = "INSERT INTO slide_activity (id, map_id, slide_id, slide_title, user_id, act, date, from_slide)
		// VALUES ('$activity_id', '$map_id', '$slide_id', NULL, '$user_id', 'delete', '$timestamp', '$map_id')";

		// $result = $mysqli->query($sql);

?>
