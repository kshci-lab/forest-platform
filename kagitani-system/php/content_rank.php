<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

	//タイムゾーンの設定
	date_default_timezone_set('Asia/Tokyo');


		// $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);//日時をマイクロ秒まで取得するようにしてみる
		$user_id = $_SESSION['USERID'];      //ユーザID
		$map_id = $_SESSION['MAPID'];    //シートID
		$item_content_history_id = $_POST["id"];             //ID
		$item_content_id = $_POST["content_id"];            //コンテントID
		$brother_id = $_POST["brother_id"];            //順番
		$item_id = $_POST["slide_id"];     //スライドID
		$content = $_POST["content"];     //コンテンツの中身
		$node_id = $_POST["node_id"];     //ノードID
		$type = $_POST["type"];     //タイプ
		$indent = $_POST["indent"];     //インデント情報
		$concept_id = $_POST["concept_id"];     //コンセプトID


		$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
		// item_latest テーブルから一致するタプルを取得
		$sql_check = "SELECT item_content_bro_id, indent FROM item_content_latest WHERE item_content_id = '$item_content_id'";
		$result_check = $mysqli->query($sql_check);

	if ($result_check) {
		$row = $result_check->fetch_assoc();
			
		// brother_id と indent が不一致の場合のみ更新処理を実行
		if ($row && ($row['item_content_bro_id'] !== $brother_id) || $row && ($row['indent'] !== $indent)) {
			
			$sql_new_1 = "CREATE TEMPORARY TABLE tmp_item_content_histories AS SELECT * FROM item_content_histories WHERE item_content_history_id = (SELECT item_content_history_id FROM item_content_latest WHERE item_content_id = '$item_content_id');";
			$sql_update = "UPDATE item_content_histories SET disappeared_at = '$timestamp' WHERE item_content_history_id = (SELECT item_content_history_id FROM tmp_item_content_histories);";
			$sql_new_2 = "UPDATE tmp_item_content_histories set item_content_history_id = '$item_content_history_id', indent = '$indent', item_content_bro_id = '$brother_id',appeared_at = '$timestamp', disappeared_at = NULL;";
			$sql_new_3 = "INSERT INTO item_content_histories SELECT * FROM tmp_item_content_histories;";
			$sql_i_update = "UPDATE item_contents set updated_at = '$timestamp' WHERE item_content_id = '$item_content_id';";

			// TEMPORARY TABLEを削除
			$sql_drop = "DROP TEMPORARY TABLE IF EXISTS tmp_item_content_histories;";

			$result_new_1 = $mysqli->query($sql_new_1);
			if ($mysqli->error) {
				echo "Error creating temporary table: " . $mysqli->error;
			}
			$result_update = $mysqli->query($sql_update);
			if ($mysqli->error) {
				echo "Error item_content_his update: " . $mysqli->error;
			}
			$result_new_2 = $mysqli->query($sql_new_2);
			if ($mysqli->error) {
				echo "Error tmp_item_content_his update: " . $mysqli->error;
			}
			$result_new_3 = $mysqli->query($sql_new_3);
			if ($mysqli->error) {
				echo "Error item_content_his insert: " . $mysqli->error;
			}
			$result_i_update = $mysqli->query($sql_i_update);
			if ($mysqli->error) {
				echo "Error item_contents update: " . $mysqli->error;
			}
			$result_drop = $mysqli->query($sql_drop);
			if ($mysqli->error) {
				echo "Error drop temporary table: " . $mysqli->error;
			}
		}
	}
?>
