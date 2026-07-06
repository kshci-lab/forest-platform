<?php

//指定した日時だけ取得・マッチングするバージョン
session_start();
require("connect_db.php");

//$user_id = $_SESSION["USERID"];//"26943"; //
// $user_id = $_GET["USER_ID"];//"26943"; //


//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');
$today_date = date("Y-m-d");
$map_id = $_SESSION['MAPID'];    //シートID
$paper_id_sql = "SELECT paper_id FROM maps WHERE map_id=$map_id ";

$result_paper_id = $mysqli->query($paper_id_sql);
$data_paper_id = mysqli_fetch_assoc($result_paper_id);
$_SESSION['PAPERID'] = $data_paper_id['paper_id'];
$paper_id = $_SESSION['PAPERID'] ;
// echo (int) $data_paper_id['paper_id'];


$sql = "SELECT paper_content FROM papers WHERE id=$paper_id"; /* and user_id=${user_id} */
// if($result = $mysqli->query($sql)){
//   $data = mysqli_fetch_assoc($result)

// }
$result = $mysqli->query($sql);
// $result = mysqli_query($mysqli,$sql);
$data = mysqli_fetch_assoc($result);

echo $data['paper_content'];

			
            




?>
