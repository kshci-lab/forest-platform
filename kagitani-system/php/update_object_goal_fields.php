<?php
require_once('connect_db.php');
header('Content-Type: application/json; charset=utf-8');

$object_goal_id = isset($_POST['object_goal_id']) ? $_POST['object_goal_id'] : null;
$action_reason = isset($_POST['action_reason']) ? $_POST['action_reason'] : null;
$completion_reason = isset($_POST['completion_reason']) ? $_POST['completion_reason'] : null;
$challenges_learnings = isset($_POST['challenges_learnings']) ? $_POST['challenges_learnings'] : null;
$update_at = isset($_POST['update_at']) ? $_POST['update_at'] : null;

if (!$object_goal_id) {
    echo json_encode(['success' => false, 'error' => 'Missing object_goal_id']);
    exit;
}

if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
    echo json_encode(['success' => false, 'error' => 'Database connection not available']);
    exit;
}

$action_reason = ($action_reason === null) ? '' : $action_reason;
$completion_reason = ($completion_reason === null) ? '' : $completion_reason;
$challenges_learnings = ($challenges_learnings === null) ? '' : $challenges_learnings;
$update_at = ($update_at === null) ? date('Y-m-d H:i:s') : $update_at;

// Keep object_goal_id as string because IDs in this app can be non-numeric (e.g. 'goal_...')
$object_goal_id_str = $object_goal_id;

try {
    $sql = "UPDATE object_goals SET action_reason = ?, completion_reason = ?, challenges_learnings = ?, update_at = ? WHERE object_goal_id = ?";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $mysqli->error]);
        exit;
    }
    $stmt->bind_param('sssss', $action_reason, $completion_reason, $challenges_learnings, $update_at, $object_goal_id_str);
    $res = $stmt->execute();
    if ($res) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'DB update failed: ' . $stmt->error]);
    }
    $stmt->close();
} catch (mysqli_sql_exception $ex) {
    // Return JSON error instead of letting PHP throw a fatal exception outputting HTML
    echo json_encode(['success' => false, 'error' => 'MySQLi exception: ' . $ex->getMessage()]);
    exit;
}

?>
