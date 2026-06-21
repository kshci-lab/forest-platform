<?php
require("php/connect_db.php");
$res = $mysqli->query("SELECT node_id FROM object_nodes LIMIT 5");
$oids = [];
while ($row = $res->fetch_assoc()) $oids[] = $row['node_id'];
print_r($oids);
foreach ($oids as $oid) {
    $r = $mysqli->query("SELECT node_id, parent_id, content, type FROM node_latest WHERE parent_id='$oid'");
    while ($row = $r->fetch_assoc()) print_r($row);
}
