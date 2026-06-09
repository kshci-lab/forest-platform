<?php
// Snapshot save for SRL journal reflections + lessons
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=UTF-8');

session_start();
require_once("connect_db.php");

date_default_timezone_set('Asia/Tokyo');

function read_json_body() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') === false) return [];
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function uuid_v4() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function get_table_columns($mysqli, $table) {
    static $cache = [];
    if (isset($cache[$table])) return $cache[$table];
    $cols = [];
    $res = $mysqli->query("DESCRIBE `{$table}`");
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $cols[] = $row['Field'];
        }
    }
    $cache[$table] = $cols;
    return $cols;
}

function build_insert_stmt($mysqli, $table, $data) {
    $columns = get_table_columns($mysqli, $table);
    $keys = [];
    $values = [];
    foreach ($data as $k => $v) {
        if (in_array($k, $columns, true)) {
            $keys[] = $k;
            $values[] = $v;
        }
    }
    if (count($keys) === 0) {
        throw new Exception("no insertable columns for {$table}");
    }
    $colSql = '`' . implode('`,`', $keys) . '`';
    $placeholders = implode(',', array_fill(0, count($keys), '?'));
    $sql = "INSERT INTO `{$table}` ({$colSql}) VALUES ({$placeholders})";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) throw new Exception("prepare failed for {$table}: " . $mysqli->error);

    $types = str_repeat('s', count($values));
    $bindParams = [$types];
    for ($i = 0; $i < count($values); $i++) {
        $bindParams[] = &$values[$i];
    }
    call_user_func_array([$stmt, 'bind_param'], $bindParams);
    return [$stmt, $keys, $values];
}

$body = read_json_body();

$object_journal_id = $_POST['object_journal_id'] ?? ($body['object_journal_id'] ?? '');
$reflections_raw = $_POST['reflections'] ?? $_POST['reflections_json'] ?? ($body['reflections'] ?? ($body['reflections_json'] ?? null));

if ($object_journal_id === '') {
    echo json_encode(['success' => false, 'error' => 'object_journal_id missing']);
    exit;
}

$reflections = [];
if (is_string($reflections_raw) && $reflections_raw !== '') {
    $decoded = json_decode($reflections_raw, true);
    if (is_array($decoded)) $reflections = $decoded;
} elseif (is_array($reflections_raw)) {
    $reflections = $reflections_raw;
}

if (!is_array($reflections) || count($reflections) === 0) {
    echo json_encode(['success' => false, 'error' => 'reflections array missing']);
    exit;
}

$map_id = $_SESSION['MAPID'] ?? ($body['map_id'] ?? null);
$now = date('Y-m-d H:i:s');

try {
    $mysqli->begin_transaction();

    // Validate required columns exist
    $histCols = get_table_columns($mysqli, 'object_journal_history_records');
    if (!in_array('journal_history_id', $histCols, true) || !in_array('object_journal_id', $histCols, true)) {
        throw new Exception('object_journal_history_records missing required columns');
    }
    $refCols = get_table_columns($mysqli, 'object_journal_reflections');
    if (!in_array('object_journal_reflection_id', $refCols, true) || !in_array('object_journal_id', $refCols, true) || !in_array('journal_history_id', $refCols, true)) {
        throw new Exception('object_journal_reflections missing required columns');
    }
    $lessonCols = get_table_columns($mysqli, 'object_journal_lesson-learneds');
    if (!in_array('object_journal_reflection_id', $lessonCols, true) || !in_array('lesson_learned', $lessonCols, true)) {
        throw new Exception('object_journal_lesson-learneds missing required columns');
    }

    $journal_history_id = uuid_v4();

    // Insert history parent record
    $historyData = [
        'journal_history_id' => $journal_history_id,
        'object_journal_id' => $object_journal_id,
        'created_at' => $now,
        'updated_at' => $now,
        'deleted' => 0
    ];
    if ($map_id !== null) $historyData['map_id'] = $map_id;

    list($stmtHist) = build_insert_stmt($mysqli, 'object_journal_history_records', $historyData);
    $stmtHist->execute();
    if ($stmtHist->error) throw new Exception('insert history failed: ' . $stmtHist->error);
    $stmtHist->close();

    $reflectionCount = 0;
    $lessonCount = 0;

    foreach ($reflections as $reflection) {
        if (!is_array($reflection)) continue;

        $object_journal_reflection_id = uuid_v4();

        $refData = [
            'object_journal_reflection_id' => $object_journal_reflection_id,
            'object_journal_id' => $object_journal_id,
            'journal_history_id' => $journal_history_id,
            'evaluation_good' => $reflection['evaluation_good'] ?? '',
            'evaluation_bad' => $reflection['evaluation_bad'] ?? '',
            'attribution' => $reflection['attribution'] ?? ($reflection['attribution_good'] ?? ''),
            'attribution_good' => $reflection['attribution_good'] ?? '',
            'attribution_bad' => $reflection['attribution_bad'] ?? '',
            'reflection_text' => $reflection['reflection_text'] ?? '',
            'created_at' => $now,
            'update_at' => $now,
            'updated_at' => $now,
            'appeared_at' => $now,
            'deleted' => 0
        ];
        if ($map_id !== null) $refData['map_id'] = $map_id;

        list($stmtRef) = build_insert_stmt($mysqli, 'object_journal_reflections', $refData);
        $stmtRef->execute();
        if ($stmtRef->error) throw new Exception('insert reflection failed: ' . $stmtRef->error);
        $stmtRef->close();
        $reflectionCount++;

        $lessons = [];
        if (isset($reflection['lessons'])) {
            if (is_string($reflection['lessons'])) {
                $decodedLessons = json_decode($reflection['lessons'], true);
                if (is_array($decodedLessons)) $lessons = $decodedLessons;
            } elseif (is_array($reflection['lessons'])) {
                $lessons = $reflection['lessons'];
            }
        }

        foreach ($lessons as $lesson) {
            if (!is_array($lesson)) continue;
            $lessonText = trim($lesson['lesson'] ?? ($lesson['lesson_learned'] ?? ''));
            $opportunity = trim($lesson['opportunity'] ?? '');
            if ($lessonText === '' && $opportunity === '') continue;

            $lessonData = [
                'object_journal_lesson-learned_id' => uuid_v4(),
                'object_journal_reflection_id' => $object_journal_reflection_id,
                'lesson_learned' => $lessonText,
                'opportunity' => $opportunity,
                'created_at' => $now,
                'updated_at' => $now,
                'deleted' => 0
            ];
            if ($map_id !== null) $lessonData['map_id'] = $map_id;

            list($stmtLesson) = build_insert_stmt($mysqli, 'object_journal_lesson-learneds', $lessonData);
            $stmtLesson->execute();
            if ($stmtLesson->error) throw new Exception('insert lesson failed: ' . $stmtLesson->error);
            $stmtLesson->close();
            $lessonCount++;
        }
    }

    $mysqli->commit();
    echo json_encode([
        'success' => true,
        'journal_history_id' => $journal_history_id,
        'reflections' => $reflectionCount,
        'lessons' => $lessonCount
    ]);
} catch (Exception $e) {
    try { $mysqli->rollback(); } catch (Exception $ex) { /* ignore */ }
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

?>
