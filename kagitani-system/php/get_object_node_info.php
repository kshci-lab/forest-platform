<?php
// --- 1. エラー表示・ログ設定 (一番最初に実行) ---
ini_set('display_errors', 0); // 本番やAjax用は0推奨（エラーがあるとJSONが壊れるため）
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_error.log');

// --- 2. 共通設定・ヘッダー ---
header('Content-Type: application/json; charset=UTF-8');
session_start();

// デバッグモード判定
$debug = isset($_GET['debug']) && $_GET['debug'] == '1';

// エラー・例外ハンドラ
set_error_handler(function($errno, $errstr, $errfile, $errline) use ($debug) {
    if (error_reporting() === 0) return false;
    echo json_encode(['success' => false, 'error' => "PHP Error: $errstr", 'file' => $errfile, 'line' => $errline]);
    exit;
});

set_exception_handler(function($e) use ($debug) {
    echo json_encode([
        'success' => false, 
        'error' => 'Exception: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit;
});

// --- 3. DB接続 (SQLを叩く前に必須) ---
require_once("connect_db.php");

// サーバー差異（PHP8系のmysqli例外化）で500にならないようにする
if (function_exists('mysqli_report')) {
    mysqli_report(MYSQLI_REPORT_OFF);
}

if (!isset($mysqli) || $mysqli->connect_error) {
    echo json_encode(['success' => false, 'error' => 'DB接続失敗: ' . ($mysqli->connect_error ?? 'Variable not defined')]);
    exit;
}

// --- 4. パラメータ取得 ---
$node_id = isset($_GET['node_id']) ? $_GET['node_id'] : '';
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : '';
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : '';

if ($node_id === '') {
    echo json_encode(['success' => false, 'error' => 'node_idがありません']);
    exit;
}

$escaped_node_id = $mysqli->real_escape_string($node_id);

// --- 5. テスト用分岐 ---
if (isset($_GET['test_simple']) && $_GET['test_simple'] == '1') {
    $sql = "SELECT * FROM object_nodes WHERE node_id = '" . $escaped_node_id . "' AND deleted = 0 ORDER BY created_at DESC";
    error_log('[TEST] object_nodes SQL: ' . $sql);
    $result = @$mysqli->query($sql);
    if ($result === false) {
        echo json_encode([
            'success' => false,
            'error' => 'object_nodes取得失敗',
            'sql_error' => $debug ? $mysqli->error : null
        ]);
        exit;
    }
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    $objectNodeIds = array_map(function($row){ return $row['object_node_id']; }, $rows);
    echo json_encode([
        'success' => true,
        'object_node_ids' => $objectNodeIds,
        'data' => $rows
    ]);
    exit;
}

// --- 6. メイン処理 ---
// 日付パラメータの正規化（スラッシュ区切り・ハイフン区切りの両方に対応）
$h_start = '';
$h_next_day = '';
$has_date_filter = false;

if ($start_date !== '' && $end_date !== '') {
    $norm_start = str_replace('/', '-', $start_date);
    $norm_end = str_replace('/', '-', $end_date);
    $ts_start = strtotime($norm_start);
    $ts_end = strtotime($norm_end);
    if ($ts_start !== false && $ts_end !== false) {
        $h_start = date('Y-m-d 00:00:00', $ts_start);
        $h_next_day = date('Y-m-d 00:00:00', strtotime('+1 day', $ts_end));
        $has_date_filter = true;
    }
}

// 該当するnode_id（問いノードなど）に属する未削除ノードを取得
// ※ updated_at で絞り込むと、後日ノードを編集・移動した際に過去の期間から除外されてしまうため、
// 　期間指定がある場合は「その期間内に履歴が存在する」または「その期間内に作成された」ノードを取得する。
$where = "node_id = '" . $escaped_node_id . "' AND deleted = 0";
if ($has_date_filter) {
    $escaped_h_start = $mysqli->real_escape_string($h_start);
    $escaped_h_next_day = $mysqli->real_escape_string($h_next_day);
    $where .= " AND (
        object_node_id IN (
            SELECT DISTINCT object_node_id 
            FROM `object_nodes_histories` 
            WHERE appeared_at >= '" . $escaped_h_start . "' 
              AND appeared_at < '" . $escaped_h_next_day . "'
        )
        OR (created_at >= '" . $escaped_h_start . "' AND created_at < '" . $escaped_h_next_day . "')
    )";
}

$sql = "SELECT * FROM object_nodes WHERE $where ORDER BY created_at DESC";
$result = @$mysqli->query($sql);
$rows = [];
if ($result === false) {
    echo json_encode([
        'success' => false,
        'error' => 'object_nodes取得失敗',
        'sql_error' => $debug ? $mysqli->error : null
    ]);
    exit;
}
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

    $answer_content = '';
    $sql_answer = "SELECT content FROM node_latest WHERE parent_id = '" . $escaped_node_id . "' AND type = 'answer' LIMIT 1";
    $result_ans = @$mysqli->query($sql_answer);
    if ($result_ans && $ans_row = $result_ans->fetch_assoc()) {
        $answer_content = $ans_row['content'];
    }

    $answer_histories = [];
    $histDateClauseForAnswer = '';
    if ($has_date_filter) {
        $escaped_h_start = $mysqli->real_escape_string($h_start);
        $escaped_h_next_day = $mysqli->real_escape_string($h_next_day);
        $histDateClauseForAnswer = " AND h.appeared_at >= '$escaped_h_start' AND h.appeared_at < '$escaped_h_next_day'";
    }
    
    // Fetch answer histories in the date range
    $sql_answer_hist = "SELECT h.content, h.appeared_at FROM node_histories h JOIN node_versions v ON h.node_version_id = v.node_version_id WHERE v.parent_id = '" . $escaped_node_id . "' AND v.node_type_id = 5 " . $histDateClauseForAnswer . " ORDER BY h.appeared_at ASC";
    $result_ans_hist = @$mysqli->query($sql_answer_hist);
    if ($result_ans_hist) {
        $last_content = null;
        while ($h = $result_ans_hist->fetch_assoc()) {
            if ($h['content'] !== $last_content) {
                $answer_histories[] = $h;
                $last_content = $h['content'];
            }
        }
    }

    if ($rows) {
        $objectNodeIds = array_map(function($row){ return $row['object_node_id']; }, $rows);
        $orderedObjectNodeIds = $objectNodeIds;
        $histories = [];
        $objectNodeHistoryIds = [];
        $adj = [];
        $indeg = [];
        $lessons = [];

        if (!empty($objectNodeIds)) {
            $escapedIds = array_map(function($id) use ($mysqli) { return $mysqli->real_escape_string($id); }, $objectNodeIds);
            $inClause = "'" . implode("','", $escapedIds) . "'";
            
            // 履歴取得
            $histDateClause = '';
            if ($has_date_filter) {
                $escaped_h_start = $mysqli->real_escape_string($h_start);
                $escaped_h_next_day = $mysqli->real_escape_string($h_next_day);
                $histDateClause = " AND appeared_at >= '$escaped_h_start' AND appeared_at < '$escaped_h_next_day'";
            }

            $sql_hist = "SELECT * FROM `object_nodes_histories` WHERE object_node_id IN ($inClause) AND drag = 0 $histDateClause 
                         ORDER BY (SELECT MIN(h2.appeared_at) FROM `object_nodes_histories` h2 WHERE h2.object_node_id = object_nodes_histories.object_node_id) ASC, object_node_id ASC, appeared_at ASC";
            
            $result_hist = @$mysqli->query($sql_hist);
            if ($result_hist) {
                while ($h = $result_hist->fetch_assoc()) {
                    $histories[] = $h;
                    if (isset($h['object_node_history_id'])) $objectNodeHistoryIds[] = $h['object_node_history_id'];
                }
            } else {
                error_log('[get_object_node_info] histories query failed: ' . $mysqli->error . ' sql=' . $sql_hist);
            }

            // --- エッジ取得・順序制御 ---
            $groupFirst = [];
            foreach ($histories as $h) {
                $oid = $h['object_node_id'];
                if (!isset($groupFirst[$oid]) || strtotime($h['appeared_at']) < strtotime($groupFirst[$oid])) {
                    $groupFirst[$oid] = $h['appeared_at'];
                }
            }

            $sql_edges = "SELECT object_edge_id, edge_start, edge_end FROM object_edges WHERE edge_start IN ($inClause) AND edge_end IN ($inClause) AND deleted = 0 ORDER BY object_edge_id";
            $result_edges = @$mysqli->query($sql_edges);
            $edges = [];
            if ($result_edges) {
                $seen_edge_ids = [];
                while ($er = $result_edges->fetch_assoc()) {
                    if (!in_array($er['object_edge_id'], $seen_edge_ids)) {
                        $edges[] = $er;
                        $seen_edge_ids[] = $er['object_edge_id'];
                    }
                }
            } else {
                error_log('[get_object_node_info] edges query failed: ' . $mysqli->error . ' sql=' . $sql_edges);
            }

            // 隣接リスト
            foreach ($objectNodeIds as $n) { $adj[$n] = []; $indeg[$n] = 0; }
            foreach ($edges as $e) {
                $s = $e['edge_start']; $t = $e['edge_end'];
                if (isset($adj[$s]) && !in_array($t, $adj[$s])) {
                    $adj[$s][] = $t;
                    $indeg[$t] = ($indeg[$t] ?? 0) + 1;
                }
            }

            // トポロジカルソート的な順序付け (簡易版)
            $queue = [];
            foreach ($indeg as $node => $cnt) { if ($cnt === 0) $queue[] = $node; }
            usort($queue, function($a, $b) use ($groupFirst) {
                return (strtotime($groupFirst[$a] ?? 'now')) - (strtotime($groupFirst[$b] ?? 'now'));
            });

            $order = [];
            $visited = [];
            while (!empty($queue)) {
                $node = array_shift($queue);
                if (isset($visited[$node])) continue;
                $visited[$node] = true;
                $order[] = $node;
                foreach ($adj[$node] as $child) {
                    if (!isset($visited[$child])) $queue[] = $child;
                }
            }
            $orderedObjectNodeIds = !empty($order) ? $order : $objectNodeIds;

            // --- 教訓取得 ---
            $sql_lessons = "SELECT * FROM `object_lesson-learneds` WHERE object_node_id IN ($inClause) AND deleted = 0 ORDER BY created_at ASC";
            $result_lessons = @$mysqli->query($sql_lessons);
            if ($result_lessons) {
                while ($lr = $result_lessons->fetch_assoc()) {
                    $lessons[$lr['object_node_id']][] = $lr;
                }
            } else {
                error_log('[get_object_node_info] lessons query failed: ' . $mysqli->error . ' sql=' . $sql_lessons);
            }
        }

        // 親マッピング
        $node_parents = [];
        foreach ($objectNodeIds as $n) $node_parents[(string)$n] = [];
        foreach ($adj as $p => $children) {
            foreach ($children as $c) { $node_parents[(string)$c][] = (string)$p; }
        }

        $strObjectNodeIds = array_map('strval', $objectNodeIds);
        $strOrderedObjectNodeIds = array_map('strval', $orderedObjectNodeIds);

        $node_children = [];
        foreach ($objectNodeIds as $n) $node_children[(string)$n] = [];
        foreach ($adj as $p => $children) {
            foreach ($children as $c) { $node_children[(string)$p][] = (string)$c; }
        }

        echo json_encode([
            'success' => true,
            'data' => $rows,
            'object_node_ids' => $strObjectNodeIds,
            'ordered_object_node_ids' => $strOrderedObjectNodeIds,
            'object_node_history_ids' => $objectNodeHistoryIds,
            'histories' => $histories,
            'lessons' => $lessons,
            'node_children' => $node_children,
            'node_parents' => $node_parents,
            'answer_content' => $answer_content,
            'answer_histories' => $answer_histories
        ]);

    } else {
        echo json_encode(['success' => false, 'error' => '該当データなし', 'object_node_ids' => [], 'answer_content' => $answer_content, 'answer_histories' => $answer_histories]);
    }