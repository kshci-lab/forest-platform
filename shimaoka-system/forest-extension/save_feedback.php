<?php
header("Content-Type: application/json; charset=UTF-8");

// シンプルにローカル直書き接続（他ファイルと同様）
$pdo = new PDO("mysql:host=localhost;dbname=forest_platform;charset=utf8", "root", "root", [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
]);

// GETでの参照: ?file_id=123 で該当の反応一覧を取得
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $fileId = isset($_GET['file_id']) && ctype_digit((string)$_GET['file_id']) ? (int)$_GET['file_id'] : null;
    if ($fileId === null) {
        echo json_encode(["error" => "file_id を指定してください"]);
        exit;
    }
    $stmt = $pdo->prepare("SELECT * FROM question_reactions WHERE file_id = ? ORDER BY id DESC");
    $stmt->execute([$fileId]);
    echo json_encode(["success" => true, "rows" => $stmt->fetchAll()]);
    exit;
}

// POSTでの保存
$data = json_decode(file_get_contents("php://input"), true);
$user_id       = $data['user_id'] ?? 1;
$file_id       = isset($data['file_id']) && is_numeric($data['file_id']) ? (int)$data['file_id'] : null;
$question_text = $data['question_text'] ?? '';
$is_adopted    = isset($data['is_adopted']) ? (int)$data['is_adopted'] : 0;
$reason        = $data['reason'] ?? '';

if (!$question_text) {
    echo json_encode(["error" => "質問がありません"]);
    exit;
}
if ($file_id === null) {
    echo json_encode(["error" => "file_id がありません"]);
    exit;
}

$stmt = $pdo->prepare("INSERT INTO question_reactions (user_id, file_id, question_text, is_adopted, reason) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$user_id, $file_id, $question_text, $is_adopted, $reason]);
echo json_encode(["success" => true]);
?>
