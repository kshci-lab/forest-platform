<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  //タイムゾーンの設定
  date_default_timezone_set('Asia/Tokyo');

    $user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
    $item_id = $_POST["id"]; //スライドID
    $title = $_POST["content"]; //スライドタイトル
    $item_history_id = uniqid();
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

    $sql = "SELECT title FROM item_latest WHERE item_id = '$item_id'";
    if($result = $mysqli->query($sql)) {
      while($row = mysqli_fetch_assoc($result)){
        $pre_title = $row['title'];
      }
    }
    // file_put_contents("error_log.txt", $pre_title);
    // file_put_contents("error_log.txt", $title);

    if($title != $pre_title){


  		$sql_new_1 = "CREATE TEMPORARY TABLE tmp_item_histories AS SELECT * FROM item_histories WHERE item_history_id = (SELECT item_history_id FROM item_latest WHERE item_id = '$item_id');";
      $sql_update = "UPDATE item_histories SET disappeared_at = '$timestamp' WHERE item_history_id = (SELECT item_history_id FROM tmp_item_histories);";
      $sql_new_2 = "UPDATE tmp_item_histories set item_history_id = '$item_history_id', title = '$title', appeared_at = '$timestamp', disappeared_at = NULL;";
      $sql_new_3 = "INSERT INTO item_histories SELECT * FROM tmp_item_histories;";
  		$sql_i_update = "UPDATE items set updated_at = '$timestamp' WHERE item_id = '$item_id';";

      // TEMPORARY TABLEを削除
      $sql_drop = "DROP TEMPORARY TABLE IF EXISTS tmp_item_histories;";

      $result_new_1 = $mysqli->query($sql_new_1);
      if ($mysqli->error) {
        echo "Error creating temporary table: " . $mysqli->error;
      }
      $result_update = $mysqli->query($sql_update);
      if ($mysqli->error) {
        echo "Error item_his update: " . $mysqli->error;
      }
      $result_new_2 = $mysqli->query($sql_new_2);
      if ($mysqli->error) {
        echo "Error tmp_item_his update: " . $mysqli->error;
      }
      $result_new_3 = $mysqli->query($sql_new_3);
      if ($mysqli->error) {
        echo "Error item_his insert: " . $mysqli->error;
      }
      $result_i_update = $mysqli->query($sql_i_update);
      if ($mysqli->error) {
        echo "Error items update: " . $mysqli->error;
      }
      $result_drop = $mysqli->query($sql_drop);
      if ($mysqli->error) {
        echo "Error drop temporary table: " . $mysqli->error;
      }

      //=================================activityログ===================================//

  		// $sql = "INSERT INTO slide_activity (id, map_id, slide_id, slide_title, user_id, act, date, from_slide)
  		// VALUES ('$activity_id', '$map_id', '$item_id', '$title', '$user_id', 'edit', '$timestamp', '$map_id')";

  		// $result = $mysqli->query($sql);
    }
?>
