<?php
// SRL由来の教訓: object_journal_lesson-learneds の lesson_learned を返す（map_idで絞り込み）
header('Content-Type: application/json; charset=UTF-8');
date_default_timezone_set('Asia/Tokyo');

$db_host = "localhost";
$db_user = "root";
$db_password = "root";
$db_dbname = "forest_platform";

try {
	if (session_status() !== PHP_SESSION_ACTIVE) session_start();
	$map_id = null;
	if (!empty($_SESSION['MAPID'])) {
		$map_id = $_SESSION['MAPID'];
	} elseif (!empty($_GET['map_id'])) {
		$map_id = $_GET['map_id'];
	}

	$debug = !empty($_GET['debug']);

	$dsn = "mysql:host={$db_host};dbname={$db_dbname};charset=utf8mb4";
	$pdo = new PDO($dsn, $db_user, $db_password, [
		PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
		PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
	]);
	// 防止: 照合順序の混在によるエラー
	try {
		$pdo->exec("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
		$pdo->exec("SET collation_connection = 'utf8mb4_unicode_ci'");
	} catch (PDOException $e) {
		error_log('set collation failed: '. $e->getMessage());
	}

	// テーブル名バリエーション (ハイフン/アンダースコアなど)
	$candidates = [
		'object_journal_lesson-learneds',
		'object_journal_lesson_learneds',
		'object_journal_lessonlearneds',
		'object_journal_lessonlearned'
	];
	$foundTable = null;
	foreach ($candidates as $cand) {
		$check = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :t");
		$check->bindValue(':db', $db_dbname, PDO::PARAM_STR);
		$check->bindValue(':t', $cand, PDO::PARAM_STR);
		$check->execute();
		$c = (int)$check->fetchColumn();
		if ($c > 0) { $foundTable = $cand; break; }
	}

	if (empty($foundTable)) {
		echo json_encode([ 'success' => true, 'items' => [], 'debug_table' => null ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
		exit;
	}

	$useHyphen = strpos($foundTable, '-') !== false;
	$ll_table_escaped = "`" . $foundTable . "`";
	$ll_id_col = $useHyphen ? "ll.`object_journal_lesson-learned_id`" : "ll.object_journal_lesson_learned_id";

	// 基本的には lesson_learned 等を直接取得する
	// map_id が指定されていれば lesson テーブルの map_id で絞り込む
	if ($map_id) {
		$sql = "SELECT " . $ll_id_col . " AS `object_journal_lesson-learned_id`, ll.`object_journal_reflection_id`, ll.`lesson_learned`, ll.`opportunity`, ll.`created_at`, ll.`updated_at`, ll.`deleted`, ll.`map_id`
			FROM " . $ll_table_escaped . " ll
			WHERE (ll.`deleted` IS NULL OR ll.`deleted` = 0) AND ll.`map_id` COLLATE utf8mb4_unicode_ci = CAST(:map_id AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
			ORDER BY ll.`updated_at` DESC";
		$stmt = $pdo->prepare($sql);
		$stmt->bindValue(':map_id', $map_id, PDO::PARAM_STR);
	} else {
		$sql = "SELECT " . $ll_id_col . " AS `object_journal_lesson-learned_id`, ll.`object_journal_reflection_id`, ll.`lesson_learned`, ll.`opportunity`, ll.`created_at`, ll.`updated_at`, ll.`deleted`, ll.`map_id`
			FROM " . $ll_table_escaped . " ll
			WHERE (ll.`deleted` IS NULL OR ll.`deleted` = 0)
			ORDER BY ll.`updated_at` DESC";
		$stmt = $pdo->prepare($sql);
	}

	$stmt->execute();
	$rows = $stmt->fetchAll();

	$out = [ 'success' => true, 'items' => $rows, 'debug_table' => $foundTable ];
	if ($debug) $out['debug_sql'] = $sql;
	echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (PDOException $e) {
	http_response_code(500);
	echo json_encode([ 'success' => false, 'error' => 'DB error: '.$e->getMessage() ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode([ 'success' => false, 'error' => $e->getMessage() ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

?>