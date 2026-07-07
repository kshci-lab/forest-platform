<?php //kii-fujinaka変更　type, parent_id を""にしてます．nodeid => commentidに

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');
	$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
	$map_id = $_SESSION['MAPID'];    //シートID
	$user_id = $_SESSION['USERID'];      //ユーザID
	
	$add_to_comment_id = $_POST["id"]; 
	$type = $_POST["type"];
	$comment_id = $_POST["comment_id"];
    $version_id = $_POST["version_id"];
	
	$sql = "INSERT INTO add_to_comment (id, type, created_at, map_id, user_id, comment_id , version_id)
	VALUES ('$add_to_comment_id', '$type','$timestamp', '$map_id', '$user_id', '$comment_id', '$version_id')";

	$result = $mysqli->query($sql);

?>