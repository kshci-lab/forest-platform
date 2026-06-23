<?php
// update_latest_goal_node.php

require_once('../../php/connect_db.php');
// 明示的にタイムゾーンを設定（サーバ既定がUTCの場合のズレ防止）
if (function_exists('date_default_timezone_set')) {
    date_default_timezone_set('Asia/Tokyo');
}

$node_id = isset($_POST['node_id']) ? $_POST['node_id'] : '';
if ($node_id === '') {
    echo 'ノードIDが指定されていません';
    exit;
}

$object_journal_id = isset($_POST['object_journal_id']) ? $_POST['object_journal_id'] : '';

$map_id = isset($_POST['map_id']) ? $_POST['map_id'] : '';

// 最新の小目標を取得
if ($object_journal_id !== '') {
    $latest_goal_id = $object_journal_id;
    $should_insert = true;
} else if ($map_id !== '') {
    $sql = "SELECT object_journal_id FROM object_journals WHERE `delete`=0 AND map_id=? ORDER BY update_at DESC LIMIT 1";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('s', $map_id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result && $row = $result->fetch_assoc()) {
        $latest_goal_id = $row['object_journal_id'];
        $should_insert = true;
    } else {
        $should_insert = false;
        echo '小目標が見つかりません';
    }
} else {
    $should_insert = false;
    echo 'マップIDが指定されていません';
}

if ($should_insert) {
    // object_journal_nodesに保存（IDをuniqidで生成）
    $object_journal_node_id = uniqid('goalnode_', true);
    // New schema: include deleted, create_at, update_at
    $created_at = date('Y-m-d H:i:s');
    $updated_at = $created_at;
    $deleted = 0;
    $insert_sql = "INSERT INTO object_journal_nodes (object_journal_node_id, object_journal_id, node_id, deleted, create_at, update_at) VALUES (?, ?, ?, ?, ?, ?)";
    $insert_stmt = $mysqli->prepare($insert_sql);
    $insert_stmt->bind_param('sssiss', $object_journal_node_id, $latest_goal_id, $node_id, $deleted, $created_at, $updated_at);
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
