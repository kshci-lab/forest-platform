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
    echo json_encode(['status' => 'error', 'message' => '更新する組織知を確認できませんでした'], JSON_UNESCAPED_UNICODE);
    exit;
}

$user_id = intval($_SESSION['USERID']);
$experience_knowledge_id = intval($_POST['experience_knowledge_id']);
$knowledge_fragment_title = isset($_POST['knowledge_fragment_title']) ? $_POST['knowledge_fragment_title'] : '';
$contents_json = isset($_POST['contents']) ? $_POST['contents'] : '[]';
$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

$stage1_items = [];
$stage2_items = [];
$stage3_items = [];
$contents = json_decode($contents_json, true);

if (is_array($contents)) {
    foreach ($contents as $content_item) {
        $type = isset($content_item['type']) ? $content_item['type'] : '';
        $content = isset($content_item['content']) ? $content_item['content'] : '';
        if (trim($content) === '') continue;

        switch ($type) {
            case 'stage1':
                $stage1_items[] = $content;
                break;
            case 'stage2':
                $stage2_items[] = $content;
                break;
            case 'stage3':
                $stage3_items[] = $content;
                break;
            default:
                $stage1_items[] = $content;
        }
    }
}

$stage1 = implode("\n", $stage1_items);
$stage2 = implode("\n", $stage2_items);
$stage3 = implode("\n", $stage3_items);

try {
    $result = kf_sync_update_fragment(
        $mysqli,
        $experience_knowledge_id,
        $user_id,
        $knowledge_fragment_title,
        $stage1,
        $stage2,
        $stage3,
        $timestamp,
        isset($_SESSION['HCIMLAB_SSO_SUB']) ? (string)$_SESSION['HCIMLAB_SSO_SUB'] : ''
    );
    echo json_encode([
        'status' => 'ok',
        'knowledge_fragment_title' => $knowledge_fragment_title,
        'stage1' => $stage1,
        'stage2' => $stage2,
        'stage3' => $stage3,
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
