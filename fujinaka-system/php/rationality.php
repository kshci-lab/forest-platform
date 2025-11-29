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
    $sqlL = "SELECT ln.logic_node_id, ln.f_node_id
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
    // 追加: f_node_id => [logic_node_id,...] の対応（主キーを格納）
    $logicNodeIdsByFNode = [];
    while ($row = $resL->fetch_assoc()) {
        $fid = (string)$row['f_node_id'];
        $lid = (string)$row['logic_node_id']; // 主キー
        $logicNodeFIds[] = $fid;
        if (!isset($logicNodeIdsByFNode[$fid])) $logicNodeIdsByFNode[$fid] = [];
        $logicNodeIdsByFNode[$fid][] = $lid;
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
            $presentFNodeId = $e['node_ids'][$presentIndex];

            // f_node_id に紐づく logicnode.id 群を取り出す
            $logicIds = $logicNodeIdsByFNode[$presentFNodeId] ?? [];
            // logicnodeid を指定して役割を取得
            $matches = findRolesInLogicTriangleByLogicNodeIds($mysqli, $logicIds);

            $e['logicDetail'] = [
                'presentIndex' => $presentIndex,
                'node_id'      => $presentFNodeId,   // f_node_id
                'logicnode_ids'=> $logicIds,         // 使った logicnode.id 群
                'matches'      => $matches,          // [{ role, column, triangle_id }, ...]
            ];
        }
        unset($e);
    }

    // 3.4) logic に存在する f_node_id について、f_node_id / logic_node_id[] / content / matches を生成
    $fNodeLogicSummary = [];
    // 追加: 全node_id(content)取得のために rSet と lSet のユニオンを作って content を先に取得
    $allNodeIds = array_values(array_unique(array_merge($rSet, $lSet)));
    $contentByNode = [];
    if (!empty($allNodeIds)) {
        $placeholdersAll = implode(',', array_fill(0, count($allNodeIds), '?'));
        $sqlNodesAll = "SELECT id AS node_id, content FROM nodes WHERE sheet_id = ? AND user_id = ? AND id IN ($placeholdersAll)";
        $stmtNA = $mysqli->prepare($sqlNodesAll);
        if ($stmtNA) {
            $typesNA = 'ss' . str_repeat('s', count($allNodeIds));
            $bindValuesNA = array_merge([$sheet_id, $user_id], $allNodeIds);
            $bindParamsNA = [ &$typesNA ];
            foreach ($bindValuesNA as $i => $v) { $bindParamsNA[] = &$bindValuesNA[$i]; }
            call_user_func_array([$stmtNA, 'bind_param'], $bindParamsNA);
            $stmtNA->execute();
            $resNA = $stmtNA->get_result();
            while ($row = $resNA->fetch_assoc()) {
                $contentByNode[(string)$row['node_id']] = $row['content'] ?? '';
            }
            $stmtNA->close();
        }
    }

    if (!empty($lSet)) {
        // f_node ごとの matches を算出
        foreach ($lSet as $fid) {
            $fidStr = (string)$fid;
            $logicIds = $logicNodeIdsByFNode[$fidStr] ?? [];
            $matches  = !empty($logicIds) ? findRolesInLogicTriangleByLogicNodeIds($mysqli, $logicIds) : [];
            $fNodeLogicSummary[] = [
                'f_node_id'       => $fidStr,
                'logic_node_ids'  => $logicIds,
                'content'         => $contentByNode[$fidStr] ?? '',
                'matches'         => $matches,
            ];
        }
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

    // 3.6) rationality_id ごとに node_id と f_node_id の対応を分類して返す
    $rationalityLogicMatch = [
        'double' => new stdClass(), // 両方対応
        'single' => new stdClass(), // 片方のみ対応
        'no'     => new stdClass(), // 対応なし
    ];
    foreach ($rationalityPairs as $pair) {
        $rid   = (string)$pair['rationality_id'];
        $nidA  = (string)$pair['node_ids'][0];
        $nidB  = (string)$pair['node_ids'][1];

        // f_node 対応可否
        $logicIdsA = $logicNodeIdsByFNode[$nidA] ?? [];
        $logicIdsB = $logicNodeIdsByFNode[$nidB] ?? [];
        $inA = !empty($logicIdsA);
        $inB = !empty($logicIdsB);

        // helper to make entry
        $makeEntry = function(?string $fnodeId, array $logicIds, array $contentByNode) {
            $firstLogicId = !empty($logicIds) ? (string)$logicIds[0] : null;
            return [
                'f_node_id'     => $fnodeId,
                'logic_node_id' => $firstLogicId,
                'content'       => ($fnodeId !== null) ? ($contentByNode[$fnodeId] ?? null) : null,
            ];
        };

        if ($inA && $inB) {
            $rationalityLogicMatch['double']->{$rid} = [
                $makeEntry($nidA, $logicIdsA, $contentByNode),
                $makeEntry($nidB, $logicIdsB, $contentByNode),
            ];
        } elseif ($inA xor $inB) {
            $entries = [];
            if ($inA) $entries[] = $makeEntry($nidA, $logicIdsA, $contentByNode);
            if ($inB) $entries[] = $makeEntry($nidB, $logicIdsB, $contentByNode);
            $rationalityLogicMatch['single']->{$rid} = $entries;
        } else {
            $rationalityLogicMatch['no']->{$rid} = [[
                'f_node_id'     => null,
                'logic_node_id' => null,
                'content'       => null,
            ]];
        }
    }

    echo json_encode([
        'ok' => true,
        'sheetId' => $sheet_id,
        'rationalityPairs' => $rationalityPairs,
        'pairStatus' => $pairStatus,
        'logicNodeIdsByFNode' => $logicNodeIdsByFNode,
        'rationalityNodeIds' => $rSet,
        'logicNodeFIds' => $lSet,
        'diffRationalityMinusLogic' => $diffRationalityMinusLogic,
        'diffLogicMinusRationality' => $diffLogicMinusRationality,
        'intersection' => $intersection,
        'diffRationalityMinusLogicDetailed' => $diffRationalityMinusLogicDetailed,
        // 追加: f_node 要約
        'fNodeLogicSummary' => $fNodeLogicSummary,
        // 追加: rationality_id ごとの対応分類
        'rationalityLogicMatch' => $rationalityLogicMatch,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

/**
 * 指定テーブルの存在確認
 */
function tableExists(mysqli $mysqli, string $table): bool {
	$sql = "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?";
	$stmt = $mysqli->prepare($sql);
	if (!$stmt) return false;
	$stmt->bind_param("s", $table);
	$stmt->execute();
	$exists = (bool)$stmt->get_result()->fetch_row();
	$stmt->close();
	return $exists;
}

/**
 * logic_node_id の配列を使って logic_triangle/logictriangle の役割を全件取得する
 * 返り値: [
 *   { logic_node_id: string, role: 'claim'|'fact'|'reason', triangle_id: string },
 *   ...
 * ]
 */
function findRolesInLogicTriangleByLogicNodeIds(mysqli $mysqli, array $logicNodeIds): array {
	if (empty($logicNodeIds)) return [];

	// 文字列化とユニーク化
	$logicNodeIds = array_values(array_unique(array_map('strval', $logicNodeIds)));

	// テーブル・カラム名の決定（logic_triangle 優先、無ければ logictriangle）
	$table = tableExists($mysqli, 'logic_triangle') ? 'logic_triangle' : 'logictriangle';
	$triCol = ($table === 'logic_triangle') ? 'triangle_id' : 'id';

	$ph = implode(',', array_fill(0, count($logicNodeIds), '?'));

	$sql = "
		SELECT {$triCol} AS triangle_id, 'claim' AS role, claim_id AS logic_node_id
		FROM {$table}
		WHERE claim_id IN ($ph)
		UNION ALL
		SELECT {$triCol} AS triangle_id, 'fact' AS role, fact_id AS logic_node_id
		FROM {$table}
		WHERE fact_id IN ($ph)
		UNION ALL
		SELECT {$triCol} AS triangle_id, 'reason' AS role, reason_id AS logic_node_id
		FROM {$table}
		WHERE reason_id IN ($ph)
	";

	// バインド: ids を3回繰り返す
	$bindValues = array_merge($logicNodeIds, $logicNodeIds, $logicNodeIds);
	$types = str_repeat('s', count($bindValues));

	$stmt = $mysqli->prepare($sql);
	if (!$stmt) return [];

	$params = [ &$types ];
	foreach ($bindValues as $i => $v) { $params[] = &$bindValues[$i]; }
	call_user_func_array([$stmt, 'bind_param'], $params);

	$out = [];
	$seen = []; // 重複排除 key: lnid|role|triId
	$stmt->execute();
	if ($res = $stmt->get_result()) {
		while ($row = $res->fetch_assoc()) {
			$triId = (string)($row['triangle_id'] ?? '');
			$lnid  = (string)($row['logic_node_id'] ?? '');
			$role  = (string)($row['role'] ?? '');
			if ($triId === '' || $lnid === '' || $role === '') continue;
			$key = $lnid.'|'.$role.'|'.$triId;
			if (isset($seen[$key])) continue;
			$seen[$key] = true;
			$out[] = [
				'logic_node_id' => $lnid,
				'role' => $role,
				'triangle_id' => $triId,
			];
		}
	}
	$stmt->close();

	return $out;
}
