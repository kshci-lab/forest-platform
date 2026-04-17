<?php
// mark_delete_externalized_fragment.php
// forest-mrn:
// Set experience_knowledges.deleted = 1 for a given experience_knowledge_id
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

$id = null;
// legacy param name compatibility: externalized_contents_id is treated as experience_knowledge_id
if(isset($_POST['experience_knowledge_id'])){ $id = (int)$_POST['experience_knowledge_id']; }
if((!$id || $id<=0) && isset($_POST['externalized_contents_id'])){ $id = (int)$_POST['externalized_contents_id']; }
if(!$id || $id <= 0){
    respond(false, 'experience_knowledge_id が不正です');
}

// Ensure table exists and has deleted column
$table = 'experience_knowledges';
$tbl = $mysqli->query("SHOW TABLES LIKE '".$mysqli->real_escape_string($table)."'");
if(!$tbl || $tbl->num_rows === 0){
    respond(false, 'experience_knowledges テーブルが存在しません');
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
if(!$stmt = $mysqli->prepare("UPDATE `$table` SET deleted=1 WHERE experience_knowledge_id=?")){
    respond(false, 'prepare失敗: '.$mysqli->error);
}
$stmt->bind_param('i', $id);
if(!$stmt->execute()){
    $err = $stmt->error;
    $stmt->close();
    respond(false, 'UPDATE失敗: '.$err);
}
$stmt->close();
$mysqli->close();
respond(true, 'deleted=1 に更新しました', ['experience_knowledge_id' => $id]);
