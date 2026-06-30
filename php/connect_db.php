<?php

if (function_exists('mysqli_report')) {
    mysqli_report(MYSQLI_REPORT_OFF);
}

$db_dbname = "forest_platform";
if (!empty($_SERVER['REQUEST_URI'])) {
    if (strpos($_SERVER['REQUEST_URI'], '/software/jiko-chouseisan-kojilab') !== false) {
        $db_dbname = "jiko-chouseisan-kojilab";
    } elseif (strpos($_SERVER['REQUEST_URI'], '/software/jiko-chouseisan') !== false) {
        $db_dbname = "forest_platform";
    }
}

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
}

$mysqli = @new mysqli($db_host, $db_user, $db_password, $db_dbname);
$lastError = $mysqli ? $mysqli->connect_error : 'mysqli init failed';

if (!$mysqli || $mysqli->connect_error) {
    print('<p>データベースへの接続に失敗しました。</p>' . $lastError);
    error_log('DB接続失敗 host=' . $db_host . ' user=' . $db_user . ' error=' . $lastError);
    exit();
}

if (!$mysqli->set_charset("utf8")) {
    error_log('文字コード設定失敗: ' . $mysqli->error);
}

?>
