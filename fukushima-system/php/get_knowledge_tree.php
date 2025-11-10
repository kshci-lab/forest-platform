<?php
// get_knowledge_tree.php
// knowledge_explorer テーブルから階層表示用ノード一覧を取得（トップレベル3種を保証）
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once __DIR__ . '/connect_db.php';

if(!isset($mysqli) || !($mysqli instanceof mysqli)){
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'DB接続失敗']);
    exit;
}
@$mysqli->set_charset('utf8mb4');

// テーブル存在チェック
$table = 'knowledge_explorer';
$tbl = $mysqli->query("SHOW TABLES LIKE '".$mysqli->real_escape_string($table)."'");
if(!$tbl){
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'テーブル存在確認エラー: '.$mysqli->error]);
    exit;
}
if($tbl->num_rows===0){
    // テーブル自体が無ければ作成（互換性高めの定義）
    $createSql = "CREATE TABLE knowledge_explorer (\n".
                 "  node_id INT(11) NOT NULL AUTO_INCREMENT,\n".
                 "  parent_id INT(11) NULL DEFAULT NULL,\n".
                 "  node_title VARCHAR(255) NOT NULL,\n".
                 "  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n".
                 "  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n".
                 "  PRIMARY KEY (node_id),\n".
                 "  KEY parent_id (parent_id)\n".
                 ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    if(!$mysqli->query($createSql)){
        // 作成に失敗しても詳細を返して終了
        http_response_code(500);
        echo json_encode(['status'=>'error','message'=>'テーブル作成失敗: '.$mysqli->error]);
        exit;
    }
}
$tbl->close();

// カラム定義を柔軟に解決（互換のため候補名を許容）
$colId = null;      // knowledge_node_id / node_id / id / knowledge_explorer_id
$colParent = null;  // parent_id / parent / pid / parent_node_id
$colTitle = null;   // node_title / title / name / label
$hasDeleted = false;
$idIsAutoInc = false;
if ($resCols = $mysqli->query("SHOW COLUMNS FROM $table")) {
    while($c = $resCols->fetch_assoc()){
        $f = isset($c['Field']) ? $c['Field'] : '';
        $lf = mb_strtolower($f, 'UTF-8');
        if($colId===null && in_array($lf, ['knowledge_node_id','node_id','id','knowledge_explorer_id'])){ $colId = $f; }
        if($colParent===null && in_array($lf, ['parent_id','parent','pid','parent_node_id'])){ $colParent = $f; }
        if($colTitle===null && in_array($lf, ['node_title','title','name','label'])){ $colTitle = $f; }
        if($lf === 'deleted'){ $hasDeleted = true; }
        if($f === $colId && isset($c['Extra']) && stripos($c['Extra'], 'auto_increment') !== false){ $idIsAutoInc = true; }
    }
    $resCols->close();
}
// 少なくともタイトルが無いと表示不能
if($colTitle === null){
    // 最低限のフォールバック: DBスキーマが未整備でもトップレベルだけ返す
    $fallback = [
        ['node_id'=>1, 'parent_id'=>null, 'node_title'=>'知識関連'],
        ['node_id'=>2, 'parent_id'=>null, 'node_title'=>'研究方略関連'],
        ['node_id'=>3, 'parent_id'=>null, 'node_title'=>'その他']
    ];
    echo json_encode(['status'=>'ok','nodes'=>$fallback]);
    exit;
}

// トップレベル3種を保証（parent列とtitle列がある場合のみ）
if($colParent !== null && $colTitle !== null){
    $topTitles = ['知識関連','研究方略関連','その他'];
    $existing = [];
    $sqlTop = "SELECT ".($colId ? "$colId" : "NULL")." AS node_id, $colTitle AS node_title FROM $table WHERE $colParent IS NULL".($hasDeleted?" AND deleted=0":"");
    if($resTop = $mysqli->query($sqlTop)){
        while($r = $resTop->fetch_assoc()){ $existing[$r['node_title']] = isset($r['node_id']) ? (int)$r['node_id'] : null; }
        $resTop->close();
    }
    foreach($topTitles as $t){
        if(!isset($existing[$t])){
            // 採番（AUTO_INCREMENT 無しなら MAX+1、基準=113）
            $nextId = null;
            if(!$idIsAutoInc && $colId){
                $nextId = 113;
                if($rs = $mysqli->query("SELECT MAX($colId) AS max_id FROM $table")){
                    $rowm = $rs->fetch_assoc();
                    if($rowm && isset($rowm['max_id']) && $rowm['max_id']!==null){
                        $maxv = (int)$rowm['max_id'];
                        $nextId = ($maxv >= 113) ? ($maxv + 1) : 113;
                    }
                    $rs->close();
                }
            }
            if(!$idIsAutoInc && $colId){
                $sqlIns = "INSERT INTO $table ($colId,$colTitle".($colParent?",$colParent":"").($hasDeleted?",deleted":"").") VALUES (?,?".($colParent?",NULL":"").($hasDeleted?",0":"").")";
                if($stmt = $mysqli->prepare($sqlIns)){
                    $stmt->bind_param('is',$nextId,$t);
                    @$stmt->execute();
                    @$stmt->close();
                }
            } else {
                $sqlIns = "INSERT INTO $table ($colTitle".($colParent?",$colParent":"").($hasDeleted?",deleted":"").") VALUES (?".($colParent?",NULL":"").($hasDeleted?",0":"").")";
                if($stmt = $mysqli->prepare($sqlIns)){
                    $stmt->bind_param('s',$t);
                    @$stmt->execute();
                    @$stmt->close();
                }
            }
        }
    }
}

// 全ノード取得（動的カラム名で取得）
$nodes = [];
$selectCols = [];
if($colId){ $selectCols[] = "$colId AS node_id"; } else { $selectCols[] = "NULL AS node_id"; }
if($colParent){ $selectCols[] = "$colParent AS parent_id"; } else { $selectCols[] = "NULL AS parent_id"; }
$selectCols[] = "$colTitle AS node_title";
$sqlAll = "SELECT ".implode(',', $selectCols)." FROM $table".($hasDeleted?" WHERE deleted=0":"")." ORDER BY ".($colId ? $colId : $colTitle)." ASC";
if($resAll = $mysqli->query($sqlAll)){
    while($row = $resAll->fetch_assoc()){
        $nid = isset($row['node_id']) && $row['node_id']!==null ? (int)$row['node_id'] : null;
        $pid = isset($row['parent_id']) && $row['parent_id']!==null ? (int)$row['parent_id'] : null;
        $nodes[] = [ 'node_id'=>$nid, 'parent_id'=>$pid, 'node_title'=>$row['node_title'] ];
    }
    $resAll->close();
} else {
    // 取得失敗時もフォールバック（トップレベル3種）
    $nodes = [
        ['node_id'=>1, 'parent_id'=>null, 'node_title'=>'知識関連'],
        ['node_id'=>2, 'parent_id'=>null, 'node_title'=>'研究方略関連'],
        ['node_id'=>3, 'parent_id'=>null, 'node_title'=>'その他']
    ];
}
$mysqli->close();

echo json_encode(['status'=>'ok','nodes'=>$nodes]);
