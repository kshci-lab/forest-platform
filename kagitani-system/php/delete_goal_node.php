<?php
require_once('../../php/connect_db.php');
// 明示的にタイムゾーンを設定（サーバ既定がUTCの場合のズレ防止）
if (function_exists('date_default_timezone_set')) {
    date_default_timezone_set('Asia/Tokyo');
}

$object_journal_id = $_POST['object_journal_id'] ?? '';
$content = $_POST['content'] ?? '';
if ($object_journal_id === '' || $content === '') {
    echo 'パラメータ不足';
    exit;
}

// node_idを取得
$sql = "SELECT n.node_id FROM object_journal_nodes n LEFT JOIN node_latest nl ON n.node_id = nl.node_id WHERE n.object_journal_id = ? AND nl.content = ? AND (n.deleted IS NULL OR n.deleted = 0) LIMIT 1";
$stmt = $mysqli->prepare($sql);
$stmt->bind_param('ss', $object_journal_id, $content);
$stmt->execute();
$stmt->bind_result($node_id);
$stmt->fetch();
$stmt->close();

if ($node_id) {
    // 論理削除: deleted フラグと update_at を更新
    $update_sql = "UPDATE object_journal_nodes SET deleted = 1, update_at = ? WHERE object_journal_id = ? AND node_id = ?";
    $update_stmt = $mysqli->prepare($update_sql);
    $now = date('Y-m-d H:i:s');
    $update_stmt->bind_param('sss', $now, $object_journal_id, $node_id);
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
