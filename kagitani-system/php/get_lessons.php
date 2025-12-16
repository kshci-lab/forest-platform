<?php
// 教訓一覧: deleted=0 かつ challenges_learnings があるレコードを返す
header('Content-Type: application/json; charset=UTF-8');

$db_host = "localhost";
$db_user = "root";
$db_password = "root";
$db_dbname = "forest_platform";

try {
    // セッションから map_id を取得（GET パラメータでも受け取れるように）
    if (session_status() !== PHP_SESSION_ACTIVE) session_start();
    $map_id = null;
    if (!empty($_SESSION['MAPID'])) {
        $map_id = $_SESSION['MAPID'];
    } elseif (!empty($_GET['map_id'])) {
        $map_id = $_GET['map_id'];
    }

    if (empty($map_id)) {
        // map_id が指定されていない場合は空の配列を返す
        echo json_encode([ 'success' => true, 'items' => [] ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // PDO 接続を確立
    $dsn = "mysql:host={$db_host};dbname={$db_dbname};charset=utf8mb4";
    $pdo = new PDO($dsn, $db_user, $db_password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone = '+09:00'"
    ]);

    // challenges_learnings が NULL でなく、空文字でないもの
    $sql = "SELECT updated_at, challenges_learnings, content FROM object_nodes 
            WHERE deleted = 0 AND challenges_learnings IS NOT NULL AND TRIM(challenges_learnings) <> '' 
            AND node_id IN (SELECT node_id FROM map_node_links WHERE map_id = :map_id)
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