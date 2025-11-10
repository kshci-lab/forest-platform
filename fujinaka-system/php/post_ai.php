<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');

if (!isset($_SESSION['USERID'])) {
    http_response_code(401);
    echo json_encode(['output' => '未ログイン'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 追加: AJAXでの実行要求に応答（Pythonを実行してJSONで返す）
if (isset($_GET['action']) && $_GET['action'] === 'run_ai') {
    // 受信したシナリオを取得（JSON優先、fallbackでapplication/x-www-form-urlencodedも対応）
    $scenario = '';
    $raw = file_get_contents('php://input');
    if ($raw !== false && $raw !== '') {
        $data = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE && isset($data['scenario'])) {
            $scenario = (string)$data['scenario'];
        }
    }
    if ($scenario === '' && isset($_POST['scenario'])) {
        $scenario = (string)$_POST['scenario'];
    }

    // 追加: 受け取ったシナリオをサーバコンソール（エラーログ）に出力
    if ($scenario !== '') {
        error_log("[run_ai] scenario length=" . strlen($scenario));
        // 追記: 全文を分割してログ出力（長文対策）
        $chunk = 4000;
        $len = strlen($scenario);
        for ($i = 0, $p = 1; $i < $len; $i += $chunk, $p++) {
            error_log("[run_ai] scenario part {$p}: " . substr($scenario, $i, $chunk));
        }
    }

    $ai_output = '';
    try {
        $python = stripos(PHP_OS, 'WIN') === 0 ? 'python' : 'python3';
        $script = __DIR__ . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'api' . DIRECTORY_SEPARATOR . 'test.py';
        // 変更: -u を付与（アンバッファ）
        $cmd = $python . ' -u ' . escapeshellarg($script);

        $disabled = (string)ini_get('disable_functions');
        if (stripos($disabled, 'proc_open') !== false) {
            $ai_output = "PHP設定で proc_open が無効です。php.ini の disable_functions を確認してください。";
        } else {
            // シナリオは環境変数で渡す（stdinへは書き込まない）
            if (is_string($scenario)) {
                putenv('SCENARIO=' . $scenario);
            }

            $descriptorspec = [
                0 => ['pipe', 'w'], // stdin（すぐ閉じてEOFを知らせる）
                1 => ['pipe', 'w'], // stdout
                2 => ['pipe', 'w'], // stderr
            ];
            $process = @proc_open($cmd, $descriptorspec, $pipes);
            if (is_resource($process)) {
                // 変更: 書き込まず即座に閉じてEOFを通知（fwriteによるEBADFを回避）
                fclose($pipes[0]);

                stream_set_blocking($pipes[1], true);
                stream_set_blocking($pipes[2], true);
                $stdout = stream_get_contents($pipes[1]);
                $stderr = stream_get_contents($pipes[2]);
                fclose($pipes[1]);
                fclose($pipes[2]);
                $exitCode = proc_close($process);

                // 実行後に環境変数を解除
                putenv('SCENARIO');

                if ($exitCode === 0 && trim($stdout) !== '') {
                    $ai_output = trim($stdout);
                } else {
                    $errMsg = trim($stderr) !== '' ? trim($stderr) : '不明';
                    $outMsg = trim($stdout);
                    $ai_output = "Python実行エラー\nコマンド: {$cmd}\n終了コード: {$exitCode}\nエラー: {$errMsg}";
                    if ($outMsg !== '') {
                        $ai_output .= "\n標準出力: {$outMsg}";
                    }
                }
            } else {
                // 実行失敗時も環境変数を解除
                putenv('SCENARIO');
                $ai_output = "proc_open の初期化に失敗しました。";
            }
        }
    } catch (Throwable $e) {
        // 念のため環境変数を解除
        putenv('SCENARIO');
        $ai_output = 'AI出力の取得に失敗しました: ' . $e->getMessage();
    }

    echo json_encode(['output' => $ai_output], JSON_UNESCAPED_UNICODE);
    exit;
}

// 受信データ取得
$raw = file_get_contents('php://input');
$scenario = '';
$triangle = '';
if ($raw !== false && $raw !== '') {
    $j = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        if (isset($j['scenario'])) {
            $scenario = (string)$j['scenario'];
        }
        if (isset($j['triangle'])) {
            $triangle = is_string($j['triangle']) ? $j['triangle'] : json_encode($j['triangle'], JSON_UNESCAPED_UNICODE);
        }
    }
}

error_log('[post_ai] scenario_len=' . strlen($scenario) . ' triangle_len=' . strlen($triangle));

$python = stripos(PHP_OS, 'WIN') === 0 ? 'python' : 'python3';
$script = __DIR__ . '/api/test.py';
$cmd = $python . ' -u ' . escapeshellarg($script);

$disabled = (string)ini_get('disable_functions');
if (stripos($disabled, 'proc_open') !== false) {
    echo json_encode(['output' => 'proc_open無効'], JSON_UNESCAPED_UNICODE);
    exit;
}

// SCENARIO: 論文シナリオ + 三角ロジック(JSON)
$scenarioToSend = $scenario;
if ($triangle !== '') {
    $scenarioToSend .= "\n\n【三角ロジック(JSON)】\n" . $triangle;
}
if ($scenarioToSend !== '') {
    putenv('SCENARIO=' . $scenarioToSend);
}

$descriptorspec = [
    0 => ['pipe', 'w'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
];

$process = @proc_open($cmd, $descriptorspec, $pipes);
if (!is_resource($process)) {
    putenv('SCENARIO');
    echo json_encode(['output' => '起動失敗'], JSON_UNESCAPED_UNICODE);
    exit;
}

fclose($pipes[0]);
$stdout = stream_get_contents($pipes[1]);
$stderr = stream_get_contents($pipes[2]);
fclose($pipes[1]);
fclose($pipes[2]);
$code = proc_close($process);
putenv('SCENARIO');

if ($code === 0) {
    $out = trim($stdout);
    echo json_encode(['output' => $out], JSON_UNESCAPED_UNICODE);
} else {
    error_log("[post_ai] python_error code=$code stderr=" . trim($stderr));
    echo json_encode(['output' => 'AI処理失敗'], JSON_UNESCAPED_UNICODE);
}