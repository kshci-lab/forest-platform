<?php
require("php/connect_db.php");
$res = $mysqli->query("SELECT node_type_id, type FROM node_latest GROUP BY node_type_id, type");
while ($row = $res->fetch_assoc()) print_r($row);
