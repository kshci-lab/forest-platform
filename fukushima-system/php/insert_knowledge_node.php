<?php
// insert_knowledge_node.php (schema適合版: knowledge_node_id 手動採番, deleted=0 使用)
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

$parent_label = isset($_POST['parent_label']) ? trim((string)$_POST['parent_label']) : '';
$title = isset($_POST['node_title']) ? trim((string)$_POST['node_title']) : '';
if($title===''){
    echo json_encode(['status'=>'error','message'=>'node_title が空です']);
    exit;
}
$table = 'knowledge_explorer';

// 親ID解決（トップレベルノードから一致を探索, deleted=0）
$parent_id = null;
if($parent_label!==''){
    if($st = $mysqli->prepare("SELECT knowledge_node_id FROM $table WHERE parent_id IS NULL AND node_title=? AND deleted=0 LIMIT 1")){
        $st->bind_param('s',$parent_label);
        $st->execute();
        $st->bind_result($pid);
        if($st->fetch()){ $parent_id = (int)$pid; }
        $st->close();
    }
}
if($parent_label!=='' && $parent_id===null){
    echo json_encode(['status'=>'error','message'=>'親ラベルが見つかりません: '.$parent_label]);
    exit;
}

// knowledge_node_id 手動採番 (MAX+1, 基準値=11)
$nextId = 11;
if($res = $mysqli->query("SELECT MAX(knowledge_node_id) AS max_id FROM $table")){
    $row = $res->fetch_assoc();
    if($row && $row['max_id']!==null){
        $m = (int)$row['max_id'];
        $nextId = ($m >= 11) ? ($m + 1) : 11;
    }
    $res->close();
}

// INSERT: content,node_type は今回は NULL, deleted=0
if($parent_id===null){
    $stmt = $mysqli->prepare("INSERT INTO $table (knowledge_node_id,parent_id,node_title,content,node_type,deleted,created_at,updated_at) VALUES (?,?,?,NULL,NULL,0,NOW(),NOW())");
    if(!$stmt){ echo json_encode(['status'=>'error','message'=>'prepare失敗: '.$mysqli->error]); exit; }
    $nullParent = null;
    $stmt->bind_param('iis',$nextId,$nullParent,$title);
} else {
    $stmt = $mysqli->prepare("INSERT INTO $table (knowledge_node_id,parent_id,node_title,content,node_type,deleted,created_at,updated_at) VALUES (?,?,?,?,NULL,0,NOW(),NOW())");
    if(!$stmt){ echo json_encode(['status'=>'error','message'=>'prepare失敗: '.$mysqli->error]); exit; }
    // content は現状未使用→NULL。node_type も未使用→NULL。
    $content = null; // 使わないがbindで位置確保
    $stmt->bind_param('iiss',$nextId,$parent_id,$title,$content);
}
if(!$stmt->execute()){
    echo json_encode(['status'=>'error','message'=>'INSERT失敗: '.$stmt->error]);
    $stmt->close();
    exit;
}
$stmt->close();
$mysqli->close();

echo json_encode(['status'=>'ok','node_id'=>$nextId,'parent_id'=>$parent_id,'node_title'=>$title]);
