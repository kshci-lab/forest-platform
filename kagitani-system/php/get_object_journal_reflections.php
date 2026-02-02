<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

if (!isset($_GET['object_journal_id']) || !$_GET['object_journal_id']) {
    echo json_encode(array('success' => false, 'error' => 'missing object_journal_id'));
    exit;
}
$object_journal_id = $_GET['object_journal_id'];

// debug flag: if debug=1 is passed, include detailed server-side messages in the JSON response
$debugMode = (isset($_GET['debug']) && ($_GET['debug'] == '1' || $_GET['debug'] === 1));
$debug = array();

// include project DB connection (adjust path relative to this file)
require_once __DIR__ . '/../../php/connect_db.php';

if (!isset($mysqli)) {
    echo json_encode(array('success' => false, 'error' => 'db connection not available'));
    exit;
}

try {
    $sql = "SELECT object_journal_reflection_id, object_journal_id, evaluation_good, evaluation_bad, attribution, attribution_bad, created_at, update_at, deleted FROM object_journal_reflections WHERE object_journal_id = ? AND deleted = 0 ORDER BY update_at ";
    if ($stmt = $mysqli->prepare($sql)) {
        $debug[] = 'prepared reflection select';
        // object_journal_id may be a string (e.g. 'goal_...'), bind as string
        $stmt->bind_param('s', $object_journal_id);
        $debug[] = 'bound object_journal_id=' . $object_journal_id;
        $stmt->execute();
        $res = $stmt->get_result();
        $reflections = array();
        if ($res) {
            // check if lesson-learneds table exists once
            $lessonTableExists = false;
            try {
                $ltQry = "SHOW TABLES LIKE 'object_journal_lesson-learneds'";
                $ltRes = $mysqli->query($ltQry);
                if ($ltRes && $ltRes->num_rows) $lessonTableExists = true;
            } catch (Exception $e) { $lessonTableExists = false; }

            while ($row = $res->fetch_assoc()) {
                $debug[] = 'fetched reflection row id=' . ($row['object_journal_reflection_id'] ?? '(none)');
                $lessons = array();
                if ($lessonTableExists) {
                    try {
                        $lrSql = "SELECT `object_journal_lesson-learned_id`, `object_journal_reflection_id`, `lesson_learned`, `opportunity`, `created_at`, `updated_at`, `deleted` FROM `object_journal_lesson-learneds` WHERE `object_journal_reflection_id` = ? ORDER BY `created_at` ASC";
                        if ($lrStmt = $mysqli->prepare($lrSql)) {
                            $rid = $row['object_journal_reflection_id'];
                            $lrStmt->bind_param('s', $rid);
                            $lrStmt->execute();
                            $lres = $lrStmt->get_result();
                            if ($lres) {
                                while ($lr = $lres->fetch_assoc()) {
                                    $lessons[] = $lr;
                                }
                            }
                            $lrStmt->close();
                        }
                    } catch (Exception $e) {
                        // ignore lesson fetch errors per-reflection
                    }
                }
                $row['lessons'] = $lessons;
                $reflections[] = $row;
            }
        }

        $out = array('success' => true, 'reflections' => $reflections);
        if ($debugMode) $out['debug'] = $debug;
        echo json_encode($out);
        $stmt->close();
    } else {
        $out = array('success' => false, 'error' => 'prepare_failed', 'errno' => $mysqli->errno, 'error_msg' => $mysqli->error);
        if ($debugMode) { $debug[] = 'prepare failed: ' . $mysqli->error; $out['debug'] = $debug; }
        echo json_encode($out);
    }
} catch (Exception $e) {
    $out = array('success' => false, 'error' => 'exception', 'message' => $e->getMessage());
    if ($debugMode) { $debug[] = 'exception: ' . $e->getMessage(); $out['debug'] = $debug; }
    echo json_encode($out);
}

exit;
