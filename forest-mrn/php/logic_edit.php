<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  //タイムゾーンの設定
  date_default_timezone_set('Asia/Tokyo');

    $user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
    $purpose = $_POST["purpose"];
    $id = $_POST["id"]; //item_idかitem_content_id
    $value_LogicID = $_POST["value"]; //スライドタイトル
    $history_id = uniqid();
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);


    if($purpose === "item"){

      $sql = "SELECT logic_option FROM item_latest WHERE item_id = '$id' ";
      if ($mysqli->error) {
        echo "Error item logic_option select: " . $mysqli->error;
      }else if($result = $mysqli->query($sql)) {
        while($row = mysqli_fetch_assoc($result)){
          $pre_LogicID = $row['logic_option'];
        }
      }

      if($value_LogicID != $pre_LogicID){

        // TEMPORARY TABLEを用いてitem_historiesから必要箇所のみ変更し，新しいタプルとして挿入
        // 挿入順を変えるとappeared_at，disappeared_atが狂うので注意
        $sql_new_1 = "CREATE TEMPORARY TABLE tmp_item_histories AS SELECT * FROM item_histories 
            WHERE item_history_id = (SELECT item_history_id FROM item_latest WHERE item_id = '$id');";
        $sql_update = "UPDATE item_histories SET disappeared_at = '$timestamp' WHERE item_history_id = (SELECT item_history_id FROM tmp_item_histories);";
        $sql_new_2 = "UPDATE tmp_item_histories SET item_history_id = '$history_id', logic_option = '$value_LogicID', appeared_at = '$timestamp', disappeared_at = NULL;";
        $sql_new_3 = "INSERT INTO item_histories SELECT * FROM tmp_item_histories;";
        $sql_i_update = "UPDATE items set updated_at = '$timestamp' WHERE item_id = '$id';";

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

      }
      
    }else if($purpose === "item_content"){

      $sql = "SELECT logic_option FROM item_content_latest WHERE item_content_id = '$id' ";
      if ($mysqli->error) {
        echo "Error item_content logic_option select: " . $mysqli->error;
      }else if($result = $mysqli->query($sql)) {
        while($row = mysqli_fetch_assoc($result)){
          $pre_LogicID = $row['logic_option'];
        }
      }

      if($value_LogicID != $pre_LogicID){

        // TEMPORARY TABLEを用いてitem_content_historiesから必要箇所のみ変更し，新しいタプルとして挿入
        // 挿入順を変えるとappeared_at，disappeared_atが狂うので注意
        $sql_new_1 = "CREATE TEMPORARY TABLE tmp_item_content_histories AS SELECT * FROM item_content_histories 
            WHERE item_content_history_id = (SELECT item_content_history_id FROM item_content_latest WHERE item_content_id = '$id');";
        $sql_update = "UPDATE item_content_histories SET disappeared_at = '$timestamp' WHERE item_content_history_id = (SELECT item_content_history_id FROM tmp_item_content_histories);";
        $sql_new_2 = "UPDATE tmp_item_content_histories SET item_content_history_id = '$history_id', logic_option = '$value_LogicID', appeared_at = '$timestamp', disappeared_at = NULL;";
        $sql_new_3 = "INSERT INTO item_content_histories SELECT * FROM tmp_item_content_histories;";
        $sql_i_update = "UPDATE item_contents set updated_at = '$timestamp' WHERE item_content_id = '$id';";

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
          echo "Error items update: " . $mysqli->error;
        }
        $result_drop = $mysqli->query($sql_drop);
        if ($mysqli->error) {
          echo "Error drop temporary table: " . $mysqli->error;
        }

      }

    }

    
?>
