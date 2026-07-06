<?php
// update_discussed_status.php
// 指定された externalized_contents_id もしくは knowledge_fragment_id から discussed 状態を更新する
// 入力: POST externalized_contents_id (int) または knowledge_fragment_id (int), status (YET|UNDERWAY|DONE)
// 出力: JSON { status: 'ok', externalized_contents_id: ..., discussed: ... }

@header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/connect_db.php';
if (session_status() !== PHP_SESSION_ACTIVE) { @session_start(); }

$response = [ 'status' => 'error' ];
try {
    if (!isset($mysqli) || !($mysqli instanceof mysqli)) { throw new Exception('DB接続が無効です'); }

    $allowed = ['YET','UNDERWAY','DONE'];
    $status = isset($_POST['status']) ? trim($_POST['status']) : '';
    if (!in_array($status, $allowed, true)) { throw new Exception('不正な status 値です'); }

    $extId = isset($_POST['externalized_contents_id']) ? intval($_POST['externalized_contents_id'], 10) : 0;
    $kfid = isset($_POST['knowledge_fragment_id']) ? intval($_POST['knowledge_fragment_id'], 10) : 0;

    // externalized_contents.discussed カラム存在チェック
    $hasDiscussed = false;
    if ($res = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'discussed'")) {
        $hasDiscussed = ($res->num_rows > 0);
        $res->free();
    }
    if (!$hasDiscussed) { throw new Exception('discussed カラムが存在しません'); }

    // externalized_contents_id 直接指定が無い場合、knowledge_fragment(s) テーブルから解決
    if ($extId <= 0 && $kfid > 0) {
        $kfragTable = null;
        if ($t = $mysqli->query("SHOW TABLES LIKE 'knowledge_fragments'")) { if ($t->num_rows > 0) { $kfragTable = 'knowledge_fragments'; } $t->close(); }
        if ($kfragTable === null) { if ($t = $mysqli->query("SHOW TABLES LIKE 'knowledge_fragment'")) { if ($t->num_rows > 0) { $kfragTable = 'knowledge_fragment'; } $t->close(); } }
        if ($kfragTable === null) { throw new Exception('knowledge_fragment(s) テーブルが見つかりません'); }
        if ($stmtKF = $mysqli->prepare("SELECT externalized_contents_id FROM {$kfragTable} WHERE knowledge_fragment_id = ? LIMIT 1")) {
            $stmtKF->bind_param('i', $kfid);
            if ($stmtKF->execute()) {
                if ($rKF = $stmtKF->get_result()) {
                    if ($rowKF = $rKF->fetch_assoc()) {
                        if (isset($rowKF['externalized_contents_id'])) { $extId = intval($rowKF['externalized_contents_id'], 10); }
                    }
                    $rKF->free();
                }
            }
            $stmtKF->close();
        }
    }

    if ($extId <= 0) { throw new Exception('更新対象 externalized_contents_id を特定できません'); }

    if (!$stmt = $mysqli->prepare("UPDATE externalized_contents SET discussed = ? WHERE externalized_contents_id = ?")) {
        throw new Exception('UPDATE 準備失敗: ' . $mysqli->error);
    }
    $stmt->bind_param('si', $status, $extId);
    if (!$stmt->execute()) { throw new Exception('UPDATE 実行失敗: ' . $stmt->error); }
    $stmt->close();

    $response = [ 'status' => 'ok', 'externalized_contents_id' => $extId, 'discussed' => $status ];
} catch (Exception $ex) {
    $response['error'] = $ex->getMessage();
}

echo json_encode($response);
