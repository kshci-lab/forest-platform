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

    // 1) 主張ノードに紐づくconcept_idを取得（JOINキー修正: ln.logic_node_id）
    $sqlClaim = "
        SELECT DISTINCT n.concept_id
        FROM logic_triangle t
        INNER JOIN logic_node ln ON ln.logic_node_id = t.claim_id
        INNER JOIN nodes n       ON n.id = ln.f_node_id
        WHERE t.sheet_id = ?
          AND ln.f_node_id IS NOT NULL
          AND n.concept_id IS NOT NULL
          AND n.concept_id <> ''
    ";
    $stmt = $mysqli->prepare($sqlClaim);
    if (!$stmt) {
        throw new Exception('SQLプリペア失敗(sqlClaim): ' . $mysqli->error);
    }
    $stmt->bind_param("s", $sheet_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $claimConceptIds = [];
    while ($row = $res->fetch_row()) {
        $claimConceptIds[] = $row[0];
    }
    $stmt->close();

    // 2) 思考整理マップのconcept_idを取得（toiを除外）
    $sqlMap = "
        SELECT DISTINCT concept_id
        FROM nodes
        WHERE sheet_id = ?
          AND concept_id IS NOT NULL
          AND concept_id <> ''
          AND type <> 'toi'
    ";
    $stmt2 = $mysqli->prepare($sqlMap);
    if (!$stmt2) {
        throw new Exception('SQLプリペア失敗(sqlMap): ' . $mysqli->error);
    }
    $stmt2->bind_param("s", $sheet_id);
    $stmt2->execute();
    $res2 = $stmt2->get_result();
    $mapConceptIds = [];
    while ($row = $res2->fetch_row()) {
        $mapConceptIds[] = $row[0];
    }
    $stmt2->close();

    // 2.5) concept_id => contents[] のマップを作成（toiを除外）
    $sqlAllContents = "
        SELECT concept_id, content
        FROM nodes
        WHERE sheet_id = ?
          AND concept_id IS NOT NULL
          AND concept_id <> ''
          AND type <> 'toi'
    ";
    $stmtC = $mysqli->prepare($sqlAllContents);
    if (!$stmtC) {
        throw new Exception('SQLプリペア失敗(sqlAllContents): ' . $mysqli->error);
    }
    $stmtC->bind_param("s", $sheet_id);
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
    $claimSet = array_values(array_unique($claimConceptIds));
    $mapSet   = array_values(array_unique($mapConceptIds));

    $diffClaimMinusMap = array_values(array_diff($claimSet, $mapSet));
    $diffMapMinusClaim = array_values(array_diff($mapSet, $claimSet));
    $intersection      = array_values(array_intersect($claimSet, $mapSet));

    // 3.5) 差分の各concept_idにcontents配列を付加
    $diffClaimMinusMapDetailed = array_map(function($cid) use ($conceptIdToContents) {
        return [
            'concept_id' => $cid,
            'contents'   => $conceptIdToContents[$cid] ?? []
        ];
    }, $diffClaimMinusMap);

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
        'mapConceptIds' => $mapSet,
        'diffClaimMinusMap' => $diffClaimMinusMap,
        'diffMapMinusClaim' => $diffMapMinusClaim,
        'intersection' => $intersection,
        // 追加: 差分にcontentを付与した詳細
        'diffClaimMinusMapDetailed' => $diffClaimMinusMapDetailed,
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
