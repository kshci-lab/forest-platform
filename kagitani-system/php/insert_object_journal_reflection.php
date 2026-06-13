<?php
// エラー表示を抑制（JSONレスポンスのために必須）
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=UTF-8');
session_start();

// DB接続情報を読み込み
require_once("connect_db.php");

// debug flag: when `debug=1` is passed via GET or POST, collect server-side messages
$debugMode = (isset($_REQUEST['debug']) && ($_REQUEST['debug'] == '1' || $_REQUEST['debug'] === 1));
$debug = array();

// PDO 接続（insert_object_goal.php に合わせた実装）

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_dbname;charset=utf8", $db_user, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    $out = ['success' => false, 'error' => 'DB接続失敗: ' . $e->getMessage()];
    if ($debugMode) { $debug[] = 'pdo connect failed: ' . $e->getMessage(); $out['debug'] = $debug; }
    echo json_encode($out);
    exit;
}

$object_journal_id = isset($_POST['object_journal_id']) ? trim($_POST['object_journal_id']) : '';
if ($object_journal_id === '') {
    $out = ['success' => false, 'error' => 'object_journal_id がありません'];
    if ($debugMode) { $debug[] = 'missing object_journal_id in POST'; $out['debug'] = $debug; }
    echo json_encode($out);
    exit;
}

$map_id = null;
if (isset($_POST['map_id'])) $map_id = $_POST['map_id'];
elseif (isset($_SESSION['MAPID'])) $map_id = $_SESSION['MAPID'];

$object_journal_reflection_id = isset($_POST['object_journal_reflection_id']) && trim($_POST['object_journal_reflection_id']) !== '' ? trim($_POST['object_journal_reflection_id']) : uniqid('ojr_', true);
$forceInsert = (isset($_POST['force_insert']) && ($_POST['force_insert'] == '1' || $_POST['force_insert'] === 1 || $_POST['force_insert'] === 'true')) ? true : false;
$appeared_at = date('Y-m-d H:i:s');
$update_at = $appeared_at;
$deleted = 0;

// Inspect table columns to build a compatible INSERT
try {
    $colsStmt = $pdo->query("DESCRIBE object_journal_reflections");
    $cols = $colsStmt->fetchAll(PDO::FETCH_ASSOC);
    $fields = array_map(function($r){ return $r['Field']; }, $cols);
} catch (Exception $e) {
    $out = ['success' => false, 'error' => 'object_journal_reflections テーブルが見つかりません: ' . $e->getMessage()];
    if ($debugMode) { $debug[] = 'describe object_journal_reflections failed: ' . $e->getMessage(); $out['debug'] = $debug; }
    echo json_encode($out);
    exit;
}

$insertCols = [];
$placeholders = [];
$bindings = [];

// Common columns we try to populate if present
// NOTE: do NOT include `object_journal_reflection_id` here by default; we will only
// add it when performing an INSERT. Including it before UPDATE caused the UPDATE
// to overwrite the primary key when we generated a new uniqid earlier.
if (in_array('object_journal_id', $fields)) { $insertCols[] = '`object_journal_id`'; $placeholders[] = ':object_journal_id'; $bindings[':object_journal_id'] = $object_journal_id; }
if (in_array('map_id', $fields) && $map_id !== null) { $insertCols[] = '`map_id`'; $placeholders[] = ':map_id'; $bindings[':map_id'] = (int)$map_id; }

