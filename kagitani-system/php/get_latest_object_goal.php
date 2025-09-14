<?php
// get_latest_object_goal.php
header('Content-Type: application/json; charset=UTF-8');

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

$sql = "SELECT object_goal_id, goal_type, start_date, finish_date FROM object_goals WHERE goal_type='weekly' AND `delete`=0 ORDER BY appeared_at DESC LIMIT 20";
$stmt = $pdo->prepare($sql);
$stmt->execute();
$goals = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(['success' => true, 'goals' => $goals]);
