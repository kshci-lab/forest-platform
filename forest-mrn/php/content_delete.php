<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  //タイムゾーンの設定
  date_default_timezone_set('Asia/Tokyo');

    $user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
    $content_id = $_POST["id"]; //コンテントID
    $activity_id = uniqid();
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);


    $sql_ic = "UPDATE item_contents SET updated_at='$timestamp', deleted=1 WHERE item_content_id='$content_id'";
    $sql_icv = "UPDATE item_content_versions SET disappeared_at='$timestamp' WHERE item_content_id='$content_id' AND disappeared_at IS NULL";
    $sql_ich = "UPDATE item_content_histories SET disappeared_at='$timestamp' WHERE item_content_version_id=(SELECT item_version_id FROM item_versions WHERE item_content_id = '$content_id' order BY appeared_at DESC LIMIT 1) AND disappeared_at IS NULL ";

    $result_ic = $mysqli->query($sql_ic);
		if($mysqli->error){
			echo "Error update item_contents: ". $mysqli->error;
		}
    $result_icv = $mysqli->query($sql_icv);
		if($mysqli->error){
			echo "Error update item_content_versions: ". $mysqli->error;
		}
    $result_ich = $mysqli->query($sql_ich);
		if($mysqli->error){
			echo "Error update item_content_hisotries: ". $mysqli->error;
		}

?>
