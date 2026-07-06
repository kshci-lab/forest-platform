<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  	$comment_id = $_POST["comment_id"]; //コメントID

	$sql = "UPDATE comment SET comment_status = '0' WHERE comment_id = '".$comment_id."'";
	$result = $mysqli->query($sql);

	if (!$result) {
		print('Error - SQLSTATE');
		exit();
	}
?>