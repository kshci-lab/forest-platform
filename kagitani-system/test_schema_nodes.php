<?php
$mysqli = new mysqli("localhost", "root", "root", "jiko-chouseisan-kojilab", 8889);
$res = $mysqli->query("DESCRIBE object_nodes_histories");
while ($row = $res->fetch_assoc()) {
    print_r($row);
}
?>
