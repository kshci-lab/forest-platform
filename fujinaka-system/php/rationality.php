<?php
session_start();
require("connect_db.php");
date_default_timezone_set('Asia/Tokyo');

header('Content-Type: application/json; charset=utf-8');

try {
    if (!isset($mysqli) || $mysqli->connect_errno) {
        throw new Exception('DB接続が見つかりません。');
    }
    if (!isset($_SESSION['SHEETID'])) {
        throw new Exception('SHEETIDが未設定です。');
    }
    $sheet_id = $_SESSION['SHEETID'];

    // 1) rationality_node から node_id を取得（対象シートのnodesに存在するもの）
    $sqlR = "SELECT DISTINCT rn.node_id
        FROM rationality_nodes rn
        INNER JOIN nodes n ON n.id = rn.node_id
        WHERE n.sheet_id = ?
          AND rn.node_id IS NOT NULL
    ";
    $stmtR = $mysqli->prepare($sqlR);
    if (!$stmtR) throw new Exception('SQLプリペア失敗(sqlR): ' . $mysqli->error);
    $stmtR->bind_param("s", $sheet_id);
    $stmtR->execute();
    $resR = $stmtR->get_result();
    $rationalityNodeIds = [];
    while ($row = $resR->fetch_row()) {
        $rationalityNodeIds[] = $row[0];
    }
    $stmtR->close();

    // 2) logic_node から f_node_id を取得（対象シートのnodesに存在するもの）
    $sqlL = "SELECT DISTINCT ln.f_node_id
        FROM logic_node ln
        INNER JOIN nodes n ON n.id = ln.f_node_id
        WHERE ln.f_node_id IS NOT NULL
          AND n.sheet_id = ?
    ";
    $stmtL = $mysqli->prepare($sqlL);
    if (!$stmtL) throw new Exception('SQLプリペア失敗(sqlL): ' . $mysqli->error);
    $stmtL->bind_param("s", $sheet_id);
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

    echo json_encode([
        'ok' => true,
        'sheetId' => $sheet_id,
        'rationalityNodeIds' => $rSet,
        'logicNodeFIds' => $lSet,
        'diffRationalityMinusLogic' => $diffRationalityMinusLogic,
        'diffLogicMinusRationality' => $diffLogicMinusRationality,
        'intersection' => $intersection,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
