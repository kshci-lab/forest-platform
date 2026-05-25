<?php
session_start();

require("connect_db.php");

$user_id = $_SESSION['USERID'];      //ユーザID
$map_id = $_SESSION['MAPID'];    //シートID
$st_time = $_POST["time"]; 

$result = $mysqli->query("SELECT sender, content, network_on, time, JPNtime FROM network_texts
          WHERE network_map_id IN (SELECT network_map_id FROm network_maps WHERE map_id = '$map_id') AND ST_Time = '$st_time'
          ORDER BY ST_Time DESC ");

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
