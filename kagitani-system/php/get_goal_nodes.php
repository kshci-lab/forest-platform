<?php
// object_journal_idから紐づくnode_id一覧を返すAPI
header('Content-Type: application/json; charset=utf-8');
require_once("connect_db.php");

$object_journal_id = isset($_GET['object_journal_id']) ? $_GET['object_journal_id'] : '';
if ($object_journal_id === '') {
    echo json_encode(['success' => false, 'error' => 'object_journal_idがありません']);
    exit;
}

$sql = "SELECT node_id FROM goal_nodes WHERE object_journal_id = '" . $mysqli->real_escape_string($object_journal_id) . "' AND deleted = 0";
$result = $mysqli->query($sql);
$nodeIds = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $nodeIds[] = $row['node_id'];
    }
}
if ($nodeIds) {
    echo json_encode(['success' => true, 'node_ids' => $nodeIds]);
} else {
    echo json_encode(['success' => false, 'error' => '該当データなし']);
}
