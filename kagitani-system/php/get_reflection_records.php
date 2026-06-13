<?php
// Fetch reflection records with lesson arrays for a given object_node_id.
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=UTF-8');
require_once("connect_db.php");

$object_node_id = $_GET['object_node_id'] ?? '';
if ($object_node_id === '') {
    echo json_encode(['success' => false, 'error' => 'object_node_id missing'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Ensure reflection_records exists
$tbl_res = $mysqli->query("SHOW TABLES LIKE 'object_reflection_records'");
if (!$tbl_res || $tbl_res->num_rows === 0) {
    echo json_encode(['success' => false, 'error' => 'object_reflection_records table not found'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Check lesson table and reflection_id column
$lesson_table_exists = false;
$lesson_has_reflection_id = false;
$lesson_tbl_res = $mysqli->query("SHOW TABLES LIKE 'object_lesson-learneds'");
if ($lesson_tbl_res && $lesson_tbl_res->num_rows > 0) {
    $lesson_table_exists = true;
    $col_res = $mysqli->query("SHOW COLUMNS FROM `object_lesson-learneds` LIKE 'reflection_id'");
    if ($col_res && $col_res->num_rows > 0) {
        $lesson_has_reflection_id = true;
    }
}

if ($lesson_table_exists && $lesson_has_reflection_id) {
        $sql = "SELECT r.reflection_id, r.object_node_id, r.evaluation_good, r.attribution, r.evaluation_bad, r.attribution_bad, r.created_at,
                   l.object_le_id, l.lesson_learned, l.why_important, l.opportunity, l.created_at AS lesson_created_at
            FROM object_reflection_records r
            LEFT JOIN `object_lesson-learneds` l ON r.reflection_id = l.reflection_id AND l.deleted = 0
            WHERE r.object_node_id = ?
            ORDER BY r.created_at DESC, l.created_at ASC";
} else {
        $sql = "SELECT r.reflection_id, r.object_node_id, r.evaluation_good, r.attribution, r.evaluation_bad, r.attribution_bad, r.created_at
            FROM object_reflection_records r
            WHERE r.object_node_id = ?
            ORDER BY r.created_at DESC";
}

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(['success' => false, 'error' => 'prepare failed: ' . $mysqli->error], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$stmt->bind_param('s', $object_node_id);
$stmt->execute();
$res = $stmt->get_result();
if (!$res) {
    echo json_encode(['success' => false, 'error' => 'query failed: ' . $mysqli->error], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $stmt->close();
    exit;
}

$records = [];
$index = [];
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $rid = $row['reflection_id'];
        if (!isset($index[$rid])) {
            $index[$rid] = count($records);
            $records[] = [
                'reflection_id' => $row['reflection_id'],
                'object_node_id' => $row['object_node_id'],
                'evaluation_good' => $row['evaluation_good'],
                'attribution' => $row['attribution'],
                'evaluation_bad' => $row['evaluation_bad'],
                'attribution_bad' => $row['attribution_bad'],
                'created_at' => $row['created_at'],
                'lessons' => []
            ];
        }

        if (isset($row['object_le_id']) && $row['object_le_id'] !== null) {
            $records[$index[$rid]]['lessons'][] = [
                'object_le_id' => $row['object_le_id'],
                'lesson_learned' => $row['lesson_learned'],
                'why_important' => isset($row['why_important']) ? $row['why_important'] : null,
                'opportunity' => $row['opportunity'],
                'created_at' => $row['lesson_created_at']
            ];
        }
    }
}

$stmt->close();

echo json_encode(['success' => true, 'records' => $records], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

?>
