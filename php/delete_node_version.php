<?php
session_start();
require("connect_db.php");

header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Asia/Tokyo');
$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

function respond_node_version_delete($status, $message = '', $extra = array()) {
    echo json_encode(array_merge(array(
        'status' => $status,
        'message' => $message
    ), $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

function fetch_single_assoc($mysqli, $sql, $types = '', &$params = array()) {
    if (!($stmt = $mysqli->prepare($sql))) {
        return false;
    }
    if ($types !== '') {
        $bind_params = array($types);
        foreach ($params as $key => &$value) {
            $bind_params[] = &$value;
        }
        call_user_func_array(array($stmt, 'bind_param'), $bind_params);
    }
    if (!$stmt->execute()) {
        $stmt->close();
        return false;
    }
    $result = $stmt->get_result();
    $row = $result ? $result->fetch_assoc() : null;
    $stmt->close();
    return $row;
}

function execute_stmt($mysqli, $sql, $types = '', &$params = array()) {
    if (!($stmt = $mysqli->prepare($sql))) {
        return false;
    }
    if ($types !== '') {
        $bind_params = array($types);
        foreach ($params as $key => &$value) {
            $bind_params[] = &$value;
        }
        call_user_func_array(array($stmt, 'bind_param'), $bind_params);
    }
    $ok = $stmt->execute();
    $stmt->close();
    return $ok;
}

if (!isset($_SESSION['MAPID'])) {
    respond_node_version_delete('error', 'マップ情報を確認できませんでした');
}

if (!isset($_POST['node_version_id']) || $_POST['node_version_id'] === '') {
    respond_node_version_delete('error', '削除するノードバージョンを確認できませんでした');
}

$map_id = intval($_SESSION['MAPID']);
$target_node_version_id = $_POST['node_version_id'];

if (!$mysqli->begin_transaction()) {
    respond_node_version_delete('error', '削除処理を開始できませんでした');
}

$target_params = array(&$target_node_version_id, &$map_id);
$target = fetch_single_assoc(
    $mysqli,
    "SELECT node_version_id, node_id, appeared_at, disappeared_at
       FROM node_versions
      WHERE node_version_id = ?
        AND node_id IN (
            SELECT node_id FROM map_node_links WHERE map_id = ?
        )
      FOR UPDATE",
    'si',
    $target_params
);

if (!$target) {
    $mysqli->rollback();
    respond_node_version_delete('error', '削除対象のノードバージョンが見つかりませんでした');
}

$node_id = $target['node_id'];
$target_appeared_at = $target['appeared_at'];
$target_disappeared_at = $target['disappeared_at'];

$previous_params = array(&$node_id, &$target_appeared_at);
$previous = fetch_single_assoc(
    $mysqli,
    "SELECT node_version_id
       FROM node_versions
      WHERE node_id = ?
        AND disappeared_at = ?
      FOR UPDATE",
    'ss',
    $previous_params
);

$next = null;
if ($target_disappeared_at !== null) {
    $next_params = array(&$node_id, &$target_disappeared_at);
    $next = fetch_single_assoc(
        $mysqli,
        "SELECT node_version_id
           FROM node_versions
          WHERE node_id = ?
            AND appeared_at = ?
          FOR UPDATE",
        'ss',
        $next_params
    );
}

if (!$previous) {
    $mysqli->rollback();
    respond_node_version_delete('error', '前のバージョンがないノードバージョンは削除できません');
}

$previous_node_version_id = $previous ? $previous['node_version_id'] : null;
$next_node_version_id = $next ? $next['node_version_id'] : null;
$replacement_node_version_id = $previous_node_version_id;
$trigger_from_rewire_node_version_id = $previous_node_version_id;
$trigger_to_rewire_node_version_id = $next_node_version_id ? $next_node_version_id : $previous_node_version_id;
$process_rewire_node_version_id = $next_node_version_id ? $next_node_version_id : $previous_node_version_id;

if ($next) {
    $update_next_params = array(&$target_appeared_at, &$next_node_version_id);
    if (!execute_stmt(
        $mysqli,
        "UPDATE node_versions
            SET appeared_at = ?
          WHERE node_version_id = ?",
        'ss',
        $update_next_params
    )) {
        $mysqli->rollback();
        respond_node_version_delete('error', '後続バージョンの更新に失敗しました');
    }
} else {
    $update_previous_params = array(&$previous_node_version_id);
    if (!execute_stmt(
        $mysqli,
        "UPDATE node_versions
            SET disappeared_at = NULL
          WHERE node_version_id = ?",
        's',
        $update_previous_params
    )) {
        $mysqli->rollback();
        respond_node_version_delete('error', '前バージョンの更新に失敗しました');
    }
}

$history_params = array(&$replacement_node_version_id, &$target_node_version_id);
if (!execute_stmt(
    $mysqli,
    "UPDATE node_histories
        SET node_version_id = ?
      WHERE node_version_id = ?",
    'ss',
    $history_params
)) {
    $mysqli->rollback();
    respond_node_version_delete('error', 'ノード履歴の更新に失敗しました');
}

$trigger_from_params = array(&$trigger_from_rewire_node_version_id, &$target_node_version_id);
if (!execute_stmt(
    $mysqli,
    "UPDATE triggers
        SET `from` = ?
      WHERE `from` = ?
        AND deleted = 0",
    'ss',
    $trigger_from_params
)) {
    $mysqli->rollback();
    respond_node_version_delete('error', 'トリガーの開始バージョン更新に失敗しました');
}

$trigger_to_params = array(&$trigger_to_rewire_node_version_id, &$target_node_version_id);
if (!execute_stmt(
    $mysqli,
    "UPDATE triggers
        SET `to` = ?
      WHERE `to` = ?
        AND deleted = 0",
    'ss',
    $trigger_to_params
)) {
    $mysqli->rollback();
    respond_node_version_delete('error', 'トリガーの終了バージョン更新に失敗しました');
}

$process_edge_start_params = array(&$process_rewire_node_version_id, &$timestamp, &$target_node_version_id);
if (!execute_stmt(
    $mysqli,
    "UPDATE process_edges
        SET edge_start = ?,
            updated_at = ?
      WHERE edge_start = ?
        AND deleted = 0",
    'sss',
    $process_edge_start_params
)) {
    $mysqli->rollback();
    respond_node_version_delete('error', 'プロセスエッジの開始ノード更新に失敗しました');
}

$process_edge_end_params = array(&$process_rewire_node_version_id, &$timestamp, &$target_node_version_id);
if (!execute_stmt(
    $mysqli,
    "UPDATE process_edges
        SET edge_end = ?,
            updated_at = ?
      WHERE edge_end = ?
        AND deleted = 0",
    'sss',
    $process_edge_end_params
)) {
    $mysqli->rollback();
    respond_node_version_delete('error', 'プロセスエッジの終了ノード更新に失敗しました');
}

$process_node_params = array(&$process_rewire_node_version_id, &$timestamp, &$target_node_version_id);
if (!execute_stmt(
    $mysqli,
    "UPDATE process_nodes
        SET node_id = ?,
            updated_at = ?
      WHERE node_id = ?
        AND deleted = 0",
    'sss',
    $process_node_params
)) {
    $mysqli->rollback();
    respond_node_version_delete('error', 'プロセスノードの接続元更新に失敗しました');
}

$delete_params = array(&$target_node_version_id);
if (!execute_stmt(
    $mysqli,
    "DELETE FROM node_versions WHERE node_version_id = ?",
    's',
    $delete_params
)) {
    $mysqli->rollback();
    respond_node_version_delete('error', 'ノードバージョンの削除に失敗しました');
}

if (!$mysqli->commit()) {
    $mysqli->rollback();
    respond_node_version_delete('error', 'ノードバージョンの削除を確定できませんでした');
}

respond_node_version_delete('ok', '', array(
    'deleted_node_version_id' => $target_node_version_id,
    'previous_node_version_id' => $previous_node_version_id,
    'next_node_version_id' => $next_node_version_id,
    'replacement_node_version_id' => $replacement_node_version_id,
    'trigger_from_rewire_node_version_id' => $trigger_from_rewire_node_version_id,
    'trigger_to_rewire_node_version_id' => $trigger_to_rewire_node_version_id,
    'process_rewire_node_version_id' => $process_rewire_node_version_id
));
?>
