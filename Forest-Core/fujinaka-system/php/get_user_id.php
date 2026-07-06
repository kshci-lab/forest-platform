<?php

	session_start();

	$user_id = $_SESSION['USERID'];     //ユーザID

    echo json_encode($user_id);

?>