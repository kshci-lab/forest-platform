<?php

session_start();
require("connect_db.php");

date_default_timezone_set('Asia/Tokyo');


$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
$user_id = $_SESSION['USERID'];      //ユーザID
$map_id = $_SESSION['MAPID'];    //シートID
$id = $_POST['id'];             //ID
$final_advice = $_POST['final_advice'];    //議論の準備性を高める助言のhtml


$sql = "INSERT INTO final_advice_log (id, final_advice, user_id, map_id, created_at)
VALUES ('$id', '$final_advice', '$user_id', '$map_id', '$timestamp')";
$result = $mysqli->query($sql);


?>
