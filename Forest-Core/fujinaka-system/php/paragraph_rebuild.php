<?php

session_start();
require("connect_db.php");

$map_id = $_SESSION["MAPID"];


$sql = "SELECT paragraph_id, section_id, title, rank, content FROM paragraph WHERE map_id='$map_id' AND deleted = 0";

$sdata = array();

if($result = $mysqli->query($sql)){

  while($row = mysqli_fetch_assoc($result)){
    $sdata[] = array(
    'id'=> $row["paragraph_id"],
    'section_id' => $row["section_id"],
    'title' => $row["title"],
    'rank'=> $row["rank"],
    'content' => $row["content"]);
  }
}

	//php($sql)のエラー処理
	if($sql == TRUE){
		error_log('$sql:paragraph_rebuild成功', 0);
	}else if($sql == FALSE){
		error_log($sql.'$sql:paragraph_rebuild失敗', 0);
	}else{
		error_log('$sql:paragraph_rebuild不明なエラー', 0);
	}
	
	//php($result)のエラー処理
	if($result == TRUE){
		error_log('$result:paragraph_rebuild成功', 0);
	}else if($result == FALSE){
		error_log($result.'$result:paragraph_rebuild失敗'.$mysqli->error, 0);
	}else{
		error_log('$result:paragraph_rebuild不明なエラー', 0);
	}

echo json_encode($sdata);

?>