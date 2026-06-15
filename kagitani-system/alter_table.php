<?php
$mysqli = new mysqli("localhost", "root", "root", "forest_platform", 8889);
$sql = "ALTER TABLE object_edges_histories MODIFY object_edges_history_id INT NOT NULL AUTO_INCREMENT";
if (!$mysqli->query($sql)) {
    echo "Error: " . $mysqli->error;
} else {
    echo "Success altering table!";
}
?>
