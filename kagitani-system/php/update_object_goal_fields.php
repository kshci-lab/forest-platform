<?php
require_once('connect_db.php');
header('Content-Type: application/json; charset=utf-8');

$object_journal_id = isset($_POST['object_journal_id']) ? $_POST['object_journal_id'] : null;
$evaluation_good = isset($_POST['evaluation_good']) ? $_POST['evaluation_good'] : null;
$evaluation_bad = isset($_POST['evaluation_bad']) ? $_POST['evaluation_bad'] : null;
$attribution = isset($_POST['attribution']) ? $_POST['attribution'] : null;
$application = isset($_POST['application']) ? $_POST['application'] : null;
$update_at = isset($_POST['update_at']) ? $_POST['update_at'] : null;
// new: separate attribution fields for success/failure
$attribution_good = isset($_POST['attribution_good']) ? $_POST['attribution_good'] : null;
$attribution_bad = isset($_POST['attribution_bad']) ? $_POST['attribution_bad'] : null;

if (!$object_journal_id) {
    echo json_encode(['success' => false, 'error' => 'Missing object_journal_id']);
    exit;
}

if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
    echo json_encode(['success' => false, 'error' => 'Database connection not available']);
    exit;
}

$evaluation_good = ($evaluation_good === null) ? '' : $evaluation_good;
$evaluation_bad = ($evaluation_bad === null) ? '' : $evaluation_bad;
$attribution = ($attribution === null) ? '' : $attribution;
// `application` column was removed from `object_journals`; ignore any incoming application value here.
$update_at = ($update_at === null) ? date('Y-m-d H:i:s') : $update_at;

// Keep object_journal_id as string because IDs in this app can be non-numeric (e.g. 'goal_...')
$object_journal_id_str = $object_journal_id;

