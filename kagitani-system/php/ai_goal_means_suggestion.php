<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

function respond($status, $body) {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['success' => false, 'error' => 'POSTで送信してください。']);
}
if (empty($_SESSION['USERID'])) {
    respond(401, ['success' => false, 'error' => 'ログイン状態を確認できません。再度ログインしてください。']);
}

$localConfigPath = dirname(__DIR__, 2) . '/php/sso_local.php';
$localConfig = is_file($localConfigPath) ? require $localConfigPath : [];
$apiKey = is_array($localConfig) ? ($localConfig['ai_api_key'] ?? '') : '';
if (!$apiKey) $apiKey = getenv('OPENAI_API_KEY');
if (!$apiKey && isset($_SERVER['OPENAI_API_KEY'])) $apiKey = $_SERVER['OPENAI_API_KEY'];
if (!$apiKey) {
    respond(503, ['success' => false, 'error' => 'サーバーにOPENAI_API_KEYが設定されていません。']);
}
if (!function_exists('curl_init')) {
    respond(500, ['success' => false, 'error' => 'PHP cURL拡張が必要です。']);
}
$caBundle = is_array($localConfig) ? trim((string)($localConfig['ca_bundle'] ?? '')) : '';
if ($caBundle !== '' && !is_file($caBundle)) {
    respond(500, ['success' => false, 'error' => 'sso_local.phpに設定されたSSL証明書ファイルが見つかりません。']);
}

$request = json_decode(file_get_contents('php://input'), true);
$node = is_array($request) ? ($request['node'] ?? null) : null;
if (!is_array($node) || trim((string)($node['content'] ?? '')) === '') {
    respond(400, ['success' => false, 'error' => '選択ノードの内容がありません。']);
}

$clipList = function ($value, $maxItems = 12) {
    if (!is_array($value)) return [];
    $items = [];
    foreach (array_slice($value, 0, $maxItems) as $item) {
        if (is_array($item)) $item = $item['content'] ?? '';
        if (is_string($item) && trim($item) !== '') $items[] = mb_substr(trim($item), 0, 500);
    }
    return $items;
};
$context = [
    'node_type' => mb_substr((string)($node['group'] ?? ''), 0, 80),
    'node_content' => mb_substr(trim((string)$node['content']), 0, 1000),
    'parent_nodes' => $clipList($request['parents'] ?? []),
    'existing_children' => $clipList($request['children'] ?? []),
    'neighboring_nodes' => $clipList($request['neighbors'] ?? [])
];

$instructions = 'あなたは目標と手段の階層マップを考える相談相手です。利用者が選んだノードを、親ノードとのつながりや既存の子ノードを考慮して支援してください。選択ノードが目標なら達成に必要な中間目標または手段を、手段なら具体的で実行可能な小さな行動を提案してください。既存ノードと重複する案は避け、最大3件、短く具体的に提案してください。情報が不足していても断定せず、必要なら確認質問を最大2件添えてください。提案を保存したりマップへ追加したと述べず、案を示すだけにしてください。JSONのみを返してください。';
$input = "次のマップ情報をもとに、選択ノードについて提案してください。\n" . json_encode($context, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
$payload = [
    'model' => getenv('OPENAI_MODEL') ?: 'gpt-4.1-mini',
    'store' => false,
    'instructions' => $instructions,
    'input' => $input,
    'text' => [
        'format' => [
            'type' => 'json_schema',
            'name' => 'goal_means_suggestions',
            'strict' => true,
            'schema' => [
                'type' => 'object',
                'properties' => [
                    'summary' => ['type' => 'string'],
                    'suggestions' => ['type' => 'array', 'items' => [
                        'type' => 'object',
                        'properties' => [
                            'content' => ['type' => 'string'],
                            'type' => ['type' => 'string', 'enum' => ['中間目標', '手段']],
                            'reason' => ['type' => 'string']
                        ],
                        'required' => ['content', 'type', 'reason'],
                        'additionalProperties' => false
                    ]],
                    'questions' => ['type' => 'array', 'items' => ['type' => 'string']]
                ],
                'required' => ['summary', 'suggestions', 'questions'],
                'additionalProperties' => false
            ]
        ]
    ]
];

$curl = curl_init('https://api.openai.com/v1/responses');
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . $apiKey],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
]);
if ($caBundle !== '') curl_setopt($curl, CURLOPT_CAINFO, $caBundle);
$responseBody = curl_exec($curl);
$curlError = curl_error($curl);
$curlErrno = curl_errno($curl);
$httpStatus = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
unset($curl);

if ($responseBody === false) {
    error_log('AI suggestion cURL error ' . $curlErrno . ': ' . $curlError);
    respond(502, ['success' => false, 'error' => '生成AIへの通信に失敗しました（cURL ' . $curlErrno . '）。' . $curlError]);
}
$decoded = json_decode($responseBody, true);
if ($httpStatus < 200 || $httpStatus >= 300) {
    $apiMessage = is_array($decoded) ? (string)($decoded['error']['message'] ?? '') : '';
    $apiCode = is_array($decoded) ? (string)($decoded['error']['code'] ?? '') : '';
    error_log('OpenAI API error (' . $httpStatus . ', ' . $apiCode . '): ' . $apiMessage);
    $safeMessage = $apiMessage !== '' ? mb_substr($apiMessage, 0, 500) : '詳細はPHPのエラーログを確認してください。';
    respond(502, ['success' => false, 'error' => 'OpenAI APIエラー (' . $httpStatus . ')' . ($apiCode !== '' ? ' [' . $apiCode . ']' : '') . ': ' . $safeMessage]);
}
$outputText = '';
foreach (($decoded['output'] ?? []) as $output) {
    foreach (($output['content'] ?? []) as $part) {
        if (($part['type'] ?? '') === 'output_text') $outputText .= $part['text'] ?? '';
    }
}
$result = json_decode($outputText, true);
if (!is_array($result) || !isset($result['suggestions']) || !is_array($result['suggestions'])) {
    error_log('OpenAI returned an unexpected suggestion response.');
    respond(502, ['success' => false, 'error' => '生成AIの返答を読み取れませんでした。']);
}
respond(200, ['success' => true, 'summary' => (string)($result['summary'] ?? ''), 'suggestions' => array_slice($result['suggestions'], 0, 3), 'questions' => array_slice($result['questions'] ?? [], 0, 2)]);
