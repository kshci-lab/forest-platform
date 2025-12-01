<?php
// node_idと日付範囲でobject_nodes情報を返す．SRLジャーナルに何を表示させるかを管理
require("../php/connect_db.php");
header('Content-Type: application/json; charset=utf-8');



$node_id = isset($_GET['node_id']) ? $_GET['node_id'] : '';
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : '';
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : '';
if ($node_id === '') {
    echo json_encode(['success' => false, 'error' => 'node_idがありません']);
    exit;
}

$escaped_node_id = $mysqli->real_escape_string($node_id);
$where = "node_id = '" . $escaped_node_id . "' and deleted = 0";
if ($start_date !== '' && $end_date !== '') {
    $escaped_start = $mysqli->real_escape_string($start_date);
    $escaped_end = $mysqli->real_escape_string($end_date);
    // yyyy-mm-dd の形式だけが渡された場合、開始はその日の 00:00:00、終了は翌日未満で扱う
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
        $escaped_start = $mysqli->real_escape_string($start_date . ' 00:00:00');
        $next_day = date('Y-m-d', strtotime($end_date . ' +1 day'));
        $escaped_next_day = $mysqli->real_escape_string($next_day);
        $where .= " AND updated_at >= '" . $escaped_start . "' AND updated_at < '" . $escaped_next_day . "'";
    } else {
        // どちらかが日時を含む場合はそのまま inclusive 範囲を使う
        $where .= " AND updated_at >= '" . $escaped_start . "' AND updated_at <= '" . $escaped_end . "'";
    }
}
$sql = "SELECT * FROM object_nodes WHERE $where ORDER BY created_at DESC";
$result = $mysqli->query($sql);
$rows = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
}
if ($rows) {
    $objectNodeIds = array_map(function($row){ return $row['object_node_id']; }, $rows);
    error_log('取得object_node_id: ' . implode(',', $objectNodeIds));

    // 該当する object_node_id に紐づく履歴を object_nodes_histories から取得
    $histories = [];
    $objectNodeHistoryIds = [];
    if (!empty($objectNodeIds)) {
        $escapedIds = array_map(function($id) use ($mysqli) { return $mysqli->real_escape_string($id); }, $objectNodeIds);
        $inClause = "'" . implode("','", $escapedIds) . "'";
        $sql_hist = "SELECT `object_node_history_id`, `object_node_id`, `object_node_type`, `status`, `appeared_at`, `disappeared_at`, `content`, `x`, `y`, `purpose`, `estimated_time`, `action_reason`, `completion_reason`, `challenges_learnings`, `drag` FROM `object_nodes_histories` WHERE object_node_id IN (" . $inClause . ") AND drag = 0 ORDER BY appeared_at DESC";
        $result_hist = $mysqli->query($sql_hist);
        if ($result_hist) {
            while ($h = $result_hist->fetch_assoc()) {
                $histories[] = $h;
                if (isset($h['object_node_history_id'])) $objectNodeHistoryIds[] = $h['object_node_history_id'];
            }
        } else {
            error_log('履歴取得失敗: ' . $mysqli->error);
        }
    }

    echo json_encode([
        'success' => true,
        'data' => $rows,
        'object_node_ids' => $objectNodeIds,
        'object_node_history_ids' => $objectNodeHistoryIds,
        'histories' => $histories
    ]);
} else {
    error_log('該当データなし: node_id=' . $node_id);
    echo json_encode(['success' => false, 'error' => '該当データなし', 'object_node_ids' => [], 'object_node_history_ids' => [], 'histories' => []]);
}
