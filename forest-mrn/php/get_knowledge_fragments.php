<?php
// get_knowledge_fragments.php
// 概要: experience_knowledges の knowledge_fragment_content を取得し、
//      ピンクのカード(knowledge_fragment)として一覧HTMLを出力する。

// DB接続（index.php から既に読み込まれていても二重読込されないように）
require_once __DIR__ . '/connect_db.php';

// このシステムの接続は mysqli を採用（$pdo ではありません）
$__kfrag_list = [];
// 表示するユーザー名（デフォルト）
$__current_user_name = 'ユーザー';

// セッションからログイン中ユーザー名を取得（usersテーブル）
if (session_status() !== PHP_SESSION_ACTIVE) { @session_start(); }
if (isset($_SESSION['USERID']) && isset($mysqli) && $mysqli instanceof mysqli) {
  $uid = $_SESSION['USERID'];
  if ($stmtU = $mysqli->prepare("SELECT name FROM users WHERE user_id = ? LIMIT 1")) {
    $stmtU->bind_param('i', $uid);
    if ($stmtU->execute()) {
      if ($resU = $stmtU->get_result()) {
        if ($rowU = $resU->fetch_assoc()) {
          if (isset($rowU['name']) && trim((string)$rowU['name']) !== '') {
            $__current_user_name = (string)$rowU['name'];
          }
        }
        $resU->free();
      }
    }
    $stmtU->close();
  }
}

if (isset($mysqli) && $mysqli instanceof mysqli) {
  // forest-mrn: experience_knowledges から取得する
  $table = 'experience_knowledges';
  $hasTable = false;
  if ($resT = $mysqli->query("SHOW TABLES LIKE '".$mysqli->real_escape_string($table)."'")) {
    $hasTable = ($resT->num_rows > 0);
    $resT->free();
  }
  if ($hasTable) {
    // deleted=0 のみ表示
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
        if ($result = $stmt->get_result()) {
          while ($row = $result->fetch_assoc()) {
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
              // JS互換: data-ext-id を使っているので、ここに experience_knowledge_id を入れる
              'experience_knowledge_id' => isset($row['experience_knowledge_id']) ? (int)$row['experience_knowledge_id'] : null
            ];
          }
          $result->free();
        }
      }
      $stmt->close();
    }
  }
}

if (!empty($__kfrag_list)) {
  $totalInitial = count($__kfrag_list);
  foreach ($__kfrag_list as $idxInitial => &$itemInitial) {
    $itemInitial['display_num'] = $totalInitial - $idxInitial;
  }
  unset($itemInitial);
}

