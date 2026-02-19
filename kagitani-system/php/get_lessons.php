<?php
// エラー表示を抑制
error_reporting(0);
ini_set('display_errors', 0);

// 教訓一覧: deleted=0 かつ application があるレコードを返す
header('Content-Type: application/json; charset=UTF-8');

// DB接続情報を読み込み
require_once("connect_db.php");

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

    // If an object_node_id is provided, return lessons for that object_node_id
    if (!empty($_GET['object_node_id'])) {
        $object_node_id = $_GET['object_node_id'];
        // Try multiple possible table names for compatibility
        $candidates = [
            '`object_lesson-learneds`', '`object_lesson-learned`', '`object_lesson_learneds`', '`object_lesson_learned`'
        ];
        $rows = [];
        foreach ($candidates as $tbl) {
            try {
                $sql = "SELECT object_le_id, object_node_id, lesson_learned, opportunity, created_at, updated_at FROM {$tbl} WHERE object_node_id = :object_node_id AND deleted = 0 ORDER BY created_at ASC";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':object_node_id', $object_node_id, PDO::PARAM_STR);
                $stmt->execute();
                $rows = $stmt->fetchAll();
                break;
            } catch (Exception $e) {
                // table not found or other error; try next
                continue;
            }
        }
        // Also fetch evaluation_bad from object_nodes for this object_node_id so client can prefill failure points
        $eval_bad = '';
        try {
            $sql2 = "SELECT evaluation_bad FROM object_nodes WHERE object_node_id = :object_node_id LIMIT 1";
            $stmt2 = $pdo->prepare($sql2);
            $stmt2->bindValue(':object_node_id', $object_node_id, PDO::PARAM_STR);
            $stmt2->execute();
            $row2 = $stmt2->fetch();
            if ($row2 && isset($row2['evaluation_bad'])) $eval_bad = $row2['evaluation_bad'];
        } catch (Exception $e) {
            // ignore
        }
        // Normalize output for client: use 'application' field for lesson text for backward compatibility
        // Ensure 'opportunity' exists in every item
        $norm = array_map(function($r){
            $r['application'] = isset($r['lesson_learned']) ? $r['lesson_learned'] : (isset($r['application']) ? $r['application'] : '');
            $r['opportunity'] = isset($r['opportunity']) ? $r['opportunity'] : '';
            return $r;
        }, $rows);
        echo json_encode([ 'success' => true, 'items' => $norm, 'evaluation_bad' => $eval_bad ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // Default: return lessons attached to nodes in this map via object_lesson-learneds (preferred)
    $rows = [];
    $candidates = [
        '`object_lesson-learneds`', '`object_lesson-learned`', '`object_lesson_learneds`', '`object_lesson_learned`'
    ];
    foreach ($candidates as $tbl) {
        try {
            // 問いノード（topic-tag）の情報も取得するためにサブクエリを追加
            $sql = "SELECT ol.object_le_id, ol.object_node_id, ol.lesson_learned, ol.opportunity, ol.created_at, ol.updated_at, 
                    o.content AS node_content, o.node_id,
                    (SELECT t.content FROM object_nodes t WHERE t.node_id = o.node_id AND t.object_nodes_type = 'topic-tag' AND t.deleted = 0 LIMIT 1) AS topic_tag_content
                    FROM {$tbl} ol
                    JOIN object_nodes o ON ol.object_node_id = o.object_node_id
                    WHERE ol.deleted = 0
                      AND (ol.lesson_learned IS NOT NULL AND TRIM(ol.lesson_learned) <> '')
                      AND o.node_id IN (SELECT node_id FROM map_node_links WHERE map_id = :map_id)
                    ORDER BY ol.updated_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':map_id', $map_id, PDO::PARAM_STR);
            $stmt->execute();
            $rows = $stmt->fetchAll();
            // normalize and ensure opportunity exists
            $norm = array_map(function($r){
                $r['application'] = isset($r['lesson_learned']) ? $r['lesson_learned'] : '';
                $r['opportunity'] = isset($r['opportunity']) ? $r['opportunity'] : '';
                $r['source_node_content'] = isset($r['node_content']) ? $r['node_content'] : '';
                $r['topic_tag_content'] = isset($r['topic_tag_content']) ? $r['topic_tag_content'] : '';
                return $r;
            }, $rows);
            echo json_encode([ 'success' => true, 'items' => $norm ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        } catch (Exception $e) {
            continue;
        }
    }

    // Fallback: older schema where application stored on object_nodes
        $sql = "SELECT o.object_node_id, o.updated_at, o.application AS application, o.content, o.content AS source_node_content, '' AS opportunity, o.node_id,
            (SELECT t.content FROM object_nodes t WHERE t.node_id = o.node_id AND t.object_nodes_type = 'topic-tag' AND t.deleted = 0 LIMIT 1) AS topic_tag_content
            FROM object_nodes o
            WHERE o.deleted = 0 AND o.application IS NOT NULL AND TRIM(o.application) <> '' 
            AND o.node_id IN (SELECT node_id FROM map_node_links WHERE map_id = :map_id)
            ORDER BY o.updated_at DESC";
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