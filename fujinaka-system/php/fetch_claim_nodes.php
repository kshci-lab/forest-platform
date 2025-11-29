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
    $sqlClaim = "SELECT DISTINCT n.concept_id
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
    $claimConceptIds = [];
    while ($row = $res->fetch_row()) {
        $claimConceptIds[] = $row[0];
    }
    $stmt->close();

    // 1.1) 事実ノードに紐づくconcept_idを取得（対象ユーザ＆シート）
    $sqlFact = "SELECT DISTINCT n.concept_id
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
    while ($row = $resF->fetch_row()) {
        $factConceptIds[] = $row[0];
    }
    $stmtF->close();

    // 1.2) 理由付けノードに紐づくconcept_idを取得（対象ユーザ＆シート）
    $sqlReason = "SELECT DISTINCT n.concept_id
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
    while ($row = $resRsn->fetch_row()) {
        $reasonConceptIds[] = $row[0];
    }
    $stmtRsn->close();

    // 2) 思考整理マップのconcept_idを取得（toiを除外、対象ユーザ＆シート）
    $sqlMap = "SELECT DISTINCT concept_id
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
    while ($row = $res2->fetch_row()) {
        $mapConceptIds[] = $row[0];
    }
    $stmt2->close();

    // 2.5) concept_id => contents[] のマップを作成（toiを除外、対象ユーザ＆シート）
    $sqlAllContents = "SELECT concept_id, content
        FROM nodes
        WHERE sheet_id = ?
          AND user_id = ?
          AND concept_id IS NOT NULL
          AND concept_id <> ''
          AND type <> 'toi'
    ";
    $stmtC = $mysqli->prepare($sqlAllContents);
    if (!$stmtC) {
        throw new Exception('SQLプリペア失敗(sqlAllContents): ' . $mysqli->error);
    }
    $stmtC->bind_param("ss", $sheet_id, $user_id);
    $stmtC->execute();
    $resC = $stmtC->get_result();
    $conceptIdToContents = [];
    while ($row = $resC->fetch_assoc()) {
        $cid = $row['concept_id'];
        $content = $row['content'];
        if ($content === null || $content === '') continue;
        if (!isset($conceptIdToContents[$cid])) $conceptIdToContents[$cid] = [];
        if (!in_array($content, $conceptIdToContents[$cid], true)) {
            $conceptIdToContents[$cid][] = $content;
        }
    }
    $stmtC->close();

    // 3) 差分と共通集合
    $claimSet  = array_values(array_unique($claimConceptIds));
    $factSet   = array_values(array_unique($factConceptIds ?? []));     
    $reasonSet = array_values(array_unique($reasonConceptIds ?? []));
    $mapSet    = array_values(array_unique($mapConceptIds));
    $diffMapMinusClaim = array_values(array_diff($mapSet, $claimSet));
    $diffMapMinusFact = array_values(array_diff($mapSet, $factSet));
    $diffMapMinusReason = array_values(array_diff($mapSet, $reasonSet));

    // 3.1) map-(事実+理由付け+主張)
    $logicConceptIds = array_values(array_unique(array_merge($claimSet, $factSet, $reasonSet)));
    $diffMapMinusLogic = array_values(array_diff($mapSet, $logicConceptIds));

    // 3.2) map - diffMapMinusLogic - claim
    // mapSet から diffMapMinusLogic と claimSet を取り除いた残り
    $diffMapMinusClaim = array_values(array_diff($mapSet, array_merge($diffMapMinusLogic, $claimSet)));

    // 3.3) Detailed（contents 付与）
    $diffMapMinusLogicDetailed = array_map(function($cid) use ($conceptIdToContents) {
        return [
            'concept_id' => $cid,
            'contents'   => $conceptIdToContents[$cid] ?? []
        ];
    }, $diffMapMinusLogic);
    $diffMapMinusClaimDetailed = array_map(function($cid) use ($conceptIdToContents) {
        return [
            'concept_id' => $cid,
            'contents'   => $conceptIdToContents[$cid] ?? []
        ];
    }, $diffMapMinusClaim);

    echo json_encode([
        'ok' => true,
        'sheetId' => $sheet_id,
        'claimConceptIds' => $claimSet,
        'factConceptIds' => $factSet,
        'reasonConceptIds' => $reasonSet,
        'mapConceptIds' => $mapSet,
        'diffMapMinusLogic' => $diffMapMinusLogic,
        'diffMapMinusLogicDetailed' => $diffMapMinusLogicDetailed,
        'diffMapMinusClaim' => $diffMapMinusClaim,
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
