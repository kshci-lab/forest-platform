<?php
// import_discussion_xml.php
// 議論内省モード: アップロードされたXML(messages形式)を読み取り、discussion_utterancesへ格納
// 入力: multipart/form-data で xml_file、任意で discussion_id（数値）
// 出力: JSON { success, inserted, updated, skipped, errors:[] }

header('Content-Type: application/json; charset=UTF-8');

// DB接続（本プロジェクトの既存方針に合わせる）
try {
    $pdo = new PDO('mysql:host=localhost;dbname=forest_platform;charset=utf8', 'root', 'root', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB接続失敗: ' . $e->getMessage()]);
    exit;
}

// タイムゾーン
date_default_timezone_set('Asia/Tokyo');

// 入力バリデーション: ファイル（既存画面は name="xmlFile" を使用しているため互換対応）
if (!isset($_FILES['xml_file']) && isset($_FILES['xmlFile'])) {
    // xmlFile を xml_file として扱う
    $_FILES['xml_file'] = $_FILES['xmlFile'];
}

// 入力バリデーション: ファイル
if (!isset($_FILES['xml_file']) || $_FILES['xml_file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'XMLファイルが受け取れませんでした']);
    exit;
}

$tmpPath = $_FILES['xml_file']['tmp_name'];
$origName = $_FILES['xml_file']['name'] ?? 'uploaded.xml';
$mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmpPath);
// MIMEは環境により不安定なため、拡張子でも軽く確認
$extOk = (strtolower(pathinfo($origName, PATHINFO_EXTENSION)) === 'xml');
if (!$extOk) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'XML拡張子のファイルのみ受け付けます']);
    exit;
}

// 任意の固定discussion_idパラメータ（ファイル内に無い場合の補完）
$fixedDiscussionId = null;
if (isset($_POST['discussion_id']) && ctype_digit((string)$_POST['discussion_id'])) {
    $fixedDiscussionId = (int)$_POST['discussion_id'];
} elseif (isset($_GET['discussion_id']) && ctype_digit((string)$_GET['discussion_id'])) {
    $fixedDiscussionId = (int)$_GET['discussion_id'];
}

$xmlStr = @file_get_contents($tmpPath);
if ($xmlStr === false || $xmlStr === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'XMLの読み込みに失敗しました']);
    exit;
}

// 文字コード自動検出（ざっくり）
$enc = mb_detect_encoding($xmlStr, ['UTF-8','SJIS','EUC-JP','JIS','ISO-2022-JP'], true);
if ($enc && strtoupper($enc) !== 'UTF-8') {
    $xmlStr = mb_convert_encoding($xmlStr, 'UTF-8', $enc);
}

libxml_use_internal_errors(true);
$xml = simplexml_load_string($xmlStr);
if ($xml === false) {
    $errs = array_map(function($e){ return trim($e->message); }, libxml_get_errors());
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'XML解析エラー', 'details' => $errs]);
    exit;
}

// 柔軟なタグ抽出ヘルパ
$first = function($node, array $candidates) {
    foreach ($candidates as $name) {
        if (isset($node->$name) && (string)$node->$name !== '') {
            return (string)$node->$name;
        }
        // 属性でも探す
        if ($node->attributes()->$name && (string)$node->attributes()->$name !== '') {
            return (string)$node->attributes()->$name;
        }
    }
    return null;
};

// メッセージ配列の推定（<messages><message>…</message></messages> / <Messages><Message>…</Message> / <root><item>…</item> / 直下繰り返し など）
$items = [];
if (isset($xml->message) && count($xml->message)) {
    $items = $xml->message;
} elseif (isset($xml->messages) && isset($xml->messages->message)) {
    $items = $xml->messages->message;
} elseif (isset($xml->Message) && count($xml->Message)) {
    $items = $xml->Message;
} elseif (isset($xml->Messages) && isset($xml->Messages->Message)) {
    $items = $xml->Messages->Message;
} elseif (isset($xml->item) && count($xml->item)) {
    $items = $xml->item;
} else {
    // 直下の子要素を全て候補に
    $items = $xml->children();
}

// items が空の場合は早期にエラー応答
if (!is_array($items) && ($items instanceof Traversable) === false && count($items) === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'XML内にメッセージ要素を検出できませんでした（messages/message などを想定）']);
    exit;
}

$inserted = 0; $updated = 0; $skipped = 0; $errors = [];

