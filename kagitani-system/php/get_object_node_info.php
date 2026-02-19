<?php
// node_idと日付範囲でobject_nodes情報を返す．SRLジャーナルに何を表示させるかを管理
header('Content-Type: application/json; charset=UTF-8');

// デバッグモード
$debug = isset($_GET['debug']) && $_GET['debug'] == '1';

// エラーハンドラを設定
set_error_handler(function($errno, $errstr, $errfile, $errline) use ($debug) {
    if ($debug) {
        echo json_encode(['success' => false, 'error' => "PHP Error: $errstr", 'file' => $errfile, 'line' => $errline]);
        exit;
    }
});

// 例外ハンドラを設定
set_exception_handler(function($e) use ($debug) {
    if ($debug) {
        echo json_encode(['success' => false, 'error' => 'Exception: ' . $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()]);
    } else {
        echo json_encode(['success' => false, 'error' => 'サーバーエラー']);
    }
    exit;
});

session_start();

// DB接続
require_once("connect_db.php");

if (!isset($mysqli) || !$mysqli) {
    echo json_encode(['success' => false, 'error' => 'DB接続失敗']);
    exit;
}

// DB接続確認
if (!isset($mysqli) || !$mysqli) {
    echo json_encode(['success' => false, 'error' => 'DB接続変数が未定義', 'loaded_path' => $loaded_path]);
    exit;
}
if ($mysqli->connect_error) {
    echo json_encode(['success' => false, 'error' => 'DB接続失敗: ' . $mysqli->connect_error]);
    exit;
}

$node_id = isset($_GET['node_id']) ? $_GET['node_id'] : '';
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : '';
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : '';
if ($node_id === '') {
    echo json_encode(['success' => false, 'error' => 'node_idがありません']);
    exit;
}

