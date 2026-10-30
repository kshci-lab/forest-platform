<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
if (!isset($_SESSION['USERID'])) { http_response_code(401); echo '{"status":"error"}'; exit; }
$id = (string)($_GET['outbox_id'] ?? '');
if (!preg_match('/^[1-9][0-9]*$/D', $id)) { http_response_code(400); echo '{"status":"error"}'; exit; }
require_once __DIR__ . '/connect_db.php';
try {
    $stmt = $mysqli->prepare('SELECT o.outbox_id, o.operation, o.status, o.attempt_count, o.next_retry_at,
        o.last_http_status, o.last_request_id, o.last_error FROM kf_sync_outbox o
        INNER JOIN experience_knowledges ek ON ek.experience_knowledge_id = o.experience_knowledge_id
        WHERE o.outbox_id = ? AND ek.user_id = ?');
    $user = (int)$_SESSION['USERID'];
    $stmt->bind_param('si', $id, $user);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if (!$row) { http_response_code(404); echo '{"status":"error"}'; exit; }
    $row['status'] = $row['status'] === 'FAILED' && $row['next_retry_at'] !== null ? 'QUEUED' : $row['status'];
    $row['error_code'] = $row['last_error'] ? explode(':', $row['last_error'], 2)[0] : null;
    unset($row['last_error']);
    echo json_encode(['status' => 'ok', 'ok_core' => $row]);
} catch (Throwable $error) { http_response_code(503); echo '{"status":"error"}'; }
