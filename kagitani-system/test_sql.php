<?php
require_once("php/connect_db.php");
$dsn = "mysql:host={$db_host};dbname={$db_dbname};charset=utf8mb4";
$pdo = new PDO($dsn, $db_user, $db_password, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$ll_table_escaped = "`object_journal_lesson-learneds`";
$map_id = '1'; // Assuming a generic map_id

// Original query pattern
$sql1 = "SELECT ll.`object_journal_lesson-learned_id`, oj.`object_journal_id`, ll.`lesson_learned`
        FROM " . $ll_table_escaped . " ll
        LEFT JOIN `object_journal_reflections` ojr ON ll.`object_journal_reflection_id` = ojr.`object_journal_reflection_id`
        LEFT JOIN `object_journals` oj ON ojr.`object_journal_id` = oj.`object_journal_id`
        WHERE (ll.`deleted` IS NULL OR ll.`deleted` = 0)
          AND ojr.`journal_history_id` = (
            SELECT ojr2.`journal_history_id`
            FROM " . $ll_table_escaped . " ll2
            LEFT JOIN `object_journal_reflections` ojr2 ON ll2.`object_journal_reflection_id` = ojr2.`object_journal_reflection_id`
            WHERE (ll2.`deleted` IS NULL OR ll2.`deleted` = 0)
              AND ojr2.`journal_history_id` IS NOT NULL
            ORDER BY COALESCE(ojr2.`update_at`, ojr2.`created_at`) DESC
            LIMIT 1
          )
        ORDER BY ll.`updated_at` DESC";

$stmt1 = $pdo->query($sql1);
echo "Original query result:\n";
print_r($stmt1->fetchAll());

// Fixed query pattern
$sql2 = "SELECT ll.`object_journal_lesson-learned_id`, oj.`object_journal_id`, ll.`lesson_learned`
        FROM " . $ll_table_escaped . " ll
        LEFT JOIN `object_journal_reflections` ojr ON ll.`object_journal_reflection_id` = ojr.`object_journal_reflection_id`
        LEFT JOIN `object_journals` oj ON ojr.`object_journal_id` = oj.`object_journal_id`
        WHERE (ll.`deleted` IS NULL OR ll.`deleted` = 0)
          AND ojr.`journal_history_id` = (
            SELECT ojr2.`journal_history_id`
            FROM " . $ll_table_escaped . " ll2
            LEFT JOIN `object_journal_reflections` ojr2 ON ll2.`object_journal_reflection_id` = ojr2.`object_journal_reflection_id`
            WHERE (ll2.`deleted` IS NULL OR ll2.`deleted` = 0)
              AND ojr2.`journal_history_id` IS NOT NULL
              AND ojr2.`object_journal_id` = oj.`object_journal_id`
            ORDER BY COALESCE(ojr2.`update_at`, ojr2.`created_at`) DESC
            LIMIT 1
          )
        ORDER BY ll.`updated_at` DESC";

$stmt2 = $pdo->query($sql2);
echo "\nFixed query result:\n";
print_r($stmt2->fetchAll());

