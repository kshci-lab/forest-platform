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

    $sql = "UPDATE slide_content SET updated_at='$timestamp', deleted=1 WHERE id='$content_id'";


		$result = $mysqli->query($sql);

    //クエリ($sql)のエラー処理
    if($sql == TRUE){
			echo "true";
			error_log('$sql成功しています！'.$timestamp, 0);
		}else if($sql == FALSE){
			error_log($sql.'$sql失敗です', 0);
			// error_log('失敗しました。'.mysqli_error($link), 0);
		}else{
			error_log('$sql不明なエラーです', 0);
		}

    //php($result)のエラー処理
    if($result == TRUE){
			echo "true";
			error_log('$result成功しています！'.$timestamp, 0);
		}else if($result == FALSE){
			error_log($result.'$result失敗です'.$mysqli->error, 0);
			// error_log('失敗しました。'.mysqli_error($link), 0);
		}else{
			error_log('$result不明なエラーです', 0);
		}

    //=================================activityログ===================================//

    $sql = "SELECT * FROM slide_content WHERE id = '$content_id'";

    // $stmt = $mysqli->query($sql);

    if($result = $mysqli->query($sql)) {
      while($row = mysqli_fetch_assoc($result)){//mysqli_fetch_assoc：連想配列として結果の行を取得
        echo $row['id'];
        $node_id = $row['node_id'];
        $concept_id = $row['concept_id'];
        $content = $row['content'];
        $slide_id = $row['slide_id'];
      }
    }

    $sql = "INSERT INTO slide_content_activity (id, map_id, slide_content_id, node_id, concept_id, content, type, user_id, slide_id, act, date, from_slide_content)
		VALUES ('$activity_id', '$map_id', '$content_id', '$node_id', '$concept_id', '$content', NULL, '$user_id', '$slide_id', 'delete', '$timestamp', NULL)";

		$result = $mysqli->query($sql);


		$json_test = json_encode($content);


?>
