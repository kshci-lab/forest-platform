<?php
// get_knowledge_fragments_by_group.php (forest-mrn)
// Return knowledge fragments list HTML filtered by the selected knowledge group.
//
// - If group_id is provided (GET), filter fragments shared in that group.
// - If not provided, try to use the latest group for the logged-in user.
// - If no group can be determined, fall back to showing all fragments (legacy).

header('Content-Type: text/html; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/connect_db.php';
if(!isset($mysqli) || !($mysqli instanceof mysqli)){
  http_response_code(500);
  echo '<div class="knowledge-fragment-list"><div class="no-fragment-note">DB接続失敗</div></div>';
  exit;
}
@$mysqli->set_charset('utf8mb4');

if (session_status() !== PHP_SESSION_ACTIVE) { @session_start(); }
$user_id = isset($_SESSION['USERID']) ? (string)$_SESSION['USERID'] : '';

/**
 * Fetch all rows from a prepared statement as associative arrays without mysqlnd.
 * Returns [] on failure.
 */
function __stmt_fetch_all_assoc(mysqli_stmt $stmt): array {
  $meta = $stmt->result_metadata();
  if (!$meta) { return []; }

  $fields = $meta->fetch_fields();
  $meta->free();
  if (!$fields) { return []; }

  $row = [];
  $bind = [];
  foreach ($fields as $field) {
    $row[$field->name] = null;
    $bind[] = &$row[$field->name];
  }
  if (!call_user_func_array([$stmt, 'bind_result'], $bind)) { return []; }

  $rows = [];
  while ($stmt->fetch()) {
    $copy = [];
    foreach ($row as $k => $v) { $copy[$k] = $v; }
    $rows[] = $copy;
  }
  return $rows;
}

$group_id = isset($_GET['group_id']) ? trim((string)$_GET['group_id']) : '';
if ($group_id === '' && $user_id !== '') {
  // pick latest group for the user
  if ($st = $mysqli->prepare("SELECT group_id FROM kgroup_user_link WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")) {
    $st->bind_param('s', $user_id);
    if ($st->execute()) {
      $rows = __stmt_fetch_all_assoc($st);
      if (!empty($rows)) {
        $row0 = $rows[0];
        if (isset($row0['group_id']) && trim((string)$row0['group_id']) !== '') {
          $group_id = trim((string)$row0['group_id']);
        }
      }
    }
    $st->close();
  }
}

// Current user name (fallback)
$__current_user_name = 'ユーザー';
if ($user_id !== '') {
  if ($stmtU = $mysqli->prepare("SELECT name FROM users WHERE user_id = ? LIMIT 1")) {
    $stmtU->bind_param('s', $user_id);
    if ($stmtU->execute()) {
      $rowsU = __stmt_fetch_all_assoc($stmtU);
      if (!empty($rowsU)) {
        $rowU0 = $rowsU[0];
        if (isset($rowU0['name']) && trim((string)$rowU0['name']) !== '') {
          $__current_user_name = (string)$rowU0['name'];
        }
      }
    }
    $stmtU->close();
  }
}

$__kfrag_list = [];

// Base table
$table = 'experience_knowledges';
$hasTable = false;
if ($resT = $mysqli->query("SHOW TABLES LIKE '".$mysqli->real_escape_string($table)."'")) {
  $hasTable = ($resT->num_rows > 0);
  $resT->free();
}

if ($hasTable) {
  if ($group_id !== '') {
    // Only fragments shared in the selected group.
    // shared_nodes: experience_knowledge_id + knowledge_group_id + deleted
    $sql = "SELECT DISTINCT ek.experience_knowledge_id,
                   ek.knowledge_fragment_content AS content,
                   ek.stage1, ek.stage2, ek.stage3,
                   ek.selected_contents,
                   ek.updated_at AS updated_at,
                   ek.user_id,
                   COALESCE(u.name,'') AS user_name,
                   ek.discussed
              FROM shared_nodes sn
              INNER JOIN experience_knowledges ek ON sn.experience_knowledge_id = ek.experience_knowledge_id
              LEFT JOIN users u ON u.user_id = ek.user_id
             WHERE sn.deleted = 0
               AND sn.knowledge_group_id = ?
               AND ek.deleted = 0
               AND ek.knowledge_fragment_content IS NOT NULL
               AND LENGTH(TRIM(ek.knowledge_fragment_content)) > 0
             ORDER BY updated_at DESC, ek.experience_knowledge_id DESC";
    if ($stmt = $mysqli->prepare($sql)) {
      $stmt->bind_param('s', $group_id);
      if ($stmt->execute()) {
        $rows = __stmt_fetch_all_assoc($stmt);
        foreach ($rows as $row) {
          $__val = isset($row['content']) ? (string)$row['content'] : '';
          if (trim($__val) === '') { continue; }
          $__user_name = $__current_user_name;
          if (isset($row['user_name']) && trim((string)$row['user_name']) !== '') {
            $__user_name = (string)$row['user_name'];
          }
          $__kfrag_list[] = [
            'content' => $__val,
            'stage1' => isset($row['stage1']) ? (string)$row['stage1'] : '',
            'stage2' => isset($row['stage2']) ? (string)$row['stage2'] : '',
            'stage3' => isset($row['stage3']) ? (string)$row['stage3'] : '',
            'selected_contents' => isset($row['selected_contents']) ? (string)$row['selected_contents'] : '',
            'user_name' => $__user_name,
            'discussed' => isset($row['discussed']) ? (string)$row['discussed'] : '',
            'experience_knowledge_id' => isset($row['experience_knowledge_id']) ? (int)$row['experience_knowledge_id'] : null
          ];
        }
      }
      $stmt->close();
    }
  } else {
    // Legacy: show all fragments.
    $sql = "SELECT ek.experience_knowledge_id,
                   ek.knowledge_fragment_content AS content,
                   ek.stage1, ek.stage2, ek.stage3,
                   ek.selected_contents,
                   ek.user_id,
                   COALESCE(u.name,'') AS user_name,
                   ek.discussed
              FROM experience_knowledges ek
              LEFT JOIN users u ON u.user_id = ek.user_id
             WHERE ek.deleted = 0
               AND ek.knowledge_fragment_content IS NOT NULL
               AND LENGTH(TRIM(ek.knowledge_fragment_content)) > 0
             ORDER BY ek.updated_at DESC, ek.experience_knowledge_id DESC";
    if ($stmt = $mysqli->prepare($sql)) {
      if ($stmt->execute()) {
        $rows = __stmt_fetch_all_assoc($stmt);
        foreach ($rows as $row) {
          $__val = isset($row['content']) ? (string)$row['content'] : '';
          if (trim($__val) === '') { continue; }
          $__user_name = $__current_user_name;
          if (isset($row['user_name']) && trim((string)$row['user_name']) !== '') {
            $__user_name = (string)$row['user_name'];
          }
          $__kfrag_list[] = [
            'content' => $__val,
            'stage1' => isset($row['stage1']) ? (string)$row['stage1'] : '',
            'stage2' => isset($row['stage2']) ? (string)$row['stage2'] : '',
            'stage3' => isset($row['stage3']) ? (string)$row['stage3'] : '',
            'selected_contents' => isset($row['selected_contents']) ? (string)$row['selected_contents'] : '',
            'user_name' => $__user_name,
            'discussed' => isset($row['discussed']) ? (string)$row['discussed'] : '',
            'experience_knowledge_id' => isset($row['experience_knowledge_id']) ? (int)$row['experience_knowledge_id'] : null
          ];
        }
      }
      $stmt->close();
    }
  }
}

$mysqli->close();
?>
<div class="knowledge-fragment-list">
  <?php if (!empty($__kfrag_list)) {
        $totalK = count($__kfrag_list);
        for ($i = 0; $i < $totalK; $i++) {
            $__kfrag_raw = $__kfrag_list[$i];
            $__tmp = is_array($__kfrag_raw) && isset($__kfrag_raw['content']) ? trim((string)$__kfrag_raw['content']) : '';
            if ($__tmp === '') { continue; }
            $__s1 = isset($__kfrag_raw['stage1']) ? (string)$__kfrag_raw['stage1'] : '';
            $__s2 = isset($__kfrag_raw['stage2']) ? (string)$__kfrag_raw['stage2'] : '';
            $__s3 = isset($__kfrag_raw['stage3']) ? (string)$__kfrag_raw['stage3'] : '';
            $__uname = isset($__kfrag_raw['user_name']) ? (string)$__kfrag_raw['user_name'] : $__current_user_name;
            $num = $totalK - $i;
  ?>
    <div class="knowledge_fragment" data-kfrag-num="<?php echo intval($num,10); ?>"<?php 
      $disc = isset($__kfrag_raw['discussed']) ? trim($__kfrag_raw['discussed']) : ''; 
      if($disc!==''){ echo ' data-discussed="'.htmlspecialchars($disc,ENT_QUOTES,'UTF-8').'"'; }
      $extId = isset($__kfrag_raw['experience_knowledge_id']) ? intval($__kfrag_raw['experience_knowledge_id'],10) : 0;
      if($extId>0){ echo ' data-ext-id="'.$extId.'"'; }
    ?>>
      <div class="card-title"><?php echo htmlspecialchars($__uname, ENT_QUOTES, 'UTF-8'); ?> さん</div>
      <div class="card-body"><?php echo nl2br(htmlspecialchars($__tmp, ENT_QUOTES, 'UTF-8')); ?></div>
      <div class="card-detail" aria-hidden="true">
        <?php 
          $__sel = isset($__kfrag_raw['selected_contents']) ? trim((string)$__kfrag_raw['selected_contents']) : '';
          if ($__sel !== '') { ?>
            <div class="selected-utterance">時間: <?php echo nl2br(htmlspecialchars($__sel, ENT_QUOTES, 'UTF-8')); ?></div>
        <?php } ?>
        <div class="qa-item"><div class="qa-q">【経験の振り返り】</div><div class="qa-a"><?php echo nl2br(htmlspecialchars($__s1, ENT_QUOTES, 'UTF-8')); ?></div></div>
        <div class="qa-item"><div class="qa-q">【活動文脈固有の振り返り】</div><div class="qa-a"><?php echo nl2br(htmlspecialchars($__s2, ENT_QUOTES, 'UTF-8')); ?></div></div>
        <div class="qa-item"><div class="qa-q">【研究固有の振り返り】</div><div class="qa-a"><?php echo nl2br(htmlspecialchars($__s3, ENT_QUOTES, 'UTF-8')); ?></div></div>
      </div>
      <div class="card-actions">
        <button type="button" class="detail-button">詳細▼</button>
      </div>
    </div>
  <?php } } else { ?>
    <div class="no-fragment-note">表示できるフラグメントがありません。</div>
  <?php } ?>
</div>
