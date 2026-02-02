<?php
header('Content-Type: application/json; charset=UTF-8');
session_start();

// PDO 接続
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
