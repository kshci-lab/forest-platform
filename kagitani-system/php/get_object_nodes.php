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
    
    // object_nodesテーブルの存在確認
    $table_check = $mysqli->query("SHOW TABLES LIKE 'object_nodes'");
    if ($table_check->num_rows == 0) {
        throw new Exception('object_nodesテーブルが存在しません');
    }
    
    // object_nodesテーブルからnode_idと最新のstatusを取得
    // inProgressを最優先、次にpaused、completed、その他の順で取得
    $sql = "SELECT node_id, 
                   CASE 
                       WHEN MAX(CASE WHEN status = 'inProgress' THEN 1 ELSE 0 END) = 1 THEN 'inProgress'
                       WHEN MAX(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) = 1 THEN 'paused'
                       WHEN MAX(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) = 1 THEN 'completed'
                       ELSE MAX(status)
                   END as status
            FROM object_nodes 
            WHERE node_id IS NOT NULL AND node_id != '' 
            AND status IS NOT NULL AND status != ''
            GROUP BY node_id 
            ORDER BY node_id";
    $result = $mysqli->query($sql);
    
    if (!$result) {
        throw new Exception('SQLクエリエラー: ' . $mysqli->error);
    }
    
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    
    // レスポンスを返す
    echo json_encode([
        'status' => 'success',
        'data' => $data,
        'count' => count($data),
        'sql' => $sql
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
