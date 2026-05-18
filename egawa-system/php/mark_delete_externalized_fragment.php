<?php
// mark_delete_externalized_fragment.php
// Set externalized_contents.deleted = 1 for a given externalized_contents_id
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);

session_start();
require_once __DIR__ . '/connect_db.php';

function respond($ok, $msg = '', $extra = []){
    $res = ['status' => $ok ? 'ok' : 'error'];
    if($msg){ $res['message'] = $msg; }
    foreach($extra as $k=>$v){ $res[$k] = $v; }
    echo json_encode($res);
    exit;
}

if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
    http_response_code(500);
    respond(false, 'DB接続失敗');
}
@$mysqli->set_charset('utf8mb4');

$user_id = isset($_SESSION['USERID']) ? (int)$_SESSION['USERID'] : 0;
if ($user_id <= 0) {
    http_response_code(401);
    respond(false, '未ログインまたはユーザー不明');
}

$extId = null;
if(isset($_POST['externalized_contents_id'])){
    $extId = (int)$_POST['externalized_contents_id'];
}
if(!$extId || $extId <= 0){
    respond(false, 'externalized_contents_id が不正です');
}

// Ensure table exists and has deleted column
$table = 'externalized_contents';
$tbl = $mysqli->query("SHOW TABLES LIKE '".$mysqli->real_escape_string($table)."'");
if(!$tbl || $tbl->num_rows === 0){
    respond(false, 'externalized_contents テーブルが存在しません');
}
$tbl && $tbl->free();

$hasDeleted = false;
if($resCol = $mysqli->query("SHOW COLUMNS FROM `$table` LIKE 'deleted'")){
    $hasDeleted = ($resCol->num_rows > 0);
    $resCol->free();
}
if(!$hasDeleted){
    // Try to add column if missing
    $alter = "ALTER TABLE `$table` ADD COLUMN `deleted` TINYINT(1) NOT NULL DEFAULT 0";
    if(!$mysqli->query($alter)){
        respond(false, 'deleted カラムの追加に失敗しました: '.$mysqli->error);
    }
}

// Update
if(!$stmt = $mysqli->prepare("UPDATE `$table` SET deleted=1 WHERE externalized_contents_id=?")){
    respond(false, 'prepare失敗: '.$mysqli->error);
}
$stmt->bind_param('i', $extId);
if(!$stmt->execute()){
    $err = $stmt->error;
    $stmt->close();
    respond(false, 'UPDATE失敗: '.$err);
}
$stmt->close();
$mysqli->close();
respond(true, 'deleted=1 に更新しました', ['externalized_contents_id' => $extId]);
