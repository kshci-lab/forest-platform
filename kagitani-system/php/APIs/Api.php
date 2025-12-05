<?php

// DB access
$db_host = "localhost:8889";  // DBサーバのurl
$db_user = "root";
$db_password = "root";
$db_dbname = "shimizu";

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
$map_id = $_GET["map_id"];
// $node_id = $_GET["node_id"];

// $sql = "SELECT * FROM nodes WHERE map_id='".$map_id."' and id='".$node_id."'";
$sql = "SELECT * FROM nodes WHERE node_id IN (SELECT node_id FROM map_node_links WHERE map_id = ".$id.") AND deleted = 0";
// $sql = "SELECT * FROM maps WHERE user_id = '".$user_id."'";

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