// Accept evaluation and attribution if provided in POST and table has the columns
if (in_array('evaluation_good', $fields) && isset($_POST['evaluation_good'])) { $insertCols[] = '`evaluation_good`'; $placeholders[] = ':evaluation_good'; $bindings[':evaluation_good'] = trim($_POST['evaluation_good']); }
if (in_array('evaluation_bad', $fields) && isset($_POST['evaluation_bad'])) { $insertCols[] = '`evaluation_bad`'; $placeholders[] = ':evaluation_bad'; $bindings[':evaluation_bad'] = trim($_POST['evaluation_bad']); }
if (in_array('attribution', $fields) && isset($_POST['attribution'])) { $insertCols[] = '`attribution`'; $placeholders[] = ':attribution'; $bindings[':attribution'] = trim($_POST['attribution']); }
// support separate attribution columns when they exist
if (in_array('attribution_good', $fields) && isset($_POST['attribution_good'])) { $insertCols[] = '`attribution_good`'; $placeholders[] = ':attribution_good'; $bindings[':attribution_good'] = trim($_POST['attribution_good']); }
if (in_array('attribution_bad', $fields) && isset($_POST['attribution_bad'])) { $insertCols[] = '`attribution_bad`'; $placeholders[] = ':attribution_bad'; $bindings[':attribution_bad'] = trim($_POST['attribution_bad']); }

// If the legacy `attribution` column exists but the client only provided
// `attribution_good`, also populate the legacy column so older consumers see the value.
if (in_array('attribution', $fields) && !isset($bindings[':attribution']) && isset($bindings[':attribution_good'])) {
    $insertCols[] = '`attribution`';
    $placeholders[] = ':attribution';
    $bindings[':attribution'] = $bindings[':attribution_good'];
}

// reflection_text optional
if (in_array('reflection_text', $fields)) { $insertCols[] = '`reflection_text`'; $placeholders[] = ':reflection_text'; $bindings[':reflection_text'] = (isset($_POST['reflection_text']) ? trim($_POST['reflection_text']) : ''); }

// created_at preferred (some schemas), otherwise appeared_at
if (in_array('created_at', $fields)) { $insertCols[] = '`created_at`'; $placeholders[] = ':created_at'; $bindings[':created_at'] = (isset($_POST['created_at']) ? trim($_POST['created_at']) : $appeared_at); }
else if (in_array('appeared_at', $fields)) { $insertCols[] = '`appeared_at`'; $placeholders[] = ':appeared_at'; $bindings[':appeared_at'] = $appeared_at; }

if (in_array('update_at', $fields)) { $insertCols[] = '`update_at`'; $placeholders[] = ':update_at'; $bindings[':update_at'] = (isset($_POST['update_at']) ? trim($_POST['update_at']) : $update_at); }

if (in_array('deleted', $fields) || in_array('delete', $fields)) {
    // prefer `deleted` then `delete`
    if (in_array('deleted', $fields)) { $insertCols[] = '`deleted`'; $placeholders[] = ':deleted'; $bindings[':deleted'] = (int)$deleted; }
    else { $insertCols[] = '`delete`'; $placeholders[] = ':delete'; $bindings[':delete'] = (int)$deleted; }
}

if (empty($insertCols)) {
    $out = ['success' => false, 'error' => '挿入または更新可能なカラムが見つかりません'];
    if ($debugMode) { $debug[] = 'no insertable columns detected'; $out['debug'] = $debug; }
    echo json_encode($out);
    exit;
}

