<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  //タイムゾーンの設定
  date_default_timezone_set('Asia/Tokyo');

	$user_id = $_SESSION['USERID'];		//ユーザID
	$map_id = $_SESSION['MAPID'];	//シートID
	$chapter_id = $_POST["id"];				//章ID
	$title = $_POST["title"];
	$brother_id = $_POST["brother_id"];						//章順番
	$chapter_version_id = uniqid();				//章versionID
	$chapter_history_id = uniqid();				//章historyID
	$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

	$sql = "INSERT INTO chapter (chapter_id, map_id, created_at, updated_at, deleted	)
	VALUES ('$chapter_id', '$map_id', '$timestamp', '$timestamp', 0)";
	
	$sql_it = "INSERT INTO chapters (chapter_id, item_id, created_at, updated_at, deleted)
	VALUES ('$chapter_id', '$map_id', '$timestamp', '$timestamp', 0)";
	$result_it = $mysqli->query($sql_it);
	if ($mysqli->error) {
	echo "Error chapters: " . $mysqli->error;
	}

	$sql_it_v = "INSERT INTO chapter_versions (chapter_version_id, chapter_id, chapter_bro_id, map_version_id, title, appeared_at, disappeared_at)
	VALUES ('$chapter_version_id', '$chapter_id', '$brother_id', '$node_id', 0, '$content', '$type', '$timestamp', NULL)";
	$result_it_v = $mysqli->query($sql_it_v);
	if ($mysqli->error) {
	echo "Error chapter_versions: " . $mysqli->error;
	}

	$sql_it_h = "INSERT INTO chapter_histories (chapter_history_id, chapter_version_id, chapter_bro_id, title, appeared_at, disappeared_at)
	VALUES ('$chapter_history_id', '$chapter_version_id', '$parent_id', '$brother_id', '$node_id', 0, '$content', '$type', '$timestamp', NULL)";
	$result_it_h = $mysqli->query($sql_it_h);
	if ($mysqli->error) {
	echo "Error chapter_histories: " . $mysqli->error;
	}

?>