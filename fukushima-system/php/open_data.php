<?php

	session_start();

	/*add_node.jsで木構造を復元するために使用*/

	require("connect_db.php");

	$id = $_SESSION["MAPID"];

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
