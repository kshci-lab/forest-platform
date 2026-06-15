<?php
$mysqli = new mysqli("localhost", "root", "root", "forest_platform", 8889);
if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

$edge_id = 'test_edge_123';
$edge_start = 'test_start';
$edge_end = 'test_end';
$timestamp = '2026-06-14 12:00:00';
$sql = "INSERT INTO object_edges_histories (object_edge_id, edge_start, edge_end, label, appeared_at, disappeared_at) VALUES ('$edge_id', '$edge_start', '$edge_end', 'test_label', '$timestamp', NULL)";

$result = $mysqli->query($sql);
if (!$result) {
    echo "Error: " . $mysqli->error . "\n";
} else {
    echo "Success!\n";
}
?>
