<?php
// update_discussed_status.php (forest-mrn)
// Update experience_knowledges.discussed for a given experience_knowledge_id.
// Input: POST experience_knowledge_id (int) OR externalized_contents_id (int, legacy), status (YET|UNDERWAY|DONE)
// Output: JSON { status: 'ok', experience_knowledge_id: ..., discussed: ... }

@header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/connect_db.php';
if (session_status() !== PHP_SESSION_ACTIVE) { @session_start(); }

$response = [ 'status' => 'error' ];
try {
    if (!isset($mysqli) || !($mysqli instanceof mysqli)) { throw new Exception('DB接続が無効です'); }
    @$mysqli->set_charset('utf8mb4');

    $allowed = ['YET','UNDERWAY','DONE'];
    $status = isset($_POST['status']) ? trim((string)$_POST['status']) : '';
    if (!in_array($status, $allowed, true)) { throw new Exception('不正な status 値です'); }

    $id = isset($_POST['experience_knowledge_id']) ? intval($_POST['experience_knowledge_id'], 10) : 0;
    if ($id <= 0) {
        // legacy param compatibility
        $id = isset($_POST['externalized_contents_id']) ? intval($_POST['externalized_contents_id'], 10) : 0;
    }
    if ($id <= 0) { throw new Exception('更新対象 experience_knowledge_id を特定できません'); }

    // existence check
    $hasDiscussed = false;
    if ($res = $mysqli->query("SHOW COLUMNS FROM experience_knowledges LIKE 'discussed'")) {
        $hasDiscussed = ($res->num_rows > 0);
        $res->free();
    }
    if (!$hasDiscussed) { throw new Exception('experience_knowledges.discussed カラムが存在しません'); }

    if (!$stmt = $mysqli->prepare("UPDATE experience_knowledges SET discussed = ? WHERE experience_knowledge_id = ?")) {
        throw new Exception('UPDATE 準備失敗: ' . $mysqli->error);
    }
    $stmt->bind_param('si', $status, $id);
    if (!$stmt->execute()) { throw new Exception('UPDATE 実行失敗: ' . $stmt->error); }
    $stmt->close();

    $response = [ 'status' => 'ok', 'experience_knowledge_id' => $id, 'discussed' => $status ];
} catch (Exception $ex) {
    $response['error'] = $ex->getMessage();
}

echo json_encode($response);

