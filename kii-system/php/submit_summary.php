<?php
session_start();

/*ノード情報をDBに格納する際に使用*/
require("connect_db.php");
$map_id = $_SESSION["MAPID"];
$rq =$_POST["rq"];
$e1s =$_POST["e1Strong"];
$e1w =$_POST["e1Weak"];
$e2s =$_POST["e2Strong"];
$e2w =$_POST["e2Weak"];
$e3s =$_POST["e3Strong"];
$e3w =$_POST["e3Weak"];
$summary =$_POST["summary"];

$sql = "INSERT INTO summary (rq, e_1_strong, e_1_weak, e_2_strong, e_2_weak, e_3_strong, e_3_weak,summary, map_id) VALUES ('$rq', '$e1s', '$e1w', '$e2s', '$e2w', '$e3s', '$e3w', '$summary', $map_id)";
$result = $mysqli->query($sql);
echo $sql;


?>