<?php
session_start();
// require("connect_db.php");
// PDO接続（connect_db.phpはmysqliのみ）
$db_host = "localhost";
$db_user = "root";
$db_password = "root";
$db_dbname = "forest_platform";
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_dbname;charset=utf8", $db_user, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'DB接続失敗: ' . $e->getMessage()]);
    exit;
}


// POSTで受け取る

$goal_type = $_POST['goal_type'] ?? '';
$object_node_id = $_POST['object_node_id'] ?? '';
$label = $_POST['label'] ?? '';
$start_date = $_POST['start_date'] ?? '';
$finish_date = $_POST['finish_date'] ?? '';



$object_goal_id = uniqid('goal_', true);
$appeared_at = date('Y-m-d H:i:s');
$update_at = $appeared_at;
$delete = 0;

$sql = "INSERT INTO `object_goals`(`object_goal_id`, `goal_type`, `start_date`, `finish_date`, `appeared_at`, `update_at`, `delete`) VALUES (:object_goal_id, :goal_type,  :start_date, :finish_date, :appeared_at, :update_at, :delete)";

$sql = "INSERT INTO `object_goals`(`object_goal_id`, `goal_type`, `object_node_id`, `label`, `start_date`, `finish_date`, `appeared_at`, `update_at`, `delete`) VALUES (:object_goal_id, :goal_type, :object_node_id, :label, :start_date, :finish_date, :appeared_at, :update_at, :delete)";
$stmt = $pdo->prepare($sql);
$stmt->bindValue(':object_goal_id', $object_goal_id, PDO::PARAM_STR);
$stmt->bindValue(':goal_type', $goal_type, PDO::PARAM_STR);
$stmt->bindValue(':object_node_id', $object_node_id, PDO::PARAM_STR);
$stmt->bindValue(':label', $label, PDO::PARAM_STR);
$stmt->bindValue(':start_date', $start_date, PDO::PARAM_STR);
$stmt->bindValue(':finish_date', $finish_date, PDO::PARAM_STR);
$stmt->bindValue(':appeared_at', $appeared_at, PDO::PARAM_STR);
$stmt->bindValue(':update_at', $update_at, PDO::PARAM_STR);
$stmt->bindValue(':delete', $delete, PDO::PARAM_INT);

try {
    $stmt->execute();
    echo json_encode(['success' => true, 'object_goal_id' => $object_goal_id]);
} catch (Exception $e) {
    file_put_contents('debug.txt', "SQL Error: " . $e->getMessage() . "\n", FILE_APPEND);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
