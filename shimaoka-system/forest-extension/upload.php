<?php
// Load .env for OPENAI_API_KEY, etc. (PHP 7+ compatible)
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) continue;
        $eq = strpos($line, '=');
        if ($eq === false) continue;
        $k = trim(substr($line, 0, $eq));
        $v = trim(substr($line, $eq + 1));
        if ($k === '') continue;
        // remove optional surrounding quotes
        if ((strlen($v) >= 2) && (($v[0] === '"' && substr($v, -1) === '"') || ($v[0] === "'" && substr($v, -1) === "'"))) {
            $v = substr($v, 1, -1);
        }
        putenv($k . '=' . $v);
    }
}

// アップロードエラーチェック
if (!isset($_FILES['pdf_file']) || $_FILES['pdf_file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    die('アップロードに失敗しました');
}

// ユーザーID（現状はダミー固定）。将来ログイン導入時にセッションから取得へ置換
$userId = 1;

// PDFバリデーション（MIME + 拡張子）
$tmpPath = $_FILES['pdf_file']['tmp_name'];
$origName = $_FILES['pdf_file']['name'];
$fileName = basename($origName);
$ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

// MIME判定
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($tmpPath);
if ($mime !== 'application/pdf' || $ext !== 'pdf') {
    http_response_code(400);
    die('PDFファイルのみアップロード可能です');
}

// DB接続（従来通りの直書き。save_feedback.php に合わせています）
try {
    $pdo = new PDO("mysql:host=localhost;dbname=forest_platform;charset=utf8", "root", "root", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_MULTI_STATEMENTS => false
    ]);
} catch (Exception $e) {
    http_response_code(500);
    die('DB接続に失敗しました: ' . htmlspecialchars($e->getMessage()));
}

// 重複チェック（同一ユーザー + 同一タイトル）
$stmt = $pdo->prepare('SELECT 1 FROM uploaded_files WHERE user_id = ? AND file_name = ? LIMIT 1');
$stmt->execute([$userId, $fileName]);
if ($stmt->fetch()) {
    http_response_code(409);
    die('同一タイトルのPDFは既にアップロード済みです（同一ユーザー）');
}

// BASE64化
$binary = file_get_contents($tmpPath);
if ($binary === false) {
    http_response_code(500);
    die('ファイル読み込みに失敗しました');
}
$base64Data = base64_encode($binary);

// DB保存
$ins = $pdo->prepare('INSERT INTO uploaded_files (user_id, file_name, file_data) VALUES (?, ?, ?)');
$ins->execute([$userId, $fileName, $base64Data]);
$fileId = (int)$pdo->lastInsertId();

// ファイルも保存（アプリで参照する可能性用）
$upload_dir = __DIR__ . '/uploads/';
if (!file_exists($upload_dir)) mkdir($upload_dir, 0777, true);
$pdf_path = $upload_dir . $fileName;
if (!move_uploaded_file($tmpPath, $pdf_path)) {
    http_response_code(500);
    die('ファイル保存に失敗しました');
}

// OpenAI Files API へアップロードし openai_file_id を取得
$openaiFileId = null;
$apiKey = getenv('OPENAI_API_KEY');
$openaiError = false;
if ($apiKey) {
    $ch = curl_init('https://api.openai.com/v1/files');
    $postFields = [
        'purpose' => 'assistants',
        'file' => new CURLFile($pdf_path, 'application/pdf', $fileName)
    ];
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60
    ]);
    $resp = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    if ($resp !== false && $status >= 200 && $status < 300) {
        $json = json_decode($resp, true);
        if (isset($json['id'])) {
            $openaiFileId = $json['id'];
        }
    } else {
        $openaiError = true;
        // log details for troubleshooting
        $log = __DIR__ . '/openai_upload_error.log';
        $msg = '[' . date('c') . "] Files API upload failed\n";
        $msg .= 'HTTP: ' . (string)$status . "\n";
        if ($curlErr) { $msg .= 'cURL: ' . $curlErr . "\n"; }
        if ($resp !== false) { $msg .= 'Body: ' . substr($resp, 0, 2000) . "\n"; }
        file_put_contents($log, $msg, FILE_APPEND);
    }
    curl_close($ch);
} else {
    $openaiError = true;
}

// マップ更新（ファイル名 => openai_file_id）
$mapFile = __DIR__ . '/openai_files_map.json';
if ($openaiFileId) {
    $map = [];
    if (file_exists($mapFile)) {
        $raw = file_get_contents($mapFile);
        $tmp = json_decode($raw, true);
        if (is_array($tmp)) { $map = $tmp; }
    }
    $map[$fileName] = $openaiFileId; // 上書き
    file_put_contents($mapFile, json_encode($map, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

// 次画面へ遷移
$qs = [
    'file_id' => (string)$fileId,
    'file_name' => $fileName
];
if ($openaiFileId) { $qs['openai_file_id'] = $openaiFileId; }
if ($openaiError) { $qs['openai_error'] = 1; }
$redirect = 'generate_question.php?' . http_build_query($qs);
header('Location: ' . $redirect);
exit;
?>
