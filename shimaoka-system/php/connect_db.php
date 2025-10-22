<?php

	
	$db_host = "localhost";  // ホスト名のみ
	$db_port = 8889;  // ポート番号
	$db_user = "root";
	$db_password = "root";
	$db_dbname = "forest_platform";


	// mysqlへの接続
	$mysqli = new mysqli($db_host, $db_user, $db_password, $db_dbname, $db_port);
	if ($mysqli->connect_error) {
	  print('<p>データベースへの接続に失敗しました。</p>' . $mysqli->connect_error);
	  exit();
	} else {
    $mysqli->set_charset("utf8");
	}

?>