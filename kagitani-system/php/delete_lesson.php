<?php
header('Content-Type: application/json; charset=UTF-8');
require_once("connect_db.php");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$object_le_id = isset($_POST['object_le_id']) ? trim($_POST['object_le_id']) : '';
if ($object_le_id === '') {
    echo json_encode(['success' => false, 'error' => 'object_le_id missing']);
    exit;
}

$ts = date("Y-m-d H:i:s") . "." . substr(explode('.', (microtime(true) . ''))[1], 0, 3);
$escaped = $mysqli->real_escape_string($object_le_id);
$sql = "UPDATE `object_lesson-learneds` SET deleted = 1, updated_at = '$ts' WHERE object_le_id = '$escaped'";
if ($mysqli->query($sql)) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => $mysqli->error, 'sql' => $sql]);
}

?>
