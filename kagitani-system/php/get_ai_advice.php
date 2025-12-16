<?php
// get_ai_advice.php
// ノードのテキストからOpenAI APIに問い合わせてアドバイスを取得
// 入力: POST json { node_title, node_content, node_status }
// 出力: JSON { success, advice, error }

header('Content-Type: application/json; charset=UTF-8');

// ヘルパ: .env を簡易パースして環境変数を設定（存在する場合）
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
        // 値の両端にあるクォートを削除
        if ((substr($v,0,1) === '"' && substr($v,-1) === '"') || (substr($v,0,1) === "'" && substr($v,-1) === "'")) {
            $v = substr($v,1,-1);
        }
        if ($k !== '') {
            // 既に環境変数が設定されている場合は上書きしない
            if (getenv($k) === false) {
                putenv("$k=$v");
                $_ENV[$k] = $v;
            }
        }
    }
}

// .env があれば読み込む
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    load_dotenv($envPath);
}

// OpenAI API キー取得（環境変数が最優先）
$apiKey = getenv('OPENAI_API_KEY');
if (!$apiKey) {
    // 互換性のため config.php も参照
    if (file_exists(__DIR__ . '/config.php')) {
        @require_once(__DIR__ . '/config.php');
        if (defined('OPENAI_API_KEY') && OPENAI_API_KEY) {
            $apiKey = OPENAI_API_KEY;
        }
    }
}

if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'OpenAI API キーが設定されていません。`.env` に `OPENAI_API_KEY=` を設定してください。']);
    exit;
}

// リクエスト解析
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'リクエスト形式が不正です']);
    exit;
}

$nodeTitle = trim($input['node_title'] ?? '');
$nodeContent = trim($input['node_content'] ?? '');
$nodeStatus = trim($input['node_status'] ?? 'unknown');

if ($nodeTitle === '' && $nodeContent === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ノードのタイトルまたは内容が必要です']);
    exit;
}

// プロンプト生成（簡易）
function buildPrompt($title, $content, $status) {
    $statusMap = ['not-started' => '未着手', 'in-progress' => '実行中', 'completed' => '完了', 'paused' => '中断'];
    $statusText = $statusMap[$status] ?? $status;

    $prompt = "あなたは目標達成支援のコーチです。ユーザーのタスク/目標に対して、実行可能で具体的なアドバイスを提供してください。\n\n";
    $prompt .= "【タスク/目標】\n";
    $prompt .= "タイトル: $title\n";
    if ($content) {
        $prompt .= "詳細: $content\n";
    }
    $prompt .= "ステータス: $statusText\n\n";
    $prompt .= "【要件】\n";
    $prompt .= "- 具体的で実行可能なアドバイスを3-5個提供\n";
    $prompt .= "- 各アドバイスは1-2行で簡潔に\n";
    $prompt .= "- 前向きで励ますトーン\n";
    $prompt .= "- 日本語で回答\n\n";
    $prompt .= "アドバイス:";
    return $prompt;
}

$prompt = buildPrompt($nodeTitle, $nodeContent, $nodeStatus);

// OpenAI 呼び出し（Chat Completions）
function callOpenAIAPI($apiKey, $prompt) {
    $url = 'https://api.openai.com/v1/chat/completions';

    $data = [
        'model' => 'gpt-4o-mini',
        'messages' => [
            ['role' => 'user', 'content' => $prompt]
        ],
        'temperature' => 0.7,
        'max_tokens' => 500
    ];

    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $resp = curl_exec($ch);
    $errno = curl_errno($ch);
    $errmsg = curl_error($ch);
    curl_close($ch);

    if ($resp === false || $errno) {
        throw new Exception('OpenAI API への接続に失敗しました: ' . $errmsg);
    }

    $result = json_decode($resp, true);
    if (!isset($result['choices'][0]['message']['content'])) {
        $err = $result['error']['message'] ?? json_encode($result);
        throw new Exception('OpenAI API からのレスポンスが不正です: ' . $err);
    }
    return trim($result['choices'][0]['message']['content']);
}

try {
    $advice = callOpenAIAPI($apiKey, $prompt);
    echo json_encode(['success' => true, 'advice' => $advice], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}

?>