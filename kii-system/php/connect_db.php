<?php

//   各々のローカル
	$db_host = "10.240.187.201";  // ホスト名のみ
	$db_port = 8889;  // ポート番号
	$db_user = "root";
	$db_password = "your_password";
	$db_dbname = "jiko-chouseisan-kojilab";
	
	// 実験データ参照用
	// $db_host = "localhost:8889";  // DBサーバのurl
	// $db_user = "root";
	// $db_password = "root";
	// $db_dbname = "FCR-Experiment-Phase1";

	//アプリケーションサーバーにアップロードするとき．
	// $db_host = "localhost";  // DBサーバのurl
	// $db_port = 3306;
	// $db_user = "root";
	// $db_password = "kslabkslab";
	// $db_dbname = "jiko-chouseisan-kojilab";

	// 　統合環境1
	// $db_host = "192.168.0.82:3306";  // DBサーバのurl
	// $db_user = "root";
	// $db_password = "kslabkslab";
	// $db_dbname = "nishida2";

	// mysqlへの接続
	$mysqli = new mysqli($db_host, $db_user, $db_password, $db_dbname, $db_port);
	if ($mysqli->connect_error) {
	  print('<p>データベースへの接続に失敗しました。</p>' . $mysqli->connect_error);
	  exit();
	} else {
    $mysqli->set_charset("utf8");
	}

?>