try {
    // Check which columns exist on object_journals so we only try to update present columns
    $cols = array();
    $colRes = $mysqli->query("SHOW COLUMNS FROM object_journals");
    if ($colRes) {
        while ($r = $colRes->fetch_assoc()) { $cols[] = $r['Field']; }
        $colRes->free();
    }

    $canUpdateOJ = false;
    $updParts = array();
    $params = array();
    $types = '';
    if (in_array('evaluation_good', $cols)) { $canUpdateOJ = true; $updParts[] = 'evaluation_good = ?'; $params[] = $evaluation_good; $types .= 's'; }
    if (in_array('evaluation_bad', $cols))  { $canUpdateOJ = true; $updParts[] = 'evaluation_bad = ?';  $params[] = $evaluation_bad;  $types .= 's'; }
    if (in_array('attribution', $cols))     { $canUpdateOJ = true; $updParts[] = 'attribution = ?';     $params[] = $attribution;      $types .= 's'; }
    if (in_array('update_at', $cols))       { if (!in_array('update_at', $cols)){} }

    if ($canUpdateOJ && count($updParts)) {
        $updParts[] = 'update_at = ?';
        $params[] = $update_at;
        $types .= 's';
        $sql = 'UPDATE object_journals SET ' . implode(', ', $updParts) . ' WHERE object_journal_id = ?';
        $params[] = $object_journal_id_str;
        $types .= 's';
        $stmt = $mysqli->prepare($sql);
        if (!$stmt) {
            echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $mysqli->error]);
            exit;
        }
        // bind params dynamically
        $bind_names[] = $types;
        for ($i = 0; $i < count($params); $i++) {
            $bind_name = 'bind' . $i;
            $$bind_name = $params[$i];
            $bind_names[] = &$$bind_name;
        }
        call_user_func_array(array($stmt, 'bind_param'), $bind_names);
        $res = $stmt->execute();
        if (!$res) {
            // continue, but report failure
            error_log('update_object_goal_fields: object_journals update failed: ' . $stmt->error);
        }
        $stmt->close();
    }

    // Regardless of whether object_journals was updated, insert a reflection record if reflections table exists
    $hasRefTable = false;
    $r = $mysqli->query("SHOW TABLES LIKE 'object_journal_reflections'");
    if ($r && $r->num_rows) { $hasRefTable = true; $r->free(); }

    if ($hasRefTable) {
        // Discover reflection table columns
        $refCols = array();
        $cr = $mysqli->query("SHOW COLUMNS FROM object_journal_reflections");
        if ($cr) { while ($rr = $cr->fetch_assoc()) { $refCols[] = $rr['Field']; } $cr->free(); }

        // Try to find an existing reflection to UPDATE instead of inserting duplicate
        $existing_reflection_id = null;
        if (isset($_POST['object_journal_reflection_id']) && trim($_POST['object_journal_reflection_id']) !== '') {
            $chk = $mysqli->prepare('SELECT object_journal_reflection_id FROM object_journal_reflections WHERE object_journal_reflection_id = ? LIMIT 1');
            if ($chk) {
                $rid = trim($_POST['object_journal_reflection_id']);
                $chk->bind_param('s', $rid);
                $chk->execute();
                $chk->bind_result($foundId);
                if ($chk->fetch()) $existing_reflection_id = $foundId;
                $chk->close();
            }
        }

        // If an existing reflection was found and the caller provided attribution_bad,
        // fetch the current value so we can append instead of blindly overwriting.
        if ($existing_reflection_id !== null && isset($_POST['attribution_bad']) && trim($_POST['attribution_bad']) !== '') {
            // only attempt fetch if column exists
            if (in_array('attribution_bad', $refCols)) {
                $g = $mysqli->prepare('SELECT attribution_bad FROM object_journal_reflections WHERE object_journal_reflection_id = ? LIMIT 1');
                if ($g) {
                    $g->bind_param('s', $existing_reflection_id);
                    $g->execute();
                    $g->bind_result($currBad);
                    if ($g->fetch()) {
                        // combine existing + incoming, separated by double newline when both present
                        $incoming = trim($_POST['attribution_bad']);
                        $currBad = ($currBad === null) ? '' : $currBad;
                        if ($currBad !== '' && $incoming !== '') {
                            // avoid duplicating exact same text
                            if (strpos($currBad, $incoming) === false) $attribution_bad = $currBad . "\n\n" . $incoming;
                            else $attribution_bad = $currBad;
                        } else {
                            $attribution_bad = ($incoming !== '') ? $incoming : $currBad;
                        }
                    }
                    $g->close();
                }
            }
        }

        if ($existing_reflection_id === null) {
            // find by object_journal_id (and map_id if present)
            $whereSql = 'object_journal_id = ?';
            $whereParams = array($object_journal_id_str);
            $typesWhere = 's';
            if (in_array('map_id', $refCols) && isset($_POST['map_id'])) {
                $whereSql .= ' AND map_id = ?';
                $whereParams[] = (int)$_POST['map_id'];
                $typesWhere .= 'i';
            }
            $selSql = 'SELECT object_journal_reflection_id FROM object_journal_reflections WHERE ' . $whereSql . ' ORDER BY ' . (in_array('created_at', $refCols) ? 'created_at' : (in_array('appeared_at', $refCols) ? 'appeared_at' : 'update_at')) . ' DESC LIMIT 1';
            $sel = $mysqli->prepare($selSql);
            if ($sel) {
                // bind where params
                $bind_names = array();
                $bind_names[] = $typesWhere;
                for ($i = 0; $i < count($whereParams); $i++) {
                    $pname = 'w' . $i;
                    $$pname = $whereParams[$i];
                    $bind_names[] = &$$pname;
                }
                call_user_func_array(array($sel, 'bind_param'), $bind_names);
                $sel->execute();
                $sel->bind_result($foundId2);
                if ($sel->fetch()) $existing_reflection_id = $foundId2;
                $sel->close();
            }
        }

        // Build update/insert parameters from allowed columns
        $fieldsToSet = array();
        $params = array();
        $types = '';
        if (in_array('object_journal_id', $refCols)) { $fieldsToSet['object_journal_id'] = $object_journal_id_str; }
        if (in_array('evaluation_good', $refCols)) { $fieldsToSet['evaluation_good'] = $evaluation_good; }
        if (in_array('evaluation_bad', $refCols))  { $fieldsToSet['evaluation_bad'] = $evaluation_bad; }
        if (in_array('attribution', $refCols)) {
            // Prefer explicit `attribution` if provided; otherwise, fall back to `attribution_good` when available
            if (isset($_POST['attribution'])) $fieldsToSet['attribution'] = $attribution;
            else if (isset($_POST['attribution_good'])) $fieldsToSet['attribution'] = $attribution_good;
        }
        // support separate attribution columns when they exist
        if (in_array('attribution_good', $refCols)) {
            // prefer explicit attribution_good if provided; otherwise fall back to legacy `attribution`
            if ($attribution_good === null) $fieldsToSet['attribution_good'] = $attribution;
            else $fieldsToSet['attribution_good'] = $attribution_good;
        }
        // Only include attribution_bad in the update/insert when the client explicitly provided it.
        // Previously we would set it to empty string when not provided, which could clear existing data.
        if (in_array('attribution_bad', $refCols) && isset($_POST['attribution_bad'])) {
            $fieldsToSet['attribution_bad'] = ($attribution_bad === null) ? '' : $attribution_bad;
        }
        if (in_array('reflection_text', $refCols) && isset($_POST['reflection_text'])) { $fieldsToSet['reflection_text'] = $_POST['reflection_text']; }
        if (in_array('created_at', $refCols)) { $fieldsToSet['created_at'] = (isset($_POST['created_at']) ? $_POST['created_at'] : date('Y-m-d H:i:s')); }
        if (in_array('update_at', $refCols))  { $fieldsToSet['update_at']  = (isset($_POST['update_at']) ? $_POST['update_at'] : date('Y-m-d H:i:s')); }
        if (in_array('deleted', $refCols))    { $fieldsToSet['deleted']    = 0; }

        if ($existing_reflection_id !== null) {
            // perform UPDATE
            $setParts = array();
            $bindParams = array();
            $bindTypes = '';
            foreach ($fieldsToSet as $col => $val) {
                $setParts[] = '`' . $col . '` = ?';
                $bindParams[] = $val;
                $bindTypes .= is_int($val) ? 'i' : 's';
            }
            if (count($setParts)) {
                $sqlUpd = 'UPDATE object_journal_reflections SET ' . implode(', ', $setParts) . ' WHERE object_journal_reflection_id = ?';
                $bindParams[] = $existing_reflection_id;
                $bindTypes .= 's';
                $stmtUpd = $mysqli->prepare($sqlUpd);
                if ($stmtUpd) {
                    $bn = array(); $bn[] = $bindTypes;
                    for ($i=0;$i<count($bindParams);$i++) { $pname = 'bp' . $i; $$pname = $bindParams[$i]; $bn[] = &$$pname; }
                    call_user_func_array(array($stmtUpd, 'bind_param'), $bn);
                    if (!$stmtUpd->execute()) { error_log('update_object_goal_fields: update reflection failed: ' . $stmtUpd->error); }
                    $stmtUpd->close();
                    // set reflection id for lesson handling
                    $reflection_id_for_lessons = $existing_reflection_id;
                } else { error_log('update_object_goal_fields: prepare reflection update failed: ' . $mysqli->error); }
            }
        } else {
            // perform INSERT
            $insFields = array();
            $insPlaceholders = array();
            $insParams = array();
            $insTypes = '';
            if (in_array('object_journal_reflection_id', $refCols)) { $insFields[] = '`object_journal_reflection_id`'; $insPlaceholders[] = '?'; $insParams[] = uniqid('ojr_', true); $insTypes .= 's'; }
            foreach ($fieldsToSet as $col => $val) { $insFields[] = '`' . $col . '`'; $insPlaceholders[] = '?'; $insParams[] = $val; $insTypes .= is_int($val) ? 'i' : 's'; }
            if (count($insFields)) {
                $insSql = 'INSERT INTO object_journal_reflections (' . implode(', ', $insFields) . ') VALUES (' . implode(', ', $insPlaceholders) . ')';
                $stmt2 = $mysqli->prepare($insSql);
                if ($stmt2) {
                    // dynamic bind
                    $bind_names = array();
                    $bind_names[] = $insTypes;
                    for ($i=0;$i<count($insParams);$i++) {
                        $pname = 'p' . $i;
                        $$pname = $insParams[$i];
                        $bind_names[] = &$$pname;
                    }
                    call_user_func_array(array($stmt2, 'bind_param'), $bind_names);
                    $execRes = $stmt2->execute();
                    if (!$execRes) {
                        error_log('update_object_goal_fields: insert reflection failed: ' . $stmt2->error);
                    }
                    // capture inserted reflection id when we generated one
                    // if we included object_journal_reflection_id in the insert, it will be the first insParams element
                    $inserted_reflection_id = null;
                    if (in_array('object_journal_reflection_id', $refCols)) {
                        // we created one earlier in $insParams as uniqid('ojr_', true)
                        // find which param corresponds to that column: insFields index
                        foreach ($insFields as $k => $colName) {
                            if (trim($colName, '`') === 'object_journal_reflection_id') {
                                $inserted_reflection_id = $insParams[$k];
                                break;
                            }
                        }
                    } else {
                        // fallback to insert_id if numeric
                        if ($mysqli->insert_id) $inserted_reflection_id = $mysqli->insert_id;
                    }
                    $stmt2->close();
                } else {
                    error_log('update_object_goal_fields: prepare reflection insert failed: ' . $mysqli->error);
                }
            }
        }
        // If we have a reflection id (either existing or just inserted) and reflection_text provided, handle lesson-learneds
        $reflection_id_for_lessons = isset($reflection_id_for_lessons) ? $reflection_id_for_lessons : (isset($inserted_reflection_id) ? $inserted_reflection_id : null);
        if ($reflection_id_for_lessons && isset($_POST['reflection_text']) && trim($_POST['reflection_text']) !== '') {
            $reflectionText = trim($_POST['reflection_text']);
            // check lesson-learneds table existence
            $ltres = $mysqli->query("SHOW TABLES LIKE 'object_journal_lesson-learneds'");
            if ($ltres && $ltres->num_rows) {
                // split into lessons by double newlines
                $parts = preg_split('/\r?\n\s*\r?\n/', $reflectionText);
                if (!is_array($parts) || count($parts) === 0) $parts = array($reflectionText);
                $lessons = array();
                foreach ($parts as $p) { $t = trim($p); if ($t !== '') $lessons[] = $t; }
                if (count($lessons) === 0) $lessons = array($reflectionText);

                // fetch existing lessons
                $sel = $mysqli->prepare('SELECT `object_journal_lesson-learned_id`, `lesson_learned` FROM `object_journal_lesson-learneds` WHERE `object_journal_reflection_id` = ? ORDER BY `created_at` ASC');
                if ($sel) {
                    $sel->bind_param('s', $reflection_id_for_lessons);
                    $sel->execute();
                    $resSel = $sel->get_result();
                    $existing = array();
                    if ($resSel) {
                        while ($r = $resSel->fetch_assoc()) $existing[] = $r;
                    }
                    $sel->close();

                    $now = date('Y-m-d H:i:s');
                    // update or insert
                    for ($i = 0; $i < count($lessons); $i++) {
                        $lessonText = $lessons[$i];
                        if (isset($existing[$i])) {
                            $lid = $existing[$i]['object_journal_lesson-learned_id'];
                            $up = $mysqli->prepare('UPDATE `object_journal_lesson-learneds` SET `lesson_learned` = ?, `updated_at` = ? WHERE `object_journal_lesson-learned_id` = ?');
                            if ($up) { $up->bind_param('sss', $lessonText, $now, $lid); $up->execute(); $up->close(); }
                        } else {
                            $newId = uniqid('ojl_', true);
                            $ins = $mysqli->prepare('INSERT INTO `object_journal_lesson-learneds` (`object_journal_lesson-learned_id`, `object_journal_reflection_id`, `lesson_learned`, `created_at`, `updated_at`, `deleted`) VALUES (?, ?, ?, ?, ?, ?)');
                            if ($ins) { $delFlag = 0; $ins->bind_param('sssssi', $newId, $reflection_id_for_lessons, $lessonText, $now, $now, $delFlag); $ins->execute(); $ins->close(); }
                        }
                    }
                    // delete extras
                    if (count($existing) > count($lessons)) {
                        for ($j = count($lessons); $j < count($existing); $j++) {
                            $delId = $existing[$j]['object_journal_lesson-learned_id'];
                            $d = $mysqli->prepare('DELETE FROM `object_journal_lesson-learneds` WHERE `object_journal_lesson-learned_id` = ?');
                            if ($d) { $d->bind_param('s', $delId); $d->execute(); $d->close(); }
                        }
                    }
                }
            }
        }
    }

    // Return success even if object_journals had no columns to update; client will handle
    echo json_encode(['success' => true]);

} catch (mysqli_sql_exception $ex) {
    // Return JSON error instead of letting PHP throw a fatal exception outputting HTML
    echo json_encode(['success' => false, 'error' => 'MySQLi exception: ' . $ex->getMessage()]);
    exit;
}

?>
