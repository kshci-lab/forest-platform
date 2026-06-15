<?php
require_once "php/connect_db.php";
$res = $mysqli->query("SELECT * FROM object_journal_nodes LIMIT 10");
while($r = $res->fetch_assoc()) { print_r($r); }
