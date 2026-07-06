<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  //タイムゾーンの設定
  date_default_timezone_set('Asia/Tokyo');

    $user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
    $presentation_title = $_POST["title"]; //プレゼン自体のタイトル
    $activity_id = uniqid();
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

    // $sql = "SELECT presentation_title FROM presentation_title WHERE edit_time = (select max(edit_time) from presentation_title)";
    // if($result = $mysqli->query($sql)) {
    //   while($row = mysqli_fetch_assoc($result)){
    //     $pre_title = $row['presentation_title'];
    //   }
    // }
    // file_put_contents("error_log.txt", $pre_title);
    // file_put_contents("error_log.txt", $slide_title);


    // if($presentation_title != $pre_title){

      $sql = "INSERT INTO presentation_title (id, presentation_title, user_id, map_id, edit_time)
  		VALUES ('$activity_id', '$presentation_title', '$user_id', '$map_id', '$timestamp')";


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
  			error_log('$result成功しています！'.$timestamp, "3", "error_log.txt");
  		}else if($result == FALSE){
  			error_log($result.'$result失敗です'.$mysqli->error, "3", "error_log.txt");
  			// error_log('失敗しました。'.mysqli_error($link), 0);
  		}else{
  			error_log('$result不明なエラーです', 0);
  		}

    // }
?>
