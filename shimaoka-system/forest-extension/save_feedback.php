<?php
header("Content-Type: application/json; charset=UTF-8");
require_once("../forest-platform/php/connect_db.php"); // DB接続ファイル

// POSTデータ取得
$data = json_decode(file_get_contents("php://input"), true);

$user_id       = $data["user_id"] ?? 1;
$question_text = $data["question_text"] ?? "";
$is_adopted    = $data["is_adopted"] ?? 0;
$reason        = $data["reason"] ?? "";

if (!$question_text) {
    echo json_encode(["error" => "質問がありません"]);
    exit;
}

try {
    $pdo = new PDO("mysql:host=localhost;dbname=forest_platform;charset=utf8", "root", "root");
    $stmt = $pdo->prepare("
        INSERT INTO question_reactions (user_id, question_text, is_adopted, reason)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$user_id, $question_text, $is_adopted, $reason]);

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
