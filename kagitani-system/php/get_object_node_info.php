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
$where = "node_id = '" . $escaped_node_id . "' and deleted = 0";
if ($start_date !== '' && $end_date !== '') {
    $escaped_start = $mysqli->real_escape_string($start_date);
    $escaped_end = $mysqli->real_escape_string($end_date);
    
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
        $escaped_start = $mysqli->real_escape_string($start_date . ' 00:00:00');
        $next_day = date('Y-m-d', strtotime($end_date . ' +1 day'));
        $escaped_next_day = $mysqli->real_escape_string($next_day);
        $where .= " AND updated_at >= '" . $escaped_start . "' AND updated_at < '" . $escaped_next_day . "'";
    } else {
        $where .= " AND updated_at >= '" . $escaped_start . "' AND updated_at <= '" . $escaped_end . "'";
    }
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
        if ($start_date !== '' && $end_date !== '') {
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date)) {
                $h_start = $start_date . ' 00:00:00';
                $h_next = date('Y-m-d', strtotime($end_date . ' +1 day'));
                $histDateClause = " AND appeared_at >= '$h_start' AND appeared_at < '$h_next'";
            } else {
                $histDateClause = " AND appeared_at >= '$start_date' AND appeared_at <= '$end_date'";
            }
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

        $sql_edges = "SELECT object_edge_id, edge_start, edge_end, appeared_at FROM object_edges_histories WHERE edge_start IN ($inClause) AND edge_end IN ($inClause) $histDateClause ORDER BY object_edge_id, appeared_at DESC";
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
    foreach ($objectNodeIds as $n) $node_parents[$n] = [];
    foreach ($adj as $p => $children) {
        foreach ($children as $c) { $node_parents[$c][] = $p; }
    }

    echo json_encode([
        'success' => true,
        'data' => $rows,
        'object_node_ids' => $objectNodeIds,
        'ordered_object_node_ids' => $orderedObjectNodeIds,
        'object_node_history_ids' => $objectNodeHistoryIds,
        'histories' => $histories,
        'lessons' => $lessons,
        'node_children' => $adj,
        'node_parents' => $node_parents
    ]);

} else {
    echo json_encode(['success' => false, 'error' => '該当データなし', 'object_node_ids' => []]);
}