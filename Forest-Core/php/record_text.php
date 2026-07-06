<?php

session_start();

/*ノード情報をDBに格納する際に使用*/
require("connect_db.php");

// $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);//日時をマイクロ秒まで取得するようにしてみる

//ここ未完成（ノードにもっと情報追加しないといけないかも）
$user_id = $_SESSION['USERID'];      //ユーザID
$map_id = $_SESSION['MAPID'];    //シートID
$sttime = $_POST["sttime"]; 
$jsonDataArray = json_decode($_POST['jsonData'], true);

foreach ($jsonDataArray as $jsonData) {
    $id = $mysqli->real_escape_string($jsonData['id']);
    $content = $mysqli->real_escape_string($jsonData['content']);
	$sender = $mysqli->real_escape_string($jsonData['sender']);
    $time = $mysqli->real_escape_string($jsonData['time']);
	$JPNtime = $mysqli->real_escape_string($jsonData['JPNtime']);
    
    $query = "INSERT INTO network_texts (user_id, map_id, area_id, sender, content, time, JPNtime, ST_Time) 
	VALUES ($user_id, $map_id, $id, '$sender', '$content', $time, '$JPNtime', '$sttime')";
    
    if ($mysqli->query($query) !== TRUE) {
        // 失敗時の処理
        $response = ["error" => $mysqli->error];
        break; // 失敗したらループを抜ける
    }
}

?>