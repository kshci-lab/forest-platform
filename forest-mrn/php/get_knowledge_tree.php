<?php
// get_knowledge_tree.php
// knowledge_explorer テーブルから階層表示用ノード一覧を取得（トップレベル3種を保証）
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);
// 環境側で MYSQLI_REPORT_STRICT が有効だと mysqli_* が例外を投げて 500 になりやすいので、このAPI内では例外化を無効化
mysqli_report(MYSQLI_REPORT_OFF);
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

// Ensure commonly used columns exist (non-fatal if ALTER fails)
// These columns are used to match fukushima-system output structure.
$ensureCols = [
    ['name' => 'deleted', 'sql' => "ALTER TABLE `$table` ADD COLUMN `deleted` TINYINT(1) NOT NULL DEFAULT 0"],
    ['name' => 'comment', 'sql' => "ALTER TABLE `$table` ADD COLUMN `comment` TEXT NULL DEFAULT NULL"],
    ['name' => 'updated_by', 'sql' => "ALTER TABLE `$table` ADD COLUMN `updated_by` INT(11) NULL DEFAULT NULL"],
    // store as CSV string to support multiple fragments (fukushima-system behavior)
    ['name' => 'knowledge_fragment_id', 'sql' => "ALTER TABLE `$table` ADD COLUMN `knowledge_fragment_id` VARCHAR(255) NULL DEFAULT NULL"],
    // used for ordering root categories
    ['name' => 'sort_order', 'sql' => "ALTER TABLE `$table` ADD COLUMN `sort_order` INT(11) NULL DEFAULT NULL"],
];
foreach($ensureCols as $c){
    $col = $c['name'];
    $has = false;
    if($resC = $mysqli->query("SHOW COLUMNS FROM `$table` LIKE '".$mysqli->real_escape_string($col)."'")){
        $has = ($resC->num_rows > 0);
        $resC->free();
    }
    if(!$has){
        // Ignore errors (older schemas might not allow ALTER here)
        @$mysqli->query($c['sql']);
    }
}

// If knowledge_fragment_id exists but is not VARCHAR/TEXT, try to widen it to VARCHAR for CSV support.
try{
    $colType = '';
    if($resCol = $mysqli->query("SHOW COLUMNS FROM `$table` LIKE 'knowledge_fragment_id'")){
        $rowCol = $resCol->fetch_assoc();
        if($rowCol && isset($rowCol['Type'])){ $colType = strtolower((string)$rowCol['Type']); }
        $resCol->free();
    }
    if($colType && (strpos($colType,'varchar') === false) && (strpos($colType,'text') === false)){
        @$mysqli->query("ALTER TABLE `$table` MODIFY COLUMN `knowledge_fragment_id` VARCHAR(255) NULL DEFAULT NULL");
    }
}catch(_){ }

