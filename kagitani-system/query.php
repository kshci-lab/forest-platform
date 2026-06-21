<?php
require("php/connect_db.php");
$res = $mysqli->query("DESCRIBE node_latest");
while ($row = $res->fetch_assoc()) print_r($row);
$res = $mysqli->query("SELECT node_id, parent_id, content FROM node_latest LIMIT 5");
while ($row = $res->fetch_assoc()) print_r($row);
