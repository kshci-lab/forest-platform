<?php
session_start();

require("connect_db.php");

$user_id = $_SESSION['USERID'];      //ユーザID
$map_id = $_SESSION['MAPID'];    //シートID
$st_time = $_POST["st_time"];
$en_time = $_POST["en_time"]; 

$result = $mysqli->query("SELECT node_id, label, node_x, node_y, color, shape FROM network_nodes
          WHERE user_id = '$user_id' AND map_id = '$map_id' AND updated_at > '$st_time' AND updated_at < '$en_time'
          ORDER BY updated_at DESC ");

$data = array();
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

if (empty($data)) {
    echo json_encode(["error" => "not"]);
} else {
    echo json_encode($data);
}

?>