// カラム定義を柔軟に解決（互換のため候補名を許容）
$colId = null;      // knowledge_node_id / node_id / id / knowledge_explorer_id
$colParent = null;  // parent_id / parent / pid / parent_node_id
$colTitle = null;   // node_title / title / name / label
$colComment = null; // comment / comments / note / notes / memo
$colUpdated = null; // updated_at / update_at / updated / modified_at
$colUpdatedBy = null; // updated_by （ユーザID）
$colKFragId = null;   // knowledge_fragment_id（外部化IDと同一扱い）
$colExtContentsId = null; // externalized_contents_id（外部化のPK）
$colSort = null; // sort_order
$hasDeleted = false;
$idIsAutoInc = false;
if ($resCols = $mysqli->query("SHOW COLUMNS FROM $table")) {
    while($c = $resCols->fetch_assoc()){
        $f = isset($c['Field']) ? $c['Field'] : '';
        // カラム名はASCII前提のため mbstring 依存を避ける
        $lf = strtolower($f);
        if($colId===null && in_array($lf, ['knowledge_node_id','node_id','id','knowledge_explorer_id'])){ $colId = $f; }
        if($colParent===null && in_array($lf, ['parent_id','parent','pid','parent_node_id'])){ $colParent = $f; }
        if($colTitle===null && in_array($lf, ['node_title','title','name','label'])){ $colTitle = $f; }
        if($colComment===null && in_array($lf, ['comment','comments','note','notes','memo'])){ $colComment = $f; }
        if($colUpdated===null && in_array($lf, ['updated_at','update_at','updated','modified_at'])){ $colUpdated = $f; }
        if($colUpdatedBy===null && in_array($lf, ['updated_by'])){ $colUpdatedBy = $f; }
        if($colKFragId===null && in_array($lf, ['knowledge_fragment_id','knowledgefragment_id','kfrag_id'])){ $colKFragId = $f; }
        if($colExtContentsId===null && in_array($lf, ['externalized_contents_id','externalizedcontent_id','externalized_id'])){ $colExtContentsId = $f; }
        if($colSort===null && in_array($lf, ['sort_order'])){ $colSort = $f; }
        if($lf === 'deleted'){ $hasDeleted = true; }
        if($f === $colId && isset($c['Extra']) && stripos($c['Extra'], 'auto_increment') !== false){ $idIsAutoInc = true; }
    }
    $resCols->close();
}
// 少なくともタイトルが無いと表示不能
if($colTitle === null){
    // 最低限のフォールバック: DBスキーマが未整備でもトップレベルだけ返す
    $fallback = [
        ['node_id'=>1, 'parent_id'=>null, 'node_title'=>'知識関連', 'comment'=>null, 'updated_at'=>null],
        ['node_id'=>2, 'parent_id'=>null, 'node_title'=>'研究方略関連', 'comment'=>null, 'updated_at'=>null],
        ['node_id'=>3, 'parent_id'=>null, 'node_title'=>'その他', 'comment'=>null, 'updated_at'=>null]
    ];
    echo json_encode(['status'=>'ok','nodes'=>$fallback]);
    exit;
}

// トップレベル3種を保証（parent列とtitle列がある場合のみ）
if($colParent !== null && $colTitle !== null){
    $topTitles = ['知識関連','研究方略関連','その他'];
    $existing = [];
    // 柔軟化：SQLで存在しないカラムを直接指定するとエラーになるため、SELECT * で取得し、PHP側でカラムの有無を確認する
    $sqlTop = "SELECT * FROM $table WHERE ".($colParent ? "$colParent IS NULL" : "1=0").($hasDeleted?" AND deleted=0":"");
    if($resTop = $mysqli->query($sqlTop)){
        while($r = $resTop->fetch_assoc()){
            $titleVal = null;
            if($colTitle && isset($r[$colTitle])){ $titleVal = $r[$colTitle]; }
            elseif(isset($r['node_title'])){ $titleVal = $r['node_title']; }
            elseif(isset($r['title'])){ $titleVal = $r['title']; }
            if($titleVal !== null){
                $idVal = null;
                if($colId && isset($r[$colId])){ $idVal = (int)$r[$colId]; }
                elseif(isset($r['node_id'])){ $idVal = (int)$r['node_id']; }
                elseif(isset($r['id'])){ $idVal = (int)$r['id']; }
                $existing[$titleVal] = $idVal;
            }
        }
        $resTop->close();
    }
    // Important: do not re-create the 3 top categories based on title matching when user renames them.
    // Only bootstrap the defaults when there are not enough root nodes yet.
    $rootCount = count($existing);
    if($rootCount < 3){
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
                    // 既に同一ID/同一ユニークキーが存在しても API が落ちないようにする
                    $sqlIns = "INSERT IGNORE INTO $table ($colId,$colTitle".($colParent?",$colParent":"").($hasDeleted?",deleted":"").") VALUES (?,?".($colParent?",NULL":"").($hasDeleted?",0":"").")";
                    if($stmt = $mysqli->prepare($sqlIns)){
                        $stmt->bind_param('is',$nextId,$t);
                        $stmt->execute();
                        $stmt->close();
                    }
                } else {
                    $sqlIns = "INSERT IGNORE INTO $table ($colTitle".($colParent?",$colParent":"").($hasDeleted?",deleted":"").") VALUES (?".($colParent?",NULL":"").($hasDeleted?",0":"").")";
                    if($stmt = $mysqli->prepare($sqlIns)){
                        $stmt->bind_param('s',$t);
                        $stmt->execute();
                        $stmt->close();
                    }
                }
            }
        }
    }
}

