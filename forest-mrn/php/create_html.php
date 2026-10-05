<?php

session_start();
require("connect_db.php");

date_default_timezone_set('Asia/Tokyo');


$name = $_SESSION["USERNAME"]; // シート名
$timestamp = time();
$login_time = date("Y-m-d H:i:s", $timestamp);

$filename = "$name:$login_time";

// ２個上の階層にtxtファイルで出力
// error_log(var_export($html, true), 3, unique_filename("./../../$name.txt"));
// echo unique_filename("./$name.txt"); // ユニーク名を返す
echo("$filename.html");

?>
