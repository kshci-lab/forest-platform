<?php
require("php/connect_db.php");
$res = $mysqli->query("SELECT * FROM object_edges WHERE object_edge_id='1782044458530904636'");
while ($row = $res->fetch_assoc()) print_r($row);
