<?php
session_start();

require("connect_db.php");

$user_id = $_SESSION['USERID'];      //ユーザID
$map_id = $_SESSION['MAPID'];    //シートID
$st_time = $_POST["st_time"];
$en_time = $_POST["en_time"]; 

$result = $mysqli->query("SELECT network_node_id, mindmap_node_id FROM network_mindmap_connects
          WHERE user_id = '$user_id' AND map_id = '$map_id' AND time > '$st_time' AND time < '$en_time'
          ORDER BY time DESC ");

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
