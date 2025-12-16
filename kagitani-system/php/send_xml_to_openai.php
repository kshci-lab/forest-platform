<?php
// send_xml_to_openai.php
// ブラウザから送られたXMLコンテンツを受け取り、OpenAIに送信して応答を返す
// 入力: JSON { filename, content }
// 出力: JSON { success, ai_response, error }

header('Content-Type: application/json; charset=UTF-8');

// 簡易 dotenv ローダー（get_ai_advice.php と同様）
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

$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    load_dotenv($envPath);
}

$apiKey = getenv('OPENAI_API_KEY');
if (!$apiKey) {
    if (file_exists(__DIR__ . '/config.php')) {
        @require_once(__DIR__ . '/config.php');
        if (defined('OPENAI_API_KEY') && OPENAI_API_KEY) {
            $apiKey = OPENAI_API_KEY;
        }
    }
}
if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'OpenAI API キーが未設定です']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'リクエストが空です']);
    exit;
}

$filename = $input['filename'] ?? 'uploaded.xml';
$content = $input['content'] ?? '';
if (trim($content) === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'コンテンツが空です']);
    exit;
}

// セッションからユーザーIDを取得（存在する場合）
session_start();
$userId = isset($_SESSION['USERID']) ? intval($_SESSION['USERID']) : null;

// DB接続（mysqli を利用する既存接続を使用）
$dbPath = __DIR__ . '/connect_db.php';
if (file_exists($dbPath)) {
    require_once $dbPath; // provides $mysqli
} else {
    $mysqli = null;
}

// 1) OpenAI Files API にアップロードして file_id を取得
$openaiFileId = null;
try {
    // 一時ファイルに書き出す
    $tmp = tempnam(sys_get_temp_dir(), 'xml_');
    file_put_contents($tmp, $content);

    // 恒久保存: uploads/YYYYMMDD/ に保存（存在すれば DB の file_name に保存名を入れる）
    $storedFilename = null;
    try {
        $uploadsBase = realpath(__DIR__ . '/..') . DIRECTORY_SEPARATOR . 'uploads';
        $subdir = date('Ymd');
        $storageDir = $uploadsBase . DIRECTORY_SEPARATOR . $subdir;
        if (!is_dir($storageDir)) {
            @mkdir($storageDir, 0755, true);
        }
        if (is_dir($storageDir)) {
            $storedFilename = uniqid('xml_', true) . '.xml';
            $storedPath = $storageDir . DIRECTORY_SEPARATOR . $storedFilename;
            // コピーして一時ファイルは後で削除
            if (@copy($tmp, $storedPath)) {
                // 権限を整えておく
                @chmod($storedPath, 0644);
            } else {
                $storedFilename = null;
            }
        }
    } catch (Exception $e) {
        $storedFilename = null;
    }

    $uploadUrl = 'https://api.openai.com/v1/files';
    $chf = curl_init($uploadUrl);
    $cfile = new CURLFile($tmp, 'application/xml', $filename);

    $postFields = [
        'file' => $cfile,
        'purpose' => 'answers'
    ];

    curl_setopt($chf, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chf, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey
    ]);
    curl_setopt($chf, CURLOPT_POST, true);
    curl_setopt($chf, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($chf, CURLOPT_TIMEOUT, 60);

    $respf = curl_exec($chf);
    $errnof = curl_errno($chf);
    $errmsgf = curl_error($chf);
    curl_close($chf);

    if ($respf === false || $errnof) {
        throw new Exception('OpenAI Files API 接続エラー: ' . $errmsgf);
    }
    $respf = json_decode($respf, true);
    if (isset($respf['id'])) {
        $openaiFileId = $respf['id'];
    } else {
        // 応答にエラーがある場合は例外
        $errm = $respf['error']['message'] ?? json_encode($respf);
        throw new Exception('OpenAI Files API エラー: ' . $errm);
    }

    // DBに挿入（存在すれば挿入。$mysqli があれば使用）
    if (!empty($mysqli) && $openaiFileId !== null) {
        $localFileId = uniqid('', true);
        // 保存名があればそれを、なければ元のアップロード名を入れる
        $dbFileName = $storedFilename !== null ? ($subdir . '/' . $storedFilename) : $filename;
        $stmt = $mysqli->prepare('INSERT INTO discussion_materials (file_id, openai_file_id, file_name, user_id) VALUES (?, ?, ?, ?)');
        if ($stmt) {
            $uidParam = $userId !== null ? $userId : 0;
            $stmt->bind_param('sssi', $localFileId, $openaiFileId, $dbFileName, $uidParam);
            $stmt->execute();
            $stmt->close();
        }
    }

    // 一時ファイル削除
    @unlink($tmp);

} catch (Exception $e) {
    // ファイルアップロード失敗は致命的ではないためログだけ残し続行
    error_log('send_xml_to_openai file upload error: ' . $e->getMessage());
}

// プロンプト作成: XML を解析して要約と重要発話を抽出するように指示
$prompt = "以下は議論ログ（XML形式）です。\nファイル名: {$filename}\n\n";
$prompt .= "指示:\n";
$prompt .= "1) このXMLの内容を日本語で簡潔に要約してください（2〜4文）。\n";
$prompt .= "2) 重要な発話（speaker と 内容）の一覧を抜き出し、箇条書きで示してください（最大10件）。\n";
$prompt .= "3) 必要であれば、この議論のトーンや次に推奨されるアクションを1〜2行で述べてください。\n\n";
$prompt .= "XMLコンテンツ:\n";
// トークン過多を避けるため、長すぎる場合は先頭/末尾をトリム
$maxLen = 200000; // 200k chars cap
if (strlen($content) > $maxLen) {
    $content = substr($content, 0, $maxLen) . "\n...[truncated]...";
}
$prompt .= $content;

// OpenAI へ送信
try {
    $url = 'https://api.openai.com/v1/chat/completions';
    $data = [
        'model' => 'gpt-4o-mini',
        'messages' => [
            ['role' => 'user', 'content' => $prompt]
        ],
        'temperature' => 0.3,
        'max_tokens' => 800
    ];

    $ch = curl_init($url);
    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ];
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    // SSL 検証用の CA バンドルがプロジェクト内にある場合は明示的に指定
    $caPath = __DIR__ . '/../cert/cacert.pem';
    if (getenv('CURL_CA_BUNDLE')) {
        $envCa = getenv('CURL_CA_BUNDLE');
        if (is_file($envCa)) $caPath = $envCa;
    }
    // php.ini の設定も参照
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
        throw new Exception('OpenAI API 接続エラー: ' . $errmsg);
    }

    $result = json_decode($resp, true);
    if (!isset($result['choices'][0]['message']['content'])) {
        $err = $result['error']['message'] ?? json_encode($result);
        throw new Exception('OpenAI API レスポンス不正: ' . $err);
    }

    $aiResponse = trim($result['choices'][0]['message']['content']);
    echo json_encode(['success' => true, 'ai_response' => $aiResponse], JSON_UNESCAPED_UNICODE);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}

?>