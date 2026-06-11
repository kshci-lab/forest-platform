<?php
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);
mysqli_report(MYSQLI_REPORT_OFF);

require_once __DIR__ . '/connect_db.php';
mysqli_report(MYSQLI_REPORT_OFF);

function respond_json($status, $payload = []) {
  echo json_encode(array_merge(['status' => $status], $payload), JSON_UNESCAPED_UNICODE);
  exit;
}

if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
  respond_json('error', ['message' => 'DB接続失敗']);
}
@$mysqli->set_charset('utf8mb4');

$raw = isset($_POST['order']) ? (string)$_POST['order'] : '';
$ids = json_decode($raw, true);
if (!is_array($ids)) {
  respond_json('error', ['message' => 'order JSON が不正です']);
}

$orderedIds = [];
foreach ($ids as $id) {
  $value = intval($id, 10);
  if ($value > 0 && !in_array($value, $orderedIds, true)) {
    $orderedIds[] = $value;
  }
}
if (!$orderedIds) {
  respond_json('error', ['message' => '保存対象がありません']);
}

$createSql = "CREATE TABLE IF NOT EXISTS knowledge_fragment_positions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  externalized_contents_id INT NOT NULL,
  pos_x FLOAT NOT NULL DEFAULT 0,
  pos_y FLOAT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY ux_externalized (externalized_contents_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci";
if (!$mysqli->query($createSql)) {
  respond_json('error', ['message' => 'テーブル作成失敗: '.$mysqli->error]);
}

if ($res = $mysqli->query("SHOW COLUMNS FROM knowledge_fragment_positions LIKE 'id'")) {
  if ($res->num_rows > 0) {
    $row = $res->fetch_assoc();
    $extra = isset($row['Extra']) ? (string)$row['Extra'] : '';
    if (stripos($extra, 'auto_increment') === false) {
      $mysqli->query("ALTER TABLE knowledge_fragment_positions MODIFY id INT NOT NULL AUTO_INCREMENT PRIMARY KEY");
    }
  }
  $res->free();
}

$updStmt = $mysqli->prepare("UPDATE knowledge_fragment_positions SET pos_y = ?, pos_x = 0 WHERE externalized_contents_id = ?");
$insStmt = $mysqli->prepare("INSERT INTO knowledge_fragment_positions (externalized_contents_id, pos_x, pos_y) VALUES (?, 0, ?)");
$insWithIdStmt = $mysqli->prepare("INSERT INTO knowledge_fragment_positions (id, externalized_contents_id, pos_x, pos_y) VALUES (?, ?, 0, ?)");
if (!$updStmt || !$insStmt || !$insWithIdStmt) {
  respond_json('error', ['message' => '保存SQLの準備に失敗しました']);
}

$saved = 0;
foreach ($orderedIds as $index => $extId) {
  $posY = (float)$index;
  $didSave = false;

  $updStmt->bind_param('di', $posY, $extId);
  if ($updStmt->execute() && $updStmt->affected_rows > 0) {
    $saved++;
    $didSave = true;
  }

  if (!$didSave) {
    $insStmt->bind_param('id', $extId, $posY);
    if ($insStmt->execute()) {
      $saved++;
      $didSave = true;
    } else {
      $updStmt->bind_param('di', $posY, $extId);
      if ($updStmt->execute()) {
        $saved++;
        $didSave = true;
      }
    }
  }

  if (!$didSave) {
    $nextId = 1;
    if ($resNext = $mysqli->query("SELECT COALESCE(MAX(id),0)+1 AS next_id FROM knowledge_fragment_positions")) {
      if ($rowNext = $resNext->fetch_assoc()) {
        $nextId = max(1, intval($rowNext['next_id'], 10));
      }
      $resNext->free();
    }
    $insWithIdStmt->bind_param('iid', $nextId, $extId, $posY);
    if ($insWithIdStmt->execute()) {
      $saved++;
    }
  }
}

$updStmt->close();
$insStmt->close();
$insWithIdStmt->close();

respond_json('ok', ['items_saved' => $saved]);
