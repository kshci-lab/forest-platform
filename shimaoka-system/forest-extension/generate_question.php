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

// 多様性（温度）: 既定0.3。環境変数 TEMPERATURE があればそれを採用。
$temperature = (float) (getenv('TEMPERATURE') ?: ($_ENV['TEMPERATURE'] ?? 0.3));

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
$desiredCount = 5;

// openai_file_id が無い場合は DB から復旧（ユーザ別）
session_start();
// user_idの取得: SESSION.USERID → SESSION.user_id → SESSION.USERNAMEからusers参照
$userId = null;
if (isset($_SESSION['USERID']) && ctype_digit((string)$_SESSION['USERID'])) {
    $userId = (int)$_SESSION['USERID'];
} elseif (isset($_SESSION['user_id']) && ctype_digit((string)$_SESSION['user_id'])) {
    $userId = (int)$_SESSION['user_id'];
} elseif (!empty($_SESSION['USERNAME'])) {
    try {
        $pdoTmp = new PDO("mysql:host=localhost;dbname=forest_platform;charset=utf8", "root", "root", [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        $stTmp = $pdoTmp->prepare('SELECT user_id FROM users WHERE name = ? ORDER BY user_id DESC LIMIT 1');
        $stTmp->execute([$_SESSION['USERNAME']]);
        $rowTmp = $stTmp->fetch();
        if ($rowTmp && isset($rowTmp['user_id'])) { $userId = (int)$rowTmp['user_id']; }
    } catch (Exception $e) {
        // 無視して後段のエラーに委ねる
    }
}
if ($userId === null) {
    http_response_code(401);
    echo 'ユーザーIDが取得できません（セッション切れの可能性）。再ログインしてください。';
    exit;
}
if (!$openai_file_id && $file_name) {
    try {
        $pdo = new PDO("mysql:host=localhost;dbname=forest_platform;charset=utf8", "root", "root", [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        $st = $pdo->prepare('SELECT openai_file_id, file_id FROM discussion_materials WHERE user_id = ? AND file_name = ? ORDER BY file_id DESC LIMIT 1');
        $st->execute([$userId, $file_name]);
        $row = $st->fetch();
        if ($row && !empty($row['openai_file_id'])) {
            $openai_file_id = (string)$row['openai_file_id'];
            if (!$file_id && isset($row['file_id'])) { $file_id = (string)$row['file_id']; }
        }
    } catch (Exception $e) {
        // DB復旧に失敗しても致命ではない
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

// 参照するファイルID（今回 + 過去N件を日付順で抽出）
$pastLimit = isset($_GET['past']) ? (int)$_GET['past'] : (isset($_GET['history']) ? (int)$_GET['history'] : 3);
$pastLimit = max(0, min(10, $pastLimit));

$docs = [];
$selected = [];
if ($openai_file_id) { $selected[] = $openai_file_id; }

// DBからユーザの履歴を取得
try {
    if (!isset($pdo)) {
        $pdo = new PDO("mysql:host=localhost;dbname=forest_platform;charset=utf8", "root", "root", [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
    }
    $st = $pdo->prepare('SELECT file_name, openai_file_id, uploaded_at, file_id FROM discussion_materials WHERE user_id = ? ORDER BY file_id DESC');
    $st->execute([$userId]);
    foreach ($st->fetchAll() as $r) {
        $fid = (string)($r['openai_file_id'] ?? '');
        if (!$fid || $fid === $openai_file_id) continue;
        $name = (string)$r['file_name'];
        $ts = 0;
        if (!empty($r['uploaded_at'])) {
            $ts = strtotime((string)$r['uploaded_at']) ?: 0;
        }
        if ($ts === 0 && preg_match('/^(\d{4})[-_](\d{2})[-_](\d{2})/', $name, $m)) {
            $ts = strtotime("{$m[1]}-{$m[2]}-{$m[3]}") ?: 0; // ファイル名から YYYY-MM-DD or YYYY_MM_DD を抽出してタイムスタンプ化
        }
        $docs[] = ['name' => $name, 'fid' => $fid, 'ts' => $ts];
    }
    usort($docs, function($a, $b){
        if ($a['ts'] === $b['ts']) return strcmp($b['name'], $a['name']);
        return $b['ts'] <=> $a['ts'];
    });
} catch (Exception $e) {
    // 履歴取得失敗時は過去参照なしで進める
}
$recentPast = array_slice($docs, 0, $pastLimit);
foreach ($recentPast as $d) { $selected[] = $d['fid']; }

// 最終的な参照ファイルID配列（重複除去）
$fileIds = array_values(array_unique($selected));

// Responses API へのリクエストを構築（input_file で直接添付、tools は使わない）
//プロンプト調整箇所
$displayName = $file_name !== '' ? $file_name : '今回資料';
$pastNames = array_map(function($d){ return (string)$d['name']; }, $recentPast);
$sourcesInfo = "資料一覧:\n- 今回:" . $displayName . "\n- 過去:" . (empty($pastNames) ? 'なし' : implode(', ', $pastNames)) . "\n";

$prompt = "以下の条件で、アップロードされた今回資料を主参照として質問を".$desiredCount."件生成してください。\n"
    . "- 出力は JSON のみ。配列で、各要素は {question, reason, source, policy}。\n"
    . "- 厳密にJSONのみを日本語で出力してください。説明文やコードフェンスは出力しないでください。\n"
    . "- source は '今回:" . $displayName . "' または '過去:ファイル名' の形式。\n"
    . "- policy は、上記『方針: 1〜4』のうち該当する番号を示してください（複数可なら [1,3] のように配列で）。\n"
    . "- 質問は重複不可、具体的に。\n\n"
    . $sourcesInfo;

$systemText = <<<SYS
あなたは，これまでの同グループでの議論をしっかりと踏まえて，適切に研究を進める活動を支援するプロの秘書です．
過去の議論資料（PDF）およびそれに基づく議論ログを参照し，最新版の議論資料について「指摘されそうな点」を抽出してください．

方針:
1. 過去に誰がどのような指摘を行い，それに対してどのように回答してきたかを踏まえ，最新版の資料で適切に記載しているかを検証してください．
2. 過去の議論や回答と矛盾している場合は，最新版の資料の内容がロジカルに正しいかどうかを検討し，その理由を説明してください．
3. 表面的な誤りの問題ではなく，研究の中で生じる思考のズレや再構成の必要性に注目してください．
4. あなたの目的は，学習者・研究者が自らの思考の一貫性や方向性を見直し，研究の質を高めることを支援することです．断定的な誤り指摘ではなく，思考を促す建設的な問いや指摘として提示してください．
 
 対象読者:
 あなたが質問を生成する相手は「研究初学者」です。彼らは、教育支援に関する議論を通じて、資料を改善しながら研究を進めています。
SYS;
$systemMsg = [ 'role' => 'system', 'content' => [[ 'type' => 'input_text', 'text' => $systemText ]] ];

// 議論ログは未提供のため、その旨を明記
$prompt .= "\n\n注意事項:\n"
    . "- 直近の指摘とその回答に最低限は応答する前提だが、本プロンプトでは議論ログは未添付である。必要があれば過去資料から推定して指摘を行うこと。\n"
    . "- 過去の議論/回答と矛盾していれば、最新版の主張がロジカルに正しいかを検証し、必要な修正や説明の提案を行うこと。\n"
    . "- 出力は配列のみで、各要素は {question, reason, source} とし、要素数は正確に" . $desiredCount . "とすること。\n";

$userContent = [ [ 'type' => 'input_text', 'text' => $prompt ] ];
foreach ($fileIds as $fid) {
    $userContent[] = [ 'type' => 'input_file', 'file_id' => $fid ];
}
$userMsg = [ 'role' => 'user', 'content' => $userContent ];

$payload = [
    'model' => 'gpt-4o-mini',
    'input' => [ $systemMsg, $userMsg ],
    'max_output_tokens' => 2000,
    'temperature' => $temperature
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
    $p = '';
    if (isset($item['policy'])) {
        if (is_array($item['policy'])) {
            $p = '[' . htmlspecialchars(implode(', ', array_map('strval', $item['policy']))) . ']';
        } else {
            $p = htmlspecialchars((string)$item['policy']);
        }
    }
    echo '<li><strong>Q' . $idx . ':</strong> ' . $q . '<br><em>理由:</em> ' . $r . '<br><em>参照:</em> ' . $s;
    if ($p !== '') {
        echo ' <br><em>方針:</em> ' . $p;
    }
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