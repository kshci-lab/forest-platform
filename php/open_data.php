<?php

	session_start();

	/*add_node.jsで木構造を復元するために使用*/

	require("connect_db.php");

	$id = $_SESSION["MAPID"];

	if (isset($_POST["val"]) && $_POST["val"] === "edited_nodes") {
		$i = 0;
		$array = array();
		$sql_edited = "SELECT DISTINCT v.node_id
			FROM view_changed_content_vs_latest v";
		try{
			if($result_edited = $mysqli->query($sql_edited)){
				while($row = mysqli_fetch_assoc($result_edited)){
					$array = $array + array($i=>$row["node_id"]);
					$i += 1;
				}
			}
		}catch(mysqli_sql_exception $e){
			error_log("open_data.php edited_nodes view query error: " . $e->getMessage());
			$sql_fallback = "SELECT DISTINCT diff.node_id
				FROM (
					SELECT nv.parent_id AS node_id
					FROM node_versions nv
					INNER JOIN node_histories nh ON nh.node_version_id = nv.node_version_id
					WHERE nv.appeared_at = (
						SELECT MAX(v2.appeared_at)
						FROM node_versions v2
						WHERE v2.parent_id = nv.parent_id
					)
					AND nh.content <> nv.content
				) diff";
			try{
				if($result_edited = $mysqli->query($sql_fallback)){
					while($row = mysqli_fetch_assoc($result_edited)){
						$array = $array + array($i=>$row["node_id"]);
						$i += 1;
					}
				}
			}catch(mysqli_sql_exception $e2){
				error_log("open_data.php edited_nodes fallback query error: " . $e2->getMessage());
			}
		}
		echo json_encode($array);
		return;
	}

	$sql = "SELECT * FROM node_latest WHERE node_id IN(SELECT node_id FROM map_node_links WHERE map_id = '$id')";

	$i = 0;
	$array = array();

	if($result = $mysqli->query($sql)){
		
		if($_POST["val"] == "id"){

			while($row = mysqli_fetch_assoc($result)){
	
				$array = $array + array($i=>$row["node_id"]);

				$i += 1;

			}
	
			echo json_encode($array);
	
		}else if($_POST["val"] == "concept_id"){
	
			while($row = mysqli_fetch_assoc($result)){
	
				$array = $array + array($i=>$row["concept_id"]);

				$i += 1;

			}
	
			echo json_encode($array);
	
		}else if($_POST["val"] == "content"){
	
			while($row = mysqli_fetch_assoc($result)){
	
				$array = $array + array($i=>$row["content"]);

				$i += 1;

			}
	
			echo json_encode($array);
	
		}else if($_POST["val"] == "type"){
	
			while($row = mysqli_fetch_assoc($result)){
	
				$array = $array + array($i=>$row["type"]);

				$i += 1;

			}
	
			echo json_encode($array);
	
		}else if($_POST["val"] == "parent_id"){

			while($row = mysqli_fetch_assoc($result)){

				$array = $array + array($i=>$row["parent_id"]);

				$i += 1;

			}
	
			echo json_encode($array);
	
		}else if($_POST["val"] == "class"){
	
			while($row = mysqli_fetch_assoc($result)){
	
				$array = $array + array($i=>$row["class"]);

				$i += 1;

			}
	
			echo json_encode($array);
	
		}else if($_POST["val"] == "root"){
	
			while($row = mysqli_fetch_assoc($result)){
	
				echo $row["content"];

			}
	
			echo json_encode($array);
	
		}

	}

	


?>
