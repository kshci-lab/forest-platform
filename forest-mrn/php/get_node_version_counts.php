<?php
// Return number of node_versions per node_id for the currently loaded mindmap.
// Used to render small badges on each jmnode.

// If connect_db.php (or PHP warnings) emit any output, it will break JSON parsing.
// Buffer everything and only output JSON at the end.
ob_start();

session_start();
require("connect_db.php");

header('Content-Type: application/json; charset=utf-8');

$map_id = isset($_SESSION["MAPID"]) ? $_SESSION["MAPID"] : null;
if(!$map_id){
    ob_clean();
    echo json_encode(['status' => 'error', 'message' => 'MAPID not set'], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = isset($_POST['node_ids']) ? $_POST['node_ids'] : '';
$raw = is_string($raw) ? trim($raw) : '';

$ids = [];
if($raw !== ''){
    foreach(explode(',', $raw) as $id){
        $id = trim($id);
        if($id === '' || $id === 'root'){ continue; }
        $ids[] = $id;
    }
    // de-dup
    $ids = array_values(array_unique($ids));
}

// If no list provided, fallback to all nodes in this map (excluding deleted).
if(count($ids) === 0){
    $ids = [];
    // map linkage is managed by map_node_links (nodes table may not have map_id).
    $sql_nodes = "
        SELECT n.node_id AS node_id
        FROM map_node_links l
        INNER JOIN nodes n ON n.node_id = l.node_id
        WHERE l.map_id = '" . $mysqli->real_escape_string($map_id) . "'
          AND n.deleted = 0
    ";
    if($res = $mysqli->query($sql_nodes)){
        while($row = mysqli_fetch_assoc($res)){
            if(isset($row['node_id']) && $row['node_id'] !== 'root'){
                $ids[] = $row['node_id'];
            }
        }
    }
}

if(count($ids) === 0){
    ob_clean();
    echo json_encode(['status' => 'ok', 'counts' => new stdClass()], JSON_UNESCAPED_UNICODE);
    exit;
}

$escaped = [];
foreach($ids as $id){
    $escaped[] = "'" . $mysqli->real_escape_string($id) . "'";
}
$in = implode(',', $escaped);

// Count versions per node_id. Limit to nodes in this map and not deleted.
$sql = "
    SELECT nv.node_id AS node_id, COUNT(*) AS cnt
    FROM node_versions nv
    INNER JOIN nodes n ON n.node_id = nv.node_id
    INNER JOIN map_node_links l ON l.node_id = n.node_id
    WHERE l.map_id = '" . $mysqli->real_escape_string($map_id) . "'
      AND n.deleted = 0
      AND nv.node_id IN ($in)
    GROUP BY nv.node_id
";

$counts = [];
if($res = $mysqli->query($sql)){
    while($row = mysqli_fetch_assoc($res)){
        $nid = isset($row['node_id']) ? $row['node_id'] : null;
        if($nid === null || $nid === ''){ continue; }
        $counts[$nid] = isset($row['cnt']) ? (int)$row['cnt'] : 0;
    }
}

// Ensure nodes with 0 versions still appear in response (so JS can show 0).
foreach($ids as $id){
    if(!array_key_exists($id, $counts)){
        $counts[$id] = 0;
    }
}

ob_clean();
echo json_encode(['status' => 'ok', 'counts' => $counts], JSON_UNESCAPED_UNICODE);
?>
