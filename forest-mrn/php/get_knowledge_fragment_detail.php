<?php
// get_knowledge_fragment_detail.php
// Input: node_id (knowledge_explorer node) or experience_knowledge_id / fragment_ids
// Output: HTML snippet for one or more knowledge fragments.
header('Content-Type: text/html; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);
mysqli_report(MYSQLI_REPORT_OFF);

require_once __DIR__ . '/connect_db.php';
mysqli_report(MYSQLI_REPORT_OFF);

function h($s){ return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

function split_fragment_ids($value){
    if ($value === null || $value === '') { return []; }
    if (is_array($value)) { $parts = $value; }
    else { $parts = preg_split('/\s*,\s*/', (string)$value); }
    $ids = [];
    foreach ($parts as $part) {
        $id = intval(trim((string)$part), 10);
        if ($id > 0 && !in_array($id, $ids, true)) { $ids[] = $id; }
    }
    return $ids;
}

if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
    echo '<div class="error">DB接続失敗</div>';
    exit;
}
@$mysqli->set_charset('utf8mb4');

$nodeId = isset($_GET['node_id']) ? intval($_GET['node_id'], 10) : 0;
$ids = [];
if (isset($_GET['fragment_ids'])) { $ids = split_fragment_ids($_GET['fragment_ids']); }
if (!$ids && isset($_GET['experience_knowledge_id'])) { $ids = split_fragment_ids($_GET['experience_knowledge_id']); }
if (!$ids && isset($_GET['externalized_contents_id'])) { $ids = split_fragment_ids($_GET['externalized_contents_id']); }
if (!$ids && isset($_GET['fragment_id'])) { $ids = split_fragment_ids($_GET['fragment_id']); }

if (!$ids && $nodeId > 0) {
    $table = 'knowledge_explorer';
    $colNodeId = null;
    $colKfragId = null;
    $colExtId = null;
    if ($cols = $mysqli->query("SHOW COLUMNS FROM `$table`")) {
        while ($c = $cols->fetch_assoc()) {
            $f = isset($c['Field']) ? $c['Field'] : '';
            $lf = strtolower($f);
            if ($colNodeId === null && in_array($lf, ['node_id','id','knowledge_node_id','knowledge_explorer_id'])) { $colNodeId = $f; }
            if ($colKfragId === null && in_array($lf, ['knowledge_fragment_id','knowledgefragment_id','kfrag_id'])) { $colKfragId = $f; }
            if ($colExtId === null && in_array($lf, ['externalized_contents_id','externalizedcontent_id','externalized_id'])) { $colExtId = $f; }
        }
        $cols->free();
    }

    if ($colNodeId !== null) {
        $selects = [];
        if ($colKfragId !== null) { $selects[] = "`$colKfragId` AS kfrag_id"; }
        if ($colExtId !== null) { $selects[] = "`$colExtId` AS ext_id"; }
        if ($selects) {
            $sql = "SELECT ".implode(',', $selects)." FROM `$table` WHERE `$colNodeId` = ? LIMIT 1";
            if ($stmt = $mysqli->prepare($sql)) {
                $stmt->bind_param('i', $nodeId);
                if ($stmt->execute() && ($res = $stmt->get_result())) {
                    if ($row = $res->fetch_assoc()) {
                        if (isset($row['kfrag_id'])) { $ids = array_merge($ids, split_fragment_ids($row['kfrag_id'])); }
                        if (isset($row['ext_id'])) { $ids = array_merge($ids, split_fragment_ids($row['ext_id'])); }
                        $ids = array_values(array_unique($ids));
                    }
                    $res->free();
                }
                $stmt->close();
            }
        }
    }
}

if (!$ids) {
    echo '<div class="error">'.h('フラグメントIDが特定できませんでした（node_id='.$nodeId.'）。').'</div>';
    exit;
}

$table = 'experience_knowledges';
$hasTable = false;
if ($resT = $mysqli->query("SHOW TABLES LIKE '".$mysqli->real_escape_string($table)."'")) {
    $hasTable = ($resT->num_rows > 0);
    $resT->free();
}
if (!$hasTable) {
    echo '<div class="error">experience_knowledges テーブルが見つかりません。</div>';
    exit;
}

$placeholders = implode(',', array_fill(0, count($ids), '?'));
$sql = "SELECT ek.experience_knowledge_id,
               ek.knowledge_fragment_content AS content,
               ek.selected_contents,
               ek.stage1,
               ek.stage2,
               ek.stage3,
               COALESCE(u.name,'') AS user_name
          FROM experience_knowledges ek
          LEFT JOIN users u ON u.user_id = ek.user_id
         WHERE ek.experience_knowledge_id IN ($placeholders)
           AND ek.deleted = 0";
$types = str_repeat('i', count($ids));
$rows = [];
if ($stmt = $mysqli->prepare($sql)) {
    $bind = [$types];
    foreach ($ids as $i => $id) { $bind[] = &$ids[$i]; }
    call_user_func_array([$stmt, 'bind_param'], $bind);
    if ($stmt->execute() && ($res = $stmt->get_result())) {
        while ($row = $res->fetch_assoc()) {
            $rows[(int)$row['experience_knowledge_id']] = $row;
        }
        $res->free();
    }
    $stmt->close();
}

echo '<div class="knowledge-detail-summary">選択したフラグメント数: '.count($ids).'</div>';

foreach ($ids as $idx => $id) {
    if (!isset($rows[$id])) {
        echo '<div class="knowledge-detail-fragment error">フラグメントID '.h($id).' の情報が見つかりません。</div>';
        continue;
    }
    $row = $rows[$id];
    $content = isset($row['content']) ? (string)$row['content'] : '';
    $userName = isset($row['user_name']) && trim((string)$row['user_name']) !== '' ? (string)$row['user_name'] : 'ユーザー';
    $selected = isset($row['selected_contents']) ? (string)$row['selected_contents'] : '';
    $s1 = isset($row['stage1']) ? (string)$row['stage1'] : '';
    $s2 = isset($row['stage2']) ? (string)$row['stage2'] : '';
    $s3 = isset($row['stage3']) ? (string)$row['stage3'] : '';
    ?>
    <div class="knowledge-detail-fragment knowledge_fragment" data-ext-id="<?php echo (int)$id; ?>">
      <div class="card-title">フラグメント<?php echo (int)($idx + 1); ?>: <?php echo nl2br(h($content)); ?></div>
      <div class="card-meta">共有したユーザー: <?php echo h($userName); ?></div>
      <?php if (trim($selected) !== '') { ?>
        <div class="selected-utterance">経験: <?php echo nl2br(h($selected)); ?></div>
      <?php } ?>
      <div class="card-detail" aria-hidden="false">
        <div class="qa-item"><div class="qa-q">【経験の振り返り】</div><div class="qa-a"><?php echo nl2br(h($s1)); ?></div></div>
        <div class="qa-item"><div class="qa-q">【活動文脈固有の振り返り】</div><div class="qa-a"><?php echo nl2br(h($s2)); ?></div></div>
        <div class="qa-item"><div class="qa-q">【研究固有の振り返り】</div><div class="qa-a"><?php echo nl2br(h($s3)); ?></div></div>
      </div>
    </div>
    <?php
}
