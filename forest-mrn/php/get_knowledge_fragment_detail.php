<?php
// get_knowledge_fragment_detail.php
// Input: node_id (knowledge_explorer.node_id) or experience_knowledge_id
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
$kId = 0;
// legacy param name compatibility: externalized_contents_id is treated as experience_knowledge_id in forest-mrn
if (isset($_GET['experience_knowledge_id'])) { $kId = intval($_GET['experience_knowledge_id'], 10); }
if ($kId <= 0 && isset($_GET['externalized_contents_id'])) { $kId = intval($_GET['externalized_contents_id'], 10); }
if ($kId <= 0 && isset($_GET['fragment_id'])) { $kId = intval($_GET['fragment_id'], 10); }

$kfragId = null; // experience_knowledge_id と同一

if($kId > 0){
    $kfragId = $kId;
} elseif($nodeId > 0){
    // knowledge_explorer の列名差異に対応しつつ、node_id からフラグメントIDを逆引き
    // forest-mrn では knowledge_fragment_id / externalized_contents_id を experience_knowledge_id として扱う
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

// experience_knowledges から詳細を取得（get_knowledge_fragments.php と同じカラム前提）
$userName = 'ユーザー';
$content = ''; $s1=''; $s2=''; $s3=''; $selected=''; $discussed='';
$table = 'experience_knowledges';
$hasTable = false;
if($resT = $mysqli->query("SHOW TABLES LIKE '".$mysqli->real_escape_string($table)."'")) { $hasTable = ($resT->num_rows>0); $resT->free(); }
if($hasTable){
    $sql = "SELECT ek.knowledge_fragment_content AS content,
                   ek.selected_contents,
                   ek.discussed,
                   ek.stage1, ek.stage2, ek.stage3,
                   COALESCE(u.name,'') AS user_name
              FROM experience_knowledges ek
              LEFT JOIN users u ON u.user_id = ek.user_id
             WHERE ek.experience_knowledge_id = ?
               AND ek.deleted = 0
             LIMIT 1";
    if($stmt = $mysqli->prepare($sql)){
        $stmt->bind_param('i', $kfragId);
        if($stmt->execute()){
            if($res = $stmt->get_result()){
                if($row = $res->fetch_assoc()){
                    $content = isset($row['content']) ? (string)$row['content'] : '';
                    $selected = isset($row['selected_contents']) ? (string)$row['selected_contents'] : '';
                    $discussed = isset($row['discussed']) ? (string)$row['discussed'] : '';
                    $s1 = isset($row['stage1']) ? (string)$row['stage1'] : '';
                    $s2 = isset($row['stage2']) ? (string)$row['stage2'] : '';
                    $s3 = isset($row['stage3']) ? (string)$row['stage3'] : '';
                    if (isset($row['user_name']) && trim((string)$row['user_name']) !== '') {
                        $userName = (string)$row['user_name'];
                    }
                }
                $res->free();
            }
        } else {
            echo '<div class="error">experience_knowledges から詳細取得に失敗しました: ' . h($stmt->error) . '</div>';
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
      <div class="selected-utterance">時間: <?php echo nl2br(h($selected)); ?></div>
    <?php } ?>
    <div class="qa-item"><div class="qa-q">【経験の振り返り】</div><div class="qa-a"><?php echo nl2br(h($s1)); ?></div></div>
    <div class="qa-item"><div class="qa-q">【活動文脈固有の振り返り】</div><div class="qa-a"><?php echo nl2br(h($s2)); ?></div></div>
    <div class="qa-item"><div class="qa-q">【研究固有の振り返り】</div><div class="qa-a"><?php echo nl2br(h($s3)); ?></div></div>
  </div>
</div>
