<?php

	mysqli_report(MYSQLI_REPORT_OFF);

	session_start();

	require "connect_db.php";

	function table_column_exists($mysqli, $table, $column){
		$table_escaped = $mysqli->real_escape_string($table);
		$column_escaped = $mysqli->real_escape_string($column);
		if($result = $mysqli->query("SHOW COLUMNS FROM `".$table_escaped."` LIKE '".$column_escaped."'")){
			$exists = ($result->num_rows > 0);
			$result->free();
			return $exists;
		}
		return false;
	}

	if($_POST["val"] == "rationality"){
		$map_id = $_SESSION["MAPID"];
		$rationality_id = $_POST["rationality_id"];
		$has_map_id = table_column_exists($mysqli, "rationality_nodes", "map_id");

		$sql = "SELECT * FROM rationality_nodes WHERE rationality_id = '".$mysqli->real_escape_string($rationality_id)."'";
		if($has_map_id){
			$sql .= " AND map_id = '".$mysqli->real_escape_string($map_id)."'";
		}

		$i = 0;
		$node_id_array = array();

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){

				$node_id_array = $node_id_array + array($i=>$row["node_id"]);

				$i += 1;

			}

		}

		echo json_encode($node_id_array);

	}else if($_POST["val"] == "rationality_all"){
		$map_id = $_SESSION["MAPID"];
		$has_map_id = table_column_exists($mysqli, "rationality_nodes", "map_id");
		$sql = "SELECT rationality_id, node_id FROM rationality_nodes";
		if($has_map_id){
			$sql .= " WHERE map_id = '".$mysqli->real_escape_string($map_id)."'";
		}
		$rationality_nodes = array();

		if($result = $mysqli->query($sql)){
			while($row = mysqli_fetch_assoc($result)){
				$rationality_id = $row["rationality_id"];
				if(!isset($rationality_nodes[$rationality_id])){
					$rationality_nodes[$rationality_id] = array();
				}
				array_push($rationality_nodes[$rationality_id], $row["node_id"]);
			}
		}

		echo json_encode($rationality_nodes);

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
