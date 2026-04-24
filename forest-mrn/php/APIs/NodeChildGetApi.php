<?php

// DB access
$db_host = "localhost:3306";  // DBサーバのurl
$db_user = "root";
$db_password = "root";
$db_dbname = "forest_platform_past";

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
$sheet_id = $_GET["sheet_id"];
$parent_id = $_GET["node_id"];
$deleted = 0;

// $sql = "SELECT * FROM nodes WHERE sheet_id='".$sheet_id."' and id='".$node_id."'";
// SELECT * FROM `nodes` WHERE `sheet_id`=259042975 AND `deleted` = 0 AND`parent_id`='4efeb528c0e4a631'
$sql = "SELECT * FROM nodes WHERE sheet_id='".$sheet_id."' AND parent_id='".$parent_id."' AND deleted='".$deleted."'";

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