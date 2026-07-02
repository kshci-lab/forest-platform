<?php
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);
mysqli_report(MYSQLI_REPORT_OFF);

session_start();
require_once __DIR__ . '/connect_db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['status' => 'error', 'message' => 'Method Not Allowed']);
  exit;
}

if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
  http_response_code(500);
  echo json_encode(['status' => 'error', 'message' => 'DB connection failed']);
  exit;
}
@$mysqli->set_charset('utf8mb4');

function parse_fragment_ids($value) {
  if ($value === null || $value === '') { return []; }
  $parts = is_array($value) ? $value : preg_split('/\s*,\s*/', (string)$value);
  $ids = [];
  foreach ($parts as $part) {
    $id = intval(trim((string)$part), 10);
    if ($id > 0 && !in_array($id, $ids, true)) { $ids[] = $id; }
  }
  return $ids;
}

function normalize_fragment_source_type($value) {
  $type = strtolower(trim((string)$value));
  if ($type === 'discussion') { return 'discussion'; }
  if ($type === 'srl') { return 'SRL'; }
  if (in_array($type, ['experience', 'discussion'], true)) { return $type; }
  if ((string)$value === 'SRL') { return 'SRL'; }
  return 'experience';
}

function ensure_fragment_links_table(mysqli $mysqli) {
  $sql = "CREATE TABLE IF NOT EXISTS `knowledge_explorer_fragment_links` (".
         "`id` INT NOT NULL AUTO_INCREMENT,".
         "`knowledge_node_id` INT NOT NULL,".
         "`fragment_source_type` ENUM('experience','discussion','SRL') NOT NULL,".
         "`fragment_source_id` INT NOT NULL,".
         "`display_order` INT DEFAULT NULL,".
         "`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,".
         "PRIMARY KEY (`id`),".
         "UNIQUE KEY `uniq_knowledge_fragment` (`knowledge_node_id`,`fragment_source_type`,`fragment_source_id`),".
         "KEY `idx_knowledge_node_id` (`knowledge_node_id`),".
         "KEY `idx_fragment_lookup` (`fragment_source_type`,`fragment_source_id`)".
         ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
  if (!$mysqli->query($sql)) { return false; }
  @$mysqli->query("UPDATE `knowledge_explorer_fragment_links` SET `fragment_source_type` = 'discussion' WHERE `fragment_source_type` = 'externalized'");
  @$mysqli->query("ALTER TABLE `knowledge_explorer_fragment_links` MODIFY COLUMN `fragment_source_type` ENUM('experience','discussion','SRL') NOT NULL");
  return true;
}

function replace_fragment_links(mysqli $mysqli, $nodeId, array $fragmentIds, $sourceType) {
  if (!ensure_fragment_links_table($mysqli)) { return 0; }
  if ($stmtDel = $mysqli->prepare("DELETE FROM `knowledge_explorer_fragment_links` WHERE `knowledge_node_id` = ?")) {
    $stmtDel->bind_param('i', $nodeId);
    $stmtDel->execute();
    $stmtDel->close();
  }
  if (empty($fragmentIds)) { return 0; }
  $sql = "INSERT INTO `knowledge_explorer_fragment_links` ".
         "(`knowledge_node_id`,`fragment_source_type`,`fragment_source_id`,`display_order`) ".
         "VALUES (?,?,?,?) ".
         "ON DUPLICATE KEY UPDATE `display_order` = VALUES(`display_order`)";
  if (!$stmt = $mysqli->prepare($sql)) { return 0; }
  $saved = 0;
  foreach (array_values($fragmentIds) as $index => $fragmentId) {
    $order = $index + 1;
    $stmt->bind_param('isii', $nodeId, $sourceType, $fragmentId, $order);
    if ($stmt->execute()) { $saved++; }
  }
  $stmt->close();
  return $saved;
}

$nodeId = isset($_POST['node_id']) ? intval($_POST['node_id'], 10) : 0;
$title = isset($_POST['node_title']) ? trim((string)$_POST['node_title']) : '';
$comment = isset($_POST['comment']) ? trim((string)$_POST['comment']) : '';
$fragmentIdsRaw = isset($_POST['knowledge_fragment_id']) ? $_POST['knowledge_fragment_id'] : '';
$fragmentIds = parse_fragment_ids($fragmentIdsRaw);
$fragmentCsv = implode(',', $fragmentIds);
$sourceType = normalize_fragment_source_type(isset($_POST['fragment_source_type']) ? $_POST['fragment_source_type'] : 'experience');

if ($nodeId <= 0 || $title === '') {
  echo json_encode(['status' => 'error', 'message' => 'invalid node_id or title']);
  exit;
}
if (strlen($title) > 255) { $title = substr($title, 0, 255); }

$table = 'knowledge_explorer';
$tbl = $mysqli->query("SHOW TABLES LIKE '".$mysqli->real_escape_string($table)."'");
if (!$tbl || $tbl->num_rows === 0) {
  http_response_code(404);
  echo json_encode(['status' => 'error', 'message' => 'knowledge_explorer not found']);
  exit;
}
if ($tbl) { $tbl->close(); }

