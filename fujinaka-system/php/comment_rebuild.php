<?php

session_start();
require("connect_db.php");

$map_id = $_SESSION["MAPID"];


$sql = "SELECT comment_id, version_id, user_name, content FROM comment WHERE map_id='$map_id' AND comment_status != 0 ORDER BY created_at ASC"; //0がdelete

$cdata = array();

if($result = $mysqli->query($sql)){

  while($row = mysqli_fetch_assoc($result)){
		$cdata[] = array(
		'id'=> $row["comment_id"],
		'version_id'=> $row["version_id"],
		'user_name'=> $row["user_name"],
		'content' => $row["content"]
		);
  }
}

	//php($sql)のエラー処理
	if($sql == TRUE){
		error_log('$sql:comment_rebuild成功', 0);
	}else if($sql == FALSE){
		error_log($sql.'$sql:comment_rebuild失敗', 0);
	}else{
		error_log('$sql:comment_rebuild不明なエラー', 0);
	}
	
	//php($result)のエラー処理
	if($result == TRUE){
		error_log('$result:comment_rebuild成功', 0);
	}else if($result == FALSE){
		error_log($result.'$result:comment_rebuild失敗'.$mysqli->error, 0);
	}else{
		error_log('$result:comment_rebuild不明なエラー', 0);
	}

echo json_encode($cdata);

?>