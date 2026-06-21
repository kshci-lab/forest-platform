<?php
require("php/connect_db.php");
$res = $mysqli->query("SELECT DISTINCT type FROM node_latest");
while ($row = $res->fetch_assoc()) print_r($row);
