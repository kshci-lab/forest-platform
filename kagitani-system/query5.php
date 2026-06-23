<?php
require("php/connect_db.php");
$res = $mysqli->query("DESCRIBE node_histories");
while ($row = $res->fetch_assoc()) print_r($row);
$res2 = $mysqli->query("DESCRIBE node_versions");
while ($row = $res2->fetch_assoc()) print_r($row);
