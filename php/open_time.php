<?php
session_start();

require("connect_db.php");

$user_id = $_SESSION['USERID'];      //ユーザID
$map_id = $_SESSION['MAPID'];    //シートID
$type = $_POST['type'];

$result = $mysqli->query("SELECT start_time, end_time FROM network_maps
          WHERE user_id = '$user_id' AND map_id = '$map_id' AND situation = '$type'
          ORDER BY start_time DESC ");

$data = array();
while ($rowtext = $result->fetch_assoc()) {
    $data[] = $rowtext;
}

if (empty($data)) {
    echo json_encode(["error" => "not"]);
} else {
    echo json_encode($data);
}

?>
