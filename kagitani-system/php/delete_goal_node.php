<?php
require_once('../../php/connect_db.php');

$object_goal_id = $_POST['object_goal_id'] ?? '';
$content = $_POST['content'] ?? '';
if ($object_goal_id === '' || $content === '') {
    echo 'パラメータ不足';
    exit;
}

// node_idを取得
$sql = "SELECT n.node_id FROM object_goal_nodes n LEFT JOIN node_latest nl ON n.node_id = nl.node_id WHERE n.object_goal_id = ? AND nl.content = ? AND (n.deleted IS NULL OR n.deleted = 0) LIMIT 1";
$stmt = $mysqli->prepare($sql);
$stmt->bind_param('ss', $object_goal_id, $content);
$stmt->execute();
$stmt->bind_result($node_id);
$stmt->fetch();
$stmt->close();

if ($node_id) {
    // 論理削除
    $update_sql = "UPDATE object_goal_nodes SET deleted = 1 WHERE object_goal_id = ? AND node_id = ?";
    $update_stmt = $mysqli->prepare($update_sql);
    $update_stmt->bind_param('ss', $object_goal_id, $node_id);
    if ($update_stmt->execute()) {
        echo 'OK';
    } else {
        echo '削除失敗';
    }
    $update_stmt->close();
} else {
    echo '該当ノードが見つかりません';
}
$mysqli->close();
?>
