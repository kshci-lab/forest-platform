<?php
// fix_schema_add_activity.php
// object_nodes_histories テーブルに activity カラムが無ければ追加する簡易スクリプト

header('Content-Type: application/json; charset=UTF-8');

// connect_db.php を利用して DB 接続
$dbFile = __DIR__ . '/connect_db.php';
if (!file_exists($dbFile)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'connect_db.php が見つかりません: ' . $dbFile]);
    exit;
}
require_once $dbFile; // $mysqli を提供する

try {
    if (!isset($mysqli) || !$mysqli) throw new Exception('DB 接続がありません');

    $table = 'object_nodes_histories';
    // カラム存在確認
    $checkSql = "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '" . $mysqli->real_escape_string($table) . "' AND COLUMN_NAME = 'activity'";
    $res = $mysqli->query($checkSql);
    if (!$res) throw new Exception('情報スキーマ照会に失敗しました: ' . $mysqli->error);
    $row = $res->fetch_assoc();
    $exists = intval($row['cnt']) > 0;

    if ($exists) {
        echo json_encode(['success' => true, 'message' => 'カラム activity は既に存在します']);
        exit;
    }

    // カラム追加（安全に INT 型で追加）
    $alterSql = "ALTER TABLE `" . $mysqli->real_escape_string($table) . "` ADD COLUMN `activity` INT(3) DEFAULT 0";
    if ($mysqli->query($alterSql)) {
        echo json_encode(['success' => true, 'message' => 'activity カラムを追加しました', 'sql' => $alterSql]);
    } else {
        throw new Exception('ALTER TABLE 失敗: ' . $mysqli->error);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
