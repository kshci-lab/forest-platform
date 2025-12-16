<?php
// fix_schema_add_concept_id.php
// item_latest テーブルに concept_id カラムが無ければ追加します

header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/connect_db.php';

try {
    if (!isset($mysqli) || !$mysqli) throw new Exception('DB 接続がありません');

    $table = 'item_latest';
    $column = 'concept_id';
    $checkSql = "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '" . $mysqli->real_escape_string($table) . "' AND COLUMN_NAME = '" . $mysqli->real_escape_string($column) . "'";
    $res = $mysqli->query($checkSql);
    if (!$res) throw new Exception('情報スキーマ照会に失敗しました: ' . $mysqli->error);
    $row = $res->fetch_assoc();
    $exists = intval($row['cnt']) > 0;

    if ($exists) {
        echo json_encode(['success' => true, 'message' => 'column concept_id は既に存在します in item_latest']);
        exit;
    }

    $alterSql = "ALTER TABLE `" . $mysqli->real_escape_string($table) . "` ADD COLUMN `concept_id` INT DEFAULT NULL";
    if ($mysqli->query($alterSql)) {
        echo json_encode(['success' => true, 'message' => 'concept_id を追加しました', 'sql' => $alterSql]);
    } else {
        throw new Exception('ALTER TABLE 失敗: ' . $mysqli->error);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
