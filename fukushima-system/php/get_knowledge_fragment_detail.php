<?php
// get_knowledge_fragment_detail.php
// Input: node_id (knowledge_explorer.node_id) or externalized_contents_id
// Output: HTML snippet containing the same structure as knowledge_fragment "詳細"表示
header('Content-Type: text/html; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/connect_db.php';

function h($s){ return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
    // 500を返すとjQueryがfailになるため、HTMLで説明を返す
    echo '<div class="error">DB接続失敗</div>';
    exit;
}
@$mysqli->set_charset('utf8mb4');

$nodeId = isset($_GET['node_id']) ? intval($_GET['node_id'],10) : 0;
$extId = isset($_GET['externalized_contents_id']) ? intval($_GET['externalized_contents_id'],10) : 0;

$kfragId = null; // externalized_contents_id と同一

if($extId > 0){
    $kfragId = $extId;
} elseif($nodeId > 0){
    // knowledge_explorer の列名差異に対応しつつ、node_id からフラグメントIDを逆引き
    $table = 'knowledge_explorer';
    $colNodeId = null; $colKfragId = null; $colExtId = null;
    $hasTable = false;
    if($resT = $mysqli->query("SHOW TABLES LIKE '$table'")) { $hasTable = ($resT->num_rows>0); $resT->free(); }
    if($hasTable){
        if($cols = $mysqli->query("SHOW COLUMNS FROM `$table`")){
            while($c = $cols->fetch_assoc()){
                $f = isset($c['Field']) ? $c['Field'] : '';
                $lf = mb_strtolower($f,'UTF-8');
                if($colNodeId===null && in_array($lf,['node_id','id','knowledge_node_id','knowledge_explorer_id'])){ $colNodeId = $f; }
                if($colKfragId===null && in_array($lf,['knowledge_fragment_id','knowledgefragment_id','kfrag_id'])){ $colKfragId = $f; }
                if($colExtId===null && in_array($lf,['externalized_contents_id','externalizedcontent_id','externalized_id'])){ $colExtId = $f; }
            }
            $cols->free();
        }
        if($colNodeId !== null){
            if($colExtId !== null && (!$kfragId || $kfragId<=0)){
                $sql = "SELECT `$colExtId` AS ext_id FROM `$table` WHERE `$colNodeId` = ? LIMIT 1";
                if($stmt = $mysqli->prepare($sql)){
                    $stmt->bind_param('i',$nodeId);
                    if($stmt->execute() && ($res = $stmt->get_result())){
                        if($row = $res->fetch_assoc()){
                            $kfragId = isset($row['ext_id']) ? intval($row['ext_id'],10) : 0;
                        }
                        $res->free();
                    }
                    $stmt->close();
                }
            }
            if($colKfragId !== null && (!$kfragId || $kfragId<=0)){
                $sql = "SELECT `$colKfragId` AS kfrag_id FROM `$table` WHERE `$colNodeId` = ? LIMIT 1";
                if($stmt = $mysqli->prepare($sql)){
                    $stmt->bind_param('i',$nodeId);
                    if($stmt->execute() && ($res = $stmt->get_result())){
                        if($row = $res->fetch_assoc()){
                            $kfragId = isset($row['kfrag_id']) ? intval($row['kfrag_id'],10) : 0;
                        }
                        $res->free();
                    }
                    $stmt->close();
                }
            }
        }
    }
}

if(!$kfragId || $kfragId <= 0){
    echo '<div class="error">'.h('フラグメントIDが特定できませんでした（node_id='.intval($nodeId,10).'）。 knowledge_explorer の対応関係が見つかりません。').'</div>';
    exit;
}

// externalized_contents から詳細を取得（get_knowledge_fragments.php と同じカラム前提）
$hasUserIdCol = false; $hasSelectedCol = false; $hasDiscussedCol = false; $kfragCol = null;
if ($res = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'user_id'")) { $hasUserIdCol = ($res->num_rows > 0); $res->free(); }
if ($res = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'selected_contents'")) { $hasSelectedCol = ($res->num_rows > 0); $res->free(); }
if ($res = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'discussed'")) { $hasDiscussedCol = ($res->num_rows > 0); $res->free(); }
if ($res = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'knowledge_fragments_content'")) { if ($res->num_rows > 0) { $kfragCol = 'knowledge_fragments_content'; } $res->free(); }
if ($kfragCol === null) { if ($res = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'knowledge_fragment_content'")) { if ($res->num_rows > 0) { $kfragCol = 'knowledge_fragment_content'; } $res->free(); } }

$userName = 'ユーザー';
if ($hasUserIdCol && isset($_SESSION['USERID'])) {
    $uid = intval($_SESSION['USERID'],10);
    if ($stmtU = $mysqli->prepare("SELECT name FROM users WHERE user_id = ? LIMIT 1")) {
        $stmtU->bind_param('i', $uid);
        if ($stmtU->execute()) {
            if ($resU = $stmtU->get_result()) {
                if ($rowU = $resU->fetch_assoc()) {
                    if (isset($rowU['name']) && trim((string)$rowU['name']) !== '') { $userName = (string)$rowU['name']; }
                }
                $resU->free();
            }
        }
        $stmtU->close();
    }
}

$content = ''; $s1=''; $s2=''; $s3=''; $selected=''; $discussed='';
if($kfragCol !== null){
    $selectFields = "ec.`{$kfragCol}` AS content";
    if($hasSelectedCol){ $selectFields .= ", ec.selected_contents"; }
    if($hasDiscussedCol){ $selectFields .= ", ec.discussed"; }
    $selectFields .= ", ec.stage1, ec.stage2, ec.stage3";
    // 取得
    if($stmt = $mysqli->prepare("SELECT {$selectFields} FROM externalized_contents ec WHERE ec.externalized_contents_id = ? LIMIT 1")){
        $stmt->bind_param('i', $kfragId);
        if($stmt->execute()){
            if($res = $stmt->get_result()){
                if($row = $res->fetch_assoc()){
                    $content = isset($row['content']) ? (string)$row['content'] : '';
                    $selected = $hasSelectedCol && isset($row['selected_contents']) ? (string)$row['selected_contents'] : '';
                    $discussed = $hasDiscussedCol && isset($row['discussed']) ? (string)$row['discussed'] : '';
                    $s1 = isset($row['stage1']) ? (string)$row['stage1'] : '';
                    $s2 = isset($row['stage2']) ? (string)$row['stage2'] : '';
                    $s3 = isset($row['stage3']) ? (string)$row['stage3'] : '';
                }
                $res->free();
            }
        } else {
            echo '<div class="error">外部化テーブルから詳細取得に失敗しました: ' . h($stmt->error) . '</div>';
        }
        $stmt->close();
    } else {
        echo '<div class="error">prepare失敗: ' . h($mysqli->error) . '</div>';
    }
}

if(trim($content) === ''){
    echo '<div class="error">詳細コンテンツが見つかりません</div>';
    exit;
}

// get_knowledge_fragments.php のカード詳細UI構造を再現
?>
<div class="knowledge_fragment" data-ext-id="<?php echo (int)$kfragId; ?>">
  <div class="card-title"><?php echo h($userName); ?> さん</div>
  <div class="card-body"><?php echo nl2br(h($content)); ?></div>
  <div class="card-detail" aria-hidden="true">
    <?php if(trim($selected)!==''){ ?>
      <div class="selected-utterance">発言内容: <?php echo nl2br(h($selected)); ?></div>
    <?php } ?>
    <div class="qa-item"><div class="qa-q">質問: なぜこの発言が印象に残りましたか？</div><div class="qa-a">回答: <?php echo nl2br(h($s1)); ?></div></div>
    <div class="qa-item"><div class="qa-q">質問: その発言には、どんな前提や背景がありますか？</div><div class="qa-a">回答: <?php echo nl2br(h($s2)); ?></div></div>
    <div class="qa-item"><div class="qa-q">質問: この発言には、他の場面でも使える考え方の指針はありますか？</div><div class="qa-a">回答: <?php echo nl2br(h($s3)); ?></div></div>
  </div>
</div>
