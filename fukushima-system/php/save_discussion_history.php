<?php
// save_discussion_history.php
// Discussion board posts -> discussion_history table (no reload)
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
// prevent PHP warnings/notices from being printed into JSON responses
ini_set('display_errors', 0);

// simple debug logger to file for investigation
function _dbg($msg){
    $fn = __DIR__ . '/debug_discussion.txt';
    $ts = date('c');
    @file_put_contents($fn, "[".$ts."] ".(is_string($msg)?$msg:print_r($msg,true))."\n", FILE_APPEND);
}
_dbg("save_discussion_history called");
_dbg([ 'REMOTE_ADDR'=>($_SERVER['REMOTE_ADDR']??''), 'REQUEST_METHOD'=>$_SERVER['REQUEST_METHOD'] ?? '' ]);

session_start();
require_once __DIR__ . '/connect_db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    _dbg('method not allowed: ' . ($_SERVER['REQUEST_METHOD'] ?? ''));
    echo json_encode(['status'=>'error','message'=>'Method Not Allowed']);
    exit;
}

if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
    http_response_code(500);
    _dbg('DB connection missing or invalid');
    echo json_encode(['status'=>'error','message'=>'DB接続失敗']);
    exit;
}
@$mysqli->set_charset('utf8mb4');

$user_id = isset($_SESSION['USERID']) ? (int)$_SESSION['USERID'] : 0;
if ($user_id <= 0) {
    http_response_code(401);
    _dbg('user not logged in or invalid user id: ' . var_export($_SESSION, true));
    echo json_encode(['status'=>'error','message'=>'未ログインまたはユーザー不明']);
    exit;
}

$content = isset($_POST['content']) ? trim((string)$_POST['content']) : '';
if ($content === '') {
    _dbg('empty content posted');
    echo json_encode(['status'=>'error','message'=>'content が空です']);
    exit;
}
if (mb_strlen($content,'UTF-8') > 255) {
    // DB列 VARCHAR(255) に収まるように切り詰め
    $content = mb_substr($content, 0, 255, 'UTF-8');
}

// optional: knowledge_fragment_id (int) - which fragment this discussion belongs to
$knowledge_fragment_id = null;
if (isset($_POST['knowledge_fragment_id']) && $_POST['knowledge_fragment_id'] !== '') {
    $knowledge_fragment_id = (int)$_POST['knowledge_fragment_id'];
}

$table = 'discussion_history';
// テーブル存在チェック
$tbl = $mysqli->query("SHOW TABLES LIKE '".$mysqli->real_escape_string($table)."'");
if (!$tbl) {
    http_response_code(500);
    _dbg('SHOW TABLES failed: ' . $mysqli->error);
    echo json_encode(['status'=>'error','message'=>'テーブル存在確認失敗']);
    exit;
}
if ($tbl->num_rows === 0) {
    // 作成（PRIMARY KEY, posted_time DEFAULT CURRENT_TIMESTAMP）
    $createSql = "CREATE TABLE `discussion_history` (\n".
                 "  discussion_history_id INT(255) NOT NULL,\n".
                 "  user_id INT(255) NOT NULL,\n".
                 "  posted_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n".
                 "  content VARCHAR(255) NOT NULL,\n".
                 "  PRIMARY KEY (discussion_history_id),\n".
                 "  KEY user_id (user_id)\n".
                 ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    if(!$mysqli->query($createSql)) {
        http_response_code(500);
        _dbg('create table failed: ' . $mysqli->error . ' SQL: ' . $createSql);
        echo json_encode(['status'=>'error','message'=>'テーブル作成失敗']);
        exit;
    }
}
$tbl->close();

// 次ID採番: MAX >= 55555 なら +1、それ以下なら 55555
$nextId = 55555;
if ($resId = $mysqli->query("SELECT MAX(discussion_history_id) AS max_id FROM `$table`")) {
    $rowId = $resId->fetch_assoc();
    if ($rowId && $rowId['max_id'] !== null) {
        $m = (int)$rowId['max_id'];
        $nextId = ($m >= 55555) ? ($m + 1) : 55555;
    }
    $resId->close();
}

