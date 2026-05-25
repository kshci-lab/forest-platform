<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  //タイムゾーンの設定
  date_default_timezone_set('Asia/Tokyo');

    $user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
    $item_content_id = $_POST["id"];       //contentID
    $content = $_POST["content"]; //content
    $node_id = $_POST["node_id"];       //contentID
    $item_content_history_id = uniqid();
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

    $sql = "SELECT * FROM item_content_latest WHERE item_content_id = '$item_content_id'";
    if($result = $mysqli->query($sql)) {
      while($row = mysqli_fetch_assoc($result)){
        $node_id = $row['node_id'];
        $slide_id = $row['item_id'];
        $pre_content = $row['title'];
      }
    }

    if($content != $pre_content){
  		
      $sql_new_1 = "CREATE TEMPORARY TABLE tmp_item_content_histories AS SELECT * FROM item_content_histories WHERE item_content_history_id = (SELECT item_content_history_id FROM item_content_latest WHERE item_content_id = '$item_content_id');";
      $sql_update = "UPDATE item_content_histories SET disappeared_at = '$timestamp' WHERE item_content_history_id = (SELECT item_content_history_id FROM tmp_item_content_histories);";
      $sql_new_2 = "UPDATE tmp_item_content_histories set item_content_history_id = '$item_content_history_id', title = '$content', node_id = '$node_id', appeared_at = '$timestamp', disappeared_at = NULL;";
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

      //=================================activityログ===================================//

      // $sql = "INSERT INTO slide_content_activity (id, map_id, slide_content_id, node_id, concept_id, content, type, user_id, slide_id, act, date, from_slide_content)
  		// VALUES ('$activity_id', '$map_id', '$item_content_id', '$node_id', '$concept_id', '$content', NULL, '$user_id', '$slide_id', 'edit', '$timestamp', NULL)";

  		// $result = $mysqli->query($sql);
    }

?>
