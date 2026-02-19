<?php
// update_object_goal_node.php
header('Content-Type: application/json; charset=UTF-8');
session_start();
require("connect_db.php");
$object_journal_id = $_POST['object_journal_id'] ?? '';
$node_id = $_POST['node_id'] ?? '';
if (!$object_journal_id || !$node_id) {
    echo json_encode(['success' => false, 'error' => 'object_journal_idまたはnode_idがありません']);
    exit;
}


try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_dbname;charset=utf8", $db_user, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'DB接続失敗: ' . $e->getMessage()]);
    exit;
}

$sql = "UPDATE object_journals SET node_id=:node_id, update_at=NOW() WHERE object_journal_id=:object_journal_id";
$stmt = $pdo->prepare($sql);
$stmt->bindValue(':object_journal_id', $object_journal_id, PDO::PARAM_STR);
$stmt->bindValue(':node_id', $node_id, PDO::PARAM_STR);
try {
    $stmt->execute();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
