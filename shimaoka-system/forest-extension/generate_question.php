<?php
// 1. APIキーの安全な取得（環境変数 or .env から）
// .env 簡易ローダ（Composer未使用環境向け）
function _load_dotenv_if_exists(array $paths)
{
    foreach ($paths as $p) {
        if (is_readable($p)) {
            $lines = @file($p, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if ($lines === false) continue;
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || $line[0] === '#') continue;
                // export KEY=VALUE 形式も許容
                if (strpos($line, 'export ') === 0) {
                    $line = trim(substr($line, 7));
                }
                $eqPos = strpos($line, '=');
                if ($eqPos === false) continue;
                $key = trim(substr($line, 0, $eqPos));
                $val = trim(substr($line, $eqPos + 1));
                // クォート除去
                if ((str_starts_with($val, '"') && str_ends_with($val, '"')) || (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
                    $val = substr($val, 1, -1);
                }
                if ($key !== '') {
                    // 既存設定を尊重し、未設定時のみ反映
                    if (getenv($key) === false && (!isset($_ENV[$key]) || $_ENV[$key] === '')) {
                        putenv($key . '=' . $val);
                        $_ENV[$key] = $val;
                    }
                }
            }
            // 最初に見つかった .env を適用して終了
            break;
        }
    }
}

// まず環境変数を参照、無ければ .env を探す
$api_key = getenv('OPENAI_API_KEY') ?: ($_ENV['OPENAI_API_KEY'] ?? null);
if (!$api_key) {
    // プロジェクトルート（1つ上）と現在ディレクトリの順で探す
    _load_dotenv_if_exists([
        dirname(__DIR__) . '/.env',
        __DIR__ . '/.env',
    ]);
    $api_key = getenv('OPENAI_API_KEY') ?: ($_ENV['OPENAI_API_KEY'] ?? null);
}
if (!$api_key) {
    http_response_code(500);
    die('OpenAI APIキーが設定されていません。サーバーの環境変数 OPENAI_API_KEY を設定するか、プロジェクトルートに .env（OPENAI_API_KEY=...）を配置してください。');
}
// 以降、$api_key はヘッダーでのみ使用し、出力やログには残さない

// 2. テキスト読み込み（JSONを優先。無ければPython実行で取得）
$combinedText = null;
$pastTitles = [];
$currentTitle = null;
$jsonStr = @file_get_contents(__DIR__ . "/tmp_text.txt");
if ($jsonStr !== false) {
    $payloadTmp = json_decode($jsonStr, true);
    if (is_array($payloadTmp) && isset($payloadTmp['combined_text'])) {
        $combinedText = (string)$payloadTmp['combined_text'];
        // 資料タイトルの抽出（プロンプトで source 指定に使う）
        if (isset($payloadTmp['past_documents']) && is_array($payloadTmp['past_documents'])) {
            foreach ($payloadTmp['past_documents'] as $doc) {
                if (isset($doc['name']) && is_string($doc['name']) && $doc['name'] !== '') {
                    $pastTitles[] = $doc['name'];
                }
            }
        }
        if (isset($payloadTmp['current_document']['name']) && is_string($payloadTmp['current_document']['name'])) {
            $currentTitle = $payloadTmp['current_document']['name'];
        }
    }
}
if ($combinedText === null) {
    $cmd = "python3 " . escapeshellarg(__DIR__ . "/parse_pdf.py") . " 2>&1";
    $out = shell_exec($cmd);
    $payloadTmp = json_decode($out ?? "", true);
    if (is_array($payloadTmp) && isset($payloadTmp['combined_text'])) {
        $combinedText = (string)$payloadTmp['combined_text'];
        // 資料タイトルの抽出（プロンプトで source 指定に使う）
        if (isset($payloadTmp['past_documents']) && is_array($payloadTmp['past_documents'])) {
            foreach ($payloadTmp['past_documents'] as $doc) {
                if (isset($doc['name']) && is_string($doc['name']) && $doc['name'] !== '') {
                    $pastTitles[] = $doc['name'];
                }
            }
        }
        if (isset($payloadTmp['current_document']['name']) && is_string($payloadTmp['current_document']['name'])) {
            $currentTitle = $payloadTmp['current_document']['name'];
        }
    } else {
        die("PDF解析結果の取得に失敗しました。");
    }
}

