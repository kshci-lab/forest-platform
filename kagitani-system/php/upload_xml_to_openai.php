<?php
// upload_xml_to_openai.php
// multipart/form-data で受け取った XML ファイルを OpenAI Files API に送信し、
// 返却された file_id を discussion_materials テーブルに挿入して JSON を返す。

header('Content-Type: application/json; charset=UTF-8');

// 簡易 dotenv ローダー
function load_dotenv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($k, $v) = explode('=', $line, 2);
        $k = trim($k);
        $v = trim($v);
        if ((substr($v,0,1) === '"' && substr($v,-1) === '"') || (substr($v,0,1) === "'" && substr($v,-1) === "'")) {
            $v = substr($v,1,-1);
        }
        if ($k !== '') {
            if (getenv($k) === false) {
                putenv("$k=$v");
                $_ENV[$k] = $v;
            }
        }
    }
}

// .env をロード
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) load_dotenv($envPath);

$apiKey = getenv('OPENAI_API_KEY');
if (!$apiKey) {
    if (file_exists(__DIR__ . '/config.php')) {
        @require_once __DIR__ . '/config.php';
        if (defined('OPENAI_API_KEY') && OPENAI_API_KEY) $apiKey = OPENAI_API_KEY;
    }
}
if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'OpenAI API キーが未設定です']);
    exit;
}

// ファイル受け取り検証
if (!isset($_FILES['xml_file'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'xml_file が送信されていません']);
    exit;
}

$file = $_FILES['xml_file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ファイルアップロードエラー: ' . $file['error']]);
    exit;
}

$origName = $file['name'];
$tmpPath = $file['tmp_name'];
$ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
if ($ext !== 'xml') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'XMLファイル(.xml)のみ許可されています']);
    exit;
}

// セッションからユーザID取得
session_start();
$userId = isset($_SESSION['USERID']) ? intval($_SESSION['USERID']) : 0;

// DB 接続
$dbFile = __DIR__ . '/connect_db.php';
$mysqli = null;
if (file_exists($dbFile)) {
    require_once $dbFile; // defines $mysqli
}

// OpenAI Files API に multipart でアップロード
try {
    $uploadUrl = 'https://api.openai.com/v1/files';

    $cfile = new CURLFile($tmpPath, 'application/xml', $origName);
    $postFields = [
        'file' => $cfile,
        'purpose' => 'answers'
    ];

    $ch = curl_init($uploadUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    // SSL 検証用 CA バンドルを指定（プロジェクト内 or 環境変数 or php.ini）
    $caPath = __DIR__ . '/../cert/cacert.pem';
    if (getenv('CURL_CA_BUNDLE')) {
        $envCa = getenv('CURL_CA_BUNDLE');
        if (is_file($envCa)) $caPath = $envCa;
    }
    $iniCa = ini_get('curl.cainfo') ?: ini_get('openssl.cafile');
    if ($iniCa && is_file($iniCa)) {
        $caPath = $iniCa;
    }
    if (is_file($caPath)) {
        curl_setopt($ch, CURLOPT_CAINFO, $caPath);
    }

    $resp = curl_exec($ch);
    $errno = curl_errno($ch);
    $errmsg = curl_error($ch);
    curl_close($ch);

    if ($resp === false || $errno) {
        throw new Exception('OpenAI Files API 接続エラー: ' . $errmsg);
    }

    $json = json_decode($resp, true);
    if (!$json) throw new Exception('OpenAI Files API のレスポンスが解析できません');
    if (isset($json['error'])) throw new Exception('OpenAI Files API エラー: ' . json_encode($json['error']));

    $openaiFileId = $json['id'] ?? null;
    if (!$openaiFileId) throw new Exception('OpenAI から file_id を取得できませんでした');

    // discussion_materials に挿入
    $localFileId = uniqid('', true);
    if (isset($mysqli) && $mysqli) {
        $stmt = $mysqli->prepare('INSERT INTO discussion_materials (file_id, openai_file_id, file_name, user_id) VALUES (?, ?, ?, ?)');
        if ($stmt) {
            $stmt->bind_param('sssi', $localFileId, $openaiFileId, $origName, $userId);
            $stmt->execute();
            $stmt->close();
        } else {
            // prepare 失敗
            error_log('DB prepare failed: ' . $mysqli->error);
        }
    }

    echo json_encode(['success' => true, 'openai_file_id' => $openaiFileId, 'file_id' => $localFileId, 'file_name' => $origName, 'user_id' => $userId], JSON_UNESCAPED_UNICODE);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    error_log('upload_xml_to_openai error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