// 全ノード取得（動的カラム名で取得）
$nodes = [];
// 全行取得: SELECT * を使い、PHP側でカラム存在を判定して nodes 配列を構築
if($colUpdatedBy){
    $sqlAll = "SELECT ke.*, u.name AS updated_by_name FROM $table ke LEFT JOIN users u ON ke.$colUpdatedBy = u.user_id".($hasDeleted?" WHERE ke.deleted=0":"");
} else {
    $sqlAll = "SELECT * FROM $table".($hasDeleted?" WHERE deleted=0":"");
}
if($resAll = $mysqli->query($sqlAll)){
    while($row = $resAll->fetch_assoc()){
        // id
        $nid = null;
        if($colId && isset($row[$colId])){ $nid = (int)$row[$colId]; }
        elseif(isset($row['node_id'])){ $nid = (int)$row['node_id']; }
        elseif(isset($row['id'])){ $nid = (int)$row['id']; }
        // parent
        $pid = null;
        if($colParent && array_key_exists($colParent, $row) && $row[$colParent]!==null){ $pid = (int)$row[$colParent]; }
        elseif(array_key_exists('parent_id',$row) && $row['parent_id']!==null){ $pid = (int)$row['parent_id']; }
        // title
        $title = null;
        if($colTitle && isset($row[$colTitle])){ $title = $row[$colTitle]; }
        elseif(isset($row['node_title'])){ $title = $row['node_title']; }
        elseif(isset($row['title'])){ $title = $row['title']; }
        // comment/updated
        $commentVal = null; $updatedVal = null;
        if($colComment && array_key_exists($colComment,$row)) { $commentVal = $row[$colComment]; }
        elseif(array_key_exists('comment',$row)) { $commentVal = $row['comment']; }
        if($colUpdated && array_key_exists($colUpdated,$row)) { $updatedVal = $row[$colUpdated]; }
        elseif(array_key_exists('updated_at',$row)) { $updatedVal = $row['updated_at']; }
        $updatedById = null; $updatedByName = null;
        if($colUpdatedBy && array_key_exists($colUpdatedBy,$row)) { $updatedById = $row[$colUpdatedBy]; }
        if(array_key_exists('updated_by_name',$row)) { $updatedByName = $row['updated_by_name']; }
        $sortVal = null;
        if($colSort && array_key_exists($colSort,$row) && $row[$colSort] !== null){ $sortVal = (int)$row[$colSort]; }
        // 参照ID（存在すれば付与）
        // knowledge_fragment_id は CSV 文字列を保持する（例: "11139,11140"）
        $kfragVal = null;
        if($colKFragId && array_key_exists($colKFragId,$row)){
            if($row[$colKFragId] !== null){
                $s = trim((string)$row[$colKFragId]);
                $kfragVal = ($s !== '') ? $s : null;
            }
        }
        $extIdVal = null;
        if($colExtContentsId && array_key_exists($colExtContentsId,$row) && $row[$colExtContentsId] !== null){
            $extIdVal = (int)$row[$colExtContentsId];
        }
        $nodes[] = [
            'node_id'=>$nid,
            'parent_id'=>$pid,
            'node_title'=>$title,
            'comment'=> $commentVal !== null ? $commentVal : null,
            'updated_at'=> $updatedVal !== null ? $updatedVal : null,
            'updated_by'=> $updatedById !== null ? (int)$updatedById : null,
            'updated_by_name'=> $updatedByName !== null ? $updatedByName : null,
            'sort_order'=> $sortVal !== null ? $sortVal : null,
            'knowledge_fragment_id'=> $kfragVal !== null ? $kfragVal : null,
            'externalized_contents_id'=> $extIdVal !== null ? $extIdVal : null
        ];
    }
    $resAll->close();
} else {
    // 取得失敗時もフォールバック（トップレベル3種）
    $nodes = [
        ['node_id'=>1, 'parent_id'=>null, 'node_title'=>'知識関連', 'comment'=>null, 'updated_at'=>null],
        ['node_id'=>2, 'parent_id'=>null, 'node_title'=>'研究方略関連', 'comment'=>null, 'updated_at'=>null],
        ['node_id'=>3, 'parent_id'=>null, 'node_title'=>'その他', 'comment'=>null, 'updated_at'=>null]
    ];
}
$mysqli->close();

echo json_encode(['status'=>'ok','nodes'=>$nodes]);