$escaped_node_id = $mysqli->real_escape_string($node_id);
$where = "node_id = '" . $escaped_node_id . "' and deleted = 0";
if ($start_date !== '' && $end_date !== '') {
    $escaped_start = $mysqli->real_escape_string($start_date);
    $escaped_end = $mysqli->real_escape_string($end_date);
    // yyyy-mm-dd の形式だけが渡された場合、開始はその日の 00:00:00、終了は翌日未満で扱う
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
        $escaped_start = $mysqli->real_escape_string($start_date . ' 00:00:00');
        $next_day = date('Y-m-d', strtotime($end_date . ' +1 day'));
        $escaped_next_day = $mysqli->real_escape_string($next_day);
        $where .= " AND updated_at >= '" . $escaped_start . "' AND updated_at < '" . $escaped_next_day . "'";
    } else {
        // どちらかが日時を含む場合はそのまま inclusive 範囲を使う
        $where .= " AND updated_at >= '" . $escaped_start . "' AND updated_at <= '" . $escaped_end . "'";
    }
}
$sql = "SELECT * FROM object_nodes WHERE $where ORDER BY created_at DESC";
$result = $mysqli->query($sql);
$rows = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
}
if ($rows) {
    $objectNodeIds = array_map(function($row){ return $row['object_node_id']; }, $rows);
    error_log('取得object_node_id: ' . implode(',', $objectNodeIds));

    // 該当する object_node_id に紐づく履歴を object_nodes_histories から取得
    $histories = [];
    $objectNodeHistoryIds = [];
    if (!empty($objectNodeIds)) {
        $escapedIds = array_map(function($id) use ($mysqli) { return $mysqli->real_escape_string($id); }, $objectNodeIds);
        $inClause = "'" . implode("','", $escapedIds) . "'";
        // include 'activity' column so frontend can adjust display (e.g., prefix 'ラベル変更' when activity=1)
        // Apply the same date-range filtering as used for object_nodes if start/end are provided
        $histDateClause = '';
        if ($start_date !== '' && $end_date !== '') {
            $escaped_h_start = $mysqli->real_escape_string($start_date);
            $escaped_h_end = $mysqli->real_escape_string($end_date);
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
                $escaped_h_start = $mysqli->real_escape_string($start_date . ' 00:00:00');
                $next_day_h = date('Y-m-d', strtotime($end_date . ' +1 day'));
                $escaped_next_day_h = $mysqli->real_escape_string($next_day_h);
                $histDateClause = " AND appeared_at >= '" . $escaped_h_start . "' AND appeared_at < '" . $escaped_next_day_h . "'";
            } else {
                $histDateClause = " AND appeared_at >= '" . $escaped_h_start . "' AND appeared_at <= '" . $escaped_h_end . "'";
            }
        }

        // Order histories so that records with the same object_node_id are consecutive.
        // Sort groups by the group's earliest appeared_at (oldest first), then by object_node_id, then by appeared_at (oldest first).
        // Use a safe select (`*`) to avoid Unknown column errors on older schemas; catch exceptions from mysqli.
        $sql_hist = "SELECT * FROM `object_nodes_histories` WHERE object_node_id IN (" . $inClause . ") AND drag = 0 " . $histDateClause . " ORDER BY (SELECT MIN(h2.appeared_at) FROM `object_nodes_histories` h2 WHERE h2.object_node_id = object_nodes_histories.object_node_id) ASC, object_node_id ASC, appeared_at ASC";
        try {
            $result_hist = $mysqli->query($sql_hist);
        } catch (mysqli_sql_exception $e) {
            error_log('履歴取得例外: ' . $e->getMessage() . ' SQL=' . $sql_hist);
            $result_hist = false;
        }
        if ($result_hist) {
            while ($h = $result_hist->fetch_assoc()) {
                $histories[] = $h;
                if (isset($h['object_node_history_id'])) $objectNodeHistoryIds[] = $h['object_node_history_id'];
            }
        } else {
            if ($mysqli->error) error_log('履歴取得失敗: ' . $mysqli->error . ' SQL=' . $sql_hist);
        }
    }

    // --- エッジを取得してノード順序を決める ---
    $orderedObjectNodeIds = $objectNodeIds; // フォールバック

    if (!empty($objectNodeIds)) {
        // グループの最小 appeared_at を計算しておく（並べ替えのためのタイブレーカーに使用）
        $groupFirst = [];
        foreach ($histories as $h) {
            $oid = $h['object_node_id'];
            $at = $h['appeared_at'];
            if (!isset($groupFirst[$oid]) || strtotime($at) < strtotime($groupFirst[$oid])) {
                $groupFirst[$oid] = $at;
            }
        }

        // エッジの日時フィルタは履歴と同じ条件を使う
        $edgeDateClause = '';
        if ($start_date !== '' && $end_date !== '') {
            $edgeDateClause = $histDateClause;
        }

        // ノード集合内のエッジのみ取得（edge_start と edge_end の両方が対象ノード内）
        // object_edges_histories テーブルが存在しない場合はスキップ
        $sql_edges = "SELECT object_edge_id, edge_start, edge_end, appeared_at FROM object_edges_histories WHERE edge_start IN (" . $inClause . ") AND edge_end IN (" . $inClause . ") " . $edgeDateClause . " ORDER BY object_edge_id, appeared_at DESC";
        $result_edges = @$mysqli->query($sql_edges);
        $edges = [];
        if ($result_edges) {
            $seen_edge_ids = [];
            while ($er = $result_edges->fetch_assoc()) {
                $eid = $er['object_edge_id'];
                if (!in_array($eid, $seen_edge_ids)) {
                    $edges[] = $er; // 最新の履歴を保持
                    $seen_edge_ids[] = $eid;
                }
            }
        } else {
            // テーブルが存在しない場合はエラーを無視して続行
            // error_log('エッジ取得失敗: ' . $mysqli->error . " SQL=" . $sql_edges);
        }

        // 隣接リストと入次数を作成
        $adj = [];
        $indeg = [];
        foreach ($objectNodeIds as $n) { $adj[$n] = []; $indeg[$n] = 0; }
        foreach ($edges as $e) {
            $s = $e['edge_start'];
            $t = $e['edge_end'];
            if (isset($adj[$s])) {
                // 重複排除
                if (!in_array($t, $adj[$s])) {
                    $adj[$s][] = $t;
                    $indeg[$t] = isset($indeg[$t]) ? $indeg[$t] + 1 : 1;
                }
            }
        }

        // 入次数0のノードを開始点とする（ない場合はすべて未訪問とする）
        $queue = [];
        foreach ($indeg as $node => $cnt) {
            if ($cnt === 0) $queue[] = $node;
        }

        // 優先度: groupFirst の早い順で開始点をソート
        usort($queue, function($a, $b) use ($groupFirst) {
            $ta = isset($groupFirst[$a]) ? strtotime($groupFirst[$a]) : PHP_INT_MAX;
            $tb = isset($groupFirst[$b]) ? strtotime($groupFirst[$b]) : PHP_INT_MAX;
            return $ta - $tb;
        });

        $visited = [];
        $order = [];

        // 幅優先（レベル順）で辿ることで、同じ edge_start を持つ edge_end（兄弟ノード）が隣接するようにする
        while (!empty($queue)) {
            $nextLevel = [];
            foreach ($queue as $node) {
                if (isset($visited[$node])) continue;
                $visited[$node] = true;
                $order[] = $node;
                // 隣接ノードを groupFirst の早い順でソートして次レベルに追加
                $children = $adj[$node];
                usort($children, function($a, $b) use ($groupFirst) {
                    $ta = isset($groupFirst[$a]) ? strtotime($groupFirst[$a]) : PHP_INT_MAX;
                    $tb = isset($groupFirst[$b]) ? strtotime($groupFirst[$b]) : PHP_INT_MAX;
                    return $ta - $tb;
                });
                foreach ($children as $ch) {
                    if (!isset($visited[$ch])) $nextLevel[] = $ch;
                }
            }
            // 次レベルの重複を取り除き順序を保つ
            $queue = array_values(array_unique($nextLevel));
        }

        // 未訪問ノードを groupFirst の早い順に追加（サイクルや孤立ノード対策）
        $remaining = array_filter($objectNodeIds, function($n) use ($visited) { return !isset($visited[$n]); });
        usort($remaining, function($a, $b) use ($groupFirst) {
            $ta = isset($groupFirst[$a]) ? strtotime($groupFirst[$a]) : PHP_INT_MAX;
            $tb = isset($groupFirst[$b]) ? strtotime($groupFirst[$b]) : PHP_INT_MAX;
            return $ta - $tb;
        });
        foreach ($remaining as $r) $order[] = $r;

        if (!empty($order)) {
            $orderedObjectNodeIds = $order;
        }
    }

    // --- 教訓(lessons) を取得 ---
    $lessons = [];
    if (!empty($objectNodeIds)) {
        // $inClause は上で定義済み
        // テーブルが存在しない場合はスキップ
        $sql_lessons = "SELECT object_le_id, object_node_id, lesson_learned, created_at, updated_at FROM `object_lesson-learneds` WHERE object_node_id IN (" . $inClause . ") AND deleted = 0 ORDER BY created_at ASC";
        $result_lessons = @$mysqli->query($sql_lessons);
        if ($result_lessons) {
            while ($lr = $result_lessons->fetch_assoc()) {
                $nid = $lr['object_node_id'];
                if (!isset($lessons[$nid])) $lessons[$nid] = [];
                $lessons[$nid][] = $lr;
            }
        } else {
            // テーブルが存在しない場合はエラーを無視して続行
            // error_log('教訓取得失敗: ' . $mysqli->error . " SQL=" . $sql_lessons);
        }
    }

    // 子・親マッピングを作成して返却（フロントで階層表示に使う）
    $node_children = $adj; // parent => [children]
    $node_parents = [];
    foreach ($objectNodeIds as $n) $node_parents[$n] = [];
    foreach ($node_children as $p => $children) {
        foreach ($children as $c) {
            if (!isset($node_parents[$c])) $node_parents[$c] = [];
            if (!in_array($p, $node_parents[$c])) $node_parents[$c][] = $p;
        }
    }

    echo json_encode([
        'success' => true,
        'data' => $rows,
        'object_node_ids' => $objectNodeIds,
        'ordered_object_node_ids' => $orderedObjectNodeIds,
        'object_node_history_ids' => $objectNodeHistoryIds,
        'histories' => $histories,
        'lessons' => $lessons,
        'node_children' => $node_children,
        'node_parents' => $node_parents
    ]);
} else {
    error_log('該当データなし: node_id=' . $node_id);
    echo json_encode(['success' => false, 'error' => '該当データなし', 'object_node_ids' => [], 'object_node_history_ids' => [], 'histories' => []]);
}
