<?php
// Create a reflection record and related lessons in one transaction.
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=UTF-8');
require_once("connect_db.php");
date_default_timezone_set('Asia/Tokyo');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'POST required'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function read_json_body() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') === false) {
        return [];
    }
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function uuid_v4() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

$body = read_json_body();

$object_node_id = $_POST['object_node_id'] ?? ($body['object_node_id'] ?? '');
if ($object_node_id === '') {
    echo json_encode(['success' => false, 'error' => 'object_node_id missing'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$evaluation_good = $_POST['evaluation_good'] ?? $_POST['success_points'] ?? ($body['evaluation_good'] ?? ($body['success_points'] ?? ''));
$evaluation_bad = $_POST['evaluation_bad'] ?? $_POST['failure_points'] ?? ($body['evaluation_bad'] ?? ($body['failure_points'] ?? ''));
$attribution = $_POST['attribution'] ?? $_POST['attribution_good'] ?? ($body['attribution'] ?? ($body['attribution_good'] ?? ''));
$attribution_bad = $_POST['attribution_bad'] ?? ($body['attribution_bad'] ?? '');

$lessons_raw = $_POST['lessons'] ?? $_POST['lessons_json'] ?? ($body['lessons'] ?? ($body['lessons_json'] ?? null));
$lessons = [];
if (is_string($lessons_raw) && $lessons_raw !== '') {
    $decoded = json_decode($lessons_raw, true);
    if (is_array($decoded)) $lessons = $decoded;
} elseif (is_array($lessons_raw)) {
    $lessons = $lessons_raw;
}

$reflection_id = uuid_v4();
$created_at = date('Y-m-d H:i:s');

$mysqli->begin_transaction();
try {
    $stmt = $mysqli->prepare("INSERT INTO object_reflection_records (reflection_id, object_node_id, evaluation_good, attribution, evaluation_bad, attribution_bad, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    if (!$stmt) {
        throw new Exception('prepare failed: ' . $mysqli->error);
    }
    $stmt->bind_param('sssssss', $reflection_id, $object_node_id, $evaluation_good, $attribution, $evaluation_bad, $attribution_bad, $created_at);
    $stmt->execute();
    if ($stmt->error) {
        throw new Exception('insert reflection failed: ' . $stmt->error);
    }
    $stmt->close();

    if (!empty($lessons)) {
        $lessonStmt = $mysqli->prepare("INSERT INTO `object_lesson-learneds` (object_le_id, object_node_id, reflection_id, lesson_learned, why_important, opportunity, created_at, updated_at, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)");
        if (!$lessonStmt) {
            throw new Exception('prepare lesson failed: ' . $mysqli->error);
        }
        foreach ($lessons as $item) {
            $lesson_text = '';
            $opportunity = '';
            $object_le_id = '';

            if (is_array($item)) {
                $lesson_text = trim($item['lesson'] ?? $item['lesson_learned'] ?? '');
                $why_important = isset($item['why_important']) ? trim($item['why_important']) : null;
                $opportunity = trim($item['opportunity'] ?? '');
                $object_le_id = trim($item['object_le_id'] ?? '');
            } else {
                $lesson_text = trim((string)$item);
                $why_important = null;
            }

            if ($lesson_text === '' && $opportunity === '' && ($why_important === null || $why_important === '')) continue;

            if ($object_le_id === '') {
                $object_le_id = uniqid('lesson_', true);
            }

            $lessonStmt->bind_param('ssssssss', $object_le_id, $object_node_id, $reflection_id, $lesson_text, $why_important, $opportunity, $created_at, $created_at);
            $lessonStmt->execute();
            if ($lessonStmt->error) {
                throw new Exception('insert lesson failed: ' . $lessonStmt->error);
            }
        }
        $lessonStmt->close();
    }

    $mysqli->commit();
    echo json_encode([
        'success' => true,
        'reflection_id' => $reflection_id,
        'created_at' => $created_at
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Exception $e) {
    $mysqli->rollback();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

?>
