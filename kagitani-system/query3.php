<?php
require("php/connect_db.php");
$res = $mysqli->query("SELECT * FROM object_journal_nodes LIMIT 5");
while ($row = $res->fetch_assoc()) print_r($row);
