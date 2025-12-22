<?php
require_once('connect_db.php');
header('Content-Type: application/json; charset=utf-8');

$object_journal_id = isset($_POST['object_journal_id']) ? $_POST['object_journal_id'] : null;
$start_date = isset($_POST['start_date']) ? $_POST['start_date'] : null;
$finish_date = isset($_POST['finish_date']) ? $_POST['finish_date'] : null;

if (!$object_journal_id || !$start_date || !$finish_date) {
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
    exit;
}

// connect_db.php provides $mysqli (mysqli object)
if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
    echo json_encode(['success' => false, 'error' => 'Database connection not available']);
    exit;
}

$sql = "UPDATE object_journals SET start_date = ?, finish_date = ? WHERE object_journal_id = ?";
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $mysqli->error]);
    exit;
}

$stmt->bind_param('sss', $start_date, $finish_date, $object_journal_id);
$res = $stmt->execute();
if ($res) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'DB update failed: ' . $stmt->error]);
}
$stmt->close();
?>
