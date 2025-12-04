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
        $sqlR = "SELECT rn.rationality_id, rn.node_id, n.content
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
    $contentByNode = [];
    while ($row = $resR->fetch_assoc()) {
        $rid = (string)$row['rationality_id'];
        $nid = $row['node_id'];
        if (!$nid) continue;
        // 先に content を収集（後段で再取得せずに使えるように）
        $contentByNode[(string)$nid] = $row['content'] ?? '';
        if (!isset($pairsByRid[$rid])) $pairsByRid[$rid] = [];
        // 重複防止
        if (!in_array($nid, $pairsByRid[$rid], true)) {
            $pairsByRid[$rid][] = $nid;
        }
    }
    $stmtR->close();

    // 2件ペアに整形（flatのみを使用）
    $rationalityPairsFlat = [];
    $rationalityNodeIds = [];
    foreach ($pairsByRid as $rid => $nodes) {
        if (count($nodes) < 2) continue; // 2つ揃っていないものは除外
        $pair = array_slice($nodes, 0, 2);
        $rationalityPairsFlat[] = [
            'rationality_id' => $rid,
            'node_id1' => (string)$pair[0],
            'content1' => $contentByNode[(string)$pair[0]] ?? '',
            'node_id2' => (string)$pair[1],
            'content2' => $contentByNode[(string)$pair[1]] ?? '',
        ];
        // node_id集合も維持（後段の補完用）
        $rationalityNodeIds = array_merge($rationalityNodeIds, $pair);
    }

    // 追加: ペアのどちらかを親に持ち、概念IDが指定のもの（アンカー）を取得し、さらにその子の content を取得
    $targetConceptId = '1519483811401_n426';
    $pairAnchors = [];               // rid => [anchor_node_id,...]
    $pairAnchorChildContents = [];   // rid => [ { node_id, content }, ... ]
    foreach ($rationalityPairsFlat as $rowFlat) {
        $rid = (string)$rowFlat['rationality_id'];
        $nidA = (string)$rowFlat['node_id1'];
        $nidB = (string)$rowFlat['node_id2'];

        // アンカー取得: parent がペアのどちらか かつ concept_id が一致
        $sqlAnchor = "SELECT id AS node_id FROM nodes
            WHERE sheet_id = ? AND user_id = ? AND concept_id = ? AND parent_id IN (?, ?)";
        if ($stmtA = $mysqli->prepare($sqlAnchor)) {
            $stmtA->bind_param('sssss', $sheet_id, $user_id, $targetConceptId, $nidA, $nidB);
            $stmtA->execute();
            $resA = $stmtA->get_result();
            while ($rowA = $resA->fetch_assoc()) {
                $aid = (string)$rowA['node_id'];
                if (!isset($pairAnchors[$rid])) $pairAnchors[$rid] = [];
                if (!in_array($aid, $pairAnchors[$rid], true)) $pairAnchors[$rid][] = $aid;
            }
            $stmtA->close();
        }

        // 子の content 取得: parent がアンカー かつ同じ concept_id
        if (!empty($pairAnchors[$rid])) {
            foreach ($pairAnchors[$rid] as $aid) {
                $sqlChild = "SELECT id AS node_id, content FROM nodes
                    WHERE sheet_id = ? AND user_id = ? AND concept_id = ? AND parent_id = ?";
                if ($stmtC = $mysqli->prepare($sqlChild)) {
                    $stmtC->bind_param('ssss', $sheet_id, $user_id, $targetConceptId, $aid);
                    $stmtC->execute();
                    $resC = $stmtC->get_result();
                    while ($rowC = $resC->fetch_assoc()) {
                        if (!isset($pairAnchorChildContents[$rid])) $pairAnchorChildContents[$rid] = [];
                        $pairAnchorChildContents[$rid][] = [
                            'node_id' => (string)$rowC['node_id'],
                            'content' => $rowC['content'] ?? ''
                        ];
                    }
                    $stmtC->close();
                }
            }
        }
    }

    // 2) 主張ノードに紐づくf_node_id を取得（対象ユーザ＆シート）
    $sqlClaim = "SELECT DISTINCT ln.f_node_id, ln.logic_node_id, ln.label
        FROM logic_triangle t
        INNER JOIN logic_node ln ON ln.logic_node_id = t.claim_id
        WHERE t.sheet_id = ?
          AND ln.user_id = ?
          AND ln.f_node_id IS NOT NULL
    ";
    $stmtL = $mysqli->prepare($sqlClaim);
    if (!$stmtL) throw new Exception('SQLプリペア失敗(sqlClaim): ' . $mysqli->error);
    $stmtL->bind_param("ss", $sheet_id, $user_id);
    $stmtL->execute();
    $resL = $stmtL->get_result();
    $logicNodeFIds = [];
    $logicNodeIdsByFNode = [];
    while ($row = $resL->fetch_row()) {
        // $row[0] = concept_id, $row[1] = nodes.id (node_id)
        $claim_f_node_ids[] = $row[0];
        $claim_logic_node_ids[] = $row[1];
        $claimNodes[] = [
            'f_node_id' => $row[0],
            'logic_node_id'    => $row[1],
            'ln_label'   => $row[2],
        ];
    }
    $stmtL->close();

    // 3) 差分・共通集合
    $rSet = array_values(array_unique($rationalityNodeIds));
    $lSet = array_values(array_unique($logicNodeFIds));

    $diffRationalityMinusLogic = array_values(array_diff($rSet, $lSet));

    // 3.1) ペア×logic のクロス分類
    // 片方のみlogicにある / 両方ない / 両方ある
    $logicSet = [];
    foreach ($lSet as $id) {
        $logicSet[(string)$id] = true;
    }

    // pairベースの分類は廃止（flatDiffを使用）

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
    // 追加: contentByNode に不足があれば補完（rSet と lSet のユニオンから欠けている id のみ取得）
    $allNodeIds = array_values(array_unique(array_merge($rSet, $lSet)));
    $missingIds = array_values(array_diff($allNodeIds, array_keys($contentByNode)));
    if (!empty($missingIds)) {
        $placeholdersAll = implode(',', array_fill(0, count($missingIds), '?'));
        $sqlNodesAll = "SELECT id AS node_id, content FROM nodes WHERE sheet_id = ? AND user_id = ? AND id IN ($placeholdersAll)";
        $stmtNA = $mysqli->prepare($sqlNodesAll);
        if ($stmtNA) {
            $typesNA = 'ss' . str_repeat('s', count($missingIds));
            $bindValuesNA = array_merge([$sheet_id, $user_id], $missingIds);
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

    // 追加: rationalityPairsFlat を基に claim との差分を分類（none/one/both）
    $flatDiff = [
        'noneinlogic' => [],
        'oneinlogic'  => [],
        'bothinlogic' => [],
    ];
    // claim 側の f_node_id セットと f_node_id=>[{logic_node_id,label}] を用意
    $claimFNodeSet = [];
    if (!empty($claim_f_node_ids)) {
        foreach ($claim_f_node_ids as $fid) { $claimFNodeSet[(string)$fid] = true; }
    }
    $logicByFNodeFlat = [];
    if (!empty($claimNodes)) {
        foreach ($claimNodes as $cn) {
            $f = (string)($cn['f_node_id'] ?? '');
            $lnid = (string)($cn['logic_node_id'] ?? '');
            $lbl = (string)($cn['ln_label'] ?? '');
            if ($f === '' || $lnid === '') continue;
            if (!isset($logicByFNodeFlat[$f])) $logicByFNodeFlat[$f] = [];
            $exists = false;
            foreach ($logicByFNodeFlat[$f] as $e) { if ($e['logic_node_id'] === $lnid && $e['label'] === $lbl) { $exists = true; break; } }
            if (!$exists) { $logicByFNodeFlat[$f][] = [ 'logic_node_id' => $lnid, 'label' => $lbl ]; }
        }
    }
    if (!empty($rationalityPairsFlat)) {
        foreach ($rationalityPairsFlat as $row) {
            $rid  = (string)($row['rationality_id'] ?? '');
            $nid1 = (string)($row['node_id1'] ?? '');
            $nid2 = (string)($row['node_id2'] ?? '');
            $in1 = ($nid1 !== '' && isset($claimFNodeSet[$nid1]));
            $in2 = ($nid2 !== '' && isset($claimFNodeSet[$nid2]));
            $entry = [
                'rationality_id' => $rid,
                'node_id1' => $nid1,
                'content1' => (string)($row['content1'] ?? ''),
                'node_id2' => $nid2,
                'content2' => (string)($row['content2'] ?? ''),
                'logic_matches1' => $logicByFNodeFlat[$nid1] ?? [],
                'logic_matches2' => $logicByFNodeFlat[$nid2] ?? [],
            ];
            if ($in1 && $in2) {
                $flatDiff['bothinlogic'][] = $entry;
            } elseif ($in1 || $in2) {
                $flatDiff['oneinlogic'][] = $entry;
            } else {
                $flatDiff['noneinlogic'][] = $entry;
            }
        }
    }

    // 表示要件に合わせたエントリ生成: rationality_id, node_id, content, anchor子content, 対応logic
    $displayEntries = [
        'noneinlogic' => [],
        'oneinlogic'  => [],
        'bothinlogic' => [],
    ];
    // displayEntries は flatDiff をもとに生成
    // noneinlogic
    foreach ($flatDiff['noneinlogic'] as $rowFlat) {
        $rid   = (string)$rowFlat['rationality_id'];
        $nidA  = (string)$rowFlat['node_id1'];
        $nidB  = (string)$rowFlat['node_id2'];
        $nodesInfo = [
            [
                'node_id' => $nidA,
                'content' => $contentByNode[$nidA] ?? $rowFlat['content1'] ?? '',
                'concept_id' => $conceptByNode[$nidA] ?? '',
                'class_constraint' => ($conceptByNode[$nidA] ?? '') !== '' ? ($conceptToOutputCC[$conceptByNode[$nidA]] ?? '') : '',
                'logic_node_ids' => [],
                'logic_labels' => [],
            ],
            [
                'node_id' => $nidB,
                'content' => $contentByNode[$nidB] ?? $rowFlat['content2'] ?? '',
                'concept_id' => $conceptByNode[$nidB] ?? '',
                'class_constraint' => ($conceptByNode[$nidB] ?? '') !== '' ? ($conceptToOutputCC[$conceptByNode[$nidB]] ?? '') : '',
                'logic_node_ids' => [],
                'logic_labels' => [],
            ]
        ];
        $displayEntries['noneinlogic'][] = [
            'rationality_id' => $rid,
            'nodes'          => $nodesInfo,
            'anchor_children'=> $pairAnchorChildContents[$rid] ?? [],
            'logic_matches'  => [],
        ];
    }
    // oneinlogic
    foreach ($flatDiff['oneinlogic'] as $rowFlat) {
        $rid   = (string)$rowFlat['rationality_id'];
        $nidA  = (string)$rowFlat['node_id1'];
        $nidB  = (string)$rowFlat['node_id2'];
        $logicForA = $logicByFNodeFlat[$nidA] ?? [];
        $logicForB = $logicByFNodeFlat[$nidB] ?? [];
        $logicIdsA = array_map(function($e){ return (string)$e['logic_node_id']; }, $logicForA);
        $logicLabelsA = array_map(function($e){ return (string)$e['label']; }, $logicForA);
        $logicIdsB = array_map(function($e){ return (string)$e['logic_node_id']; }, $logicForB);
        $logicLabelsB = array_map(function($e){ return (string)$e['label']; }, $logicForB);
        $nodesInfo = [
            [
                'node_id' => $nidA,
                'content' => $contentByNode[$nidA] ?? $rowFlat['content1'] ?? '',
                'concept_id' => $conceptByNode[$nidA] ?? '',
                'class_constraint' => ($conceptByNode[$nidA] ?? '') !== '' ? ($conceptToOutputCC[$conceptByNode[$nidA]] ?? '') : '',
                'logic_node_ids' => $logicIdsA,
                'logic_labels' => $logicLabelsA,
            ],
            [
                'node_id' => $nidB,
                'content' => $contentByNode[$nidB] ?? $rowFlat['content2'] ?? '',
                'concept_id' => $conceptByNode[$nidB] ?? '',
                'class_constraint' => ($conceptByNode[$nidB] ?? '') !== '' ? ($conceptToOutputCC[$conceptByNode[$nidB]] ?? '') : '',
                'logic_node_ids' => $logicIdsB,
                'logic_labels' => $logicLabelsB,
            ]
        ];
        $logicMatches = [];
        foreach ($logicForA as $e) { $logicMatches[] = [ 'logic_node_id' => (string)$e['logic_node_id'], 'f_node_id' => $nidA, 'content' => $contentByNode[$nidA] ?? $rowFlat['content1'] ?? '' ]; }
        foreach ($logicForB as $e) { $logicMatches[] = [ 'logic_node_id' => (string)$e['logic_node_id'], 'f_node_id' => $nidB, 'content' => $contentByNode[$nidB] ?? $rowFlat['content2'] ?? '' ]; }
        $displayEntries['oneinlogic'][] = [
            'rationality_id' => $rid,
            'nodes'          => $nodesInfo,
            'anchor_children'=> $pairAnchorChildContents[$rid] ?? [],
            'logic_matches'  => $logicMatches,
        ];
    }
    // bothinlogic
    foreach ($flatDiff['bothinlogic'] as $rowFlat) {
        $rid   = (string)$rowFlat['rationality_id'];
        $nidA  = (string)$rowFlat['node_id1'];
        $nidB  = (string)$rowFlat['node_id2'];
        $logicForA = $logicByFNodeFlat[$nidA] ?? [];
        $logicForB = $logicByFNodeFlat[$nidB] ?? [];
        $logicIdsA = array_map(function($e){ return (string)$e['logic_node_id']; }, $logicForA);
        $logicLabelsA = array_map(function($e){ return (string)$e['label']; }, $logicForA);
        $logicIdsB = array_map(function($e){ return (string)$e['logic_node_id']; }, $logicForB);
        $logicLabelsB = array_map(function($e){ return (string)$e['label']; }, $logicForB);
        $nodesInfo = [
            [
                'node_id' => $nidA,
                'content' => $contentByNode[$nidA] ?? $rowFlat['content1'] ?? '',
                'concept_id' => $conceptByNode[$nidA] ?? '',
                'class_constraint' => ($conceptByNode[$nidA] ?? '') !== '' ? ($conceptToOutputCC[$conceptByNode[$nidA]] ?? '') : '',
                'logic_node_ids' => $logicIdsA,
                'logic_labels' => $logicLabelsA,
            ],
            [
                'node_id' => $nidB,
                'content' => $contentByNode[$nidB] ?? $rowFlat['content2'] ?? '',
                'concept_id' => $conceptByNode[$nidB] ?? '',
                'class_constraint' => ($conceptByNode[$nidB] ?? '') !== '' ? ($conceptToOutputCC[$conceptByNode[$nidB]] ?? '') : '',
                'logic_node_ids' => $logicIdsB,
                'logic_labels' => $logicLabelsB,
            ]
        ];
        $logicMatches = [];
        foreach ($logicForA as $e) { $logicMatches[] = [ 'logic_node_id' => (string)$e['logic_node_id'], 'f_node_id' => $nidA, 'content' => $contentByNode[$nidA] ?? $rowFlat['content1'] ?? '' ]; }
        foreach ($logicForB as $e) { $logicMatches[] = [ 'logic_node_id' => (string)$e['logic_node_id'], 'f_node_id' => $nidB, 'content' => $contentByNode[$nidB] ?? $rowFlat['content2'] ?? '' ]; }
        $displayEntries['bothinlogic'][] = [
            'rationality_id' => $rid,
            'nodes'          => $nodesInfo,
            'anchor_children'=> $pairAnchorChildContents[$rid] ?? [],
            'logic_matches'  => $logicMatches,
        ];
    }

    echo json_encode([
        'ok' => true,
        'sheetId' => $sheet_id,
        'claimNodes' => $claimNodes,
        // 追加: フラット形式のペア配列
        'rationalityPairsFlat' => $rationalityPairsFlat,
        // 追加: フラット行ベースの差分分類
        'flatDiff' => $flatDiff,
        // 追加: ペア関連の指定概念アンカーと子のcontent
        'pairAnchors' => $pairAnchors,
        'pairAnchorChildContents' => $pairAnchorChildContents,
        // 既存の詳細に加えて、表示用に整理した配列を追加
        'displayEntries' => $displayEntries,
        // 互換キーは廃止: pairStatus は提供しない（flatへ一本化）
        // エイリアスキー名も追加（noneinlogic/oneinlogic/bothinlogic）
        'noneinlogic' => $displayEntries['noneinlogic'],
        'oneinlogic'  => $displayEntries['oneinlogic'],
        'bothinlogic' => $displayEntries['bothinlogic'],
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
