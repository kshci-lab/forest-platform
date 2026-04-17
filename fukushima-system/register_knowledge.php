<?php
// register_knowledge.php (AJAX JSON API)
// combined_contents テーブルへ非同期登録し JSON を返す
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL); ini_set('display_errors', 1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status'=>'error','message'=>'Method Not Allowed']);
    exit;
}

$content = isset($_POST['knowledge_content']) ? $_POST['knowledge_content'] : (isset($_POST['content']) ? $_POST['content'] : '');
$comment = isset($_POST['comment']) ? $_POST['comment'] : '';
$content = is_string($content) ? trim($content) : '';
$comment = is_string($comment) ? trim($comment) : '';

require_once __DIR__ . '/../php/connect_db.php';
if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'DB接続失敗']);
    exit;
}
@$mysqli->set_charset('utf8mb4');

$tableName = 'combined_contents';
$existsRes = $mysqli->query("SHOW TABLES LIKE '" . $mysqli->real_escape_string($tableName) . "'");
if(!$existsRes){
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'テーブル存在確認エラー: '.$mysqli->error]);
    exit;
}
if($existsRes->num_rows===0){
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'テーブル '.$tableName.' が存在しません']);
    exit;
}
$existsRes->free();

$nextId = 33333;
$maxSql = 'SELECT MAX(combined_contents_id) AS max_id FROM `'.$tableName.'`';
if($res = $mysqli->query($maxSql)){
    $row = $res->fetch_assoc();
    if($row && !is_null($row['max_id'])){ $nextId = ((int)$row['max_id']) + 1; }
    $res->free();
} else {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'MAX取得エラー: '.$mysqli->error]);
    exit;
}

$externalized_contents_id = null; // 現状未対応
$sql = 'INSERT INTO `'.$tableName.'` (combined_contents_id, externalized_contents_id, content, comment, deleted) VALUES (?,?,?,?,0)';
$stmt = $mysqli->prepare($sql);
if(!$stmt){
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'ステートメント準備失敗: '.$mysqli->error]);
    exit;
}
$stmt->bind_param('iiss', $nextId, $externalized_contents_id, $content, $comment);
if(!$stmt->execute()){
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'INSERT失敗: '.$stmt->error]);
    $stmt->close();
    exit;
}
$stmt->close();
$mysqli->close();

echo json_encode([
    'status'=>'ok',
    'id'=>$nextId,
    'content'=>$content,
    'comment'=>$comment
]);
