<?php
if (function_exists('mysqli_report')) {
	mysqli_report(MYSQLI_REPORT_OFF);
}

$db_dbname = "jiko-chouseisan-kojilab";

// 試行接続は警告を起こしうるため、環境判定で1セットだけ使う
$isProduction = false;
if (!empty($_SERVER['DOCUMENT_ROOT']) && strpos($_SERVER['DOCUMENT_ROOT'], '/home/ubuntu/') !== false) {
	$isProduction = true;
}
if (!empty($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'archive.kshci-lab.net') !== false) {
	$isProduction = true;
}

if ($isProduction) {
	$db_host = "localhost:3306";
	$db_user = "root";
	$db_password = "kslabkslab";
} else {
	$db_host = "localhost";
	$db_user = "root";
	$db_password = "root";
	$db_dbname = "forest_platform";
}

$mysqli = @new mysqli($db_host, $db_user, $db_password, $db_dbname);
$lastError = $mysqli ? $mysqli->connect_error : 'mysqli init failed';


// DB接続時のエラーをログに記録し、致命的エラー時もphp_error.logに詳細を残す
if (!$mysqli || $mysqli->connect_error) {
	print('<p>データベースへの接続に失敗しました。</p>' . $lastError);
	error_log('DB接続エラー: ' . $lastError . ' host=' . $db_host . ' user=' . $db_user);
	exit();
} else {
	if (!$mysqli->set_charset("utf8")) {
		error_log('文字コード設定失敗: ' . $mysqli->error);
	}
}

// 致命的エラー時もログに記録
set_exception_handler(function($e) {
	error_log('致命的エラー: ' . $e->getMessage() . ' in ' . $e->getFile() . ' line ' . $e->getLine());
	http_response_code(500);
	echo json_encode(['success' => false, 'error' => 'サーバーエラー']);
	exit;
});

?>
