<?php
// get_latest_object_goal.php
header('Content-Type: application/json; charset=UTF-8');

$db_host = "localhost";
$db_user = "root";
$db_password = "root";
$db_dbname = "forest_platform";
// タイムゾーン（表示に影響はないがログの整合性のため）
if (function_exists('date_default_timezone_set')) {
    date_default_timezone_set('Asia/Tokyo');
}
try {
    // DB 接続
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_dbname;charset=utf8", $db_user, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'DB接続失敗: ' . $e->getMessage()]);
    exit;
}

// セッション開始
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// map_id を取得（優先: GET > POST > SESSION）
$map_id = null;
if (isset($_GET['map_id'])) { $map_id = $_GET['map_id']; }
elseif (isset($_POST['map_id'])) { $map_id = $_POST['map_id']; }
elseif (isset($_SESSION['MAPID'])) { $map_id = $_SESSION['MAPID']; }

if ($map_id === null || $map_id === '') {
    echo json_encode(['success' => false, 'error' => 'map_id が指定されていません']);
    exit;
}

// object_journals の列名（map_id/MAPID）を検出
$mapCol = 'map_id';
try {
    $colsStmt = $pdo->query("DESCRIBE object_journals");
    $cols = $colsStmt ? $colsStmt->fetchAll(PDO::FETCH_COLUMN, 0) : [];
    if (is_array($cols)) {
        if (in_array('map_id', $cols, true)) { $mapCol = 'map_id'; }
        elseif (in_array('MAPID', $cols, true)) { $mapCol = 'MAPID'; }
    }
} catch (Exception $e) { /* fallback: map_id */ }

// 週次目標と紐づくノードの content を返す
$sql = "
    SELECT 
        g.object_journal_id,
        g.start_date,
        g.finish_date,
        n.node_id,
    FROM object_journals g
    LEFT JOIN object_journal_nodes n
        ON g.object_journal_id = n.object_journal_id
       AND (n.deleted IS NULL OR n.deleted = 0)
    LEFT JOIN node_latest nl
        ON n.node_id = nl.node_id
    WHERE g.`$mapCol` = :map_id
      AND g.goal_type = 'weekly'
      AND g.`delete` = 0
    ORDER BY g.appeared_at DESC
    LIMIT 50
";

$stmt = $pdo->prepare($sql);
$stmt->execute([':map_id' => (int)$map_id]);
$goals = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(['success' => true, 'goals' => $goals]);
