<?php

	
	// $db_host = "10.240.187.*";  // DBサーバのurl
	// $db_port = 8889;  // ポート番号
	// $db_user = "root";
	// $db_password = "your_password";
	// $db_dbname = "forest_platform";


	$db_host = "localhost";  // DBサーバのurl
	$db_user = "root";
	$db_password = "root";
	$db_dbname = "forest_platform";


	//アプリケーションサーバーにアップロードするとき．
	// $db_host = "localhost:3306";  // DBサーバのurl
	// $db_user = "root";
	// $db_password = "kslabkslab";
	// $db_dbname = "shimizu";

	// mysqlへの接続
	// $mysqli = new mysqli($db_host, $db_user, $db_password, $db_dbname,$db_port);
	// if ($mysqli->connect_error) {
	//   print('<p>データベースへの接続に失敗しました。</p>' . $mysqli->connect_error);
	//   exit();
	// } else {
    // 	$mysqli->set_charset("utf8");
	// }

	$mysqli = new mysqli($db_host, $db_user, $db_password, $db_dbname);
	if ($mysqli->connect_error) {
	  print('<p>データベースへの接続に失敗しました。</p>' . $mysqli->connect_error);
	  exit();
	} else {
    	$mysqli->set_charset("utf8");
	}


	
?>
