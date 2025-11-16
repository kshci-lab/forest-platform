<?php
// get_discussion_history.php
// Returns last N discussion_history rows (default 100) ordered by discussion_history_id ASC
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL); ini_set('display_errors', 1);

require_once __DIR__ . '/connect_db.php';
if(!isset($mysqli) || !($mysqli instanceof mysqli)){
  http_response_code(500);
  echo json_encode(['status'=>'error','message'=>'DB接続失敗']);
  exit;
}
@$mysqli->set_charset('utf8mb4');

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
if($limit <= 0 || $limit > 500){ $limit = 100; }

$table = 'discussion_history';
$tbl = $mysqli->query("SHOW TABLES LIKE '".$mysqli->real_escape_string($table)."'");
if(!$tbl){
  echo json_encode(['status'=>'error','message'=>'テーブル確認失敗: '.$mysqli->error]);
  exit;
}
if($tbl->num_rows === 0){
  // No table yet => empty list
  echo json_encode(['status'=>'ok','items'=>[]]);
  exit;
}
$tbl->close();

// join users table to include the poster's display name (user_name)
$sql = "SELECT dh.discussion_history_id, dh.user_id, dh.posted_time, dh.content, COALESCE(u.name,'') AS user_name " .
  "FROM `$table` dh LEFT JOIN `users` u ON dh.user_id = u.user_id " .
  "ORDER BY dh.discussion_history_id ASC LIMIT ?";
if(!$stmt = $mysqli->prepare($sql)){
  echo json_encode(['status'=>'error','message'=>'prepare失敗: '.$mysqli->error]);
  exit;
}
$stmt->bind_param('i',$limit);
if(!$stmt->execute()){
  $err = $stmt->error; $stmt->close();
  echo json_encode(['status'=>'error','message'=>'SELECT失敗: '.$err]);
  exit;
}
$result = $stmt->get_result();
$items = [];
while($row = $result->fetch_assoc()){
  $items[] = [
    'discussion_history_id' => (int)$row['discussion_history_id'],
    'user_id' => (int)$row['user_id'],
    'posted_time' => $row['posted_time'],
    'content' => $row['content'],
    'user_name' => isset($row['user_name']) ? $row['user_name'] : ''
  ];
}
$result->free();
$stmt->close();
$mysqli->close();

echo json_encode(['status'=>'ok','items'=>$items]);
