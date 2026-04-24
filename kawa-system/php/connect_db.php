<?php

/*
// //   各々のローカル
// 	$db_host = "localhost";  // DBサーバのurl
// 	$db_user = "root";
// 	$db_password = "root";
// 	$db_dbname = "nishida_seta";
	*/

	// $db_host = "localhost";  // DBサーバのurl
	// $db_user = "root";
	// $db_password = "root";
	// $db_dbname = "forest_platform_past";
	// $db_port = 8889;

	// 　統合環境1
	$db_host = "localhost";  // DBサーバのurl
	$db_user = "root";
	$db_password = "kslabkslab";
	$db_dbname = "forest_platform_past";
	$db_port = 3306;

	// mysqlへの接続
	$mysqli = new mysqli($db_host, $db_user, $db_password, $db_dbname, $db_port);
	if ($mysqli->connect_error) {
	  print('<p>データベースへの接続に失敗しました。</p>' . $mysqli->connect_error);
	  exit();
	} else {
    $mysqli->set_charset("utf8");
	}

?>
