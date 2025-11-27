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

    // 1) rationality_nodes から node_id を取得（対象ユーザ＆シート）
    $sqlR = "SELECT DISTINCT rn.node_id
        FROM rationality_nodes rn
        INNER JOIN nodes n ON n.id = rn.node_id
        WHERE n.sheet_id = ?
          AND n.user_id = ?
          AND rn.node_id IS NOT NULL
    ";
    $stmtR = $mysqli->prepare($sqlR);
    if (!$stmtR) throw new Exception('SQLプリペア失敗(sqlR): ' . $mysqli->error);
    $stmtR->bind_param("ss", $sheet_id, $user_id);
    $stmtR->execute();
    $resR = $stmtR->get_result();
    $rationalityNodeIds = [];
    while ($row = $resR->fetch_row()) {
        $rationalityNodeIds[] = $row[0];
    }
    $stmtR->close();

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

    // 3.5) 差分（rationality - logic）のnode_idに紐づくcontentを取得（rationality_nodesにあるnode_idを参照し、nodesからcontentを取得）
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
        'rationalityNodeIds' => $rSet,
        'logicNodeFIds' => $lSet,
        'diffRationalityMinusLogic' => $diffRationalityMinusLogic,
        'diffLogicMinusRationality' => $diffLogicMinusRationality,
        'intersection' => $intersection,
        // 追加: 差分のnode_idに対応するcontent
        'diffRationalityMinusLogicDetailed' => $diffRationalityMinusLogicDetailed,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
