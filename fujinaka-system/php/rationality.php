<?php
session_start();
require("connect_db.php");
date_default_timezone_set('Asia/Tokyo');
$user_id = $_SESSION['USERID'];
$sheet_id = $_SESSION['SHEETID'];

header('Content-Type: application/json; charset=utf-8');

try {
    if (!isset($mysqli) || $mysqli->connect_errno) {
        throw new Exception('DB接続が見つかりません。');
    }
    if (!isset($_SESSION['SHEETID'])) {
        throw new Exception('SHEETIDが未設定です。');
    }
    $sheet_id = $_SESSION['SHEETID'];

    // 1) rationality_nodes を rationality_id ごとに取得し、2つの node_id をペア化
    $sqlR = "SELECT rn.rationality_id, rn.node_id
        FROM rationality_nodes rn
        INNER JOIN nodes n ON n.id = rn.node_id
        WHERE n.sheet_id = ?
          AND n.user_id = ?
          AND rn.node_id IS NOT NULL
          AND rn.rationality_id IS NOT NULL
    ";
    $stmtR = $mysqli->prepare($sqlR);
    if (!$stmtR) throw new Exception('SQLプリペア失敗(sqlR): ' . $mysqli->error);
    $stmtR->bind_param("ss", $sheet_id, $user_id);
    $stmtR->execute();
    $resR = $stmtR->get_result();

    // rationality_id => [node_id, node_id]
    $pairsByRid = [];
    while ($row = $resR->fetch_assoc()) {
        $rid = (string)$row['rationality_id'];
        $nid = $row['node_id'];
        if (!$nid) continue;
        if (!isset($pairsByRid[$rid])) $pairsByRid[$rid] = [];
        // 重複防止
        if (!in_array($nid, $pairsByRid[$rid], true)) {
            $pairsByRid[$rid][] = $nid;
        }
    }
    $stmtR->close();

    // 2件ペアに整形（余剰があっても先頭2件に丸める）
    $rationalityPairs = [];
    $rationalityNodeIds = [];
    foreach ($pairsByRid as $rid => $nodes) {
        if (count($nodes) < 2) continue; // 2つ揃っていないものは除外
        $pair = array_slice($nodes, 0, 2);
        $rationalityPairs[] = [
            'rationality_id' => $rid,
            'node_ids' => $pair,
        ];
        // 既存処理用に node_id 集合も作成
        $rationalityNodeIds = array_merge($rationalityNodeIds, $pair);
    }

    // 2) logic_node から f_node_id を取得（対象ユーザ＆シート）
    $sqlL = "SELECT DISTINCT ln.f_node_id
        FROM logic_node ln
        INNER JOIN nodes n ON n.id = ln.f_node_id
        WHERE ln.f_node_id IS NOT NULL
          AND n.sheet_id = ?
          AND n.user_id = ?
    ";
    $stmtL = $mysqli->prepare($sqlL);
    if (!$stmtL) throw new Exception('SQLプリペア失敗(sqlL): ' . $mysqli->error);
    $stmtL->bind_param("ss", $sheet_id, $user_id);
    $stmtL->execute();
    $resL = $stmtL->get_result();
    $logicNodeFIds = [];
    while ($row = $resL->fetch_row()) {
        $logicNodeFIds[] = $row[0];
    }
    $stmtL->close();

    // 3) 差分・共通集合
    $rSet = array_values(array_unique($rationalityNodeIds));
    $lSet = array_values(array_unique($logicNodeFIds));

    $diffRationalityMinusLogic = array_values(array_diff($rSet, $lSet));
    $diffLogicMinusRationality = array_values(array_diff($lSet, $rSet));
    $intersection = array_values(array_intersect($rSet, $lSet));

    // 3.1) ペア×logic のクロス分類
    // 片方のみlogicにある / 両方ない / 両方ある
    $logicSet = [];
    foreach ($lSet as $id) {
        $logicSet[(string)$id] = true;
    }

    $pairStatus = [
        'oneInLogic'   => [], // 片方のみlogicにある
        'noneInLogic'  => [], // 両方logicにない
        'bothInLogic'  => [], // 両方logicにある
    ];
    foreach ($rationalityPairs as $pair) {
        $nidA = (string)$pair['node_ids'][0];
        $nidB = (string)$pair['node_ids'][1];
        $inA  = isset($logicSet[$nidA]);
        $inB  = isset($logicSet[$nidB]);

        $entry = [
            'rationality_id' => $pair['rationality_id'],
            'node_ids'       => [$nidA, $nidB],
            'in_logic'       => [$inA, $inB],
        ];

        if ($inA && $inB) {
            $pairStatus['bothInLogic'][] = $entry;
        } elseif ($inA || $inB) {
            $pairStatus['oneInLogic'][] = $entry;
        } else {
            $pairStatus['noneInLogic'][] = $entry;
        }
    }

    // oneInLogic の各要素について、logictriangle から役割/カラムを全件取得して付与
    if (!empty($pairStatus['oneInLogic'])) {
        foreach ($pairStatus['oneInLogic'] as &$e) {
            $nidA = (string)$e['node_ids'][0];
            $nidB = (string)$e['node_ids'][1];
            $inA  = isset($logicSet[$nidA]);
            $presentIndex = $inA ? 0 : 1;
            $presentNodeId = $e['node_ids'][$presentIndex];

            $matches = findLogicTriangleRoles($mysqli, $presentNodeId);
            $e['logicDetail'] = [
                'presentIndex' => $presentIndex, // 0 or 1
                'node_id'      => $presentNodeId,
                'matches'      => $matches,      // [{ role: 'claim'|'fact'|'reason', column: 'claim_id'|'fact_id'|'reason_id' }, ...]
            ];
        }
        unset($e);
    }

    // 3.5) 差分（rationality - logic）のnode_idに紐づくcontentを取得
    $diffRationalityMinusLogicDetailed = [];
    if (!empty($diffRationalityMinusLogic)) {
        $placeholders = implode(',', array_fill(0, count($diffRationalityMinusLogic), '?'));
        $sqlContents = "SELECT id AS node_id, content
            FROM nodes
            WHERE sheet_id = ?
              AND user_id = ?
              AND id IN ($placeholders)
        ";
        $stmtD = $mysqli->prepare($sqlContents);
        if (!$stmtD) throw new Exception('SQLプリペア失敗(sqlContents): ' . $mysqli->error);

        // 型をすべて文字列で扱う（node_idが数値でないケースに対応）
        $types = 'ss' . str_repeat('s', count($diffRationalityMinusLogic));
        $bindValues = array_merge([$sheet_id, $user_id], $diffRationalityMinusLogic);

        $bindParams = [];
        $bindParams[] = &$types;
        foreach ($bindValues as $k => $v) {
            $bindParams[] = &$bindValues[$k];
        }
        call_user_func_array([$stmtD, 'bind_param'], $bindParams);

        $stmtD->execute();
        $resD = $stmtD->get_result();
        while ($row = $resD->fetch_assoc()) {
            $diffRationalityMinusLogicDetailed[] = [
                // 数値化せずそのまま返す（0化防止）
                'node_id' => $row['node_id'],
                'content' => $row['content'] ?? ''
            ];
        }
        $stmtD->close();
    }

    echo json_encode([
        'ok' => true,
        'sheetId' => $sheet_id,
        'rationalityPairs' => $rationalityPairs,
        'pairStatus' => $pairStatus,
        'rationalityNodeIds' => $rSet,
        'logicNodeFIds' => $lSet,
        'diffRationalityMinusLogic' => $diffRationalityMinusLogic,
        'diffLogicMinusRationality' => $diffLogicMinusRationality,
        'intersection' => $intersection,
        'diffRationalityMinusLogicDetailed' => $diffRationalityMinusLogicDetailed,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

/**
 * logictriangle を nodeId で照会し、該当する全行分の役割/カラムを返す
 * 返り値: [ { role: 'claim'|'fact'|'reason', column: 'claim_id'|'fact_id'|'reason_id' }, ... ]
 */
function findLogicTriangleRoles(mysqli $mysqli, string $nodeId): array {
    $out = [];
    $targets = [
        ['role' => 'claim',  'col' => 'claim_id'],
        ['role' => 'fact',   'col' => 'fact_id'],
        ['role' => 'reason', 'col' => 'reason_id'],
    ];
    foreach ($targets as $t) {
        $sql = "SELECT {$t['col']} FROM logictriangle WHERE {$t['col']} = ?";
        $stmt = $mysqli->prepare($sql);
        if (!$stmt) continue;
        $stmt->bind_param("s", $nodeId);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res) {
            // 同一 node_id が複数行に該当する場合、行数分追加
            while ($res->fetch_row()) {
                $out[] = ['role' => $t['role'], 'column' => $t['col']];
            }
        }
        $stmt->close();
    }
    return $out;
}
