<?php
$mysqli = new mysqli("localhost", "root", "root", "forest_platform", 8889);
$res = $mysqli->query("DESCRIBE object_edges_histories");
while ($row = $res->fetch_assoc()) {
    print_r($row);
}
?>
