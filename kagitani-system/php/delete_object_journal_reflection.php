<?php
// PDO 接続

session_start();

require("connect_db.php");


$pdo_host = $db_host;
$pdo_port = '3306';
if (strpos($db_host, ':') !== false) {
    list($pdo_host, $pdo_port) = explode(':', $db_host, 2);
}
try {
    $pdo = new PDO("mysql:host=$pdo_host;port=$pdo_port;dbname=$db_dbname;charset=utf8", $db_user, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'DB接続失敗: ' . $e->getMessage()]);
    exit;
}

$object_journal_reflection_id = isset($_POST['object_journal_reflection_id']) ? trim($_POST['object_journal_reflection_id']) : '';

if ($object_journal_reflection_id === '') {
    echo json_encode(['success' => false, 'error' => 'object_journal_reflection_id がありません']);
    exit;
}

try {
    // Soft delete: set deleted flag to 1 instead of physically deleting
    $updateStmt = $pdo->prepare("UPDATE `object_journal_reflections` SET `deleted` = 1, `update_at` = NOW() WHERE `object_journal_reflection_id` = :id");
    $updateStmt->execute([':id' => $object_journal_reflection_id]);
    
    if ($updateStmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => '内省を削除しました']);
    } else {
        echo json_encode(['success' => false, 'error' => '該当する内省が見つかりません']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => '削除に失敗しました: ' . $e->getMessage()]);
}
?>
