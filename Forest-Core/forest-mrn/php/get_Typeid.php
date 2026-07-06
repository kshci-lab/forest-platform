<?php

//指定した日時だけ取得・マッチングするバージョン
session_start();
require("connect_db.php");

$class_name = $_POST["class"];
$type_name = $_POST["type"];

if($class_name == ""){
    $sql = "SELECT node_type_id FROM node_types WHERE type='" .$type_name. "' ";

    $result = $mysqli->query($sql);
    if($result){
        $row = $result->fetch_assoc();
        if($row && isset($row["node_type_id"])){
            echo json_encode($row);
        } else {
            echo json_encode([
                "error" => "node_type not found",
                "class" => $class_name,
                "type" => $type_name
            ]);
        }
    } else {
        echo json_encode(["error" => "SQL error: " . $mysqli->error]);
    }

}else{
    $sql = "SELECT node_type_id FROM node_types WHERE class = '" .$class_name. "' AND type = '" .$type_name. "' ";

    $result = $mysqli->query($sql);
	if($result){
        $row = $result->fetch_assoc();
        if($row && isset($row["node_type_id"])){
            echo json_encode($row);
        } else {
            echo json_encode([
                "error" => "node_type not found",
                "class" => $class_name,
                "type" => $type_name
            ]);
        }
    } else {
        echo json_encode(["error" => "SQL error: " . $mysqli->error]);
    }

}

?>
