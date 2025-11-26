<?php
// NOTE: 環境に合わせて接続情報を設定してください
$dsn = 'mysql:host=localhost;dbname=forest_platform;charset=utf8mb4';
$user = 'root';
$pass = 'root'; // MAMP のデフォルトなら 'root'

// エラーハンドリングとJSONレスポンス設定
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    // logic_triangle から claim_id をすべて取得
    $claimStmt = $pdo->query('SELECT claim_id FROM logic_triangle');
    $claimIds = $claimStmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($claimIds)) {
        echo json_encode([]);
        exit;
    }

    // IN 句を動的に生成
    $placeholders = implode(',', array_fill(0, count($claimIds), '?'));

    // logic_node から node_id が claim_id に一致し、f_node_id が NULL ではないものを取得
    $sql = "SELECT *
            FROM logic_node
            WHERE node_id IN ($placeholders)
              AND f_node_id IS NOT NULL";
    $nodeStmt = $pdo->prepare($sql);
    $nodeStmt->execute($claimIds);

    $rows = $nodeStmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Internal Server Error',
        // 'detail' => $e->getMessage(), // 必要なら詳細を返す
    ], JSON_UNESCAPED_UNICODE);
    exit;
}