// detect if discussion_history has knowledge_fragment_id column; add if missing
$hasKFragCol = false;
if ($resCol = $mysqli->query("SHOW COLUMNS FROM `$table` LIKE 'knowledge_fragment_id'")) {
    $hasKFragCol = ($resCol->num_rows > 0);
    $resCol->free();
}
if (!$hasKFragCol) {
    // try to add column (non-blocking; report to error log on failure)
    $alterSql = "ALTER TABLE `$table` ADD COLUMN knowledge_fragment_id INT NULL DEFAULT NULL";
    if ($mysqli->query($alterSql)) {
        $hasKFragCol = true;
        error_log("save_discussion_history: added column knowledge_fragment_id to $table");
    } else {
        error_log("save_discussion_history: failed to add knowledge_fragment_id column: " . $mysqli->error);
    }
}

// if column exists, detect whether it allows NULL; if not and no value provided, coerce to 0
$kfragAllowsNull = true;
if ($hasKFragCol) {
    if ($resCol2 = $mysqli->query("SHOW COLUMNS FROM `$table` WHERE Field='knowledge_fragment_id'")) {
        $rowCol2 = $resCol2->fetch_assoc();
        if ($rowCol2 && isset($rowCol2['Null'])) {
            $kfragAllowsNull = (strtoupper(trim($rowCol2['Null'])) === 'YES');
        }
        $resCol2->free();
    }
    if (!$kfragAllowsNull && $knowledge_fragment_id === null) {
        // coerce to 0 to avoid NULL insert failure in strict mode
        _dbg('knowledge_fragment_id column NOT NULL but no fragment provided; coercing to 0');
        $knowledge_fragment_id = 0;
    }
}

// Build INSERT with optional knowledge_fragment_id
$sqlIns = "INSERT INTO `$table` (discussion_history_id, user_id, content" . ($hasKFragCol ? ", knowledge_fragment_id" : "") . ") VALUES (?,?,?" . ($hasKFragCol ? ",?" : "") . ")"; // posted_time は DEFAULT
if(!$stmt = $mysqli->prepare($sqlIns)) {
    _dbg('prepare failed: ' . $mysqli->error . ' SQL: ' . $sqlIns);
    echo json_encode(['status'=>'error','message'=>'prepare失敗']);
    exit;
}
if($hasKFragCol){
    $stmt->bind_param('iisi', $nextId, $user_id, $content, $knowledge_fragment_id);
} else {
    $stmt->bind_param('iis', $nextId, $user_id, $content);
}
if(!$stmt->execute()) {
    $err = $stmt->error;
    $stmt->close();
    _dbg('execute failed: ' . $err);
    echo json_encode(['status'=>'error','message'=>'INSERT失敗']);
    exit;
}
$stmt->close();
error_log('save_discussion_history: inserted discussion_history_id=' . $nextId . ' user_id=' . $user_id . ' kfrag=' . var_export($knowledge_fragment_id,true));

// 投稿日時取得（DBの値を正確に返すため SELECT または NOW() を利用）
$posted = null;
if ($resSel = $mysqli->prepare("SELECT posted_time FROM `$table` WHERE discussion_history_id=? LIMIT 1")) {
    $resSel->bind_param('i', $nextId);
    if ($resSel->execute()) {
        $resSel->bind_result($pt);
        if ($resSel->fetch()) { $posted = $pt; }
    }
    $resSel->close();
}
// 投稿者の表示名を取得（users テーブルがあれば照会）
$user_name = '';
if ($resName = $mysqli->prepare("SELECT name FROM `users` WHERE user_id=? LIMIT 1")) {
    $resName->bind_param('i', $user_id);
    if ($resName->execute()) {
        $resName->bind_result($uname);
        if ($resName->fetch()) { $user_name = $uname; }
    }
    $resName->close();
}
if (!$user_name && isset($_SESSION['USERNAME'])) { $user_name = $_SESSION['USERNAME']; }
$mysqli->close();

    _dbg('save_discussion_history succeeded: id=' . $nextId . ' user=' . $user_id . ' kfrag=' . var_export($knowledge_fragment_id,true));

    echo json_encode([
        'status' => 'ok',
        'discussion_history_id' => $nextId,
        'user_id' => $user_id,
        'user_name' => $user_name,
        'content' => $content,
        'posted_time' => $posted
    ]);
