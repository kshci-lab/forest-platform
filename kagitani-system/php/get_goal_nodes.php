<?php
// object_goal_idから紐づくnode_id一覧を返すAPI
require("../php/connect_db.php");
header('Content-Type: application/json; charset=utf-8');

$object_goal_id = isset($_GET['object_goal_id']) ? $_GET['object_goal_id'] : '';
if ($object_goal_id === '') {
    echo json_encode(['success' => false, 'error' => 'object_goal_idがありません']);
    exit;
}

$sql = "SELECT node_id FROM goal_nodes WHERE object_goal_id = '" . $mysqli->real_escape_string($object_goal_id) . "' AND deleted = 0";
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