$colId = null;
$colTitle = null;
$colComment = null;
$colKFragId = null;
$kfragColType = '';
$colUpdatedAt = null;
$colUpdatedBy = null;
$hasDeleted = false;

if ($resCols = $mysqli->query("SHOW COLUMNS FROM `$table`")) {
  while ($c = $resCols->fetch_assoc()) {
    $f = isset($c['Field']) ? $c['Field'] : '';
    $lf = strtolower($f);
    if ($colId === null && in_array($lf, ['knowledge_node_id','node_id','id','knowledge_explorer_id'], true)) { $colId = $f; }
    if ($colTitle === null && in_array($lf, ['node_title','title','name','label'], true)) { $colTitle = $f; }
    if ($colComment === null && in_array($lf, ['comment','comments','note','notes','memo'], true)) { $colComment = $f; }
    if ($colKFragId === null && in_array($lf, ['knowledge_fragment_id','knowledgefragment_id','kfrag_id'], true)) { $colKFragId = $f; }
    if ($lf === 'knowledge_fragment_id' && isset($c['Type'])) { $kfragColType = strtolower((string)$c['Type']); }
    if ($colUpdatedAt === null && in_array($lf, ['updated_at','update_at','updated','modified_at'], true)) { $colUpdatedAt = $f; }
    if ($colUpdatedBy === null && $lf === 'updated_by') { $colUpdatedBy = $f; }
    if ($lf === 'deleted') { $hasDeleted = true; }
  }
  $resCols->close();
}

if ($colComment === null) {
  if (@$mysqli->query("ALTER TABLE `$table` ADD COLUMN `comment` TEXT NULL DEFAULT NULL")) { $colComment = 'comment'; }
}
if ($colKFragId === null) {
  if (@$mysqli->query("ALTER TABLE `$table` ADD COLUMN `knowledge_fragment_id` VARCHAR(255) NULL DEFAULT NULL")) { $colKFragId = 'knowledge_fragment_id'; }
}
if ($colKFragId !== null && $kfragColType && strpos($kfragColType, 'varchar') === false && strpos($kfragColType, 'text') === false) {
  @$mysqli->query("ALTER TABLE `$table` MODIFY COLUMN `$colKFragId` VARCHAR(255) NULL DEFAULT NULL");
}
if ($colUpdatedBy === null) {
  if (@$mysqli->query("ALTER TABLE `$table` ADD COLUMN `updated_by` INT(11) NULL DEFAULT NULL")) { $colUpdatedBy = 'updated_by'; }
}

if ($colId === null || $colTitle === null) {
  http_response_code(500);
  echo json_encode(['status' => 'error', 'message' => 'required columns not found']);
  exit;
}

$setParts = ["`$colTitle` = ?"];
$types = 's';
$params = [$title];
if ($colComment !== null) {
  $setParts[] = "`$colComment` = ?";
  $types .= 's';
  $params[] = $comment;
}
if ($colKFragId !== null) {
  $setParts[] = "`$colKFragId` = ?";
  $types .= 's';
  $params[] = $fragmentCsv;
}
if ($colUpdatedAt !== null) {
  $setParts[] = "`$colUpdatedAt` = NOW()";
}
if ($colUpdatedBy !== null) {
  $userId = isset($_SESSION['USERID']) ? intval($_SESSION['USERID'], 10) : null;
  $setParts[] = "`$colUpdatedBy` = ?";
  $types .= 'i';
  $params[] = $userId;
}

$types .= 'i';
$params[] = $nodeId;
$where = "`$colId` = ?";
if ($hasDeleted) { $where .= " AND `deleted` = 0"; }

$sql = "UPDATE `$table` SET ".implode(', ', $setParts)." WHERE $where";
if (!$stmt = $mysqli->prepare($sql)) {
  http_response_code(500);
  echo json_encode(['status' => 'error', 'message' => 'prepare failed: '.$mysqli->error]);
  exit;
}

$bind = [$types];
for ($i = 0; $i < count($params); $i++) { $bind[] = &$params[$i]; }
if (call_user_func_array([$stmt, 'bind_param'], $bind) === false) {
  http_response_code(500);
  echo json_encode(['status' => 'error', 'message' => 'bind failed: '.$stmt->error]);
  $stmt->close();
  exit;
}
if (!$stmt->execute()) {
  http_response_code(500);
  echo json_encode(['status' => 'error', 'message' => 'update failed: '.$stmt->error]);
  $stmt->close();
  exit;
}
$affected = $stmt->affected_rows;
$stmt->close();

$linkCount = replace_fragment_links($mysqli, $nodeId, $fragmentIds, $sourceType);
$mysqli->close();

echo json_encode([
  'status' => 'ok',
  'node_id' => $nodeId,
  'node_title' => $title,
  'comment' => $comment,
  'knowledge_fragment_id' => $fragmentCsv,
  'fragment_link_count' => $linkCount,
  'affected_rows' => $affected
], JSON_UNESCAPED_UNICODE);
