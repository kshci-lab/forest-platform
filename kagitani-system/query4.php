<?php
require("php/connect_db.php");
$res = $mysqli->query("SELECT node_id FROM node_latest WHERE content LIKE '%どのような準備が必要ですか%' LIMIT 1");
if ($row = $res->fetch_assoc()) {
    $parent = $row['node_id'];
    echo "Question: " . $parent . "\n";
    $r = $mysqli->query("SELECT * FROM node_latest WHERE parent_id='$parent'");
    while ($ans = $r->fetch_assoc()) print_r($ans);
}

$res = $mysqli->query("SELECT node_id FROM node_latest WHERE content LIKE '%問い間のつながりをSRL%' LIMIT 1");
if ($row = $res->fetch_assoc()) {
    $parent = $row['node_id'];
    echo "Question 2: " . $parent . "\n";
    $r = $mysqli->query("SELECT * FROM node_latest WHERE parent_id='$parent'");
    while ($ans = $r->fetch_assoc()) print_r($ans);
}
