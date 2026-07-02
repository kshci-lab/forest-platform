<?php
header('Content-Type: application/json; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);
mysqli_report(MYSQLI_REPORT_OFF);

require_once __DIR__ . '/connect_db.php';

function respond_json($status, $payload = []) {
  echo json_encode(array_merge(['status' => $status], $payload), JSON_UNESCAPED_UNICODE);
  exit;
}

if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
  http_response_code(500);
  respond_json('error', ['message' => 'DB connection failed']);
}
@$mysqli->set_charset('utf8mb4');

$groupId = isset($_GET['group_id']) ? intval($_GET['group_id'], 10) : 0;
if ($groupId < 0) { $groupId = 0; }

$table = 'knowledge_fragment_relations';
$tbl = $mysqli->query("SHOW TABLES LIKE '".$mysqli->real_escape_string($table)."'");
if (!$tbl || $tbl->num_rows === 0) {
  if ($tbl) { $tbl->close(); }
  respond_json('ok', ['relations' => []]);
}
$tbl->close();

$relations = [];
$sql = "SELECT relation_id, group_id, from_fragment_id, to_fragment_id, relation_type, label, updated_at ".
       "FROM `$table` ".
       "WHERE deleted = 0 AND group_id = ? ".
       "ORDER BY updated_at DESC, relation_id DESC";
if ($stmt = $mysqli->prepare($sql)) {
  $stmt->bind_param('i', $groupId);
  if ($stmt->execute()) {
    $stmt->bind_result($relationId, $rowGroupId, $fromId, $toId, $relationType, $label, $updatedAt);
    while ($stmt->fetch()) {
        $relations[] = [
          'relation_id' => intval($relationId, 10),
          'group_id' => intval($rowGroupId, 10),
          'from_fragment_id' => intval($fromId, 10),
          'to_fragment_id' => intval($toId, 10),
          'relation_type' => $relationType !== null ? (string)$relationType : 'related',
          'label' => $label !== null ? $label : null,
          'updated_at' => $updatedAt !== null ? $updatedAt : null
        ];
    }
  }
  $stmt->close();
}
$mysqli->close();

respond_json('ok', ['relations' => $relations]);
