<?php
require("connect_db.php");
// Mock session map_id for testing if session is empty
session_start();
// Since we run via HTTP, session might not have MAPID if we don't pass cookie. 
// Let's hardcode one or just find MIN over all maps for a specific user.
$sql = "SELECT MIN(DATE(appeared_at)) as global_start_date FROM object_nodes_histories LIMIT 1";
$res = $mysqli->query($sql);
if ($res) {
    $row = $res->fetch_assoc();
    echo "Query successful. Schema is valid. Start date: " . $row['global_start_date'];
} else {
    echo "Error: " . $mysqli->error;
}
?>
