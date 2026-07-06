<?php
// update_latest_goal_node.php
// 最新の小目標（goal_type='小目標'）のnode_idを更新する

require_once('../../php/connect_db.php');

$node_id = isset($_POST['node_id']) ? $_POST['node_id'] : '';
if ($node_id === '') {
    echo 'ノードIDが指定されていません';
    exit;
}

// 最新の小目標を取得
$sql = "SELECT object_goal_id FROM object_goals WHERE goal_type='weekly' AND `delete`=0 ORDER BY update_at DESC LIMIT 1";
$result = $mysqli->query($sql);
if ($result && $row = $result->fetch_assoc()) {
    $latest_goal_id = $row['object_goal_id'];
    // object_goal_nodesに保存（IDをuniqidで生成）
    $object_goal_node_id = uniqid('goalnode_', true);
    $insert_sql = "INSERT INTO object_goal_nodes (object_goal_node_id, object_goal_id, node_id) VALUES (?, ?, ?)";
    $insert_stmt = $mysqli->prepare($insert_sql);
    $insert_stmt->bind_param('sss', $object_goal_node_id, $latest_goal_id, $node_id);
    $insert_result = $insert_stmt->execute();
    $insert_stmt->close();

    if ($insert_result) {
        echo 'OK';
    } else {
        echo '保存に失敗しました';
    }
} else {
    echo '小目標が見つかりません';
}
$mysqli->close();
?>
