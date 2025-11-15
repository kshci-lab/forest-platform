<?php
// save_discussion_history.php
// Discussion board posts -> discussion_history table (no reload)
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL); ini_set('display_errors', 1);

session_start();
require_once __DIR__ . '/connect_db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status'=>'error','message'=>'Method Not Allowed']);
    exit;
}

if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'DB接続失敗']);
    exit;
}
@$mysqli->set_charset('utf8mb4');

$user_id = isset($_SESSION['USERID']) ? (int)$_SESSION['USERID'] : 0;
if ($user_id <= 0) {
    http_response_code(401);
    echo json_encode(['status'=>'error','message'=>'未ログインまたはユーザー不明']);
    exit;
}

$content = isset($_POST['content']) ? trim((string)$_POST['content']) : '';
if ($content === '') {
    echo json_encode(['status'=>'error','message'=>'content が空です']);
    exit;
}
if (mb_strlen($content,'UTF-8') > 255) {
    // DB列 VARCHAR(255) に収まるように切り詰め
    $content = mb_substr($content, 0, 255, 'UTF-8');
}

$table = 'discussion_history';
// テーブル存在チェック
$tbl = $mysqli->query("SHOW TABLES LIKE '".$mysqli->real_escape_string($table)."'");
if (!$tbl) {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'テーブル存在確認失敗: '.$mysqli->error]);
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
        echo json_encode(['status'=>'error','message'=>'テーブル作成失敗: '.$mysqli->error]);
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

$sqlIns = "INSERT INTO `$table` (discussion_history_id, user_id, content) VALUES (?,?,?)"; // posted_time は DEFAULT
if(!$stmt = $mysqli->prepare($sqlIns)) {
    echo json_encode(['status'=>'error','message'=>'prepare失敗: '.$mysqli->error]);
    exit;
}
$stmt->bind_param('iis', $nextId, $user_id, $content);
if(!$stmt->execute()) {
    $err = $stmt->error;
    $stmt->close();
    echo json_encode(['status'=>'error','message'=>'INSERT失敗: '.$err]);
    exit;
}
$stmt->close();

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
$mysqli->close();

echo json_encode([
    'status' => 'ok',
    'discussion_history_id' => $nextId,
    'user_id' => $user_id,
    'content' => $content,
    'posted_time' => $posted
]);
