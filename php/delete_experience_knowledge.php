<?php
session_start();
require("connect_db.php");
require_once __DIR__ . '/kf_sync_service.php';

header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Asia/Tokyo');

if (!isset($_SESSION['USERID'])) {
    echo json_encode(['status' => 'error', 'message' => 'ログイン情報を確認できませんでした'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isset($_POST['experience_knowledge_id']) || $_POST['experience_knowledge_id'] === '') {
    echo json_encode(['status' => 'error', 'message' => '削除する組織知を確認できませんでした'], JSON_UNESCAPED_UNICODE);
    exit;
}

$user_id = intval($_SESSION['USERID']);
$experience_knowledge_id = intval($_POST['experience_knowledge_id']);
$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

try {
    $result = kf_sync_delete_fragment(
        $mysqli,
        $experience_knowledge_id,
        $user_id,
        $timestamp,
        isset($_SESSION['HCIMLAB_SSO_SUB']) ? (string)$_SESSION['HCIMLAB_SSO_SUB'] : ''
    );
    echo json_encode([
        'status' => 'ok',
        'source_revision' => $result['source_revision'],
        'outbox_id' => $result['outbox_id'],
        'ok_core' => $result['ok_core']
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $error->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
?>
