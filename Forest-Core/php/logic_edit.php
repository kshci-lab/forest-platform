<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  //タイムゾーンの設定
  date_default_timezone_set('Asia/Tokyo');

    $user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
    $slide_id = $_POST["id"]; //スライドID
    $value_LogicID = $_POST["value"]; //スライドタイトル
    $activity_id = uniqid();
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

    $sql = "SELECT slide_title FROM slide WHERE id = '$slide_id'";
    if($result = $mysqli->query($sql)) {
      while($row = mysqli_fetch_assoc($result)){
        $pre_title = $row['slide_title'];
      }
    }

    $sql = "SELECT slide_title FROM slide WHERE id = '$slide_id'";
    if($result = $mysqli->query($sql)) {
      while($row = mysqli_fetch_assoc($result)){
        $pre_title = $row['slide_title'];
      }
    }
    // file_put_contents("error_log.txt", $pre_title);
    // file_put_contents("error_log.txt", $slide_title);

    // if($slide_title != $pre_title){

    //   $sql = "UPDATE slide SET updated_at='$timestamp', slide_title='$slide_title' WHERE id='$slide_id'";

  	// 	$result = $mysqli->query($sql);

    //   // //クエリ($sql)のエラー処理
    //   // if($sql == TRUE){
  	// 	// 	echo "true";
  	// 	// 	error_log('$sql成功しています！'.$timestamp, 0);
  	// 	// }else if($sql == FALSE){
  	// 	// 	error_log($sql.'$sql失敗です', 0);
  	// 	// 	// error_log('失敗しました。'.mysqli_error($link), 0);
  	// 	// }else{
  	// 	// 	error_log('$sql不明なエラーです', 0);
  	// 	// }

    //   // //php($result)のエラー処理
    //   // if($result == TRUE){
  	// 	// 	echo "true";
  	// 	// 	error_log('$result成功しています！'.$timestamp, 0);
  	// 	// }else if($result == FALSE){
  	// 	// 	error_log($result.'$result失敗です'.$mysqli->error, 0);
  	// 	// 	// error_log('失敗しました。'.mysqli_error($link), 0);
  	// 	// }else{
  	// 	// 	error_log('$result不明なエラーです', 0);
  	// 	// }

    // }
    //=================================activityログ===================================//

    $sql = "INSERT INTO single_logic_activity (id, map_id, content_id, user_id, act, LogicID, date, from_slide)
    VALUES ('$activity_id', '$map_id', '$slide_id', '$user_id', 'change', '$value_LogicID', '$timestamp', '$map_id')";

    $result = $mysqli->query($sql);
?>
