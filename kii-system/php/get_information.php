<?php
session_start();
require("connect_db.php");

$node_id =  $_POST["id"];
$want_info = $_POST["want"];

//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');

//指定した情報を取得するSQLクエリ
$sql = "SELECT  $want_info  FROM node_latest
        where node_id = '$node_id' limit 1";

        $i = 0;
    		$get_array = array();

    		if($result = $mysqli->query($sql)){

    			while($row = mysqli_fetch_assoc($result)){

    				$get_array = $get_array + array($i=>$row[$want_info]);

    				$i += 1;

    			}
        }

echo json_encode($get_array);


?>
