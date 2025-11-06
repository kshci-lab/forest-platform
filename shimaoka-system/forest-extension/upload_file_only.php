<?php
// PDFをOpenAI Filesにアップロードし、DBへopenai_file_id等を保存するだけのAPI（質問生成は行わない）

// 共通: .env読み込みヘルパー
if (!function_exists('load_env_if_exists')) {
    function load_env_if_exists($path) {
        if (!is_readable($path)) return;
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) return;
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || strpos($line, '#') === 0) continue;
            if (strpos($line, 'export ') === 0) $line = trim(substr($line, 7));
            $eq = strpos($line, '=');
            if ($eq === false) continue;
            $k = trim(substr($line, 0, $eq));
            $v = trim(substr($line, $eq + 1));
            if ($k === '') continue;
            if ((strlen($v) >= 2) && (($v[0] === '"' && substr($v, -1) === '"') || ($v[0] === "'" && substr($v, -1) === "'"))) {
                $v = substr($v, 1, -1);
            }
            if (getenv($k) === false) {
                putenv($k . '=' . $v);
                $_ENV[$k] = $v;
            }
        }
    }
}

header('Content-Type: application/json; charset=utf-8');

$isAjax = !empty($_POST['ajax']) || !empty($_GET['ajax']) || (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest');

// APIキー取得順序: env → /shimaoka-system/.env → forest-extension/.env
$apiKey = getenv('OPENAI_API_KEY') ?: ($_ENV['OPENAI_API_KEY'] ?? '');
if ($apiKey === '') {
    load_env_if_exists(dirname(__DIR__) . '/.env');
    $apiKey = getenv('OPENAI_API_KEY') ?: ($_ENV['OPENAI_API_KEY'] ?? '');
}
if ($apiKey === '') {
    load_env_if_exists(__DIR__ . '/.env');
    $apiKey = getenv('OPENAI_API_KEY') ?: ($_ENV['OPENAI_API_KEY'] ?? '');
}

// アップロード検証
if (!isset($_FILES['pdf_file']) || $_FILES['pdf_file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode([ 'success' => false, 'error' => 'アップロードに失敗しました' ]);
    exit;
}

if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }

$tmpPath = $_FILES['pdf_file']['tmp_name'];
$origName = $_FILES['pdf_file']['name'];
$fileName = basename($origName);
$ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

// MIME判定
$mime = null;
if (class_exists('finfo')) {
    try { $finfo = new finfo(FILEINFO_MIME_TYPE); $mime = @$finfo->file($tmpPath); } catch (Throwable $e) { $mime = null; }
}
if (!$mime && function_exists('mime_content_type')) { $mime = @mime_content_type($tmpPath); }
if (!$mime) {
    $fp = @fopen($tmpPath, 'rb');
    $sig = $fp ? @fread($fp, 4) : '';
    if ($fp) { @fclose($fp); }
    if (strpos($sig, '%PDF') === 0) { $mime = 'application/pdf'; }
}
if ($mime !== 'application/pdf' || $ext !== 'pdf') {
    http_response_code(400);
    echo json_encode([ 'success' => false, 'error' => 'PDFファイルのみアップロード可能です' ]);
    exit;
}

// DB接続
try {
    $pdo = new PDO("mysql:host=localhost;dbname=forest_platform;charset=utf8", "root", "root", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_MULTI_STATEMENTS => false
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([ 'success' => false, 'error' => 'DB接続に失敗しました: ' . $e->getMessage() ]);
    exit;
}

// user_id解決（セッション/ユーザ名）
$userId = null;
if (isset($_SESSION['USERID']) && ctype_digit((string)$_SESSION['USERID'])) {
    $userId = (int)$_SESSION['USERID'];
}
if ($userId === null && !empty($_SESSION['USERNAME'])) {
    try {
        $st = $pdo->prepare('SELECT user_id FROM users WHERE name = ? ORDER BY user_id DESC LIMIT 1');
        $st->execute([$_SESSION['USERNAME']]);
        $row = $st->fetch();
        if ($row && isset($row['user_id'])) { $userId = (int)$row['user_id']; }
    } catch (Exception $e) { /* no-op */ }
}
if ($userId === null && isset($_SESSION['user_id']) && ctype_digit((string)$_SESSION['user_id'])) {
    $userId = (int)$_SESSION['user_id'];
}
if ($userId === null) {
    http_response_code(401);
    echo json_encode([ 'success' => false, 'error' => 'ユーザーIDが取得できません。再ログインしてください。' ]);
    exit;
}

// 既存チェック（同一ユーザー + 同一タイトル）
$stmt = $pdo->prepare('SELECT file_id, openai_file_id FROM discussion_materials WHERE user_id = ? AND file_name = ? ORDER BY file_id DESC LIMIT 1');
$stmt->execute([$userId, $fileName]);
$existing = $stmt->fetch(PDO::FETCH_ASSOC);

// 既存レコードがなければ作成
if ($existing) {
    $fileId = (int)$existing['file_id'];
} else {
    $ins = $pdo->prepare('INSERT INTO discussion_materials (user_id, file_name) VALUES (?, ?)');
    $ins->execute([$userId, $fileName]);
    $fileId = (int)$pdo->lastInsertId();
}

$already = false;
$openaiFileId = $existing['openai_file_id'] ?? null;

// 既にopenai_file_idがある場合は再利用し、アップロードはスキップ
if (!empty($openaiFileId)) {
    @unlink($tmpPath);
    $already = true;
} else {
    // OpenAI Files API へアップロード
    if (!$apiKey) {
        http_response_code(500);
        echo json_encode([ 'success' => false, 'error' => 'OPENAI_API_KEYが未設定です' ]);
        exit;
    }
    if (!function_exists('curl_init')) {
        http_response_code(500);
        echo json_encode([ 'success' => false, 'error' => 'cURL拡張が利用できません' ]);
        exit;
    }

    $ch = curl_init('https://api.openai.com/v1/files');
    $postFields = [
        'purpose' => 'assistants',
        'file' => new CURLFile($tmpPath, 'application/pdf', $fileName)
    ];
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => [ 'Authorization: Bearer ' . $apiKey ],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60
    ]);
    $resp = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($resp === false || $status < 200 || $status >= 300) {
        $body = is_string($resp) ? substr($resp, 0, 2000) : '';
        http_response_code(502);
        echo json_encode([
            'success' => false,
            'error' => 'OpenAI Files APIへのアップロードに失敗しました',
            'status' => $status,
            'detail' => $curlErr ?: $body
        ]);
        exit;
    }

    $json = json_decode($resp, true);
    if (!isset($json['id'])) {
        http_response_code(502);
        echo json_encode([
            'success' => false,
            'error' => 'OpenAIから有効な応答がありません',
            'body' => $json
        ]);
        exit;
    }
    $openaiFileId = $json['id'];

    // DB更新
    $upd = $pdo->prepare('UPDATE discussion_materials SET openai_file_id = ? WHERE file_id = ?');
    $upd->execute([$openaiFileId, $fileId]);
}

echo json_encode([
    'success' => true,
    'message' => 'クラウドに保存しました',
    'file_id' => (string)$fileId,
    'file_name' => $fileName,
    'openai_file_id' => (string)$openaiFileId,
    'already_exists' => $already
]);
exit;
?>
