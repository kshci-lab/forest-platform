<?php

	session_start();

	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');

	// $updated_at = date("Y-m-d H:i:s");
	$deleted = 1;

	$sql = "UPDATE paper_annotations SET deleted = '".$deleted."' WHERE id = '".$_POST['id']."'";
	$result = $mysqli->query($sql);

	if (!$result) {
		print('Error - SQLSTATE');
		exit();
	}

?>
