<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
session_start();
if (!isset($_SESSION['USERID'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'ログイン情報を確認してください。', 'groups' => []]);
    exit;
}
try {
    require_once __DIR__ . '/connect_db.php';
    require_once __DIR__ . '/ok_core_bridge.php';
    if (!isset($mysqli) || !($mysqli instanceof mysqli)) throw new RuntimeException('Forest DB unavailable');
    $result = ok_core_get_user_groups($mysqli, (int)$_SESSION['USERID']);
    if ($result['status'] !== 'ok') http_response_code(502);
} catch (Throwable $error) {
    http_response_code(503);
    $result = ['status' => 'error', 'message' => 'ForestのDB接続・API設定を確認してください。', 'groups' => []];
}
echo json_encode($result, JSON_UNESCAPED_UNICODE);
