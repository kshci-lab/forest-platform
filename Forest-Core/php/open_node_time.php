<?php
session_start();

require("connect_db.php");

$user_id = $_SESSION['USERID'];      //ユーザID
$map_id = $_SESSION['MAPID'];    //シートID
$mt_time = $_POST["mttime"]; 


$start_time_result = $mysqli->query("SELECT start_time FROM network_maps WHERE user_id = '$user_id' AND map_id = '$map_id' AND start_time < '$mt_time' AND end_time > '$mt_time'");
if (!$start_time_result || $start_time_result->num_rows == 0) {
    $start_time_result = $mysqli->query("SELECT start_time FROM network_maps WHERE user_id = '$user_id' AND map_id = '$map_id' AND situation = 'start'");
}

// クエリの結果を確認
if ($start_time_result) {
    // 複数の行がある場合、中断
    if ($start_time_result->num_rows > 1) {
        echo json_encode(["error" => "No matching records found."]);
        exit;
    }
    // 1行だけ取得
    $raw = $start_time_result->fetch_assoc();
    $st_time = $raw['start_time'];
    echo json_encode(["start_time" => $st_time]);
    } else {
      echo json_encode(["error" => "No matching records found."]);
}

?>
