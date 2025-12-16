<?php
// fix_schema_create_document_titles.php
// document_titles テーブルが無ければ最小限の定義で作成します

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/connect_db.php';
try {
    if (!isset($mysqli) || !$mysqli) throw new Exception('DB 接続がありません');

    $table = 'document_titles';
    $checkSql = "SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '" . $mysqli->real_escape_string($table) . "'";
    $res = $mysqli->query($checkSql);
    if (!$res) throw new Exception('情報スキーマ照会に失敗しました: ' . $mysqli->error);
    $row = $res->fetch_assoc();
    $exists = intval($row['cnt']) > 0;

    if ($exists) {
        echo json_encode(['success' => true, 'message' => 'table document_titles は既に存在します']);
        exit;
    }

    $createSql = "CREATE TABLE `document_titles` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `map_id` INT DEFAULT NULL,
        `title` VARCHAR(1024) DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_map_id` (`map_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

    if ($mysqli->query($createSql)) {
        echo json_encode(['success' => true, 'message' => 'document_titles を作成しました', 'sql' => $createSql]);
    } else {
        throw new Exception('CREATE TABLE 失敗: ' . $mysqli->error);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
