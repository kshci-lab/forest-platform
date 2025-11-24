<?php
// get_other_remarks.php
// Returns remarked_utterances rows for given utterance IDs, excluding current user
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once __DIR__ . '/connect_db.php';

if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'DB接続失敗']);
    exit;
}

$currentUser = isset($_SESSION['USERID']) ? (string)$_SESSION['USERID'] : '';

$raw = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = isset($_POST['utter_ids']) ? $_POST['utter_ids'] : null;
    if ($raw === null && isset($_POST['utter_ids[]'])) {
        $raw = $_POST['utter_ids[]'];
    }
} else {
    $raw = isset($_GET['utter_ids']) ? $_GET['utter_ids'] : null;
}

if ($raw === null) {
    echo json_encode(['status'=>'error','message'=>'utter_ids が指定されていません']);
    exit;
}

// utter_ids may be JSON-encoded or comma-separated
$ids = [];
if (is_string($raw)) {
    $decoded = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        $ids = $decoded;
    } else {
        // try comma separated
        $parts = preg_split('/\s*,\s*/', trim($raw));
        foreach ($parts as $p) { if ($p !== '') $ids[] = $p; }
    }
} else if (is_array($raw)) {
    $ids = $raw;
}

$ids = array_map('intval', array_values(array_filter($ids, function($v){ return $v !== '' && $v !== null; })));
if (count($ids) === 0) {
    echo json_encode(['status'=>'ok','items'=>[]]);
    exit;
}

// build placeholders
$placeholders = implode(',', array_fill(0, count($ids), '?'));

$sql = "SELECT utterance_id, user_id, type FROM remarked_utterances WHERE deleted = 0 AND utterance_id IN ($placeholders)";
if ($currentUser !== '') {
    $sql .= " AND user_id <> ?";
}

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(['status'=>'error','message'=>'prepare 失敗: ' . $mysqli->error]);
    exit;
}

$types = str_repeat('i', count($ids));
$params = array_merge($ids);

if ($currentUser !== '') {
    // user_id stored as string; bind as string
    $types .= 's';
    $params[] = $currentUser;
}

// bind params dynamically
$refs = [];
foreach ($params as $k => $v) { $refs[$k] = &$params[$k]; }
array_unshift($refs, $types);
call_user_func_array([$stmt, 'bind_param'], $refs);

if (!$stmt->execute()) {
    echo json_encode(['status'=>'error','message'=>'execute 失敗: ' . $stmt->error]);
    exit;
}

$res = $stmt->get_result();
$items = [];
while ($row = $res->fetch_assoc()) {
    $items[] = $row;
}
$stmt->close();

echo json_encode(['status'=>'ok','items'=>$items]);
exit;
?>
