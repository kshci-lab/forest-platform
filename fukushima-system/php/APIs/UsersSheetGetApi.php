<?php

// DB access
$db_host = "localhost:8889";  // DBサーバのurl
$db_user = "root";
$db_password = "root";
$db_dbname = "forest_platform";

// mysqlへの接続
$mysqli = new mysqli($db_host, $db_user, $db_password, $db_dbname);
if ($mysqli->connect_error) {
  print('<p>データベースへの接続に失敗しました。</p>' . $mysqli->connect_error);
  exit();
} else {
  $mysqli->set_charset("utf8");
}

// params
$request_param = $_GET["request"];
$user_id = $_GET["user_id"];
// $node_id = $_GET["node_id"];

// $sql = "SELECT * FROM nodes WHERE map_id='".$map_id."' and id='".$node_id."'";
// $sql = "SELECT * FROM nodes WHERE map_id='".$map_id."'";
$sql = "SELECT * FROM map_mode_link WHERE user_id = '".$user_id."' AND mode_id =1 ";

$data = array();
if($result = $mysqli->query($sql)){ 
  while($row = mysqli_fetch_assoc($result)){
    array_push($data, $row);
  }
}


if($request_param === "content") {
  echo $data[0][$request_param];
} else {
  header("Access-Control-Allow-Origin: *");
  header("Content-Type: application/json; charset=utf-8");

  $json=json_encode($data, JSON_UNESCAPED_UNICODE);
  echo $json;
}

?>