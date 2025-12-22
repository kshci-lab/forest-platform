<?php
require_once('connect_db.php');
header('Content-Type: application/json; charset=utf-8');

$object_journal_id = isset($_GET['object_journal_id']) ? $_GET['object_journal_id'] : (isset($_POST['object_journal_id']) ? $_POST['object_journal_id'] : null);
if (!$object_journal_id) {
    echo json_encode(['success' => false, 'error' => 'Missing object_journal_id']);
    exit;
}

if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
    echo json_encode(['success' => false, 'error' => 'Database connection not available']);
    exit;
}

try {
    $sql = "SELECT evaluation_good, attribution, application FROM object_journals WHERE object_journal_id = ? LIMIT 1";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $mysqli->error]);
        exit;
    }
    $stmt->bind_param('s', $object_journal_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $row = $res->fetch_assoc()) {
        echo json_encode(['success' => true,
            'evaluation_good' => isset($row['evaluation_good']) ? $row['evaluation_good'] : '',
            'attribution' => isset($row['attribution']) ? $row['attribution'] : '',
            'application' => isset($row['application']) ? $row['application'] : ''
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
