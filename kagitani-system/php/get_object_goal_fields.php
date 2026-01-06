<?php
require_once('connect_db.php');
header('Content-Type: application/json; charset=utf-8');

$object_journal_id = isset($_GET['object_journal_id']) ? $_GET['object_journal_id'] : (isset($_POST['object_journal_id']) ? $_POST['object_journal_id'] : null);
if (!$object_journal_id) {
    echo json_encode(['success' => false, 'error' => 'Missing object_journal_id']);
    exit;
}

if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
    echo json_encode(['success' => false, 'error' => 'Database connection not available']);
    exit;
}

try {
    // Discover which columns actually exist in object_journals to avoid unknown column errors
    $availableCols = [];
    $cr = $mysqli->query("SHOW COLUMNS FROM object_journals");
    if ($cr) {
        while ($r = $cr->fetch_assoc()) { $availableCols[] = $r['Field']; }
        $cr->free();
    }

    $selectParts = [];
    // Prefer new column names, fall back to legacy column names where appropriate
    if (in_array('evaluation_good', $availableCols)) {
        $selectParts[] = 'evaluation_good';
    } else if (in_array('success_points', $availableCols)) {
        $selectParts[] = 'success_points AS evaluation_good';
    }

    if (in_array('evaluation_bad', $availableCols)) {
        $selectParts[] = 'evaluation_bad';
    } else if (in_array('failure_points', $availableCols)) {
        $selectParts[] = 'failure_points AS evaluation_bad';
    }

    if (in_array('attribution', $availableCols)) {
        $selectParts[] = 'attribution';
    }
    if (in_array('application', $availableCols)) {
        $selectParts[] = 'application';
    }

    if (count($selectParts) === 0) {
        // No compatible columns on object_journals; return success with empty fields
        echo json_encode(['success' => true, 'evaluation_good' => '', 'evaluation_bad' => '', 'attribution' => '', 'application' => '']);
        exit;
    }

    $sql = 'SELECT ' . implode(', ', $selectParts) . ' FROM object_journals WHERE object_journal_id = ? LIMIT 1';
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $mysqli->error]);
        exit;
    }
    $stmt->bind_param('s', $object_journal_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = ($res) ? $res->fetch_assoc() : null;
    // Helper to return a successful JSON payload
    $returnPayload = array('success' => true, 'evaluation_good' => '', 'evaluation_bad' => '', 'attribution' => '', 'application' => '');
    if ($row) {
        $returnPayload['evaluation_good'] = isset($row['evaluation_good']) ? $row['evaluation_good'] : (isset($row['success_points']) ? $row['success_points'] : '');
        $returnPayload['evaluation_bad'] = isset($row['evaluation_bad']) ? $row['evaluation_bad'] : (isset($row['failure_points']) ? $row['failure_points'] : '');
        $returnPayload['attribution'] = isset($row['attribution']) ? $row['attribution'] : '';
        $returnPayload['application'] = isset($row['application']) ? $row['application'] : '';
    }
    $stmt->close();

    // Always try to fetch the latest reflection for this object_journal_id and prefer its values
    $r = $mysqli->query("SHOW TABLES LIKE 'object_journal_reflections'");
    if ($r && $r->num_rows) {
        $r->free();
        // discover reflection columns
        $refCols = array();
        $cr = $mysqli->query("SHOW COLUMNS FROM object_journal_reflections");
        if ($cr) { while ($rr = $cr->fetch_assoc()) { $refCols[] = $rr['Field']; } $cr->free(); }

        $selectParts = array();
        if (in_array('evaluation_good', $refCols)) $selectParts[] = 'evaluation_good';
        if (in_array('evaluation_bad', $refCols)) $selectParts[] = 'evaluation_bad';
        if (in_array('attribution', $refCols)) $selectParts[] = 'attribution';
        if (in_array('reflection_text', $refCols)) $selectParts[] = 'reflection_text';
        if (in_array('object_journal_reflection_id', $refCols)) $selectParts[] = 'object_journal_reflection_id';
        if (in_array('created_at', $refCols)) $orderBy = 'created_at';
        else if (in_array('appeared_at', $refCols)) $orderBy = 'appeared_at';
        else $orderBy = 'update_at';

        if (count($selectParts)) {
            $sqlRef = 'SELECT ' . implode(', ', $selectParts) . ' FROM object_journal_reflections WHERE object_journal_id = ? ORDER BY ' . $orderBy . ' DESC LIMIT 1';
            $stmtRef = $mysqli->prepare($sqlRef);
            if ($stmtRef) {
                $stmtRef->bind_param('s', $object_journal_id);
                $stmtRef->execute();
                $resRef = $stmtRef->get_result();
                if ($resRef && $rrow = $resRef->fetch_assoc()) {
                    // Prefer reflection values over object_journals values when present
                    if (isset($rrow['evaluation_good']) && $rrow['evaluation_good'] !== '') $returnPayload['evaluation_good'] = $rrow['evaluation_good'];
                    if (isset($rrow['evaluation_bad']) && $rrow['evaluation_bad'] !== '') $returnPayload['evaluation_bad'] = $rrow['evaluation_bad'];
                    if (isset($rrow['attribution']) && $rrow['attribution'] !== '') $returnPayload['attribution'] = $rrow['attribution'];
                    if (isset($rrow['reflection_text']) && $rrow['reflection_text'] !== '') $returnPayload['application'] = $rrow['reflection_text'];
                    if (isset($rrow['object_journal_reflection_id'])) $returnPayload['object_journal_reflection_id'] = $rrow['object_journal_reflection_id'];
                }
                $stmtRef->close();
            }
        }
    }

    // If we have a reflection id, try to fetch lesson-learneds from the lesson table
    try {
        $reflectionId = isset($returnPayload['object_journal_reflection_id']) ? $returnPayload['object_journal_reflection_id'] : null;
        // if not present, attempt to find latest reflection id for the journal
        if (!$reflectionId) {
            $chkRefT = $mysqli->query("SHOW TABLES LIKE 'object_journal_reflections'");
            if ($chkRefT && $chkRefT->num_rows) {
                $chkRefT->free();
                $sel = $mysqli->prepare('SELECT object_journal_reflection_id FROM object_journal_reflections WHERE object_journal_id = ? ORDER BY COALESCE(created_at, appeared_at, update_at) DESC LIMIT 1');
                if ($sel) {
                    $sel->bind_param('s', $object_journal_id);
                    $sel->execute();
                    $sel->bind_result($foundRid);
                    if ($sel->fetch()) $reflectionId = $foundRid;
                    $sel->close();
                }
            }
        }

        if ($reflectionId) {
            // check lesson table exists
            $lt = $mysqli->query("SHOW TABLES LIKE 'object_journal_lesson-learneds'");
            if ($lt && $lt->num_rows) {
                $lt->free();
                $lessSql = 'SELECT `object_journal_lesson-learned_id` AS object_le_id, `lesson_learned` FROM `object_journal_lesson-learneds` WHERE `object_journal_reflection_id` = ? ORDER BY created_at ASC';
                $lst = $mysqli->prepare($lessSql);
                if ($lst) {
                    $lst->bind_param('s', $reflectionId);
                    $lst->execute();
                    $resL = $lst->get_result();
                    $lessons = array();
                    if ($resL) {
                        while ($lr = $resL->fetch_assoc()) {
                            $lessons[] = array('object_le_id' => $lr['object_le_id'], 'lesson_learned' => $lr['lesson_learned']);
                        }
                    }
                    $lst->close();
                    if (count($lessons)) $returnPayload['additional_lessons'] = $lessons;
                }
            }
        }
    } catch (Exception $e) {
        // non-fatal: ignore
    }

    echo json_encode($returnPayload);
} catch (mysqli_sql_exception $ex) {
    echo json_encode(['success' => false, 'error' => 'MySQLi exception: ' . $ex->getMessage()]);
    exit;
}

?>