if (!empty($__kfrag_list) && isset($mysqli) && $mysqli instanceof mysqli) {
  $orderMap = [];
  if ($resP = $mysqli->query("SHOW TABLES LIKE 'knowledge_fragment_positions'")) {
    $hasPositions = ($resP->num_rows > 0);
    $resP->free();
    if ($hasPositions) {
      $idsForOrder = [];
      foreach ($__kfrag_list as $item) {
        $idForOrder = isset($item['experience_knowledge_id']) ? intval($item['experience_knowledge_id'], 10) : 0;
        if ($idForOrder > 0) { $idsForOrder[] = $idForOrder; }
      }
      $idsForOrder = array_values(array_unique($idsForOrder));
      if ($idsForOrder) {
        $in = implode(',', array_map('intval', $idsForOrder));
        if ($resO = $mysqli->query("SELECT externalized_contents_id, pos_y FROM knowledge_fragment_positions WHERE externalized_contents_id IN ($in)")) {
          while ($rowO = $resO->fetch_assoc()) {
            $orderMap[intval($rowO['externalized_contents_id'], 10)] = floatval($rowO['pos_y']);
          }
          $resO->free();
        }
      }
    }
  }
  if (!empty($orderMap)) {
    $indexMap = [];
    foreach ($__kfrag_list as $idx => $item) {
      $idForIndex = isset($item['experience_knowledge_id']) ? intval($item['experience_knowledge_id'], 10) : 0;
      if ($idForIndex > 0) { $indexMap[$idForIndex] = $idx; }
    }
    usort($__kfrag_list, function($a, $b) use ($orderMap, $indexMap) {
      $aid = isset($a['experience_knowledge_id']) ? intval($a['experience_knowledge_id'], 10) : 0;
      $bid = isset($b['experience_knowledge_id']) ? intval($b['experience_knowledge_id'], 10) : 0;
      $ap = array_key_exists($aid, $orderMap) ? $orderMap[$aid] : PHP_INT_MAX;
      $bp = array_key_exists($bid, $orderMap) ? $orderMap[$bid] : PHP_INT_MAX;
      if ($ap == $bp) {
        $ai = array_key_exists($aid, $indexMap) ? $indexMap[$aid] : PHP_INT_MAX;
        $bi = array_key_exists($bid, $indexMap) ? $indexMap[$bid] : PHP_INT_MAX;
        if ($ai == $bi) { return 0; }
        return ($ai < $bi) ? -1 : 1;
      }
      return ($ap < $bp) ? -1 : 1;
    });
  }
}
?>
<div class="knowledge-fragment-list">
  <?php if (!empty($__kfrag_list)) {
        // PHP側で総数を取得しておき、JSの表示と一致する "番号" (古い->1) を埋め込みます。
        $totalK = count($__kfrag_list);
        for ($i = 0; $i < $totalK; $i++) {
            $__kfrag_raw = $__kfrag_list[$i];
            $__tmp = is_array($__kfrag_raw) && isset($__kfrag_raw['content']) ? trim((string)$__kfrag_raw['content']) : (is_string($__kfrag_raw) ? trim($__kfrag_raw) : '');
            if ($__tmp === '') { continue; }
            $__s1 = is_array($__kfrag_raw) && isset($__kfrag_raw['stage1']) ? (string)$__kfrag_raw['stage1'] : '';
            $__s2 = is_array($__kfrag_raw) && isset($__kfrag_raw['stage2']) ? (string)$__kfrag_raw['stage2'] : '';
            $__s3 = is_array($__kfrag_raw) && isset($__kfrag_raw['stage3']) ? (string)$__kfrag_raw['stage3'] : '';
            $__uname = is_array($__kfrag_raw) && isset($__kfrag_raw['user_name']) ? (string)$__kfrag_raw['user_name'] : $__current_user_name;
            // PHPでは配列は新しい順(new->old)で格納されています。表示順はこのままに、番号は古い->1 に合わせる。
            $num = isset($__kfrag_raw['display_num']) ? intval($__kfrag_raw['display_num'], 10) : ($totalK - $i);
  ?>
    <div class="fragment-node-wrapper"<?php
      $extId = isset($__kfrag_raw['experience_knowledge_id']) ? intval($__kfrag_raw['experience_knowledge_id'],10) : 0;
      if($extId>0){ echo ' data-ext-id="'.$extId.'"'; }
    ?>>
      <div class="fragment-number-badge" aria-hidden="true"><?php echo intval($num,10); ?></div>
      <div class="knowledge_fragment" data-kfrag-num="<?php echo intval($num,10); ?>"<?php 
      $disc = isset($__kfrag_raw['discussed']) ? trim($__kfrag_raw['discussed']) : ''; 
      if($disc!==''){ echo ' data-discussed="'.htmlspecialchars($disc,ENT_QUOTES,'UTF-8').'"'; }
      if($extId>0){ echo ' data-ext-id="'.$extId.'"'; }
    ?>>
        <div class="card-title"><?php echo htmlspecialchars($__uname, ENT_QUOTES, 'UTF-8'); ?> さん</div>
        <div class="card-body"><?php echo nl2br(htmlspecialchars($__tmp, ENT_QUOTES, 'UTF-8')); ?></div>
        <div class="card-detail" aria-hidden="true">
          <?php 
            $__sel = is_array($__kfrag_raw) && isset($__kfrag_raw['selected_contents']) ? trim((string)$__kfrag_raw['selected_contents']) : '';
            if ($__sel !== '') { ?>
              <div class="selected-utterance">経験: <?php echo nl2br(htmlspecialchars($__sel, ENT_QUOTES, 'UTF-8')); ?></div>
          <?php } ?>
          <div class="qa-item"><div class="qa-q">【経験の振り返り】</div><div class="qa-a"><?php echo nl2br(htmlspecialchars($__s1, ENT_QUOTES, 'UTF-8')); ?></div></div>
          <div class="qa-item"><div class="qa-q">【活動文脈固有の振り返り】</div><div class="qa-a"><?php echo nl2br(htmlspecialchars($__s2, ENT_QUOTES, 'UTF-8')); ?></div></div>
          <div class="qa-item"><div class="qa-q">【研究固有の振り返り】</div><div class="qa-a"><?php echo nl2br(htmlspecialchars($__s3, ENT_QUOTES, 'UTF-8')); ?></div></div>
        </div>
        <div class="card-actions">
          <button type="button" class="detail-button">詳細▼</button>
        </div>
      </div>
    </div>
  <?php } } else { ?>
    <div class="no-fragment-note">表示できるフラグメントがありません。</div>
  <?php } ?>
</div>
<!-- クリックハンドラは meeting-reflection-network.js 側に集約 -->
