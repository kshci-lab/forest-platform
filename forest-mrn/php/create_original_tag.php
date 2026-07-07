<?php

require_once("connect_db.php");

session_start();

date_default_timezone_set('Asia/Tokyo');

$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);//日時をマイクロ秒まで取得するようにしてみる
$user_id = $_SESSION['USERID'];      //ユーザID
$map_id = $_SESSION['MAPID'];    //シートID

$tagid = rand();
$tagname = $_POST['tagname'];
$node_id = $_POST['node_id'];
$node_topic = $_POST['node_topic'];

$sql = "INSERT INTO original_tag (id, user_id, map_id, timestamp, tag_name, selected_node_id, selected_node_topic)
VALUES ('".$tagid."','".$user_id."','".$map_id."','".$timestamp."','".$tagname."','".$node_id."', '".$node_topic."') ";

$result = $mysqli->query($sql);

error_log('$timestamp', 0);

//クエリ($sql)のエラー処理
if($sql == TRUE){
  echo "true";
  error_log('$sql成功しています！', 0);
}else if($sql == FALSE){
  error_log($sql.'$sql失敗です', 0);
  // error_log('失敗しました。'.mysqli_error($link), 0);
}else{
  error_log('$sql不明なエラーです', 0);
}

//php($result)のエラー処理
if($result == TRUE){
  echo "true";
  error_log('$result成功しています！', 0);
}else if($result == FALSE){
  error_log($result.'$result失敗です'.$mysqli->error, 0);
  // error_log('失敗しました。'.mysqli_error($link), 0);
}else{
  error_log('$result不明なエラーです', 0);
}

?>
