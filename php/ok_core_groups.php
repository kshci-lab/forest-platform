<?php

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
session_start();

if (!isset($_SESSION['USERID'])) {
    http_response_code(401);
    echo json_encode(array('status' => 'error', 'message' => 'not logged in', 'groups' => array()));
    exit;
}

try {
    require_once __DIR__ . '/connect_db.php';
    require_once __DIR__ . '/ok_core_bridge.php';
    if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
        throw new RuntimeException('Forest DB connection unavailable');
    }
    $result = ok_core_get_user_groups($mysqli, (int)$_SESSION['USERID']);
    if ($result['status'] !== 'ok') {
        http_response_code(502);
    }
} catch (Throwable $error) {
    error_log('ok_core_groups: ' . $error->getMessage());
    http_response_code(503);
    $result = ['status' => 'error', 'message' => '組織一覧を取得できません。Forest側のDB接続・API設定を確認してください。', 'groups' => []];
}
echo json_encode($result);

?>
