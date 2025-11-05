<?php
// APIキー取得: 環境変数 → プロジェクト直下 .env → forest-extension/.env の順で探索（generate_question.php と統一）
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

// 1) 環境変数
$apiKey = getenv('OPENAI_API_KEY') ?: ($_ENV['OPENAI_API_KEY'] ?? '');
// AJAX判定（フォームの ajax=1 または ヘッダ）
$isAjax = !empty($_POST['ajax']) || !empty($_GET['ajax']) || (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest');
// 2) プロジェクト直下 .env（/shimaoka-system/.env）
if ($apiKey === '') {
    load_env_if_exists(dirname(__DIR__) . '/.env');
    $apiKey = getenv('OPENAI_API_KEY') ?: ($_ENV['OPENAI_API_KEY'] ?? '');
}
// 3) forest-extension/.env
if ($apiKey === '') {
    load_env_if_exists(__DIR__ . '/.env');
    $apiKey = getenv('OPENAI_API_KEY') ?: ($_ENV['OPENAI_API_KEY'] ?? '');
}

// アップロードエラーチェック
if (!isset($_FILES['pdf_file']) || $_FILES['pdf_file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    die('アップロードに失敗しました');
}

// セッション開始（user_id は後で users テーブルからも導出可）
if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }

// PDFバリデーション（MIME + 拡張子）
$tmpPath = $_FILES['pdf_file']['tmp_name'];
$origName = $_FILES['pdf_file']['name'];
$fileName = basename($origName);
$ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

// MIME判定（拡張が無い環境でも落ちないようフォールバック）
$mime = null;
if (class_exists('finfo')) {
    try {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = @$finfo->file($tmpPath);
    } catch (Throwable $e) {
        $mime = null;
    }
}
if (!$mime && function_exists('mime_content_type')) {
    $mime = @mime_content_type($tmpPath);
}
if (!$mime) {
    // シンプルに先頭シグネチャで判定
    $fp = @fopen($tmpPath, 'rb');
    $sig = $fp ? @fread($fp, 4) : '';
    if ($fp) { @fclose($fp); }
    if (strpos($sig, '%PDF') === 0) {
        $mime = 'application/pdf';
    }
}
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

// usersテーブルに基づき user_id を決定（優先度: SESSION.USERID → SESSION.USERNAME→ SESSION.user_id → POST/GET）
$userId = null;
if (isset($_SESSION['USERID']) && ctype_digit((string)$_SESSION['USERID'])) {
    $userId = (int)$_SESSION['USERID'];
}
if ($userId === null && !empty($_SESSION['USERNAME'])) {
    try {
        $st = $pdo->prepare('SELECT user_id FROM users WHERE name = ? ORDER BY user_id DESC LIMIT 1');
        $st->execute([$_SESSION['USERNAME']]);
        $row = $st->fetch();
        if ($row && isset($row['user_id'])) {
            $userId = (int)$row['user_id'];
        }
    } catch (Exception $e) {
        // ユーザー取得失敗は致命ではないが、後段のフォールバックに任せる
    }
}
if ($userId === null && isset($_SESSION['user_id']) && ctype_digit((string)$_SESSION['user_id'])) {
    $userId = (int)$_SESSION['user_id'];
}
if ($userId === null && isset($_POST['user_id']) && ctype_digit((string)$_POST['user_id'])) {
    $userId = (int)$_POST['user_id'];
}
if ($userId === null && isset($_GET['user_id']) && ctype_digit((string)$_GET['user_id'])) {
    $userId = (int)$_GET['user_id'];
}
if ($userId === null) {
    http_response_code(401);
    die('ユーザーIDが取得できません（usersテーブル未登録かセッション未設定）。再ログインしてください。');
}

// 既存チェック（同一ユーザー + 同一タイトル）
$stmt = $pdo->prepare('SELECT file_id, openai_file_id FROM discussion_materials WHERE user_id = ? AND file_name = ? ORDER BY file_id DESC LIMIT 1');
$stmt->execute([$userId, $fileName]);
$existing = $stmt->fetch(PDO::FETCH_ASSOC);

if ($existing && !empty($existing['openai_file_id'])) {
    // 既存のOpenAIファイルを再利用（クラウド再アップロードしない）
    @unlink($tmpPath);
    $qs = [
        'file_id'        => (string)$existing['file_id'],
        'file_name'      => $fileName,
        'openai_file_id' => (string)$existing['openai_file_id'],
    ];
    if ($isAjax) {
        // クエリ相当を設定して同階層の generate_question.php を実行し、HTMLをそのまま返す
        $_GET = $qs + $_GET; // 既存GETを保持しつつ上書き
        include __DIR__ . '/generate_question.php';
        exit;
    } else {
        header('Location: ./generate_question.php?' . http_build_query($qs));
        exit;
    }
}

// discussion_materials 行を用意（既存があれば流用、なければ新規）
if ($existing) {
    $fileId = (int)$existing['file_id'];
} else {
    // openai_file_id はDBデフォルト（NULL）に任せる
    $ins = $pdo->prepare('INSERT INTO discussion_materials (user_id, file_name) VALUES (?, ?)');
    $ins->execute([$userId, $fileName]);
    $fileId = (int)$pdo->lastInsertId();
}

// OpenAI Files API へアップロードし openai_file_id を取得
$openaiFileId = null;
$openaiError = false;
if ($apiKey && function_exists('curl_init')) {
    $ch = curl_init('https://api.openai.com/v1/files');
    $postFields = [
        'purpose' => 'assistants',
    // 一時ファイルから直接アップロード（サーバー保存は行わない）
    'file' => new CURLFile($tmpPath, 'application/pdf', $fileName)
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
    // APIキー未設定やcURL未導入のログ
    $log = __DIR__ . '/openai_upload_error.log';
    $msg = '[' . date('c') . '] ' . ($apiKey ? 'Missing cURL extension.' : 'Missing OPENAI_API_KEY.') . "\n";
    file_put_contents($log, $msg, FILE_APPEND);
}

// DBにopenai_file_idを反映（成功時）
if (!empty($openaiFileId)) {
    $upd = $pdo->prepare('UPDATE discussion_materials SET openai_file_id = ? WHERE file_id = ?');
    $upd->execute([$openaiFileId, $fileId]);
}

// 次画面へ遷移
$qs = [
    'file_id' => (string)$fileId,
    'file_name' => $fileName
];
if ($openaiFileId) { $qs['openai_file_id'] = $openaiFileId; }
if ($openaiError) { $qs['openai_error'] = 1; }
if ($isAjax) {
    $_GET = $qs + $_GET;
    include __DIR__ . '/generate_question.php';
    exit;
} else {
    $redirect = 'generate_question.php?' . http_build_query($qs);
    header('Location: ' . $redirect);
    exit;
}
?>
