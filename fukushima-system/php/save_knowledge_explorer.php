<?php
// Save knowledge_explorer record on KRA submit
header('Content-Type: application/json; charset=UTF-8');
session_start();
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
$comment = isset($_POST['comment']) ? trim((string)$_POST['comment']) : '';
$node_type = isset($_POST['node_type']) ? trim((string)$_POST['node_type']) : '';
if($node_type===''){ $node_type = null; }

// optional: knowledge_fragment_id (accept string, CSV, or array) - store as-is (expect VARCHAR column)
$knowledge_fragment_id = null;
if (isset($_POST['knowledge_fragment_id']) && $_POST['knowledge_fragment_id'] !== '') {
    if (is_array($_POST['knowledge_fragment_id'])) {
        $arr = array_map('trim', $_POST['knowledge_fragment_id']);
        $arr = array_filter($arr, function($v){ return $v !== ''; });
        if (count($arr)) { $knowledge_fragment_id = implode(',', $arr); }
    } else {
        $kraw = trim((string)$_POST['knowledge_fragment_id']);
        if ($kraw !== '') {
            if (strpos($kraw, ',') !== false) {
                $parts = array_map('trim', explode(',', $kraw));
                $parts = array_filter($parts, function($v){ return $v !== ''; });
                if (count($parts)) { $knowledge_fragment_id = implode(',', $parts); }
            } else {
                $knowledge_fragment_id = $kraw;
            }
        }
    }
}

if($node_title===''){
    echo json_encode(['status'=>'error','message'=>'node_title が空です']);
    exit;
}

$table = 'knowledge_explorer';

// knowledge_node_id / parent_node_id の実際のカラム名を自動検出（parent_id で運用されている可能性に対応）
$colId = 'knowledge_node_id';
$colParent = 'parent_node_id';
$colTitle = 'node_title';
$colComment = 'comment';
$colType = 'node_type';
$colDeleted = 'deleted';
$colUpdatedBy = null; // updated_by カラム存在時に格納
$colKFrag = null; // knowledge_fragment_id column name if present
if($cols = $mysqli->query("SHOW COLUMNS FROM $table")){
    while($c = $cols->fetch_assoc()){
        $f = $c['Field']; $lf = strtolower($f);
        if(in_array($lf,['knowledge_node_id','node_id'])){ $colId = $f; }
        if(in_array($lf,['parent_node_id','parent_id'])){ $colParent = $f; }
        if(in_array($lf,['node_title','name','label'])){ $colTitle = $f; }
        if(in_array($lf,['comment','body','text'])){ $colComment = $f; }
        if(in_array($lf,['node_type','type','category'])){ $colType = $f; }
        if(in_array($lf,['deleted','is_deleted','flag_deleted'])){ $colDeleted = $f; }
        if($lf==='updated_by'){ $colUpdatedBy = $f; }
        if($lf==='knowledge_fragment_id'){ $colKFrag = $f; }
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
$colsPart = "$colId, $colParent, $colTitle, $colComment, $colType";
if ($colKFrag) { $colsPart .= ", $colKFrag"; }
$colsPart .= ", $colDeleted" . ($colUpdatedBy?", $colUpdatedBy":"");
// append timestamp columns
$colsPart .= ", created_at, updated_at";

$valsPart = "?,?,?,?,?"; // nextId, parent, title, comment, type
if ($colKFrag) { $valsPart .= ",?"; }
$valsPart .= ",0" . ($colUpdatedBy?", ?":"");

$sql = "INSERT INTO $table (".$colsPart.") VALUES (".$valsPart.",NOW(),NOW())"; 
$stmt = $mysqli->prepare($sql);
if(!$stmt){
    error_log('save_knowledge_explorer prepare failed: '.$mysqli->error);
    error_log('save_knowledge_explorer SQL: '. $sql);
    echo json_encode(['status'=>'error','message'=>'prepare失敗: '.$mysqli->error]);
    exit;
}
// Bind parameters dynamically (support optional knowledge_fragment_id and updated_by)
$userId = isset($_SESSION['USERID']) ? (int)$_SESSION['USERID'] : null;
$bind_types = '';
$bind_values = array();
// nextId (i)
$bind_types .= 'i'; $bind_values[] = $nextId;
// parent_node_id (i)
$bind_types .= 'i'; $bind_values[] = $parent_node_id;
// node_title (s)
$bind_types .= 's'; $bind_values[] = $node_title;
// comment (s)
$bind_types .= 's'; $bind_values[] = $comment;
// node_type (s)
$bind_types .= 's'; $bind_values[] = $node_type;
// knowledge_fragment_id (s) optional
if ($colKFrag) {
    $bind_types .= 's'; $bind_values[] = ($knowledge_fragment_id === null ? '' : $knowledge_fragment_id);
}
// deleted is constant 0 in SQL, not bound
// updated_by optional
if ($colUpdatedBy) {
    $bind_types .= 'i'; $bind_values[] = $userId;
}

// prepare args for bind_param (by reference)
$bind_names = array();
$bind_names[] = $bind_types;
for ($i=0;$i<count($bind_values);$i++){
    // create variable references
    $bind_names[] = & $bind_values[$i];
}
call_user_func_array(array($stmt,'bind_param'), $bind_names);
if(!$stmt->execute()){
    $msg = $stmt->error;
    $stmt->close();
    echo json_encode(['status'=>'error','message'=>'INSERT失敗: '.$msg]);
    exit;
}
$stmt->close();
$mysqli->close();

echo json_encode(['status'=>'ok','knowledge_node_id'=>$nextId]);
