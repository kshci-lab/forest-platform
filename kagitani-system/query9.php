<?php
require("php/connect_db.php");
$res = $mysqli->query("SELECT * FROM object_edges WHERE edge_start='1782032033199519720' OR edge_end='1782032033199519720'");
while ($row = $res->fetch_assoc()) print_r($row);
