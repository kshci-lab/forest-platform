<?php
// SRL由来の教訓: object_nodes_histories の challenges_learnings を返す（map_idで絞り込み）
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

        // SRLジャーナル: object_goals テーブルから取得
        // 条件: challenges_learnings が空でない、delete = 0、かつ map に紐づく node_id のもの
        $sql = "SELECT update_at AS updated_at, challenges_learnings, start_date, finish_date, object_goal_id, node_id, map_id
                        FROM object_goals
                        WHERE (challenges_learnings IS NOT NULL AND TRIM(challenges_learnings) <> '')
                            AND `delete` = 0
                            AND map_id = :map_id
                        ORDER BY update_at DESC";

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