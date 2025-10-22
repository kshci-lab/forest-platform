<?php

	session_start();

	require "connect_db.php";

	if($_POST["val"] == "rationality"){
		$map_id = $_SESSION["MAPID"];
		$rationality_id = $_POST["rationality_id"];

		$sql = "SELECT * FROM rationality_nodes WHERE map_id = ".$map_id." AND rationality_id = '".$rationality_id."'";

		$i = 0;
		$node_id_array = array();

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){

				$node_id_array = $node_id_array + array($i=>$row["node_id"]);

				$i += 1;

			}

		}

		echo json_encode($node_id_array);

	}else if($_POST["val"] == "edit_reason"){

		//2024-11-19 使用されていない？
		$map_id = $_SESSION["MAPID"];
		$id = $_POST["id"];

		$sql = "SELECT * FROM edit_reason WHERE map_id = ".$map_id." AND node_id = '".$id."'";

		$i = 0;
		$node_id_array = array();

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){

				$node_id_array = $node_id_array + array($i=>$row["content"]);

				$i += 1;

			}

		}

		echo json_encode($node_id_array);

	}else if($_POST["val"] == "node_id"){
		$sql = "SELECT * FROM node_latest WHERE node_id = '".$_POST["node_id"]."' ";
		$result = $mysqli->query($sql);

		if(!$result){

			echo "false";

		}else{

			echo "save";

		}

	}else if($_POST["val"] == "return"){

		$sql = "SELECT * FROM node_histories WHERE node_version_id IN (select node_version_id from node_versions where node_id IN (SELECT node_id FROM map_node_links WHERE map_id = ".$_SESSION["MAPID"].")) ORDER BY disappeared_at DESC LIMIT 1";

		$i = 0;
		$updated_array = array();

		if($$mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){

				$updated_array = $updated_array + array($i=>$row["node_history_id"]);

				$i += 1;

			}

		}

		echo json_encode($updated_array);

// MTタイムを選択した時の処理
	}else if($_POST["val"] == "time"){

		echo "ok";

	}

?>