// 3. URL
$url = "https://api.openai.com/v1/chat/completions";

// 3.5 質問数（コードで固定：2または3を想定。ここを変えるだけで拡張可）
$desiredCount = 2; // 2 でも可。将来増やす場合はこの数を変更

// 4. 送信データ（JSONのみ返すよう厳密指定）
$instruction = "あなたは教材設計の専門家です。今回資料を主対象として質問を作成し、過去資料は用語の整合・前提知識の補完・変更点の対比といった文脈としてのみ参照してください。根拠は提供テキストの範囲に限定し、創作はしないでください。出力は厳密なJSONのみです。";

// モデルに与える資料タイトル一覧（source を選ばせるため）
$sourcesInfo = "資料一覧:\n";
$sourcesInfo .= "- 今回資料: " . ($currentTitle ? $currentTitle : "なし") . "\n";
$sourcesInfo .= "- 過去資料: ";
if (!empty($pastTitles)) {
    $sourcesInfo .= implode(", ", $pastTitles) . "\n";
} else {
    $sourcesInfo .= "なし\n";
}

$user_task = "次のテキストに基づき、学習に適した日本語の質問を必ず{$desiredCount}個作成してください。".
            "各質問には reason（過去資料を把握したうえで、今回資料に対してなぜその質問が必要かを具体的に。用語の整合、差分・変更点、前提から本論への橋渡し等の観点を含める）と source（参照元資料）を含めてください。".
            "source は下記の資料タイトルから必ず1つを選び、\"今回資料:タイトル\" または \"過去資料:タイトル\" の形式で出力します。基本は \"今回資料\" を選び、核心情報が過去資料にのみある場合や前提想起が目的の問いに限って \"過去資料\" を選んで構いません。".
                    "source は下記の資料タイトルから必ず1つを選び,\"今回資料:タイトル\" または \"過去資料:タイトル\" の形式で出力します。質問の主たる根拠／発想の拠り所になった資料を選んでください。主対象は \"今回資料\" ですが、過去資料の内容・定義・対比が主な根拠や着想源である場合は \"過去資料\" を選んで構いません。".
            "questions 配列の要素数は正確に {$desiredCount} とすること。\n".
            "{\n  \"questions\": [\n    { \"question\": \"質問1\", \"reason\": \"学習上の重要性\", \"source\": \"今回資料:タイトル または 過去資料:タイトル\" },\n    { \"question\": \"質問2\", \"reason\": \"学習上の重要性\", \"source\": \"今回資料:タイトル または 過去資料:タイトル\" }\n  ]\n}\n\n".
            // テキストの構成と資料一覧
            "以下テキストは、『【過去資料】』セクションが文脈、『【今回アップロード】』セクションが主対象です。\n" .
            $sourcesInfo . "\n".
            "対象テキスト:\n" . $combinedText;

$data = [
    "model" => "gpt-4o-mini",
    "messages" => [
        ["role" => "system", "content" => $instruction],
        ["role" => "user", "content" => $user_task]
    ],
    "temperature" => 0.7
];

// 5. POST送信（file_get_contents版）
$options = [
    "http" => [
        "method" => "POST",
        "header" => "Content-Type: application/json\r\n" .
                    "Authorization: Bearer $api_key\r\n",
        "content" => json_encode($data),
        // 任意: タイムアウト（安全のため）
        "timeout" => 30
    ]
];
$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);

if ($response === false) die("API呼び出しに失敗しました。");

// JSONをデコード
$result = json_decode($response, true);
if (!isset($result["choices"][0]["message"]["content"])) {
    echo "<pre>APIレスポンスが不正です:</pre>";
    echo "<pre>" . htmlspecialchars($response) . "</pre>";
    exit;
}
$content = trim($result["choices"][0]["message"]["content"]);

