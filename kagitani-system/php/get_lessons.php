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
        $latest_reflection_id = '';
        try {
            $chk = $pdo->query("SHOW TABLES LIKE 'object_reflection_records'");
            if ($chk && $chk->rowCount() > 0) {
                $stmtRef = $pdo->prepare("SELECT reflection_id FROM object_reflection_records WHERE object_node_id = :object_node_id ORDER BY created_at DESC LIMIT 1");
                $stmtRef->bindValue(':object_node_id', $object_node_id, PDO::PARAM_STR);
                $stmtRef->execute();
                $refRow = $stmtRef->fetch();
                if ($refRow && !empty($refRow['reflection_id'])) {
                    $latest_reflection_id = $refRow['reflection_id'];
                }
            }
        } catch (Exception $e) {
            $latest_reflection_id = '';
        }

        foreach ($candidates as $tbl) {
            try {
                $has_reflection_id = false;
                try {
                    $col = $pdo->query("SHOW COLUMNS FROM {$tbl} LIKE 'reflection_id'");
                    if ($col && $col->rowCount() > 0) $has_reflection_id = true;
                } catch (Exception $e) {
                    $has_reflection_id = false;
                }

                if ($latest_reflection_id !== '' && $has_reflection_id) {
                    $sql = "SELECT object_le_id, object_node_id, lesson_learned, why_important, opportunity, created_at, updated_at FROM {$tbl} WHERE object_node_id = :object_node_id AND reflection_id = :reflection_id AND deleted = 0 ORDER BY created_at ASC";
                    $stmt = $pdo->prepare($sql);
                    $stmt->bindValue(':object_node_id', $object_node_id, PDO::PARAM_STR);
                    $stmt->bindValue(':reflection_id', $latest_reflection_id, PDO::PARAM_STR);
                } else {
                    $sql = "SELECT object_le_id, object_node_id, lesson_learned, why_important, opportunity, created_at, updated_at FROM {$tbl} WHERE object_node_id = :object_node_id AND deleted = 0 ORDER BY created_at ASC";
                    $stmt = $pdo->prepare($sql);
                    $stmt->bindValue(':object_node_id', $object_node_id, PDO::PARAM_STR);
                }

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
            $has_reflection_id = false;
            $has_reflection_records = false;
            try {
                $col = $pdo->query("SHOW COLUMNS FROM {$tbl} LIKE 'reflection_id'");
                if ($col && $col->rowCount() > 0) $has_reflection_id = true;
            } catch (Exception $e) {
                $has_reflection_id = false;
            }
            try {
                $chk = $pdo->query("SHOW TABLES LIKE 'object_reflection_records'");
                if ($chk && $chk->rowCount() > 0) $has_reflection_records = true;
            } catch (Exception $e) {
                $has_reflection_records = false;
            }

            $latest_reflection_join = '';
            $latest_reflection_where = '';
            if ($has_reflection_id && $has_reflection_records) {
                $latest_reflection_join = "\n                    JOIN (\n                        SELECT r1.object_node_id, r1.reflection_id\n                        FROM object_reflection_records r1\n                        JOIN (\n                            SELECT object_node_id, MAX(created_at) AS max_created_at\n                            FROM object_reflection_records\n                            GROUP BY object_node_id\n                        ) r2 ON r1.object_node_id = r2.object_node_id AND r1.created_at = r2.max_created_at\n                    ) latest_ref ON latest_ref.object_node_id = ol.object_node_id";
                $latest_reflection_where = "\n                      AND ol.reflection_id = latest_ref.reflection_id";
            }

            // 問いノード（topic-tag）の情報も取得するためにサブクエリを追加
            $sql = "SELECT ol.object_le_id, ol.object_node_id, ol.lesson_learned, ol.why_important, ol.opportunity, ol.created_at, ol.updated_at,
                    o.content AS node_content, o.node_id,
                    (SELECT t.content FROM object_nodes t WHERE t.node_id = o.node_id AND t.object_nodes_type = 'topic-tag' AND t.deleted = 0 LIMIT 1) AS topic_tag_content
                    FROM {$tbl} ol
                    JOIN object_nodes o ON ol.object_node_id = o.object_node_id
                    {$latest_reflection_join}
                    WHERE ol.deleted = 0
                      AND (ol.lesson_learned IS NOT NULL AND TRIM(ol.lesson_learned) <> '')
                      AND o.node_id IN (SELECT node_id FROM map_node_links WHERE map_id = :map_id)
                      {$latest_reflection_where}
                    ORDER BY ol.updated_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':map_id', $map_id, PDO::PARAM_STR);
            $stmt->execute();
            $rows = $stmt->fetchAll();
            // normalize and ensure opportunity exists
            $norm = array_map(function($r){
                $r['application'] = isset($r['lesson_learned']) ? $r['lesson_learned'] : '';
                $r['opportunity'] = isset($r['opportunity']) ? $r['opportunity'] : '';
                $r['why_important'] = isset($r['why_important']) ? $r['why_important'] : null;
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