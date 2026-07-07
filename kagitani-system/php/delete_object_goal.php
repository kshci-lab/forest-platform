<?php
// delete_object_goal.php
header('Content-Type: application/json; charset=UTF-8');

$object_goal_id = $_POST['object_goal_id'] ?? '';
if (!$object_goal_id) {
    echo json_encode(['success' => false, 'error' => 'object_goal_idがありません']);
    exit;
}

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

$sql = "UPDATE object_goals SET `delete`=1 WHERE object_goal_id=:object_goal_id";
$stmt = $pdo->prepare($sql);
$stmt->bindValue(':object_goal_id', $object_goal_id, PDO::PARAM_STR);
try {
    $stmt->execute();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
