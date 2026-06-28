<?php
$db_host = '127.0.0.1';
$db_user = 'root';
$db_password = 'root';
$db_dbname = '2026-06-15_jiko-chouseisan-kojilab';

try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_dbname};charset=utf8mb4", $db_user, $db_password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $user_ids = [540742316, 705669067, 1047560894, 1059266691, 1079778750, 1170943400, 1295772075, 1359833175, 1762021915, 1836505621];
    $in_users = implode(',', $user_ids);

    $sql_maps = "SELECT map_id FROM maps WHERE user_id IN ($in_users) AND (deleted IS NULL OR deleted = 0)";
    $maps = $pdo->query($sql_maps)->fetchAll(PDO::FETCH_COLUMN);
    $in_maps = implode(',', $maps);

    echo "Target Maps Count: " . count($maps) . "\n";

    // check reasons
    $sql_reasons1 = "SELECT COUNT(DISTINCT n.object_node_id) 
     FROM `object_nodes` n
     JOIN `map_node_links` mnl ON n.node_id = mnl.node_id
     JOIN `object_edges` e ON n.object_node_id = e.edge_end
     WHERE mnl.map_id IN ($in_maps)
       AND n.object_nodes_type IN ('step', 'action')
       AND (n.deleted IS NULL OR n.deleted = 0)
       AND (e.deleted IS NULL OR e.deleted = 0)
       AND e.label IS NOT NULL AND TRIM(e.label) <> ''
       AND n.created_at >= '2026-04-01 00:00:00'";
    echo "Reasons (edge_end): " . $pdo->query($sql_reasons1)->fetchColumn() . "\n";

    $sql_reasons2 = "SELECT COUNT(DISTINCT n.object_node_id) 
     FROM `object_nodes` n
     JOIN `map_node_links` mnl ON n.node_id = mnl.node_id
     JOIN `object_edges` e ON n.object_node_id = e.edge_start
     WHERE mnl.map_id IN ($in_maps)
       AND n.object_nodes_type IN ('step', 'action')
       AND (n.deleted IS NULL OR n.deleted = 0)
       AND (e.deleted IS NULL OR e.deleted = 0)
       AND e.label IS NOT NULL AND TRIM(e.label) <> ''
       AND n.created_at >= '2026-04-01 00:00:00'";
    echo "Reasons (edge_start): " . $pdo->query($sql_reasons2)->fetchColumn() . "\n";

    // check completed
    $sql_completed = "SELECT status, COUNT(*) as c FROM object_nodes n JOIN map_node_links mnl ON n.node_id = mnl.node_id WHERE mnl.map_id IN ($in_maps) AND n.object_nodes_type IN ('step', 'action') AND n.created_at >= '2026-04-01 00:00:00' GROUP BY status";
    echo "Status distribution:\n";
    print_r($pdo->query($sql_completed)->fetchAll());

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
