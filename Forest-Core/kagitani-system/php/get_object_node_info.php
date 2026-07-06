<?php
// node_idと日付範囲でobject_nodes情報を返すAPI
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
    $where .= " AND updated_at >= '" . $escaped_start . "' AND updated_at <= '" . $escaped_end . "'";
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
    echo json_encode(['success' => true, 'data' => $rows]);
} else {
    error_log('該当データなし: node_id=' . $node_id);
    echo json_encode(['success' => false, 'error' => '該当データなし']);
}
