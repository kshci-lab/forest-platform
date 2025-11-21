<?php
// update_node_title.php
// タイトル更新ではなく履歴を積むため、新しいレコードをINSERT（knowledge_node_id 手動採番, deleted=0）
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

$node_id = isset($_POST['node_id']) ? (int)$_POST['node_id'] : 0;
$new_title = isset($_POST['new_title']) ? trim((string)$_POST['new_title']) : '';
if($node_id<=0 || $new_title===''){
    echo json_encode(['status'=>'error','message'=>'node_id / new_title が不正です']);
    exit;
}
$table = 'knowledge_explorer';

// 動的カラム検出 (parent_node_id / parent_id など) + id カラム名
$colId = 'knowledge_node_id';
$colParent = 'parent_id';
$colTitle = 'node_title';
$colUpdatedBy = null; // updated_by 検出
$hasDeleted = false;
if($cols = $mysqli->query("SHOW COLUMNS FROM $table")){
    while($c = $cols->fetch_assoc()){
        $f = $c['Field']; $lf = strtolower($f);
        if(in_array($lf,['knowledge_node_id','node_id','id'])){ $colId = $f; }
        if(in_array($lf,['parent_node_id','parent_id','parent','pid'])){ $colParent = $f; }
        if(in_array($lf,['node_title','title','name','label'])){ $colTitle = $f; }
        if($lf==='deleted'){ $hasDeleted = true; }
        if($lf==='updated_by'){ $colUpdatedBy = $f; }
    }
    $cols->close();
}

// 元ノードの parent を取得
$parentId = null;
if($st = $mysqli->prepare("SELECT $colParent FROM $table WHERE $colId=? LIMIT 1")){
    $st->bind_param('i',$node_id);
    $st->execute();
    $st->bind_result($pid);
    if($st->fetch()){ $parentId = ($pid!==null) ? (int)$pid : null; }
    $st->close();
}

// 新しい ID を採番 (MAX+1, 基準=113)
$nextId = 113;
if($res = $mysqli->query("SELECT MAX($colId) AS max_id FROM $table")){
    $row = $res->fetch_assoc();
    if($row && $row['max_id']!==null){
        $m = (int)$row['max_id'];
        $nextId = ($m >= 113) ? ($m + 1) : 113;
    }
    $res->close();
}

// レコード挿入 deleted=0 (カラムがあれば)
// まず既存レコードを論理削除（deleted=1）する
if($hasDeleted){
    if($upd = $mysqli->prepare("UPDATE $table SET deleted=1 WHERE $colId = ?")){
        $upd->bind_param('i', $node_id);
        @$upd->execute();
        $upd->close();
    }
} else {
    // deleted カラムが無ければ追加してから更新する
    $alter = "ALTER TABLE $table ADD COLUMN deleted TINYINT(1) NOT NULL DEFAULT 0";
    if($mysqli->query($alter)){
        $hasDeleted = true;
        if($upd = $mysqli->prepare("UPDATE $table SET deleted=1 WHERE $colId = ?")){
            $upd->bind_param('i', $node_id);
            @$upd->execute();
            $upd->close();
        }
    }
}

// 新規履歴レコード挿入 (updated_by も含める)
$userId = isset($_SESSION['USERID']) ? (int)$_SESSION['USERID'] : null;
if($parentId===null){
    $sqlIns = "INSERT INTO $table (".$colId.",".$colParent.",".$colTitle.
             ($hasDeleted?",deleted":"").
             ($colUpdatedBy?",".$colUpdatedBy:"").
             ",created_at,updated_at) VALUES (?,?,?".
             ($hasDeleted?",0":"").
             ($colUpdatedBy?",?":"").
             ",NOW(),NOW())";
    if(!$stmt = $mysqli->prepare($sqlIns)){ echo json_encode(['status'=>'error','message'=>'prepare失敗: '.$mysqli->error]); exit; }
    $nullParent = null;
    if($colUpdatedBy){
        $stmt->bind_param('iisi',$nextId,$nullParent,$new_title,$userId);
    }else{
        $stmt->bind_param('iis',$nextId,$nullParent,$new_title);
    }
} else {
    $sqlIns = "INSERT INTO $table (".$colId.",".$colParent.",".$colTitle.
             ($hasDeleted?",deleted":"").
             ($colUpdatedBy?",".$colUpdatedBy:"").
             ",created_at,updated_at) VALUES (?,?,?".
             ($hasDeleted?",0":"").
             ($colUpdatedBy?",?":"").
             ",NOW(),NOW())";
    if(!$stmt = $mysqli->prepare($sqlIns)){ echo json_encode(['status'=>'error','message'=>'prepare失敗: '.$mysqli->error]); exit; }
    if($colUpdatedBy){
        $stmt->bind_param('iisi',$nextId,$parentId,$new_title,$userId);
    }else{
        $stmt->bind_param('iis',$nextId,$parentId,$new_title);
    }
}
if(!$stmt->execute()){
    echo json_encode(['status'=>'error','message'=>'INSERT失敗: '.$stmt->error]);
    $stmt->close();
    exit;
}
$stmt->close();
$mysqli->close();

echo json_encode(['status'=>'ok','node_id'=>$nextId,'parent_id'=>$parentId,'node_title'=>$new_title]);
