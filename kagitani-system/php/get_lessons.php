<?php
// 教訓一覧: deleted=0 かつ application があるレコードを返す
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

    // If an object_node_id is provided, return lessons from object_lesson-learneds for that object_node_id
    if (!empty($_GET['object_node_id'])) {
        $object_node_id = $_GET['object_node_id'];
        $sql = "SELECT object_le_id, object_node_id, lesson_learned, created_at, updated_at FROM `object_lesson-learneds` WHERE object_node_id = :object_node_id AND deleted = 0 ORDER BY created_at ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':object_node_id', $object_node_id, PDO::PARAM_STR);
        $stmt->execute();
        $rows = $stmt->fetchAll();
        // Also fetch evaluation_bad from object_nodes for this object_node_id so client can prefill failure points
        $eval_bad = '';
        $sql2 = "SELECT evaluation_bad FROM object_nodes WHERE object_node_id = :object_node_id LIMIT 1";
        $stmt2 = $pdo->prepare($sql2);
        $stmt2->bindValue(':object_node_id', $object_node_id, PDO::PARAM_STR);
        try {
            $stmt2->execute();
            $row2 = $stmt2->fetch();
            if ($row2 && isset($row2['evaluation_bad'])) $eval_bad = $row2['evaluation_bad'];
        } catch (Exception $e) {
            // ignore DB errors here but keep items
        }
        echo json_encode([ 'success' => true, 'items' => $rows, 'evaluation_bad' => $eval_bad ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // application が NULL でなく、空文字でないもの
    // Return both new column name `application` and alias it as `application` for backwards compatibility
    $sql = "SELECT updated_at, application AS application, application AS application, content FROM object_nodes 
            WHERE deleted = 0 AND application IS NOT NULL AND TRIM(application) <> '' 
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