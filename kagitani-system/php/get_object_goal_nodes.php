


<?php
ini_set('display_errors', 0); // 本番は0, デバッグは1
error_reporting(E_ALL);
header('Content-Type: application/json; charset=UTF-8');

$map_id = $_SESSION['MAPID']; 

try {
    require_once('../../php/connect_db.php');
    if (!isset($mysqli) || !$mysqli) {
        throw new Exception('DB接続失敗 ($mysqli未定義)');
    }

    $object_journal_id = isset($_GET['object_journal_id']) ? $_GET['object_journal_id'] : '';
    if (!$object_journal_id) {
        echo json_encode(['success' => false, 'error' => 'object_journal_id missing']);
        exit;
    }

    $sql = "SELECT node_id FROM object_journal_nodes WHERE object_journal_id = ? AND deleted = 0";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        throw new Exception('SQLプリペア失敗: ' . $mysqli->error);
    }
    $stmt->bind_param("s", $object_journal_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $node_ids = [];
    while ($row = $result->fetch_assoc()) {
        $node_ids[] = $row['node_id'];
    }
    $stmt->close();
    echo json_encode(['success' => true, 'node_ids' => $node_ids]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
