<?php

	session_start();

	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');

	$user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
	$purpose = $_POST['purpose'];  //テキストの合体(union)，ネットワークに移動したとき(network_on)
	$areaid = $_POST['areaid'];   //(ネットワークに移動したor合体によって残るされる)エリアID
	$delete_areaid = $_POST['delete_id']; //合体によって削除されるエリアID
	$content = $_POST['content'];  //合体させる場合の合体後の発言内容

	$result_struct_start_time = $mysqli->query("SELECT MAX(start_time) FROM network_maps WHERE user_id = $user_id AND map_id = $map_id ORDER BY start_time DESC");
	$row = $result_struct_start_time->fetch_assoc();
    $struct_start_time = $row['MAX(start_time)'];
	if($purpose === 'network_on'){
		//ネットワークに移動したときの処理
		$mysqli->query("UPDATE network_texts SET network_on = '1' WHERE user_id = '$user_id' AND map_id = '$map_id' AND ST_Time = '$struct_start_time' AND area_id = '$areaid'");
	}else if($purpose === 'union'){
		//合体したときの処理
		$mysqli->query("UPDATE network_texts SET content = '$content' WHERE user_id = '$user_id' AND map_id = '$map_id' AND ST_Time = '$struct_start_time' AND area_id = '$areaid'");
		$mysqli->query("DELETE FROM network_texts WHERE user_id = '$user_id' AND map_id = '$map_id' AND ST_Time = '$struct_start_time' AND area_id = '$delete_areaid'");
	}
?>