// Determine whether to UPDATE an existing reflection or INSERT a new one.
// Priority: if client supplied object_journal_reflection_id -> update that id.
// Otherwise, try to find an existing reflection for the same object_journal_id (+ map_id if present) and update it.
try {
    $existing_reflection_id = null;
    if (!$forceInsert && isset($_POST['object_journal_reflection_id']) && trim($_POST['object_journal_reflection_id']) !== '') {
        // check that the provided id exists
        $chk = $pdo->prepare('SELECT `object_journal_reflection_id` FROM `object_journal_reflections` WHERE `object_journal_reflection_id` = :rid LIMIT 1');
        $chk->execute([':rid' => trim($_POST['object_journal_reflection_id'])]);
        $row = $chk->fetch(PDO::FETCH_ASSOC);
        if ($row) $existing_reflection_id = $row['object_journal_reflection_id'];
        if ($debugMode) { $debug[] = 'checked provided reflection id, exists=' . ($existing_reflection_id ? 'yes' : 'no'); }
    }

    if ($existing_reflection_id === null && !$forceInsert) {
        // Attempt to find by object_journal_id (+ map_id if present)
        $where = '`object_journal_id` = :object_journal_id';
        $params = [':object_journal_id' => $object_journal_id];
        if ($map_id !== null && in_array('map_id', $fields)) {
            $where .= ' AND `map_id` = :map_id';
            $params[':map_id'] = (int)$map_id;
        }
        // pick the most recent matching reflection if any
        $selSql = 'SELECT `object_journal_reflection_id` FROM `object_journal_reflections` WHERE ' . $where . ' ORDER BY ' . (in_array('created_at', $fields) ? '`created_at`' : (in_array('appeared_at', $fields) ? '`appeared_at`' : '`update_at`')) . ' DESC LIMIT 1';
        $sel = $pdo->prepare($selSql);
        $sel->execute($params);
        $r = $sel->fetch(PDO::FETCH_ASSOC);
        if ($r) {
            $existing_reflection_id = $r['object_journal_reflection_id'];
            if ($debugMode) $debug[] = 'found existing reflection by object_journal_id: ' . $existing_reflection_id;
        } else {
            if ($debugMode) $debug[] = 'no existing reflection found by object_journal_id';
        }
    }

    if ($existing_reflection_id !== null) {
        // Perform UPDATE on the found reflection id. Build SET list from $insertCols and $bindings.
        $setParts = [];
        $updateBindings = [];
        foreach ($insertCols as $idx => $col) {
            // $col contains backticks, convert to bare name for param
            $bare = trim($col, "` ");
            $param = ':' . $bare . '_u';
            $setParts[] = $col . ' = ' . $param;
            // find corresponding value from $bindings (matching placeholder or column)
            // we prepared bindings keyed by placeholders like ':reflection_text' etc.
            // guess the original placeholder by column name
            $origPlaceholder = ':' . $bare;
            if (array_key_exists($origPlaceholder, $bindings)) {
                $updateBindings[$param] = $bindings[$origPlaceholder];
            } else {
                // fallback: try without prefix (shouldn't occur)
                $updateBindings[$param] = isset($bindings[$bare]) ? $bindings[$bare] : null;
            }
        }
        $updateBindings[':object_journal_reflection_id'] = $existing_reflection_id;
        $updateSql = 'UPDATE `object_journal_reflections` SET ' . implode(', ', $setParts) . ' WHERE `object_journal_reflection_id` = :object_journal_reflection_id';
        $ustmt = $pdo->prepare($updateSql);
        foreach ($updateBindings as $k => $v) {
            if (is_int($v)) $ustmt->bindValue($k, $v, PDO::PARAM_INT);
            else $ustmt->bindValue($k, $v, PDO::PARAM_STR);
        }
        $ustmt->execute();
        if ($debugMode) $debug[] = 'executed reflection UPDATE';

        // After updating reflection, handle lesson-learneds.
        try {
            $lessonTableExists = false;
            try {
                $lt = $pdo->query("SHOW TABLES LIKE 'object_journal_lesson-learneds'");
                if ($lt && $lt->rowCount()) { $lessonTableExists = true; }
            } catch (Exception $e) { $lessonTableExists = false; }
            if ($lessonTableExists) {
                $rows = array();
                // If client provided structured lessons JSON, prefer that
                if (isset($_POST['lessons']) && trim($_POST['lessons']) !== '') {
                    $raw = $_POST['lessons'];
                    // attempt to JSON-decode; allow magic-quoted strings
                    $decoded = json_decode($raw, true);
                    if ($decoded && is_array($decoded)) {
                        foreach ($decoded as $it) {
                            $w = '';
                            if (is_array($it)) {
                                if (isset($it['lesson'])) $l = trim($it['lesson']);
                                if (isset($it['opportunity'])) $o = trim($it['opportunity']);
                                if (isset($it['why_important'])) $w = trim($it['why_important']);
                            }
                            if ($l !== '' || $o !== '' || $w !== '') $rows[] = array('lesson' => $l, 'opportunity' => $o, 'why_important' => $w);
                        }
                    } else {
                        if ($debugMode) $debug[] = 'failed to decode lessons JSON, falling back to reflection_text';
                    }
                }
                // fallback: if no structured lessons, parse reflection_text as before
                if (empty($rows) && isset($_POST['reflection_text']) && trim($_POST['reflection_text']) !== '') {
                    $reflectionText = trim($_POST['reflection_text']);
                    $parts = preg_split('/\r?\n\s*\r?\n/', $reflectionText);
                    if (!is_array($parts) || count($parts) === 0) $parts = array($reflectionText);
                    $tokens = array();
                    foreach ($parts as $p) { $t = trim($p); if ($t !== '') $tokens[] = $t; }
                    if (count($tokens) === 0) $tokens = array($reflectionText);
                    if (count($tokens) >= 2) {
                        $rows[] = array('lesson' => $tokens[0], 'opportunity' => $tokens[1]);
                        for ($pi = 2; $pi < count($tokens); $pi++) { $rows[] = array('lesson' => $tokens[$pi], 'opportunity' => ''); }
                    } else {
                        $rows[] = array('lesson' => $tokens[0], 'opportunity' => '');
                    }
                }

                if (!empty($rows)) {
                    // Inspect lesson table columns to see if `opportunity` exists
                        $lessonCols = array();
                    try {
                        $lc = $pdo->query("DESCRIBE `object_journal_lesson-learneds`");
                        $lcols = $lc->fetchAll(PDO::FETCH_ASSOC);
                        foreach ($lcols as $c) $lessonCols[] = $c['Field'];
                    } catch (Exception $e) { $lessonCols = array(); }
                    $hasOpportunity = in_array('opportunity', $lessonCols);
                    $hasWhyImportant = in_array('why_important', $lessonCols);
                    $hasLessonMapId = in_array('map_id', $lessonCols);

                    // fetch existing lesson rows for this reflection (include opportunity if possible)
                    $selectCols = '`object_journal_lesson-learned_id`, `lesson_learned`' . ($hasOpportunity ? ', `opportunity`' : '') . ($hasWhyImportant ? ', `why_important`' : '');
                    $sel = $pdo->prepare('SELECT ' . $selectCols . ' FROM `object_journal_lesson-learneds` WHERE `object_journal_reflection_id` = :rid ORDER BY `created_at` ASC');
                    $sel->execute([':rid' => $existing_reflection_id]);
                    $existing = $sel->fetchAll(PDO::FETCH_ASSOC);

                    // update existing rows or insert new ones
                    $now = date('Y-m-d H:i:s');
                    for ($i = 0; $i < count($rows); $i++) {
                        $lessonText = isset($rows[$i]['lesson']) ? $rows[$i]['lesson'] : '';
                        $opportunityText = isset($rows[$i]['opportunity']) ? $rows[$i]['opportunity'] : '';
                        $whyText = isset($rows[$i]['why_important']) ? $rows[$i]['why_important'] : '';
                        if (isset($existing[$i])) {
                            $lid = $existing[$i]['object_journal_lesson-learned_id'];
                            $setCols = array('`lesson_learned` = :txt', '`updated_at` = :u');
                            $execParams = [':txt' => $lessonText, ':u' => $now, ':lid' => $lid];
                            if ($hasOpportunity) {
                                $setCols[] = '`opportunity` = :opp';
                                $execParams[':opp'] = $opportunityText;
                            }
                            if ($hasWhyImportant) {
                                $setCols[] = '`why_important` = :why';
                                $execParams[':why'] = $whyText;
                            }
                            $up = $pdo->prepare('UPDATE `object_journal_lesson-learneds` SET ' . implode(', ', $setCols) . ' WHERE `object_journal_lesson-learned_id` = :lid');
                            $up->execute($execParams);
                        } else {
                            $newId = uniqid('ojl_', true);
                            $insCols = array('`object_journal_lesson-learned_id`', '`object_journal_reflection_id`', '`lesson_learned`', '`created_at`', '`updated_at`', '`deleted`');
                            $insVals = array(':id', ':rid', ':txt', ':c', ':u', ':d');
                            $execParams = [':id' => $newId, ':rid' => $existing_reflection_id, ':txt' => $lessonText, ':c' => $now, ':u' => $now, ':d' => 0];
                            if ($hasOpportunity) {
                                $insCols[] = '`opportunity`';
                                $insVals[] = ':opp';
                                $execParams[':opp'] = $opportunityText;
                            }
                            if ($hasWhyImportant) {
                                $insCols[] = '`why_important`';
                                $insVals[] = ':why';
                                $execParams[':why'] = $whyText;
                            }
                            if ($hasLessonMapId) {
                                $insCols[] = '`map_id`';
                                $insVals[] = ':map';
                                $execParams[':map'] = $map_id;
                            }
                            $ins = $pdo->prepare('INSERT INTO `object_journal_lesson-learneds` (' . implode(', ', $insCols) . ') VALUES (' . implode(', ', $insVals) . ')');
                            $ins->execute($execParams);
                        }
                    }
                    // if there are extra existing rows beyond new lessons, delete them
                    if (count($existing) > count($rows)) {
                        for ($j = count($rows); $j < count($existing); $j++) {
                            $delId = $existing[$j]['object_journal_lesson-learned_id'];
                            $del = $pdo->prepare('DELETE FROM `object_journal_lesson-learneds` WHERE `object_journal_lesson-learned_id` = :id');
                            $del->execute([':id' => $delId]);
                        }
                    }
                }
            }
        } catch (Exception $e) {
            // non-fatal: log and continue
            error_log('lesson handling after reflection update failed: ' . $e->getMessage());
        }

        $out = ['success' => true, 'object_journal_reflection_id' => $existing_reflection_id, 'action' => 'updated'];
        if ($debugMode) { $debug[] = 'reflection updated id=' . $existing_reflection_id; $out['debug'] = $debug; }
        echo json_encode($out);
        exit;
    }

    // No existing reflection -> perform INSERT (bindings already prepared)
    // Ensure object_journal_reflection_id is included so caller receives a stable PK
    if (!in_array('`object_journal_reflection_id`', $insertCols)) {
        array_unshift($insertCols, '`object_journal_reflection_id`');
        array_unshift($placeholders, ':object_journal_reflection_id');
        $bindings[':object_journal_reflection_id'] = $object_journal_reflection_id;
    }
    $sql = 'INSERT INTO `object_journal_reflections` (' . implode(', ', $insertCols) . ') VALUES (' . implode(', ', $placeholders) . ')';
    $stmt = $pdo->prepare($sql);
    foreach ($bindings as $k => $v) {
        if (is_int($v)) $stmt->bindValue($k, $v, PDO::PARAM_INT);
        else $stmt->bindValue($k, $v, PDO::PARAM_STR);
    }
    $stmt->execute();
    if ($debugMode) $debug[] = 'executed reflection INSERT';
    // After insert, handle lesson-learneds. Prefer structured POST['lessons'] JSON if provided.
    try {
        $lessonTableExists = false;
        try {
            $lt = $pdo->query("SHOW TABLES LIKE 'object_journal_lesson-learneds'");
            if ($lt && $lt->rowCount()) { $lessonTableExists = true; }
        } catch (Exception $e) { $lessonTableExists = false; }
        if ($lessonTableExists) {
            $rows = array();
            if (isset($_POST['lessons']) && trim($_POST['lessons']) !== '') {
                $raw = $_POST['lessons'];
                $decoded = json_decode($raw, true);
                if ($decoded && is_array($decoded)) {
                    foreach ($decoded as $it) {
                        $w = '';
                        if (is_array($it)) {
                            if (isset($it['lesson'])) $l = trim($it['lesson']);
                            if (isset($it['opportunity'])) $o = trim($it['opportunity']);
                            if (isset($it['why_important'])) $w = trim($it['why_important']);
                        }
                        if ($l !== '' || $o !== '' || $w !== '') $rows[] = array('lesson' => $l, 'opportunity' => $o, 'why_important' => $w);
                    }
                } else {
                    if ($debugMode) $debug[] = 'failed to decode lessons JSON on insert, falling back to reflection_text';
                }
            }
            if (empty($rows) && isset($_POST['reflection_text']) && trim($_POST['reflection_text']) !== '') {
                $reflectionText = trim($_POST['reflection_text']);
                $parts = preg_split('/\r?\n\s*\r?\n/', $reflectionText);
                if (!is_array($parts) || count($parts) === 0) $parts = array($reflectionText);
                $tokens = array();
                foreach ($parts as $p) { $t = trim($p); if ($t !== '') $tokens[] = $t; }
                if (count($tokens) === 0) $tokens = array($reflectionText);
                if (count($tokens) >= 2) {
                    $rows[] = array('lesson' => $tokens[0], 'opportunity' => $tokens[1]);
                    for ($pi = 2; $pi < count($tokens); $pi++) { $rows[] = array('lesson' => $tokens[$pi], 'opportunity' => ''); }
                } else {
                    $rows[] = array('lesson' => $tokens[0], 'opportunity' => '');
                }
            }

            if (!empty($rows)) {
                // Inspect lesson table columns to see if `opportunity` exists
                $lessonCols = array();
                try {
                    $lc = $pdo->query("DESCRIBE `object_journal_lesson-learneds`");
                    $lcols = $lc->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($lcols as $c) $lessonCols[] = $c['Field'];
                } catch (Exception $e) { $lessonCols = array(); }
                $hasOpportunity = in_array('opportunity', $lessonCols);
                $hasWhyImportant = in_array('why_important', $lessonCols);
                $hasLessonMapId = in_array('map_id', $lessonCols);

                $now = date('Y-m-d H:i:s');
                foreach ($rows as $rrow) {
                    $newId = uniqid('ojl_', true);
                    $lessonText = isset($rrow['lesson']) ? $rrow['lesson'] : '';
                    $opportunityText = isset($rrow['opportunity']) ? $rrow['opportunity'] : '';
                    $whyText = isset($rrow['why_important']) ? $rrow['why_important'] : '';

                    $insCols = array('`object_journal_lesson-learned_id`', '`object_journal_reflection_id`', '`lesson_learned`', '`created_at`', '`updated_at`', '`deleted`');
                    $insVals = array(':id', ':rid', ':txt', ':c', ':u', ':d');
                    $execParams = [':id' => $newId, ':rid' => $object_journal_reflection_id, ':txt' => $lessonText, ':c' => $now, ':u' => $now, ':d' => 0];
                    if ($hasOpportunity) {
                        $insCols[] = '`opportunity`';
                        $insVals[] = ':opp';
                        $execParams[':opp'] = $opportunityText;
                    }
                    if ($hasWhyImportant) {
                        $insCols[] = '`why_important`';
                        $insVals[] = ':why';
                        $execParams[':why'] = $whyText;
                    }
                    if ($hasLessonMapId) {
                        $insCols[] = '`map_id`';
                        $insVals[] = ':map';
                        $execParams[':map'] = $map_id;
                    }
                    $ins = $pdo->prepare('INSERT INTO `object_journal_lesson-learneds` (' . implode(', ', $insCols) . ') VALUES (' . implode(', ', $insVals) . ')');
                    $ins->execute($execParams);
                }
            }
        }
    } catch (Exception $e) {
        error_log('lesson handling after reflection insert failed: ' . $e->getMessage());
    }

    $out = ['success' => true, 'object_journal_reflection_id' => $object_journal_reflection_id, 'action' => 'inserted'];
    if ($debugMode) { $debug[] = 'reflection inserted id=' . $object_journal_reflection_id; $out['debug'] = $debug; }
    echo json_encode($out);

} catch (Exception $e) {
    $out = ['success' => false, 'error' => 'DB operation failed: ' . $e->getMessage()];
    if ($debugMode) { $debug[] = 'exception: ' . $e->getMessage(); $out['debug'] = $debug; }
    echo json_encode($out);
}

?>
