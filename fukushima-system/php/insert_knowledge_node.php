<?php
// insert_knowledge_node.php (動的カラム対応: knowledge_node_id / parent_node_id を検出, 手動採番, deleted=0)
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

// カラム存在の動的検出
$colId = 'knowledge_node_id';
$colParent = 'parent_id';
$colTitle = 'node_title';
$hasDeleted = false;
if($cols = $mysqli->query("SHOW COLUMNS FROM $table")){
    while($c = $cols->fetch_assoc()){
        $f = $c['Field'];
        $lf = strtolower($f);
        if(in_array($lf, ['knowledge_node_id','node_id','id'])){ $colId = $f; }
        if(in_array($lf, ['parent_node_id','parent_id','parent','pid'])){ $colParent = $f; }
        if(in_array($lf, ['node_title','title','name','label'])){ $colTitle = $f; }
        if($lf==='deleted'){ $hasDeleted = true; }
    }
    $cols->close();
}

// 親ID解決（トップレベルノードから一致を探索）
$parentId = null;
if($parent_label!==''){
    $sqlFind = "SELECT $colId FROM $table WHERE $colParent IS NULL AND $colTitle=?".($hasDeleted?" AND deleted=0":"")." LIMIT 1";
    if($st = $mysqli->prepare($sqlFind)){
        $st->bind_param('s',$parent_label);
        $st->execute();
        $st->bind_result($pid);
        if($st->fetch()){ $parentId = ($pid!==null) ? (int)$pid : null; }
        $st->close();
    }
}
if($parent_label!=='' && $parentId===null){
    echo json_encode(['status'=>'error','message'=>'親ラベルが見つかりません: '.$parent_label]);
    exit;
}

// knowledge_node_id 手動採番 (MAX+1, 基準値=113)
$nextId = 113;
if($res = $mysqli->query("SELECT MAX($colId) AS max_id FROM $table")){
    $row = $res->fetch_assoc();
    if($row && $row['max_id']!==null){
        $m = (int)$row['max_id'];
        $nextId = ($m >= 113) ? ($m + 1) : 113;
    }
    $res->close();
}

// INSERT: content,node_type は今回は NULL, deleted=0 (あれば)
if($parentId===null){
    $sqlIns = "INSERT INTO $table ($colId,$colParent,$colTitle".($hasDeleted?",deleted":"").",created_at,updated_at) VALUES (?,?,?".($hasDeleted?",0":"").",NOW(),NOW())";
    if($stmt = $mysqli->prepare($sqlIns)){
        $nullParent = null;
        $stmt->bind_param('iis',$nextId,$nullParent,$title);
    } else { echo json_encode(['status'=>'error','message'=>'prepare失敗: '.$mysqli->error]); exit; }
} else {
    $sqlIns = "INSERT INTO $table ($colId,$colParent,$colTitle".($hasDeleted?",deleted":"").",created_at,updated_at) VALUES (?,?,?".($hasDeleted?",0":"").",NOW(),NOW())";
    if($stmt = $mysqli->prepare($sqlIns)){
        $stmt->bind_param('iis',$nextId,$parentId,$title);
    } else { echo json_encode(['status'=>'error','message'=>'prepare失敗: '.$mysqli->error]); exit; }
}
if(!$stmt->execute()){
    echo json_encode(['status'=>'error','message'=>'INSERT失敗: '.$stmt->error]);
    $stmt->close();
    exit;
}
$stmt->close();
$mysqli->close();

echo json_encode(['status'=>'ok','node_id'=>$nextId,'parent_id'=>$parentId,'node_title'=>$title]);
