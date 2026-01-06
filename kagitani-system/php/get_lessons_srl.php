<?php
// SRL由来の教訓: object_nodes_histories の application を返す（map_idで絞り込み）
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

    if (empty($map_id)) {
        echo json_encode([ 'success' => true, 'items' => [] ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $dsn = "mysql:host={$db_host};dbname={$db_dbname};charset=utf8mb4";
    $pdo = new PDO($dsn, $db_user, $db_password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

        // SRLジャーナル: object_journal_reflections と object_journal_lesson-learneds を参照して教訓を取得
        // 仕様: lesson-learneds が存在すればそれを優先、なければ reflection_text を使用する
        $sql = "SELECT COALESCE(ll.lesson_learned, r.reflection_text) AS application,
                COALESCE(r.update_at, r.created_at) AS updated_at,
                j.start_date, j.finish_date, r.object_journal_id, j.node_id, j.map_id
            FROM object_journal_reflections r
            LEFT JOIN `object_journal_lesson-learneds` ll ON ll.object_journal_reflection_id = r.object_journal_reflection_id AND (ll.deleted IS NULL OR ll.deleted = 0)
            LEFT JOIN object_journals j ON j.object_journal_id = r.object_journal_id
            WHERE j.map_id = :map_id
              AND ((ll.lesson_learned IS NOT NULL AND TRIM(ll.lesson_learned) <> '') OR (r.reflection_text IS NOT NULL AND TRIM(r.reflection_text) <> ''))
            ORDER BY updated_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':map_id', $map_id, PDO::PARAM_STR);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    echo json_encode([ 'success' => true, 'items' => $rows ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([ 'success' => false, 'error' => 'DB error: '.$e->getMessage() ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([ 'success' => false, 'error' => $e->getMessage() ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

?>