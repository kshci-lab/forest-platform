<?php
require("php/connect_db.php");
$res = $mysqli->query("SELECT * FROM object_nodes WHERE object_node_id='1782032033199519720'");
while ($row = $res->fetch_assoc()) print_r($row);
