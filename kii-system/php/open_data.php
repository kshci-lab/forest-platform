<?php

	session_start();

	/*add_node.jsで木構造を復元するために使用*/

	require("connect_db.php");

	$id = $_SESSION["MAPID"];

	if (isset($_POST["val"]) && $_POST["val"] === "edited_nodes") {
		$i = 0;
		$array = array();
		$sql_edited = "SELECT DISTINCT v.node_id
			FROM view_changed_content_vs_latest v
			WHERE v.node_id IN(SELECT node_id FROM map_node_links WHERE map_id = '$id')";

		if($result_edited = $mysqli->query($sql_edited)){
			while($row = mysqli_fetch_assoc($result_edited)){
				$array = $array + array($i=>$row["node_id"]);
				$i += 1;
			}
		}

		echo json_encode($array);
		return;
	}

	if (isset($_POST["val"]) && $_POST["val"] === "reflection_nodes") {
		$i = 0;
		$array = array();
		$sql_reflections = "SELECT DISTINCT reflection.node_id
			FROM paper_reading_reflections reflection
			INNER JOIN map_node_links link ON link.node_id = reflection.node_id
			WHERE link.map_id = '$id'";

		if ($result_reflections = $mysqli->query($sql_reflections)) {
			while ($row = mysqli_fetch_assoc($result_reflections)) {
				$array[$i] = $row["node_id"];
				$i += 1;
			}
		}

		echo json_encode($array);
		return;
	}

	$n_sql = "SELECT * FROM node_latest WHERE node_id IN(SELECT node_id FROM map_node_links WHERE map_id = '$id')";
	$a_sql = "SELECT * FROM paper_annotations WHERE node_id IN(SELECT node_id FROM map_node_links WHERE map_id = '$id') AND deleted = 0";

	$i = 0;
	$array = array();

	if($result_n= $mysqli->query($n_sql)){
		
		if($_POST["val"] == "id"){

			while($row = mysqli_fetch_assoc($result_n)){
	
				$array = $array + array($i=>$row["node_id"]);

				$i += 1;

			}
	
			echo json_encode($array);
	
		}else if($_POST["val"] == "concept_id"){
	
			while($row = mysqli_fetch_assoc($result_n)){
	
				$array = $array + array($i=>$row["concept_id"]);

				$i += 1;

			}
	
			echo json_encode($array);
	
		}else if($_POST["val"] == "content"){
	
			while($row = mysqli_fetch_assoc($result_n)){
	
				$array = $array + array($i=>$row["content"]);

				$i += 1;

			}
	
			echo json_encode($array);
	
		}else if($_POST["val"] == "type"){
	
			while($row = mysqli_fetch_assoc($result_n)){
	
				$array = $array + array($i=>$row["type"]);

				$i += 1;

			}
	
			echo json_encode($array);
	
		}else if($_POST["val"] == "parent_id"){

			while($row = mysqli_fetch_assoc($result_n)){

				$array = $array + array($i=>$row["parent_id"]);

				$i += 1;

			}
	
			echo json_encode($array);
	
		}else if($_POST["val"] == "class"){
	
			while($row = mysqli_fetch_assoc($result_n)){
	
				$array = $array + array($i=>$row["class"]);

				$i += 1;

			}
	
			echo json_encode($array);
	
		}else if($_POST["val"] == "start_char_id"){

			if($result_a = $mysqli->query($a_sql)){

				while($row = mysqli_fetch_assoc($result_a)){
	
					$array = $array + array($i=>$row["start_char_id"]);
	
					$i += 1;
	
				}
			}
			echo json_encode($array);
			

		}else if($_POST["val"] == "end_char_id"){

			if($result_a = $mysqli->query($a_sql)){

				while($row = mysqli_fetch_assoc($result_a)){
	
					$array = $array + array($i=>$row["end_char_id"]);
	
					$i += 1;
	
				}
			}
			echo json_encode($array);

		}else if($_POST["val"] == "root"){
	
			while($row = mysqli_fetch_assoc($result_n)){
	
				echo $row["content"];

			}
	
			echo json_encode($array);
	
		}
	}else if($result_n== FALSE){
		echo "false";
			error_log($result.'$result失敗です'.$mysqli->error, "3", "error_log.txt");
			// error_log('失敗しました。'.mysqli_error($link), 0);
	}else{
		error_log('$result不明なエラーです', 0);
	}


?>
