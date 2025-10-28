<?php
// APIキー取得: 環境変数 → プロジェクト直下 .env → forest-extension/.env の順で探索
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

// 1) 環境変数
$apiKey = getenv('OPENAI_API_KEY') ?: ($_ENV['OPENAI_API_KEY'] ?? '');

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

if ($apiKey === '') {
    http_response_code(500);
    echo 'OPENAI_API_KEY not configured.';
    exit;
}

// クエリからの入力値
$openai_file_id = $_GET['openai_file_id'] ?? $_POST['openai_file_id'] ?? '';
$file_name = $_GET['file_name'] ?? $_POST['file_name'] ?? '';
$file_id = $_GET['file_id'] ?? $_POST['file_id'] ?? '';
$openai_error = isset($_GET['openai_error']) || isset($_POST['openai_error']);
// 件数パラメータの取得（?count= または ?n=）
$desiredCount = 5;
$cntRaw = $_GET['count'] ?? $_POST['count'] ?? ($_GET['n'] ?? $_POST['n'] ?? null);
if ($cntRaw !== null) {
    $cnt = (int)$cntRaw;
    if ($cnt > 0) { $desiredCount = $cnt; }
}
// 件数の範囲を 1〜20 に丸める
//if ($desiredCount < 1) $desiredCount = 1;
//if ($desiredCount > 20) $desiredCount = 20;
$desiredCount = 3;

// openai_file_id が無い場合は file_name からマップで復旧
if (!$openai_file_id && $file_name) {
    $mapPath = __DIR__ . '/openai_files_map.json';
    if (file_exists($mapPath)) {
        $mapTmp = json_decode((string)file_get_contents($mapPath), true);
        if (is_array($mapTmp) && isset($mapTmp[$file_name])) {
            $openai_file_id = (string)$mapTmp[$file_name];
        }
    }
}

if (!$openai_file_id) {
    http_response_code(400);
    if ($openai_error) {
        echo 'OpenAIへのファイル登録に失敗した可能性があります。.env の OPENAI_API_KEY を確認し、再度アップロードしてください。';
    } else {
        echo 'ファイルが未添付のため、質問生成はできません。アップロードからPDFを選び直してください。';
    }
    exit;
}

// 参照するファイルID（今回 + 過去）を収集
$fileIds = [];
if ($openai_file_id) { $fileIds[$openai_file_id] = true; }
$mapPath = __DIR__ . '/openai_files_map.json';
$map = file_exists($mapPath) ? json_decode((string)file_get_contents($mapPath), true) : [];
if (is_array($map)) {
    foreach ($map as $name => $fid) {
        if ($fid) { $fileIds[$fid] = true; }
    }
}
$fileIds = array_keys($fileIds);

// Responses API へのリクエストを構築（input_file で直接添付、tools は使わない）
//プロンプト調整箇所
$displayName = $file_name !== '' ? $file_name : '今回資料';
$prompt = "以下の条件で、アップロードされた今回資料を主参照として質問を".$desiredCount."件生成してください。\n"
        . "- 出力は JSON のみ。配列で、各要素は {question, reason, source}。\n"
        . "- source は '今回:" . $displayName . "' または '過去:ファイル名' の形式。\n"
        . "- 質問は重複不可、具体的に。";

$systemMsg = [ 'role' => 'system', 'content' => [[ 'type' => 'input_text', 'text' => 'You are a helpful assistant that outputs strict JSON only.' ]] ];
$userContent = [ [ 'type' => 'input_text', 'text' => $prompt ] ];
foreach ($fileIds as $fid) {
    $userContent[] = [ 'type' => 'input_file', 'file_id' => $fid ];
}
$userMsg = [ 'role' => 'user', 'content' => $userContent ];

$payload = [
    'model' => 'gpt-4o-mini',
    'input' => [ $systemMsg, $userMsg ],
    'max_output_tokens' => 2000
];

