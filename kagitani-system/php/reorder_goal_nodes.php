<?php
require_once('connect_db.php');
// エラー表示を抑制
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=UTF-8');
if (function_exists('date_default_timezone_set')) {
    date_default_timezone_set('Asia/Tokyo');
}

$object_journal_id = $_POST['object_journal_id'] ?? '';
$ordered_nodes_json = $_POST['ordered_nodes'] ?? '[]';

if ($object_journal_id === '') {
    echo json_encode(['success' => false, 'error' => 'Missing object_journal_id']);
    exit;
}

$ordered_nodes = json_decode($ordered_nodes_json, true);
if (!is_array($ordered_nodes)) {
    echo json_encode(['success' => false, 'error' => 'Invalid ordered_nodes format']);
    exit;
}

$pdo_host = $db_host;
$pdo_port = '3306';
if (strpos($db_host, ':') !== false) {
    list($pdo_host, $pdo_port) = explode(':', $db_host, 2);
}
try {
    $pdo = new PDO("mysql:host=$pdo_host;port=$pdo_port;dbname=$db_dbname;charset=utf8", $db_user, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // トランザクション開始
    $pdo->beginTransaction();
    
    // まず既存の該当ジャーナルのノードをすべて論理削除 (deleted=1)
    $now = date('Y-m-d H:i:s');
    $del_sql = "UPDATE object_journal_nodes SET deleted = 1, update_at = :now WHERE object_journal_id = :journal_id";
    $del_stmt = $pdo->prepare($del_sql);
    $del_stmt->execute([':now' => $now, ':journal_id' => $object_journal_id]);
    
    // その後、順番通りに新規挿入 (新しい primary_key を生成)
    $ins_sql = "INSERT INTO object_journal_nodes (object_journal_node_id, object_journal_id, node_id, created_at, update_at, deleted) VALUES (:oj_node_id, :journal_id, :node_id, :now, :now, 0)";
    $ins_stmt = $pdo->prepare($ins_sql);
    
    foreach ($ordered_nodes as $node) {
        $node_id = isset($node['node_id']) && $node['node_id'] !== '' ? $node['node_id'] : null;
        
        // node_id がない場合は content から node_id を取得
        if (!$node_id && isset($node['content'])) {
            $sel_sql = "SELECT node_id FROM node_latest WHERE content = :content LIMIT 1";
            $sel_stmt = $pdo->prepare($sel_sql);
            $sel_stmt->execute([':content' => $node['content']]);
            $row = $sel_stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $node_id = $row['node_id'];
            }
        }
        
        if ($node_id) {
            $new_oj_node_id = uniqid('ojn_', true);
            $ins_stmt->execute([
                ':oj_node_id' => $new_oj_node_id,
                ':journal_id' => $object_journal_id,
                ':node_id' => $node_id,
                ':now' => $now
            ]);
        }
    }
    
    $pdo->commit();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
