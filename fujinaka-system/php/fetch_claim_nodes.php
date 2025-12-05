<?php
session_start();
require("connect_db.php");
date_default_timezone_set('Asia/Tokyo');

$user_id = $_SESSION['USERID'];
$sheet_id = $_SESSION['SHEETID'];

header('Content-Type: application/json; charset=utf-8');

try {
    // mysqli接続の存在確認（logic_maneger.phpと同様の前提）
    if (!isset($mysqli) || $mysqli->connect_errno) {
        throw new Exception('DB接続が見つかりません。');
    }

    if (!isset($_SESSION['SHEETID'])) {
        throw new Exception('SHEETIDが未設定です。');
    }
    $sheet_id = $_SESSION['SHEETID'];

    // 1) 主張ノードに紐づくconcept_idを取得（対象ユーザ＆シート）
    $sqlClaim = "SELECT DISTINCT n.concept_id, n.id, ln.logic_node_id, ln.label
        FROM logic_triangle t
        INNER JOIN logic_node ln ON ln.logic_node_id = t.claim_id
        INNER JOIN nodes n       ON n.id = ln.f_node_id
        WHERE t.sheet_id = ?
          AND n.user_id = ?
          AND ln.f_node_id IS NOT NULL
          AND n.concept_id IS NOT NULL
          AND n.concept_id <> ''
    ";
    $stmt = $mysqli->prepare($sqlClaim);
    if (!$stmt) {
        throw new Exception('SQLプリペア失敗(sqlClaim): ' . $mysqli->error);
    }
    $stmt->bind_param("ss", $sheet_id, $user_id);
    $stmt->execute();
    $res = $stmt->get_result();

    // concept_id だけの配列
    $claimConceptIds = [];
    // concept_id と node_id のペア配列（両方見たい場合）
    $claimConceptNodes = [];

    $claimNodeIds = [];
    while ($row = $res->fetch_row()) {
        // $row[0] = concept_id, $row[1] = nodes.id (node_id)
        $claimConceptIds[] = $row[0];
        $claimNodeIds[] = $row[1];
        $claimConceptNodes[] = [
            'concept_id' => $row[0],
            'node_id'    => $row[1],
            'ln_id'      => $row[2],
            'ln_label'   => $row[3],
        ];
    }
    $stmt->close();

    // 1.1) 根拠ノードに紐づくconcept_idを取得（対象ユーザ＆シート）
    $sqlFact = "SELECT DISTINCT n.concept_id, n.id, ln.logic_node_id, ln.label
        FROM logic_triangle t
        INNER JOIN logic_node ln ON ln.logic_node_id = t.fact_id
        INNER JOIN nodes n       ON n.id = ln.f_node_id
        WHERE t.sheet_id = ?
          AND n.user_id = ?
          AND ln.f_node_id IS NOT NULL
          AND n.concept_id IS NOT NULL
          AND n.concept_id <> ''
    ";
    $stmtF = $mysqli->prepare($sqlFact);
    if (!$stmtF) {
        throw new Exception('SQLプリペア失敗(sqlFact): ' . $mysqli->error);
    }
    $stmtF->bind_param("ss", $sheet_id, $user_id);
    $stmtF->execute();
    $resF = $stmtF->get_result();
    $factConceptIds = [];
    $factNodeIds = [];
    $factConceptNodes = [];
    while ($row = $resF->fetch_row()) {
        $factConceptIds[] = $row[0];
        $factNodeIds[] = $row[1];
        $factConceptNodes[] = [
            'concept_id' => $row[0],
            'node_id'    => $row[1],
            'ln_id'      => $row[2],
            'ln_label'   => $row[3],
        ];
    }
    $stmtF->close();

    // 1.2) 理由付けノードに紐づくconcept_idを取得（対象ユーザ＆シート）
    $sqlReason = "SELECT DISTINCT n.concept_id, n.id, ln.logic_node_id, ln.label
        FROM logic_triangle t
        INNER JOIN logic_node ln ON ln.logic_node_id = t.reason_id
        INNER JOIN nodes n       ON n.id = ln.f_node_id
        WHERE t.sheet_id = ?
          AND n.user_id = ?
          AND ln.f_node_id IS NOT NULL
          AND n.concept_id IS NOT NULL
          AND n.concept_id <> ''
    ";
    $stmtRsn = $mysqli->prepare($sqlReason);
    if (!$stmtRsn) {
        throw new Exception('SQLプリペア失敗(sqlReason): ' . $mysqli->error);
    }
    $stmtRsn->bind_param("ss", $sheet_id, $user_id);
    $stmtRsn->execute();
    $resRsn = $stmtRsn->get_result();
    $reasonConceptIds = [];
    $reasonNodeIds = [];
    $reasonConceptNodes = [];
    while ($row = $resRsn->fetch_row()) {
        $reasonConceptIds[] = $row[0];
        $reasonNodeIds[] = $row[1];
        $reasonConceptNodes[] = [
            'concept_id' => $row[0],
            'node_id'    => $row[1],
            'ln_id'      => $row[2],
            'ln_label'   => $row[3],
        ];
    }
    $stmtRsn->close();

    // 2) 思考整理マップのconcept_idを取得（toiを除外、対象ユーザ＆シート）
    $sqlMap = "SELECT DISTINCT concept_id, id, content
        FROM nodes
        WHERE sheet_id = ?
          AND user_id = ?
          AND concept_id IS NOT NULL
          AND concept_id <> ''
          AND type <> 'toi'
    ";
    $stmt2 = $mysqli->prepare($sqlMap);
    if (!$stmt2) {
        throw new Exception('SQLプリペア失敗(sqlMap): ' . $mysqli->error);
    }
    $stmt2->bind_param("ss", $sheet_id, $user_id);
    $stmt2->execute();
    $res2 = $stmt2->get_result();
    $mapConceptIds = [];
    $mapNodeIds = [];
    $mapConceptNodes = [];
    while ($row = $res2->fetch_row()) {
        $mapConceptIds[] = $row[0];
        $mapNodeIds[] = $row[1];
        $mapConceptNodes[] = [
            'concept_id' => $row[0],
            'node_id'    => $row[1],
            'content'    => $row[2],
        ];
    }
    $stmt2->close();

    // 3) 差分（node_idベース）と共通集合（各セットは併記維持）
    $claimSet  = array_values(array_unique($claimConceptIds));
    $factSet   = array_values(array_unique($factConceptIds ?? []));
    $reasonSet = array_values(array_unique($reasonConceptIds ?? []));
    $mapSet    = array_values(array_unique($mapConceptIds));

    // 3.1) node_idベースのロジック集合と差分: mapNodeIds - (claim|fact|reason の f_node_id)
    $logicFNodeIds = array_values(array_unique(array_merge($claimNodeIds ?? [], $factNodeIds ?? [], $reasonNodeIds ?? [])));
    $diffMapMinusLogicNodes = array_values(array_diff($mapNodeIds ?? [], $logicFNodeIds));

    // 3.2) node_idベースの差分: mapNodeIds - diffMapMinusLogicNodes - claimNodeIds
    $diffMapMinusClaimNodes = array_values(array_diff($mapNodeIds ?? [], array_merge($diffMapMinusLogicNodes, $claimNodeIds ?? [])));

    // 3.3) Detailed 拡張
    // 準備: concept_id -> nodes(id, content) の参照（map側）
    $conceptIdToContents = [];
    $conceptIdToNodeIds = [];
    foreach (($mapConceptNodes ?? []) as $mn) {
        $cid = $mn['concept_id'];
        $nid = $mn['node_id'];
        $content = $mn['content'];
        if (!isset($conceptIdToContents[$cid])) $conceptIdToContents[$cid] = [];
        if (!isset($conceptIdToNodeIds[$cid])) $conceptIdToNodeIds[$cid] = [];
        if ($content !== null && $content !== '' && !in_array($content, $conceptIdToContents[$cid], true)) {
            $conceptIdToContents[$cid][] = $content;
        }
        if ($nid !== null && $nid !== '' && !in_array($nid, $conceptIdToNodeIds[$cid], true)) {
            $conceptIdToNodeIds[$cid][] = $nid;
        }
    }

    // 準備: node_id -> logic_node_id/label の参照（claim/fact/reason から統合）
    $nodeIdToLogicInfo = [];
    foreach ((isset($claimConceptNodes)?$claimConceptNodes:[]) as $row) {
        $nid = $row['node_id'] ?? null; if (!$nid) continue;
        $nodeIdToLogicInfo[$nid] = [ 'logic_node_id' => $row['ln_id'] ?? null, 'logic_label' => $row['ln_label'] ?? null ];
    }
    foreach ((isset($factConceptNodes)?$factConceptNodes:[]) as $row) {
        $nid = $row['node_id'] ?? null; if (!$nid) continue;
        if (!isset($nodeIdToLogicInfo[$nid])) {
            $nodeIdToLogicInfo[$nid] = [ 'logic_node_id' => $row['ln_id'] ?? null, 'logic_label' => $row['ln_label'] ?? null ];
        }
    }
    foreach ((isset($reasonConceptNodes)?$reasonConceptNodes:[]) as $row) {
        $nid = $row['node_id'] ?? null; if (!$nid) continue;
        if (!isset($nodeIdToLogicInfo[$nid])) {
            $nodeIdToLogicInfo[$nid] = [ 'logic_node_id' => $row['ln_id'] ?? null, 'logic_label' => $row['ln_label'] ?? null ];
        }
    }

    // Detailed: concept_id から map の n.id/n.content を列挙し、node_id 経由で ln.* を付与
    $buildDetailed = function($cid) use ($conceptIdToContents, $conceptIdToNodeIds, $nodeIdToLogicInfo) {
        $nodeIds = $conceptIdToNodeIds[$cid] ?? [];
        $details = [];
        foreach ($nodeIds as $nid) {
            $logic = $nodeIdToLogicInfo[$nid] ?? [ 'logic_node_id' => null, 'logic_label' => null ];
            // content は代表値として conceptIdToContents の先頭を採用（必要なら個別に取得するよう拡張可能）
            $content = isset($conceptIdToContents[$cid][0]) ? $conceptIdToContents[$cid][0] : null;
            $details[] = [
                'concept_id'    => $cid,
                'node_id'       => $nid,
                'content'       => $content,
                'logic_node_id' => $logic['logic_node_id'],
                'logic_label'   => $logic['logic_label'],
            ];
        }
        return [
            'concept_id' => $cid,
            'contents'   => $conceptIdToContents[$cid] ?? [],
            'node_id'    => isset($nodeIds[0]) ? $nodeIds[0] : null,
            'node_ids'   => $nodeIds,
            'details'    => $details,
        ];
    };
    
    // node_idベース Detailed: 対象node_idごとに詳細を構築
    // node_id -> concept_id/content の逆引き辞書（map側）
    $nodeIdToConcept = [];
    $nodeIdToContent = [];
    foreach (($mapConceptNodes ?? []) as $mn) {
        $nodeIdToConcept[$mn['node_id']] = $mn['concept_id'];
        $nodeIdToContent[$mn['node_id']] = $mn['content'];
    }

    $buildDetailedNode = function($nid) use ($nodeIdToConcept, $nodeIdToContent, $nodeIdToLogicInfo) {
        $cid = $nodeIdToConcept[$nid] ?? null;
        $content = $nodeIdToContent[$nid] ?? null;
        $logic = $nodeIdToLogicInfo[$nid] ?? [ 'logic_node_id' => null, 'logic_label' => null ];
        return [
            'concept_id'    => $cid,
            'node_id'       => $nid,
            'content'       => $content,
            'logic_node_id' => $logic['logic_node_id'],
            'logic_label'   => $logic['logic_label'],
        ];
    };

    $diffMapMinusLogicDetailed = array_map($buildDetailedNode, $diffMapMinusLogicNodes);
    $diffMapMinusClaimDetailed = array_map($buildDetailedNode, $diffMapMinusClaimNodes);

    echo json_encode([
        'ok' => true,
        'sheetId' => $sheet_id,
        'claimConceptIds' => $claimSet,
        'claimNodeIds' => $claimNodeIds,
        'claimConceptNodes' => $claimConceptNodes, // 追加: concept_id と node_id の一覧
        'factConceptIds' => $factSet,
        'factNodeIds' => $factNodeIds,
        'factConceptNodes' => $factConceptNodes, // 追加: concept_id と node_id の一覧
        'reasonConceptIds' => $reasonSet,
        'reasonNodeIds' => $reasonNodeIds,
        'reasonConceptNodes' => $reasonConceptNodes, // 追加: concept_id と node_id の一覧
        'mapConceptIds' => $mapSet,
        'mapConceptNodes' => $mapConceptNodes,
        // 旧conceptベースのキーとの互換は維持しつつ、nodeベースのキーを追加
        'diffMapMinusLogic' => $diffMapMinusLogicNodes,
        'diffMapMinusLogicNodes' => $diffMapMinusLogicNodes,
        'diffMapMinusLogicDetailed' => $diffMapMinusLogicDetailed,
        'diffMapMinusClaim' => $diffMapMinusClaimNodes,
        'diffMapMinusClaimNodes' => $diffMapMinusClaimNodes,
        'diffMapMinusClaimDetailed' => $diffMapMinusClaimDetailed,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
?>