$ch = curl_init('https://api.openai.com/v1/responses');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
]);
$res = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$cerr = curl_error($ch);
curl_close($ch);
if ($cerr) {
    http_response_code(502);
    echo 'OpenAI呼び出しエラー: ' . htmlspecialchars($cerr);
    exit;
}
if ($httpcode < 200 || $httpcode >= 300) {
    http_response_code($httpcode);
    echo 'OpenAIエラー応答: ' . htmlspecialchars((string)$res);
    exit;
}
$resp = json_decode((string)$res, true);
$jsonOut = '';
if (isset($resp['output_text'])) {
    $jsonOut = trim((string)$resp['output_text']);
}
if (!$jsonOut && isset($resp['output']) && is_array($resp['output'])) {
    foreach ($resp['output'] as $o) {
        if (isset($o['content'][0]['text'])) { $jsonOut = trim((string)$o['content'][0]['text']); break; }
    }
}
if (!$jsonOut) {
    echo 'モデル出力の取得に失敗しました。';
    exit;
}

// JSON文字列をクリーンアップ（```json ... ``` のコードフェンスや前後ノイズを許容）
$cleanJson = $jsonOut;
// 1) ```json ... ``` フェンスを剥がす
if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/i', $cleanJson, $m)) {
    $cleanJson = trim($m[1]);
}
// 2) 先頭が { or [ でなければ、最初の { or [ から最後の } or ] までを抽出
$trimmed = ltrim($cleanJson);
if ($trimmed === '' || ($trimmed[0] !== '{' && $trimmed[0] !== '[')) {
    $posArr = strpos($cleanJson, '[');
    $posObj = strpos($cleanJson, '{');
    $startPos = ($posArr === false) ? $posObj : (($posObj === false) ? $posArr : min($posArr, $posObj));
    $endArr = strrpos($cleanJson, ']');
    $endObj = strrpos($cleanJson, '}');
    $endPos = ($endArr === false) ? $endObj : (($endObj === false) ? $endArr : max($endArr, $endObj));
    if ($startPos !== false && $endPos !== false && $endPos > $startPos) {
        $cleanJson = substr($cleanJson, $startPos, $endPos - $startPos + 1);
    }
}

$data = json_decode($cleanJson, true);
if (!is_array($data)) {
    echo 'JSONの解釈に失敗: ' . htmlspecialchars($jsonOut);
    exit;
}
// 返却配列を希望件数までに制限
if (count($data) > $desiredCount) {
    $data = array_slice($data, 0, $desiredCount);
}

// HTML を描画（質問一覧と採用/不採用ボタン）
header('Content-Type: text/html; charset=utf-8');
echo '<!doctype html><meta charset="utf-8"><title>質問生成</title>';
echo '<h2>生成結果</h2>';
echo '<ul>';
$idx = 1;
foreach ($data as $item) {
    $q = htmlspecialchars($item['question'] ?? '');
    $r = htmlspecialchars($item['reason'] ?? '');
    $s = htmlspecialchars($item['source'] ?? '');
    echo '<li><strong>Q' . $idx . ':</strong> ' . $q . '<br><em>理由:</em> ' . $r . '<br><em>参照:</em> ' . $s;
    echo ' <br><button class="adopt" data-q="' . htmlspecialchars($q) . '">採用</button>';
    echo ' <button class="reject" data-q="' . htmlspecialchars($q) . '">不採用</button>';
    echo "</li>";
    $idx++;
}
echo '</ul>';
?>
<script>
const fileId = <?php echo json_encode($file_id); ?>;
function send(feedback){
  const fd = new FormData();
  fd.append('file_id', fileId);
  fd.append('question_text', feedback.q);
  fd.append('is_adopted', feedback.ok ? 1 : 0);
  fd.append('reason', feedback.reason || '');
  fetch('save_feedback.php', { method:'POST', body: fd });
}
document.querySelectorAll('button.adopt').forEach(b=>{
  b.addEventListener('click', ()=>{
    const q = b.dataset.q;
    const reason = prompt('採用理由(任意)');
    send({q, ok:true, reason});
  });
});
document.querySelectorAll('button.reject').forEach(b=>{
  b.addEventListener('click', ()=>{
    const q = b.dataset.q;
    const reason = prompt('不採用理由(任意)');
    send({q, ok:false, reason});
  });
});
</script>