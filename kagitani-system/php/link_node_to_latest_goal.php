<?php
require_once('../../php/connect_db.php');
// 明示的にタイムゾーンを設定（サーバ既定がUTCの場合のズレ防止）
if (function_exists('date_default_timezone_set')) {
    date_default_timezone_set('Asia/Tokyo');
}

$node_id = $_POST['node_id'] ?? '';
if ($node_id === '') {
    echo 'ノードIDが指定されていません';
    exit;
}

// 最新のgoal取得
$sql = "SELECT object_journal_id FROM object_journals ORDER BY update_at DESC LIMIT 1";
$result = $mysqli->query($sql);
if ($result && $row = $result->fetch_assoc()) {
    $latest_goal_id = $row['object_journal_id'];
    // ノードリンク挿入
    // 新しいテーブル構造に合わせてカラムを指定
    // object_goal_node_id, object_journal_id, node_id, deleted, create_at, update_at
    $object_goal_node_id = uniqid('goalnode_', true);
    $created_at = date('Y-m-d H:i:s');
    $updated_at = $created_at;
    $deleted = 0;
    $insert_sql = "INSERT INTO object_goal_nodes (object_goal_node_id, object_journal_id, node_id, deleted, create_at, update_at) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $mysqli->prepare($insert_sql);
    $stmt->bind_param('sssiss', $object_goal_node_id, $latest_goal_id, $node_id, $deleted, $created_at, $updated_at);
    if ($stmt->execute()) {
        echo 'OK';
    } else {
        echo 'NG';
    }
    $stmt->close();
} else {
    echo '目標が見つかりません';
}
$mysqli->close();
?>
