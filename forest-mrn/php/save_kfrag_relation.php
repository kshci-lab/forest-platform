<?php
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);
mysqli_report(MYSQLI_REPORT_OFF);

session_start();
require_once __DIR__ . '/connect_db.php';

function respond_json($status, $payload = []) {
  echo json_encode(array_merge(['status' => $status], $payload), JSON_UNESCAPED_UNICODE);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  respond_json('error', ['message' => 'Method Not Allowed']);
}
if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
  http_response_code(500);
  respond_json('error', ['message' => 'DB connection failed']);
}
@$mysqli->set_charset('utf8mb4');

$groupId = isset($_POST['group_id']) ? intval($_POST['group_id'], 10) : 0;
if ($groupId < 0) { $groupId = 0; }
$relationType = isset($_POST['relation_type']) ? trim((string)$_POST['relation_type']) : 'related';
if ($relationType === '') { $relationType = 'related'; }
if (strlen($relationType) > 32) { $relationType = substr($relationType, 0, 32); }
$action = isset($_POST['action']) ? trim((string)$_POST['action']) : 'save';
if ($action !== 'delete') { $action = 'save'; }

$pairsRaw = isset($_POST['pairs']) ? (string)$_POST['pairs'] : '';
$pairs = json_decode($pairsRaw, true);
if (!is_array($pairs)) {
  respond_json('error', ['message' => 'invalid pairs JSON']);
}

$normalized = [];
foreach ($pairs as $pair) {
  if (!is_array($pair)) { continue; }
  $from = isset($pair['from']) ? intval($pair['from'], 10) : 0;
  $to = isset($pair['to']) ? intval($pair['to'], 10) : 0;
  if ($from <= 0 || $to <= 0 || $from === $to) { continue; }
  if ($from > $to) {
    $tmp = $from;
    $from = $to;
    $to = $tmp;
  }
  $key = $from.'-'.$to;
  $normalized[$key] = ['from' => $from, 'to' => $to];
}
if (!$normalized) {
  respond_json('error', ['message' => 'no valid relation pairs']);
}

$createSql = "CREATE TABLE IF NOT EXISTS `knowledge_fragment_relations` (".
  "`relation_id` INT NOT NULL AUTO_INCREMENT,".
  "`group_id` INT NOT NULL DEFAULT 0,".
  "`from_fragment_id` INT NOT NULL,".
  "`to_fragment_id` INT NOT NULL,".
  "`relation_type` VARCHAR(32) NOT NULL DEFAULT 'related',".
  "`label` VARCHAR(255) NULL DEFAULT NULL,".
  "`created_by` INT NULL DEFAULT NULL,".
  "`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,".
  "`updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,".
  "`deleted` TINYINT(1) NOT NULL DEFAULT 0,".
  "PRIMARY KEY (`relation_id`),".
  "UNIQUE KEY `ux_kfrag_relation` (`group_id`,`from_fragment_id`,`to_fragment_id`,`relation_type`),".
  "KEY `idx_kfrag_relation_group` (`group_id`),".
  "KEY `idx_kfrag_relation_from` (`from_fragment_id`),".
  "KEY `idx_kfrag_relation_to` (`to_fragment_id`)".
  ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
if (!$mysqli->query($createSql)) {
  respond_json('error', ['message' => 'failed to prepare relation table: '.$mysqli->error]);
}

$userId = isset($_SESSION['USERID']) ? intval($_SESSION['USERID'], 10) : null;
$sql = ($action === 'delete')
  ? "UPDATE `knowledge_fragment_relations`
        SET `deleted` = 1, `updated_at` = NOW()
      WHERE `group_id` = ? AND `from_fragment_id` = ? AND `to_fragment_id` = ? AND `relation_type` = ?"
  : "INSERT INTO `knowledge_fragment_relations` ".
       "(`group_id`,`from_fragment_id`,`to_fragment_id`,`relation_type`,`created_by`,`deleted`) ".
       "VALUES (?,?,?,?,?,0) ".
       "ON DUPLICATE KEY UPDATE `deleted` = 0, `updated_at` = NOW()";
if (!$stmt = $mysqli->prepare($sql)) {
  respond_json('error', ['message' => 'prepare failed: '.$mysqli->error]);
}

$saved = 0;
foreach ($normalized as $pair) {
  if ($action === 'delete') {
    $stmt->bind_param('iiis', $groupId, $pair['from'], $pair['to'], $relationType);
  } else {
    $stmt->bind_param('iiisi', $groupId, $pair['from'], $pair['to'], $relationType, $userId);
  }
  if ($stmt->execute()) { $saved++; }
}
$stmt->close();
$mysqli->close();

respond_json('ok', ['items_saved' => $saved]);
