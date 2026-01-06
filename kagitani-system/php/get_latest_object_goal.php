<?php
// get_latest_object_goal.php
header('Content-Type: application/json; charset=UTF-8');
if (function_exists('date_default_timezone_set')) {
    date_default_timezone_set('Asia/Tokyo');
}

// ensure session is started so we can access MAPID
if (session_status() === PHP_SESSION_NONE) session_start();

// require DB connection (provides $mysqli)
require_once(__DIR__ . '/../../php/connect_db.php');

$map_id = isset($_SESSION['MAPID']) ? $_SESSION['MAPID'] : '';
if (!$map_id) {
    echo json_encode(['success' => false, 'error' => 'map_id missing']);
    exit;
}

try {
    // detect whether object_journals has a `deleted` column to avoid SQL errors
    $hasDeleted = false;
    $colRes = $mysqli->query("SHOW COLUMNS FROM `object_journals` LIKE 'deleted'");
    if ($colRes && $colRes->num_rows) $hasDeleted = true;

    // Build WHERE fragment conditionally
    $deletedFilter = $hasDeleted ? "AND (g.deleted IS NULL OR g.deleted = 0)" : "";

    // Return weekly goals joined with node content (if any)
    $sql = "
        SELECT 
            g.object_journal_id,
            g.start_date,
            g.finish_date,
            nl.content AS content
        FROM object_journals g
        LEFT JOIN object_journal_nodes n
            ON g.object_journal_id = n.object_journal_id
            AND (n.deleted IS NULL OR n.deleted = 0)
        LEFT JOIN node_latest nl
            ON n.node_id = nl.node_id
        WHERE g.map_id = ?
          " . $deletedFilter . "
        ORDER BY g.appeared_at DESC
        LIMIT 50";

    $stmt = $mysqli->prepare($sql);
    if (!$stmt) throw new Exception('SQL prepare failed: ' . $mysqli->error . ' SQL=' . $sql);
    $stmt->bind_param('s', $map_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $goals = [];
    while ($row = $res->fetch_assoc()) {
        $goals[] = $row;
    }
    $stmt->close();
    echo json_encode(['success' => true, 'map_id' => $map_id, 'has_deleted_column' => $hasDeleted, 'goals' => $goals]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
