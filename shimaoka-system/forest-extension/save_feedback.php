<?php
header("Content-Type: application/json; charset=UTF-8");

// シンプルにローカル直書き接続（他ファイルと同様）
$pdo = new PDO("mysql:host=localhost;dbname=forest_platform;charset=utf8", "root", "root", [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
]);

// ユーザーIDは必ず存在する前提：セッションから取得し、なければ users から導出
session_start();
$resolvedUserId = null;
if (isset($_SESSION['USERID']) && ctype_digit((string)$_SESSION['USERID'])) {
    $resolvedUserId = (int)$_SESSION['USERID'];
} elseif (isset($_SESSION['user_id']) && ctype_digit((string)$_SESSION['user_id'])) {
    $resolvedUserId = (int)$_SESSION['user_id'];
} elseif (!empty($_SESSION['USERNAME'])) {
    try {
        $stU = $pdo->prepare('SELECT user_id FROM users WHERE name = ? ORDER BY user_id DESC LIMIT 1');
        $stU->execute([$_SESSION['USERNAME']]);
        $rowU = $stU->fetch();
        if ($rowU && isset($rowU['user_id'])) {
            $resolvedUserId = (int)$rowU['user_id'];
        }
    } catch (Exception $e) {
        // 無視して後段のエラーに委ねる
    }
}
if ($resolvedUserId === null) {
    http_response_code(401);
    echo json_encode(["error" => "ユーザーIDが取得できません（セッション切れの可能性）。再ログインしてください。"]); 
    exit;
}

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

// POSTでの保存（JSON / form-data / x-www-form-urlencoded の全てに対応）
$ct = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($ct, 'application/json') !== false) {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
} else {
    // FormData や x-www-form-urlencoded は $_POST から取得
    $data = $_POST;
}

$user_id       = $resolvedUserId; // リクエストからは受け取らず、サーバ側で確定したIDを使用
$file_id       = isset($data['file_id']) && is_numeric($data['file_id']) ? (int)$data['file_id'] : null;
$question_text = isset($data['question_text']) ? (string)$data['question_text'] : '';
$is_adopted    = isset($data['is_adopted']) && is_numeric($data['is_adopted']) ? (int)$data['is_adopted'] : 0;
$reason        = isset($data['reason']) ? (string)$data['reason'] : '';

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
