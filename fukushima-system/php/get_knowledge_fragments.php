<?php
// get_knowledge_fragments.php
// 概要: externalized_contents の knowledge_fragment(s)_content を取得し、
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
  // カラム存在チェック: knowledge_fragments_content（複数形）優先、なければ knowledge_fragment_content（単数形）
  $kfragCol = null;
  if ($res = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'knowledge_fragments_content'")) {
    if ($res->num_rows > 0) { $kfragCol = 'knowledge_fragments_content'; }
    $res->free();
  }
  if ($kfragCol === null) {
    if ($res = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'knowledge_fragment_content'")) {
      if ($res->num_rows > 0) { $kfragCol = 'knowledge_fragment_content'; }
      $res->free();
    }
  }
  // 並び順: 新しい -> 古い（左から右へ）外部化IDがある場合はそれで降順
  $hasExtIdCol = false;
  if ($res = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'externalized_contents_id'")) {
    $hasExtIdCol = ($res->num_rows > 0);
    $res->free();
  }

  if ($kfragCol !== null) {
    // 値が NULL/空白のみを除外して取得（stage1/2/3 も合わせて取得）
    $orderBy = $hasExtIdCol ? " ORDER BY externalized_contents_id DESC" : "";
    $sql = "SELECT `{$kfragCol}` AS content, stage1, stage2, stage3
              FROM externalized_contents
             WHERE `{$kfragCol}` IS NOT NULL
               AND LENGTH(TRIM(`{$kfragCol}`)) > 0" . $orderBy;
    if ($stmt = $mysqli->prepare($sql)) {
      if ($stmt->execute()) {
        if ($result = $stmt->get_result()) {
          while ($row = $result->fetch_assoc()) {
            $__val = isset($row['content']) ? (string)$row['content'] : '';
            if (trim($__val) === '') { continue; }
            $__kfrag_list[] = [
              'content' => $__val,
              'stage1' => isset($row['stage1']) ? (string)$row['stage1'] : '',
              'stage2' => isset($row['stage2']) ? (string)$row['stage2'] : '',
              'stage3' => isset($row['stage3']) ? (string)$row['stage3'] : ''
            ];
          }
          $result->free();
        }
      }
      $stmt->close();
    }
  }
}
?>
<div class="knowledge-fragment-list">
  <?php if (!empty($__kfrag_list)) { foreach ($__kfrag_list as $__kfrag_raw) { 
        $__tmp = is_array($__kfrag_raw) && isset($__kfrag_raw['content']) ? trim((string)$__kfrag_raw['content']) : (is_string($__kfrag_raw) ? trim($__kfrag_raw) : '');
        if ($__tmp === '') { continue; }
        $__s1 = is_array($__kfrag_raw) && isset($__kfrag_raw['stage1']) ? (string)$__kfrag_raw['stage1'] : '';
        $__s2 = is_array($__kfrag_raw) && isset($__kfrag_raw['stage2']) ? (string)$__kfrag_raw['stage2'] : '';
        $__s3 = is_array($__kfrag_raw) && isset($__kfrag_raw['stage3']) ? (string)$__kfrag_raw['stage3'] : '';
  ?>
    <div class="knowledge_fragment">
      <div class="card-title"><?php echo htmlspecialchars($__current_user_name, ENT_QUOTES, 'UTF-8'); ?> さん</div>
      <div class="card-body"><?php echo nl2br(htmlspecialchars($__tmp, ENT_QUOTES, 'UTF-8')); ?></div>
      <div class="card-detail" aria-hidden="true">
        <div class="qa-item"><div class="qa-q">質問: なぜこの発言が印象に残りましたか？</div><div class="qa-a">回答: <?php echo nl2br(htmlspecialchars($__s1, ENT_QUOTES, 'UTF-8')); ?></div></div>
        <div class="qa-item"><div class="qa-q">質問: その発言には、どんな前提や背景がありますか？</div><div class="qa-a">回答: <?php echo nl2br(htmlspecialchars($__s2, ENT_QUOTES, 'UTF-8')); ?></div></div>
        <div class="qa-item"><div class="qa-q">質問: この発言には、他の場面でも使える考え方の指針はありますか？</div><div class="qa-a">回答: <?php echo nl2br(htmlspecialchars($__s3, ENT_QUOTES, 'UTF-8')); ?></div></div>
      </div>
      <div class="card-actions">
        <button type="button" class="detail-button">詳細▼</button>
      </div>
    </div>
  <?php } } else { ?>
    <div class="no-fragment-note">表示できるフラグメントがありません。</div>
  <?php } ?>
</div>
<!-- クリックハンドラは meeting-reflection-network.js 側に集約 -->
