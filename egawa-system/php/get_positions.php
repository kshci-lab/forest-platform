<?php
// get_positions.php
// GET ids=1,2,3  -> returns saved positions from knowledge_fragment_positions
@header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/connect_db.php';
if (session_status() !== PHP_SESSION_ACTIVE) { @session_start(); }

$response = ['status' => 'error'];
try {
    if (!isset($mysqli) || !($mysqli instanceof mysqli)) { throw new Exception('DB接続が無効です'); }
    $idsRaw = isset($_GET['ids']) ? trim($_GET['ids']) : '';
    $items = [];
    if ($idsRaw !== '') {
        $parts = array_filter(array_map('trim', explode(',', $idsRaw)), function($v){ return $v !== ''; });
        $ints = array_map('intval', $parts);
        if (count($ints) > 0) {
            // build placeholders
            $placeholders = implode(',', array_fill(0, count($ints), '?'));
            $types = str_repeat('i', count($ints));
            $sql = "SELECT externalized_contents_id, pos_x AS x, pos_y AS y, updated_at FROM knowledge_fragment_positions WHERE externalized_contents_id IN ($placeholders)";
            if ($stmt = $mysqli->prepare($sql)) {
                $stmt->bind_param($types, ...$ints);
                if ($stmt->execute()) {
                    $res = $stmt->get_result();
                    while ($row = $res->fetch_assoc()) { $items[] = $row; }
                    $res->free();
                }
                $stmt->close();
            }
        }
    } else {
        // return all positions
        if ($res = $mysqli->query("SELECT externalized_contents_id, pos_x AS x, pos_y AS y, updated_at FROM knowledge_fragment_positions")) {
            while ($row = $res->fetch_assoc()) { $items[] = $row; }
            $res->free();
        }
    }
    $response = ['status' => 'ok', 'items' => $items];
} catch (Exception $ex) {
    $response['error'] = $ex->getMessage();
}

echo json_encode($response);
