<?php
// エラー表示・ログ設定
ini_set('display_errors', 0);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');
session_start();

require_once("connect_db.php");

if (function_exists('mysqli_report')) {
    mysqli_report(MYSQLI_REPORT_OFF);
}

if (!isset($mysqli) || $mysqli->connect_error) {
    echo json_encode(['success' => false, 'error' => 'DB接続失敗']);
    exit;
}

$object_node_id = isset($_GET['object_node_id']) ? $_GET['object_node_id'] : '';

if ($object_node_id === '') {
    echo json_encode(['success' => false, 'error' => 'object_node_idがありません']);
    exit;
}

$escaped_id = $mysqli->real_escape_string($object_node_id);

$sql_hist = "SELECT * FROM `object_nodes_histories` WHERE object_node_id = '$escaped_id' ORDER BY appeared_at ASC";
$result_hist = @$mysqli->query($sql_hist);

$histories = [];
if ($result_hist) {
    while ($h = $result_hist->fetch_assoc()) {
        $histories[] = $h;
    }
} else {
    echo json_encode(['success' => false, 'error' => 'クエリ失敗: ' . $mysqli->error]);
    exit;
}

echo json_encode([
    'success' => true,
    'histories' => $histories
]);
