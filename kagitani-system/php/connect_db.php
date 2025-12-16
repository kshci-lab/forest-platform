<?php


	$db_host = "localhost";  // DBサーバのurl
	$db_user = "root";
	$db_password = "root";
	$db_dbname = "forest_platform";
	$db_port = 8889;

	function try_mysqli_connect($host, $user, $pass, $db, $port = null) {
		if ($port !== null) {
			@$m = new mysqli($host, $user, $pass, $db, $port);
		} else {
			@$m = new mysqli($host, $user, $pass, $db);
		}
		if ($m && !$m->connect_error) {
			$m->set_charset("utf8");
			return $m;
		}
		return null;
	}

	// まず既定のポートで試す（8889）→ 3306 → デフォルト接続
	$mysqli = try_mysqli_connect($db_host, $db_user, $db_password, $db_dbname, $db_port);
	if (!$mysqli) {
		$mysqli = try_mysqli_connect($db_host, $db_user, $db_password, $db_dbname, 3306);
	}
	if (!$mysqli) {
		$mysqli = try_mysqli_connect($db_host, $db_user, $db_password, $db_dbname, null);
	}

	if (!$mysqli) {
		print('<p>データベースへの接続に失敗しました。MySQL サービスが起動しているか、ホスト/ポート設定を確認してください。</p>');
		exit();
	}

?>
