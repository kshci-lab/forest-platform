<?php
require_once('connect_db.php');
header('Content-Type: application/json; charset=utf-8');

$object_goal_id = isset($_GET['object_goal_id']) ? $_GET['object_goal_id'] : (isset($_POST['object_goal_id']) ? $_POST['object_goal_id'] : null);
if (!$object_goal_id) {
    echo json_encode(['success' => false, 'error' => 'Missing object_goal_id']);
    exit;
}

if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
    echo json_encode(['success' => false, 'error' => 'Database connection not available']);
    exit;
}

try {
    $sql = "SELECT action_reason, completion_reason, challenges_learnings FROM object_goals WHERE object_goal_id = ? LIMIT 1";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $mysqli->error]);
        exit;
    }
    $stmt->bind_param('s', $object_goal_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $row = $res->fetch_assoc()) {
        echo json_encode(['success' => true,
            'action_reason' => isset($row['action_reason']) ? $row['action_reason'] : '',
            'completion_reason' => isset($row['completion_reason']) ? $row['completion_reason'] : '',
            'challenges_learnings' => isset($row['challenges_learnings']) ? $row['challenges_learnings'] : ''
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Not found']);
    }
    $stmt->close();
} catch (mysqli_sql_exception $ex) {
    echo json_encode(['success' => false, 'error' => 'MySQLi exception: ' . $ex->getMessage()]);
    exit;
}

?>
