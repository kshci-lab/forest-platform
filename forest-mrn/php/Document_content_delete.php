<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  //タイムゾーンの設定
  date_default_timezone_set('Asia/Tokyo');

    $user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
    $item_content_id = $_POST["id"]; //コンテントID
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

		$sql_item_content = "UPDATE item_contents SET updated_at='$timestamp', deleted=1 WHERE item_content_id='$item_content_id' AND deleted = 0";
    $result = $mysqli->query($sql_item_content);
      //クエリ($sql)のエラー処理
      if ($mysqli->error) {
      echo "Error item_contents: " . $mysqli->error;
    }

    $sql_item_content_v = "UPDATE item_content_versions SET disappeared_at='$timestamp' WHERE item_content_id='$item_content_id' AND disappeared_at IS NULL";
    $result = $mysqli->query($sql_item_content_v);
      //クエリ($sql)のエラー処理
      if ($mysqli->error) {
      echo "Error item_content_versions: " . $mysqli->error;
    }

    $sql_item_content_h = "UPDATE item_content_histories SET disappeared_at='$timestamp' WHERE item_content_version_id = (SELECT item_content_version_id FROM item_content_versions WHERE item_content_id='$item_content_id' order by appeared_at DESC LIMIT 1) AND disappeared_at IS NULL";
    $result = $mysqli->query($sql_item_content_h);
      //クエリ($sql)のエラー処理
      if ($mysqli->error) {
      echo "Error item_content_histories: " . $mysqli->error;
    }

    //=================================activityログ===================================//

    // $sql = "SELECT * FROM slide_content WHERE id = '$content_id'";

    // // $stmt = $mysqli->query($sql);

    // if($result = $mysqli->query($sql)) {
    //   while($row = mysqli_fetch_assoc($result)){//mysqli_fetch_assoc：連想配列として結果の行を取得
    //     echo $row['id'];
    //     $node_id = $row['node_id'];
    //     $concept_id = $row['concept_id'];
    //     $content = $row['content'];
    //     $slide_id = $row['slide_id'];
    //   }
    // }

    // $sql = "INSERT INTO slide_content_activity (id, map_id, slide_content_id, node_id, concept_id, content, type, user_id, slide_id, act, date, from_slide_content)
		// VALUES ('$activity_id', '$map_id', '$content_id', '$node_id', '$concept_id', '$content', NULL, '$user_id', '$slide_id', 'delete', '$timestamp', NULL)";

		// $result = $mysqli->query($sql);


		// $json_test = json_encode($content);


?>
