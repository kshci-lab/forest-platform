<?php
require_once('../../php/connect_db.php');

$node_id = $_POST['node_id'] ?? '';
if ($node_id === '') {
    echo 'ノードIDが指定されていません';
    exit;
}

// 最新のgoal取得
$sql = "SELECT object_goal_id FROM object_goals ORDER BY update_at DESC LIMIT 1";
$result = $mysqli->query($sql);
if ($result && $row = $result->fetch_assoc()) {
    $latest_goal_id = $row['object_goal_id'];
    // ノードリンク挿入
    $insert_sql = "INSERT INTO object_goal_nodes (object_goal_id, node_id) VALUES (?, ?)";
    $stmt = $mysqli->prepare($insert_sql);
    $stmt->bind_param('ss', $latest_goal_id, $node_id);
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
