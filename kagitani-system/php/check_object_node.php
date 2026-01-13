<?php
// エラー表示を有効にする（デバッグ用）
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

try {
    // connect_db.phpの存在確認
    $connect_db_path = __DIR__ . '/connect_db.php';
    if (!file_exists($connect_db_path)) {
        throw new Exception('connect_db.php が見つかりません: ' . $connect_db_path);
    }
    
    // データベース接続
    require_once $connect_db_path;
    
    // $mysqliが定義されているか確認
    if (!isset($mysqli)) {
        throw new Exception('データベース接続($mysqli)が初期化されていません');
    }
    
    $node_id = $_POST['node_id'] ?? '';
    
    if (empty($node_id)) {
        echo json_encode([
            'status' => 'error',
            'message' => 'node_idが指定されていません'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // object_nodesテーブルの存在確認
    $table_check = $mysqli->query("SHOW TABLES LIKE 'object_nodes'");
    if ($table_check->num_rows == 0) {
        throw new Exception('object_nodesテーブルが存在しません');
    }
    
    // 指定されたnode_idがobject_nodesテーブルに存在するかチェック
    $stmt = $mysqli->prepare("SELECT COUNT(*) as count, MAX(status) as status FROM object_nodes WHERE node_id = ?");
    if (!$stmt) {
        throw new Exception('SQLプリペア文エラー: ' . $mysqli->error);
    }
    
    $stmt->bind_param('s', $node_id);
    $stmt->execute();
    
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $exists = $row['count'] > 0;
    $status = $row['status'];
    
    $stmt->close();
    
    // レスポンスを返す
    echo json_encode([
        'status' => 'success',
        'exists' => $exists,
        'node_id' => $node_id,
        'node_status' => $status
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'error_type' => get_class($e),
        'message' => 'エラー: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_UNESCAPED_UNICODE);
}
?>
