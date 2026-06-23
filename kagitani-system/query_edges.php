<?php
require("php/connect_db.php");
$res = $mysqli->query("SELECT * FROM object_edges ORDER BY created_at DESC LIMIT 10");
while ($row = $res->fetch_assoc()) {
    print_r($row);
    // Check if start node exists
    $start_res = $mysqli->query("SELECT * FROM object_nodes WHERE object_node_id='".$row['edge_start']."'");
    if ($start_res->num_rows == 0) echo "START NODE MISSING\n";
    else { $n = $start_res->fetch_assoc(); echo "Start deleted: " . $n['deleted'] . "\n"; }

    // Check if end node exists
    $end_res = $mysqli->query("SELECT * FROM object_nodes WHERE object_node_id='".$row['edge_end']."'");
    if ($end_res->num_rows == 0) echo "END NODE MISSING\n";
    else { $n = $end_res->fetch_assoc(); echo "End deleted: " . $n['deleted'] . "\n"; }
}