// モデルからのJSONを厳密パース（フェンスなし前提。万一のため抽出フォールバック）
$payload = json_decode($content, true);
if (!is_array($payload)) {
    if (preg_match('/\{[\s\S]*\}/u', $content, $m)) {
        $payload = json_decode($m[0], true);
    }
}

if (!is_array($payload) || !isset($payload['questions']) || !is_array($payload['questions'])) {
    echo "<pre>期待するJSON形式ではありません。受信データ:</pre>";
    echo "<pre>" . htmlspecialchars($content) . "</pre>";
    exit;
}

// questions を [{question, reason, source}] に正規化（後方互換: 文字列のみの場合も対応）
$normalized = [];
foreach ($payload['questions'] as $item) {
    if (is_string($item)) {
        $q = trim($item);
        if ($q !== '') {
            $normalized[] = [
                'question' => $q,
                'reason'   => '',
                'source'   => ''
            ];
        }
    } elseif (is_array($item)) {
        $q = isset($item['question']) ? trim((string)$item['question']) : '';
        $r = isset($item['reason']) ? trim((string)$item['reason']) : '';
        $s = isset($item['source']) ? trim((string)$item['source']) : '';
        if ($q !== '') {
            $normalized[] = [
                'question' => $q,
                'reason'   => $r,
                'source'   => $s
            ];
        }
    }
}

if (count($normalized) > $desiredCount) {
    $normalized = array_slice($normalized, 0, $desiredCount);
}

echo "<h2>生成された質問</h2>";
echo '<div id="questions-container">';

if (empty($normalized)) {
    echo "<p>質問が抽出できませんでした。</p>";
} else {
    foreach ($normalized as $i => $item) {
        $q = $item['question'];
        $r = $item['reason'] ?? '';
        $s = $item['source'] ?? '';
        echo "<div class='question-block' style='margin-bottom:20px;'>";
        // 表示は Qn: を付け、保存用のテキストは .question-text の中身のみ
        echo "<p><strong class='q-num'>Q" . ($i + 1) . ":</strong> <span class='question-text'>" . htmlspecialchars($q) . "</span></p>";
        // 生成メタ情報（理由・参照元）
        echo "<div class='gen-meta' style='color:#555; margin:4px 0 8px 0; font-size:0.9em;'>";
        if ($r !== '') {
            echo "<div class='gen-reason'><strong>理由:</strong> " . htmlspecialchars($r) . "</div>";
        }
        if ($s !== '') {
            echo "<div class='gen-source'><strong>参照元:</strong> " . htmlspecialchars($s) . "</div>";
        }
        echo "</div>";
        echo "<button class='adopt-btn'>採用</button> ";
        echo "<button class='reject-btn'>不採用</button>";
        echo "<div class='reason-box' style='display:none; margin-top:10px;'>
                <textarea rows='2' cols='50' placeholder='理由を入力してください'></textarea><br>
                <button class='submit-reason'>送信</button>
              </div>";
        echo "</div>";
    }
}

echo '</div>';
?>

<script>
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".question-block").forEach(block => {
        const questionText = block.querySelector(".question-text").textContent;

        const adoptBtn = block.querySelector(".adopt-btn");
        const rejectBtn = block.querySelector(".reject-btn");
        const reasonBox = block.querySelector(".reason-box");
        const textarea = reasonBox.querySelector("textarea");
        const submitBtn = reasonBox.querySelector(".submit-reason");

        adoptBtn.addEventListener("click", () => {
            reasonBox.style.display = "block";
            reasonBox.dataset.status = 1; // 採用
        });

        rejectBtn.addEventListener("click", () => {
            reasonBox.style.display = "block";
            reasonBox.dataset.status = 0; // 不採用
        });

        submitBtn.addEventListener("click", () => {
            const reason = textarea.value.trim();
            if (!reason) {
                alert("理由を入力してください。");
                return;
            }

            const isAdopted = parseInt(reasonBox.dataset.status);
            fetch("save_feedback.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: 1,
                    question_text: questionText,
                    is_adopted: isAdopted,
                    reason: reason
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("DBに保存しました！");
                    reasonBox.style.display = "none";
                    textarea.value = "";
                } else {
                    alert("保存エラー: " + data.error);
                }
            });
        });
    });
});
</script>