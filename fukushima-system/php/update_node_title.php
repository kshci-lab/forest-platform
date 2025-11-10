<?php
// update_node_title.php
// タイトル更新ではなく履歴を積むため、新しいレコードをINSERT（knowledge_node_id 手動採番, deleted=0）
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/connect_db.php';
if($_SERVER['REQUEST_METHOD']!=='POST'){
    http_response_code(405);
    echo json_encode(['status'=>'error','message'=>'Method Not Allowed']);
    exit;
}
if(!isset($mysqli) || !($mysqli instanceof mysqli)){
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'DB接続失敗']);
    exit;
}
@$mysqli->set_charset('utf8mb4');

$node_id = isset($_POST['node_id']) ? (int)$_POST['node_id'] : 0;
$new_title = isset($_POST['new_title']) ? trim((string)$_POST['new_title']) : '';
if($node_id<=0 || $new_title===''){
    echo json_encode(['status'=>'error','message'=>'node_id / new_title が不正です']);
    exit;
}
$table = 'knowledge_explorer';

// 元ノードの parent_id を取得（deleted=0 の制約は元レコード取得では必須ではないが、存在性チェックとして）
$parent_id = null;
if($st = $mysqli->prepare("SELECT parent_id FROM $table WHERE knowledge_node_id=? LIMIT 1")){
    $st->bind_param('i',$node_id);
    $st->execute();
    $st->bind_result($pid);
    if($st->fetch()){ $parent_id = ($pid!==null) ? (int)$pid : null; }
    $st->close();
}

// 新しい knowledge_node_id を採番 (MAX+1, 開始=11)
$nextId = 11;
if($res = $mysqli->query("SELECT MAX(knowledge_node_id) AS max_id FROM $table")){
    $row = $res->fetch_assoc();
    if($row && $row['max_id']!==null){
        $m = (int)$row['max_id'];
        $nextId = ($m >= 11) ? ($m + 1) : 11;
    }
    $res->close();
}

// レコード挿入（content/node_type は未使用→NULL、deleted=0）
if($parent_id===null){
    $stmt = $mysqli->prepare("INSERT INTO $table (knowledge_node_id,parent_id,node_title,content,node_type,deleted,created_at,updated_at) VALUES (?,?,?,NULL,NULL,0,NOW(),NOW())");
    if(!$stmt){ echo json_encode(['status'=>'error','message'=>'prepare失敗: '.$mysqli->error]); exit; }
    $nullParent = null;
    $stmt->bind_param('iis',$nextId,$nullParent,$new_title);
} else {
    $stmt = $mysqli->prepare("INSERT INTO $table (knowledge_node_id,parent_id,node_title,content,node_type,deleted,created_at,updated_at) VALUES (?,?,?,NULL,NULL,0,NOW(),NOW())");
    if(!$stmt){ echo json_encode(['status'=>'error','message'=>'prepare失敗: '.$mysqli->error]); exit; }
    $stmt->bind_param('iis',$nextId,$parent_id,$new_title);
}
if(!$stmt->execute()){
    echo json_encode(['status'=>'error','message'=>'INSERT失敗: '.$stmt->error]);
    $stmt->close();
    exit;
}
$stmt->close();
$mysqli->close();

echo json_encode(['status'=>'ok','node_id'=>$nextId,'parent_id'=>$parent_id,'node_title'=>$new_title]);
