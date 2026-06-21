<?php
require_once("php/connect_db.php");
$dsn = "mysql:host={$db_host};dbname={$db_dbname};charset=utf8mb4";
$pdo = new PDO($dsn, $db_user, $db_password, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$map_ids = [
    540742316, 705669067, 1047560894, 1059266691, 1079778750,
    1170943400, 1295772075, 1359833175, 1762021915, 1836505621
];
$in_map_ids = implode(',', $map_ids);

echo "--- 統計情報 (指定ユーザー10名) ---\n";

// 1. SRL Journals
$sql_journals = "SELECT COUNT(*) FROM object_journals WHERE map_id IN ($in_map_ids) AND (`delete` IS NULL OR `delete` = 0)";
$stmt = $pdo->query($sql_journals);
$journal_count = $stmt->fetchColumn();
echo "SRLジャーナル: " . $journal_count . "\n";

// 2. Means nodes
$sql_steps = "SELECT COUNT(*) FROM object_nodes WHERE node_id IN (SELECT node_id FROM map_node_links WHERE map_id IN ($in_map_ids)) AND deleted = 0 AND object_nodes_type IN ('step', 'action')";
$stmt = $pdo->query($sql_steps);
$step_count = $stmt->fetchColumn();
echo "手段ノード: " . $step_count . "\n";

// 3. Lessons learned (SRL journal)
$candidates_jl = [
    'object_journal_lesson-learneds',
    'object_journal_lesson_learneds',
    'object_journal_lessonlearneds',
    'object_journal_lessonlearned'
];
$found_jl = null;
foreach ($candidates_jl as $cand) {
    $chk = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?");
    $chk->execute([$db_dbname, $cand]);
    if ($chk->fetchColumn() > 0) { $found_jl = "`" . $cand . "`"; break; }
}

$jl_count = 0;
if ($found_jl) {
    // Only deleted = 0, maybe map_id exists
    $chkCol = $pdo->query("SHOW COLUMNS FROM {$found_jl} LIKE 'map_id'");
    if ($chkCol->rowCount() > 0) {
        $sql = "SELECT COUNT(*) FROM {$found_jl} WHERE map_id IN ($in_map_ids) AND (deleted IS NULL OR deleted = 0)";
        $jl_count = $pdo->query($sql)->fetchColumn();
    }
}
echo "SRLジャーナルからの教訓: " . $jl_count . "\n";

// 4. Lessons learned (SRL Map)
$candidates_ml = [
    'object_lesson-learneds', 
    'object_lesson-learned', 
    'object_lesson_learneds', 
    'object_lesson_learned'
];
$found_ml = null;
foreach ($candidates_ml as $cand) {
    $chk = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?");
    $chk->execute([$db_dbname, $cand]);
    if ($chk->fetchColumn() > 0) { $found_ml = "`" . $cand . "`"; break; }
}

$ml_count = 0;
if ($found_ml) {
    $sql = "SELECT COUNT(*) FROM {$found_ml} ol 
            JOIN object_nodes o ON ol.object_node_id = o.object_node_id
            WHERE ol.deleted = 0 AND (ol.lesson_learned IS NOT NULL AND TRIM(ol.lesson_learned) <> '')
            AND o.node_id IN (SELECT node_id FROM map_node_links WHERE map_id IN ($in_map_ids))";
    $ml_count = $pdo->query($sql)->fetchColumn();
}
echo "SRL整理マップからの教訓: " . $ml_count . "\n";
echo "教訓合計: " . ($jl_count + $ml_count) . "\n";