// 事前にusers名前→IDキャッシュ
$userIdCache = [];
$getUserId = function($val) use ($pdo, &$userIdCache) {
    if ($val === null || $val === '') return null;
    if (ctype_digit((string)$val)) return (int)$val;
    $name = (string)$val;
    if (isset($userIdCache[$name])) return $userIdCache[$name];
    $st = $pdo->prepare('SELECT user_id FROM users WHERE name = ? ORDER BY user_id DESC LIMIT 1');
    $st->execute([$name]);
    $row = $st->fetch();
    $uid = $row ? (int)$row['user_id'] : null;
    $userIdCache[$name] = $uid;
    return $uid;
};

// INSERT文（utterance_idはXMLにあれば指定、無ければNULLでAUTO INCREMENT任せ）
$ins = $pdo->prepare('INSERT INTO discussion_utterances (
    utterance_id, discussion_id, user_id, content, utter_time, utter_epoc_time
) VALUES (?, ?, ?, ?, ?, ?)');

// 重複時更新のためのUPDATE文（キーの詳細は未確定のため、utterance_idが既存時のみ更新）
$upd = $pdo->prepare('UPDATE discussion_utterances
    SET discussion_id = ?, user_id = ?, content = ?, utter_time = ?, utter_epoc_time = ?
    WHERE utterance_id = ?');

foreach ($items as $idx => $node) {
    try {
        // 各フィールドを多候補で抽出
        $utteranceIdRaw = $first($node, ['utterance_id','id','message_id']);
    $discussionIdRaw = $first($node, ['discussion_id','discussion','thread_id','toolID']);
    $userRaw         = $first($node, ['user_id','userId','user','speaker','author','name']);
    $contentRaw      = $first($node, ['content','data','text','message','body']);
    $timeJpRaw       = $first($node, ['utter_time','JPNtime','time_jp','time','created_at','timestamp']);
    $epochRaw        = $first($node, ['utter_epoc_time','epoch','unix','ts']);

        // discussion_id の補完
        $discussionId = null;
    if ($discussionIdRaw !== null && ctype_digit((string)$discussionIdRaw)) {
            $discussionId = (int)$discussionIdRaw;
        } elseif ($fixedDiscussionId !== null) {
            $discussionId = $fixedDiscussionId;
        }

        // user_id 解決
        $userId = $getUserId($userRaw);

        // content
        $content = ($contentRaw !== null) ? trim((string)$contentRaw) : '';

        // 時刻: epoch優先。msなら秒へ変換
        $epoch = null;
        if ($epochRaw !== null && is_numeric($epochRaw)) {
            $epoch = (int)$epochRaw;
            if ($epoch > 2000000000) { // ms想定
                $epoch = (int) floor($epoch / 1000);
            }
        }
        $timeStr = null;
        if ($epoch !== null && $epoch > 0) {
            $timeStr = date('Y-m-d H:i:s', $epoch);
        } elseif ($timeJpRaw !== null && trim($timeJpRaw) !== '') {
            // ISOや任意の日時文字列 -> strtotime
            $t = strtotime((string)$timeJpRaw);
            if ($t !== false) {
                $epoch = (int)$t;
                $timeStr = date('Y-m-d H:i:s', $t);
            }
        }

        // utterance_id
        $utteranceId = null;
        if ($utteranceIdRaw !== null && ctype_digit((string)$utteranceIdRaw)) {
            $utteranceId = (int)$utteranceIdRaw;
        }

        // 最低限の必須: discussion_id, content（空でなければ）
        if ($discussionId === null) {
            $skipped++;
            continue;
        }
        if ($content === '') {
            $skipped++;
            continue;
        }

        // INSERT実行
        try {
            $ins->execute([
                $utteranceId, $discussionId, $userId, $content, $timeStr, $epoch
            ]);
            $inserted++;
        } catch (PDOException $e) {
            // 既存主キー重複時はUPDATE（SQLSTATE 23000）
            if ($e->getCode() === '23000' && $utteranceId !== null) {
                $upd->execute([$discussionId, $userId, $content, $timeStr, $epoch, $utteranceId]);
                $updated++;
            } else {
                $errors[] = 'row#' . $idx . ': ' . $e->getMessage();
                $skipped++;
            }
        }
    } catch (Exception $e) {
        $errors[] = 'row#' . $idx . ': ' . $e->getMessage();
        $skipped++;
    }
}

echo json_encode([
    'success'  => true,
    'file'     => $origName,
    'inserted' => $inserted,
    'updated'  => $updated,
    'skipped'  => $skipped,
    'errors'   => $errors,
], JSON_UNESCAPED_UNICODE);
