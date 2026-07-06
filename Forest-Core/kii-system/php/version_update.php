<?php

session_start();
require("connect_db.php");

//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');
$timestamp = date("Y-m-d H:i:s");

//マップ更新ボタンを押したとき
if($_POST["data"] == "map"){

        //map_versionsをUPDATE
        $sql_mvu = "UPDATE map_versions SET disappeared_at = '".$timestamp."' WHERE map_id = ".$_SESSION['MAPID']." AND disappeared_at IS NULL";
        $result_mvu = $mysqli->query($sql_mvu);
        if($mysqli->error){
                echo "Error: ". $mysqli->error;
        }

        //map_versionsにINSERTする
        $map_version = rand();	//not unique
        $sql_mvi = "INSERT INTO map_versions(map_version_id, map_id, name, appeared_at, disappeared_at)
                VALUES (".$map_version.", '".$_SESSION['MAPID']."', (SELECT name FROM maps WHERE map_id = ".$_SESSION['MAPID']."), '".$timestamp."', NULL)";	//後で理由入れる
        $result_mvi = $mysqli->query($sql_mvi);
        if($mysqli->error){
                echo "Error: ". $mysqli->error;
        }

//ノードのバージョンを更新
}else if($_POST["data"] == "node"){
        //node_versionsをUPDATE
        $sql_nvu = "UPDATE node_versions SET disappeared_at = '".$timestamp."' WHERE node_id = '".$_POST['node_id']."' AND disappeared_at IS NULL";
        $result_nvu = $mysqli->query($sql_nvu);
        if($mysqli->error){
                echo "Error update node_version: ". $mysqli->error;
        }

        //node_versionsにINSERTする
        $sql_nvi = "INSERT INTO node_versions(node_version_id, node_id, parent_id, node_type_id, appeared_at, disappeared_at, content, concept_id, x, y)
                VALUES ('".$_POST['node_version_id']."', '".$_POST['node_id']."', '".$_POST['parent_id']."', ".$_POST['node_type_id'].", '".$timestamp."', NULL, '".$_POST['content']."', '".$_POST['concept_id']."', '".$_POST['x']."', '".$_POST['y']."')";
        $result_nvi = $mysqli->query($sql_nvi);
        if($mysqli->error){
                echo "Error insert node_version: ". $mysqli->error;
        }
}

?>