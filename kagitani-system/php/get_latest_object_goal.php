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



$sql = "SELECT g.object_goal_id, g.goal_type, g.start_date, g.finish_date, n.node_id, nl.content FROM object_goals g LEFT JOIN object_goal_nodes n ON g.object_goal_id = n.object_goal_id AND (n.deleted IS NULL OR n.deleted = 0) LEFT JOIN node_latest nl ON n.node_id = nl.node_id WHERE g.goal_type='weekly' AND g.delete=0 ORDER BY g.appeared_at DESC LIMIT 20";
$stmt = $pdo->prepare($sql);
$stmt->execute();
$goals = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(['success' => true, 'goals' => $goals]);
