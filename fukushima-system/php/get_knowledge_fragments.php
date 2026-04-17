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
  // カラム存在チェック: selected_contents（詳細先頭に表示）
  $hasSelectedCol = false;
  if ($res = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'selected_contents'")) {
    $hasSelectedCol = ($res->num_rows > 0);
    $res->free();
  }
  // カラム存在チェック: user_id（登録者のユーザー名を取得するため）
  $hasUserIdCol = false;
  if ($res = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'user_id'")) {
    $hasUserIdCol = ($res->num_rows > 0);
    $res->free();
  }
  // カラム存在チェック: discussed（議論状態 YET/UNDERWAY/DONE）
  $hasDiscussedCol = false;
  if ($res = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'discussed'")) {
    $hasDiscussedCol = ($res->num_rows > 0);
    $res->free();
  }
  // PKカラム externalized_contents_id（後で data-ext-id に埋め込む）
  $hasExtContentsIdCol = false;
  if ($res = $mysqli->query("SHOW COLUMNS FROM externalized_contents LIKE 'externalized_contents_id'")) {
    $hasExtContentsIdCol = ($res->num_rows > 0);
    $res->free();
  }

  if ($kfragCol !== null) {
    // 値が NULL/空白のみを除外して取得（stage1/2/3 も合わせて取得）
    $orderBy = $hasExtIdCol ? " ORDER BY externalized_contents_id DESC" : "";
    // SELECT 句を動的に構築（selected_contents / user_name を含める）
    $selectFields = "ec.`{$kfragCol}` AS content, ec.stage1, ec.stage2, ec.stage3";
    if ($hasSelectedCol) { $selectFields .= ", ec.selected_contents"; }
    if ($hasUserIdCol) { $selectFields .= ", ec.user_id, u.name AS user_name"; }
    if ($hasDiscussedCol) { $selectFields .= ", ec.discussed"; }
    if ($hasExtContentsIdCol) { $selectFields .= ", ec.externalized_contents_id"; }

    // FROM 句と JOIN（user_idがある場合のみJOIN）
    $fromJoin = $hasUserIdCol
      ? "FROM externalized_contents ec LEFT JOIN users u ON u.user_id = ec.user_id"
      : "FROM externalized_contents ec";

    $sql = "SELECT {$selectFields}
              {$fromJoin}
             WHERE ec.`{$kfragCol}` IS NOT NULL
               AND LENGTH(TRIM(ec.`{$kfragCol}`)) > 0" . $orderBy;
    if ($stmt = $mysqli->prepare($sql)) {
      if ($stmt->execute()) {
        if ($result = $stmt->get_result()) {
          while ($row = $result->fetch_assoc()) {
            $__val = isset($row['content']) ? (string)$row['content'] : '';
            if (trim($__val) === '') { continue; }
            // 行ごとのユーザー名（user_idがない場合/名前未設定時はログインユーザー名にフォールバック）
            $__user_name = $__current_user_name;
            if ($hasUserIdCol) {
              if (isset($row['user_name']) && trim((string)$row['user_name']) !== '') {
                $__user_name = (string)$row['user_name'];
              }
            }
            $__kfrag_list[] = [
              'content' => $__val,
              'stage1' => isset($row['stage1']) ? (string)$row['stage1'] : '',
              'stage2' => isset($row['stage2']) ? (string)$row['stage2'] : '',
              'stage3' => isset($row['stage3']) ? (string)$row['stage3'] : '',
              'selected_contents' => isset($row['selected_contents']) ? (string)$row['selected_contents'] : '',
              'user_name' => $__user_name,
              'discussed' => $hasDiscussedCol && isset($row['discussed']) ? (string)$row['discussed'] : '',
              'externalized_contents_id' => $hasExtContentsIdCol && isset($row['externalized_contents_id']) ? (int)$row['externalized_contents_id'] : null
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
            $num = $totalK - $i; // 例: latest idx=0 -> num=total, oldest idx=total-1 -> num=1
  ?>
    <div class="knowledge_fragment" data-kfrag-num="<?php echo intval($num,10); ?>"<?php 
      $disc = isset($__kfrag_raw['discussed']) ? trim($__kfrag_raw['discussed']) : ''; 
      if($disc!==''){ echo ' data-discussed="'.htmlspecialchars($disc,ENT_QUOTES,'UTF-8').'"'; }
      $extId = isset($__kfrag_raw['externalized_contents_id']) ? intval($__kfrag_raw['externalized_contents_id'],10) : 0;
      if($extId>0){ echo ' data-ext-id="'.$extId.'"'; }
    ?>>
      <div class="card-title"><?php echo htmlspecialchars($__uname, ENT_QUOTES, 'UTF-8'); ?> さん</div>
      <div class="card-body"><?php echo nl2br(htmlspecialchars($__tmp, ENT_QUOTES, 'UTF-8')); ?></div>
      <div class="card-detail" aria-hidden="true">
        <?php 
          $__sel = is_array($__kfrag_raw) && isset($__kfrag_raw['selected_contents']) ? trim((string)$__kfrag_raw['selected_contents']) : '';
          if ($__sel !== '') { ?>
            <div class="selected-utterance">発言内容: <?php echo nl2br(htmlspecialchars($__sel, ENT_QUOTES, 'UTF-8')); ?></div>
        <?php } ?>
        <div class="qa-item"><div class="qa-q">質問: なぜこの発言が印象に残りましたか？</div><div class="qa-a">回答: <?php echo nl2br(htmlspecialchars($__s1, ENT_QUOTES, 'UTF-8')); ?></div></div>
        <div class="qa-item"><div class="qa-q">質問: この発言には、どんな前提や背景がありますか？</div><div class="qa-a">回答: <?php echo nl2br(htmlspecialchars($__s2, ENT_QUOTES, 'UTF-8')); ?></div></div>
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
