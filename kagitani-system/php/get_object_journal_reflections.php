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
    $sql = "SELECT object_journal_reflection_id, object_journal_id, journal_history_id, evaluation_good, evaluation_bad, attribution, attribution_bad, created_at, update_at, deleted FROM object_journal_reflections WHERE object_journal_id = ? AND deleted = 0 AND journal_history_id IS NOT NULL ORDER BY update_at DESC";
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

        // Group by journal_history_id to build snapshot sets
        $groups = array();
        foreach ($reflections as $row) {
            $hid = isset($row['journal_history_id']) ? $row['journal_history_id'] : '';
            if ($hid === '' || $hid === null) continue;
            if (!isset($groups[$hid])) {
                $groups[$hid] = array(
                    'journal_history_id' => $hid,
                    'created_at' => isset($row['created_at']) ? $row['created_at'] : null,
                    'update_at' => isset($row['update_at']) ? $row['update_at'] : null,
                    'reflections' => array()
                );
            }
            // Track latest update_at within the snapshot
            if (isset($row['update_at'])) {
                $cur = $groups[$hid]['update_at'];
                if ($cur === null || strtotime($row['update_at']) > strtotime($cur)) {
                    $groups[$hid]['update_at'] = $row['update_at'];
                }
            }
            if (isset($row['created_at'])) {
                $curc = $groups[$hid]['created_at'];
                if ($curc === null || strtotime($row['created_at']) < strtotime($curc)) {
                    $groups[$hid]['created_at'] = $row['created_at'];
                }
            }
            $groups[$hid]['reflections'][] = $row;
        }

        $snapshots = array_values($groups);
        usort($snapshots, function($a, $b){
            $ta = isset($a['update_at']) ? strtotime($a['update_at']) : 0;
            $tb = isset($b['update_at']) ? strtotime($b['update_at']) : 0;
            return $tb - $ta;
        });

        $latestSnapshot = count($snapshots) > 0 ? $snapshots[0] : null;

        // Exclude the latest snapshot (most recent update_at) from history
        if (count($snapshots) > 1) {
            $snapshots = array_slice($snapshots, 1);
        } else {
            $snapshots = array();
        }

        $out = array('success' => true, 'snapshots' => $snapshots, 'latest_snapshot' => $latestSnapshot);
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
