<?php

session_start();
require("connect_db.php");

$map_id = $_SESSION["MAPID"];


$sql = "SELECT chapter_id, title, rank FROM chapter WHERE map_id='$map_id' AND deleted = 0";

$cdata = array();

if($result = $mysqli->query($sql)){

  while($row = mysqli_fetch_assoc($result)){
		$cdata[] = array(
			'id' => $row["chapter_id"],
			'title'=> $row["title"],
			'rank' => $row["rank"],
		);
	}
}

	//php($sql)のエラー処理
	if($sql == TRUE){
		error_log('$sql:chapter_rebuild成功', 0);
	}else if($sql == FALSE){
		error_log($sql.'$sql:chapter_rebuild失敗', 0);
	}else{
		error_log('$sql:chapter_rebuild不明なエラー', 0);
	}
	
	//php($result)のエラー処理
	if($result == TRUE){
		error_log('$result:chapter_rebuild成功', 0);
	}else if($result == FALSE){
		error_log($result.'$result:chapter_rebuild失敗'.$mysqli->error, 0);
	}else{
		error_log('$result:chapter_rebuild不明なエラー', 0);
	}

echo json_encode($cdata);

?>