<?php
require_once('connect_db.php');
header('Content-Type: application/json');

$object_goal_id = isset($_POST['object_goal_id']) ? $_POST['object_goal_id'] : null;
$start_date = isset($_POST['start_date']) ? $_POST['start_date'] : null;
$finish_date = isset($_POST['finish_date']) ? $_POST['finish_date'] : null;

if (!$object_goal_id || !$start_date || !$finish_date) {
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
    exit;
}

try {
    $pdo = connect_db();
    $sql = 'UPDATE object_goals SET start_date = ?, finish_date = ? WHERE object_goal_id = ?';
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$start_date, $finish_date, $object_goal_id]);
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'DB update failed']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
