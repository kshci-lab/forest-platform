<?php
// Save knowledge_explorer record on KRA submit
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

// 入力値の取得（NULL許容の node_type は空なら NULL 扱い）
$parent_node_id = isset($_POST['parent_node_id']) ? (int)$_POST['parent_node_id'] : null;
$node_title = isset($_POST['node_title']) ? trim((string)$_POST['node_title']) : '';
$content = isset($_POST['content']) ? trim((string)$_POST['content']) : '';
$node_type = isset($_POST['node_type']) ? trim((string)$_POST['node_type']) : '';
if($node_type===''){ $node_type = null; }

if($node_title===''){
    echo json_encode(['status'=>'error','message'=>'node_title が空です']);
    exit;
}

$table = 'knowledge_explorer';

// knowledge_node_id / parent_node_id の実際のカラム名を自動検出（parent_id で運用されている可能性に対応）
$colId = 'knowledge_node_id';
$colParent = 'parent_node_id';
$colTitle = 'node_title';
$colContent = 'content';
$colType = 'node_type';
$colDeleted = 'deleted';
if($cols = $mysqli->query("SHOW COLUMNS FROM $table")){
    while($c = $cols->fetch_assoc()){
        $f = $c['Field']; $lf = strtolower($f);
        if(in_array($lf,['knowledge_node_id','node_id'])){ $colId = $f; }
        if(in_array($lf,['parent_node_id','parent_id'])){ $colParent = $f; }
        if(in_array($lf,['node_title','name','label'])){ $colTitle = $f; }
        if(in_array($lf,['content','body','text'])){ $colContent = $f; }
        if(in_array($lf,['node_type','type','category'])){ $colType = $f; }
        if(in_array($lf,['deleted','is_deleted','flag_deleted'])){ $colDeleted = $f; }
    }
    $cols->close();
}

// knowledge_node_id を採番: MAX+1, 最低開始値は 113
$nextId = 113;
if($res = $mysqli->query("SELECT MAX($colId) AS max_id FROM $table")){
    $row = $res->fetch_assoc();
    if($row && $row['max_id']!==null){
        $m = (int)$row['max_id'];
        $nextId = ($m >= 113) ? ($m + 1) : 113;
    }
    $res->close();
}

// INSERT 実行（deleted=0, timestamps は NOW()）
// 動的カラム名で INSERT 文構築
$sql = "INSERT INTO $table ($colId, $colParent, $colTitle, $colContent, $colType, $colDeleted, created_at, updated_at) VALUES (?,?,?,?,?,0,NOW(),NOW())";
$stmt = $mysqli->prepare($sql);
if(!$stmt){
    echo json_encode(['status'=>'error','message'=>'prepare失敗: '.$mysqli->error]);
    exit;
}
$stmt->bind_param('iisss', $nextId, $parent_node_id, $node_title, $content, $node_type);
if(!$stmt->execute()){
    $msg = $stmt->error;
    $stmt->close();
    echo json_encode(['status'=>'error','message'=>'INSERT失敗: '.$msg]);
    exit;
}
$stmt->close();
$mysqli->close();

echo json_encode(['status'=>'ok','knowledge_node_id'=>$nextId]);
