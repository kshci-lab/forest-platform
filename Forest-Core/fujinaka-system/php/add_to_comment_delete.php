<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

	if($_POST["type"] == "id"){

        $id = $_POST["id"];

		$sql = "UPDATE add_to_comment SET deleted = 1 WHERE id = '$id'";

        $result = $mysqli->query($sql);


    }else if($_POST["type"] == "comment"){

        $comment_id = $_POST["comment_id"];

		$sql = "UPDATE add_to_comment SET deleted = 1 WHERE comment_id = '$comment_id'";

        $result = $mysqli->query($sql);


    }


?>