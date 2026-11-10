<?php
// admin_api の単体テスト
require_once __DIR__ . '/kagitani-system/php/connect_db.php';
require_once __DIR__ . '/kagitani-system/php/admin_workbench_lib.php';

$pdo_host = $db_host;
$pdo_port = '3306';
if (strpos($db_host, ':') !== false) {
    list($pdo_host, $pdo_port) = explode(':', $db_host, 2);
}
$dsn = "mysql:host={$pdo_host};port={$pdo_port};dbname={$db_dbname};charset=utf8mb4";
$pdo = new PDO($dsn, $db_user, $db_password, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$lib = new AdminWorkbenchLib($pdo);

// 1. Auth check
echo "1. Auth check:\n";
echo "   User 66166488 (admin): " . ($lib->checkAdminAuth(66166488) ? "TRUE (OK)" : "FALSE") . "\n";
echo "   User 1894664221 (student): " . (!$lib->checkAdminAuth(1894664221) ? "FALSE (OK)" : "TRUE (FAIL)") . "\n";

// 2. Filter options
$opts = $lib->getFilterOptions();
echo "2. Filter options: Users count = " . count($opts['users']) . ", Min date = " . $opts['min_date'] . ", Max date = " . $opts['max_date'] . "\n";

// 3. Summary (2026-04-20 ~ 2026-09-23)
$filter = [
    'start_date' => '2026-04-20 00:00:00',
    'end_date' => '2026-09-23 23:59:59',
    'date_basis' => 'created_at',
    'user_ids' => [1894664221]
];
$summary = $lib->getSummary($filter);
echo "3. Summary (2026-04-20 ~ 2026-09-23, User 1894664221):\n";
print_r($summary);

// 4. Lessons list
$lessons = $lib->getLessonsList($filter);
echo "4. Lessons count = " . count($lessons) . "\n";
if (!empty($lessons)) {
    echo "   Sample lesson [{$lessons[0]['origin_name']}]: {$lessons[0]['lesson_learned']}\n";
    echo "   - Why: {$lessons[0]['why_important']}\n";
    echo "   - Opp: {$lessons[0]['opportunity']}\n";
    echo "   - Question: {$lessons[0]['question_content']}\n";
    echo "   - Good: {$lessons[0]['eval_good']} (Reason: {$lessons[0]['eval_good_reason']})\n";
    echo "   - Bad: {$lessons[0]['eval_bad']} (Reason: {$lessons[0]['eval_bad_reason']})\n";
}

// 5. Nodes list
$nodes = $lib->getNodesList($filter);
echo "5. Nodes count = " . count($nodes) . "\n";
if (!empty($nodes)) {
    echo "   Sample node: {$nodes[0]['content']} | Depth: {$nodes[0]['depth']} | Question: {$nodes[0]['question_content']}\n";
}

// 6. Aggregation (月別 x 参加者別)
$agg = $lib->getAggregationData($filter, 'lessons_total', 'month', 'user');
echo "6. Aggregation (Month x User):\n";
echo "   Row keys: " . implode(', ', $agg['row_keys']) . "\n";
echo "   Col keys: " . implode(', ', $agg['col_keys']) . "\n";
echo "   Grand total: " . $agg['grand_total'] . "\n";
foreach ($agg['matrix'] as $row) {
    echo "   - " . $row['row_key'] . ": " . json_encode($row['cells'], JSON_UNESCAPED_UNICODE) . " (Total: " . $row['row_total'] . ")\n";
}
