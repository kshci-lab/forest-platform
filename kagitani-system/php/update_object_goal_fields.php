<?php
require_once('connect_db.php');
header('Content-Type: application/json; charset=utf-8');

$object_journal_id = isset($_POST['object_journal_id']) ? $_POST['object_journal_id'] : null;
$evaluation_good = isset($_POST['evaluation_good']) ? $_POST['evaluation_good'] : null;
$attribution = isset($_POST['attribution']) ? $_POST['attribution'] : null;
$application = isset($_POST['application']) ? $_POST['application'] : null;
$update_at = isset($_POST['update_at']) ? $_POST['update_at'] : null;

if (!$object_journal_id) {
    echo json_encode(['success' => false, 'error' => 'Missing object_journal_id']);
    exit;
}

if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
    echo json_encode(['success' => false, 'error' => 'Database connection not available']);
    exit;
}

$evaluation_good = ($evaluation_good === null) ? '' : $evaluation_good;
$attribution = ($attribution === null) ? '' : $attribution;
$application = ($application === null) ? '' : $application;
$update_at = ($update_at === null) ? date('Y-m-d H:i:s') : $update_at;

// Keep object_journal_id as string because IDs in this app can be non-numeric (e.g. 'goal_...')
$object_journal_id_str = $object_journal_id;

try {
    $sql = "UPDATE object_journals SET evaluation_good = ?, attribution = ?, application = ?, update_at = ? WHERE object_journal_id = ?";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $mysqli->error]);
        exit;
    }
    $stmt->bind_param('sssss', $evaluation_good, $attribution, $application, $update_at, $object_journal_id_str);
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
