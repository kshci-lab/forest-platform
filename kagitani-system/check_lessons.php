<?php
$db_host = '127.0.0.1';
$db_user = 'root';
$db_password = 'root';
$db_dbname = '2026-06-15_forest_platform';

try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_dbname};charset=utf8mb4", $db_user, $db_password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $user_ids = [540742316, 705669067, 1047560894, 1059266691, 1079778750, 1170943400, 1295772075, 1359833175, 1762021915, 1836505621];
    $in_users = implode(',', $user_ids);

    $sql_maps = "SELECT map_id FROM maps WHERE user_id IN ($in_users) AND (deleted IS NULL OR deleted = 0)";
    $maps = $pdo->query($sql_maps)->fetchAll(PDO::FETCH_COLUMN);
    $in_maps = implode(',', $maps);

    // Old way (count all matching rows)
    $sql_old_map = "SELECT COUNT(*) FROM `object_lesson-learneds` ol JOIN `object_nodes` n ON ol.object_node_id = n.object_node_id JOIN `map_node_links` mnl ON n.node_id = mnl.node_id WHERE mnl.map_id IN ($in_maps) AND (ol.deleted IS NULL OR ol.deleted = 0) AND ol.lesson_learned IS NOT NULL AND TRIM(ol.lesson_learned) <> '' AND ol.created_at >= '2026-04-01 00:00:00'";
    echo "Old map lessons: " . $pdo->query($sql_old_map)->fetchColumn() . "\n";

    // New way (count distinct nodes but only for the latest row)
    $sql_new_map = "SELECT COUNT(DISTINCT ol.object_node_id) 
         FROM `object_lesson-learneds` ol
         JOIN (
             SELECT object_node_id, MAX(created_at) AS max_created_at
             FROM `object_lesson-learneds`
             GROUP BY object_node_id
         ) latest ON ol.object_node_id = latest.object_node_id AND ol.created_at = latest.max_created_at
         JOIN `object_nodes` n ON ol.object_node_id = n.object_node_id
         JOIN `map_node_links` mnl ON n.node_id = mnl.node_id
         WHERE mnl.map_id IN ($in_maps)
           AND (ol.deleted IS NULL OR ol.deleted = 0)
           AND ol.lesson_learned IS NOT NULL AND TRIM(ol.lesson_learned) <> ''
           AND ol.created_at >= '2026-04-01 00:00:00'";
    echo "New map lessons: " . $pdo->query($sql_new_map)->fetchColumn() . "\n";

    $sql_old_jour = "SELECT COUNT(*) FROM `object_journal_lesson-learneds` ojl WHERE ojl.map_id IN ($in_maps) AND (ojl.deleted IS NULL OR ojl.deleted = 0) AND ojl.lesson_learned IS NOT NULL AND TRIM(ojl.lesson_learned) <> '' AND ojl.created_at >= '2026-04-01 00:00:00'";
    echo "Old jour lessons: " . $pdo->query($sql_old_jour)->fetchColumn() . "\n";

    $sql_new_jour = "SELECT COUNT(DISTINCT ojr.object_journal_id) 
         FROM `object_journal_lesson-learneds` ojl
         JOIN `object_journal_reflections` ojr ON ojl.`object_journal_reflection_id` = ojr.`object_journal_reflection_id`
         JOIN (
             SELECT ojr_sub.object_journal_id, MAX(ojl_sub.created_at) AS max_created_at
             FROM `object_journal_lesson-learneds` ojl_sub
             JOIN `object_journal_reflections` ojr_sub ON ojl_sub.object_journal_reflection_id = ojr_sub.object_journal_reflection_id
             GROUP BY ojr_sub.object_journal_id
         ) latest ON ojr.object_journal_id = latest.object_journal_id AND ojl.created_at = latest.max_created_at
         WHERE ojl.map_id IN ($in_maps)
           AND (ojl.deleted IS NULL OR ojl.deleted = 0)
           AND ojl.lesson_learned IS NOT NULL AND TRIM(ojl.lesson_learned) <> ''
           AND ojl.created_at >= '2026-04-01 00:00:00'";
    echo "New jour lessons: " . $pdo->query($sql_new_jour)->fetchColumn() . "\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
