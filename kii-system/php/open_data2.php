<?php

	session_start();

	require("connect_db.php");

	$map_id = isset($_POST["mapid"]) ? $_POST["mapid"] : "";
	$val = isset($_POST["val"]) ? $_POST["val"] : "";
	$array = array();

	if ($map_id === "") {
		echo json_encode($array);
		return;
	}

	$node_columns = array(
		"id" => "node_id",
		"concept_id" => "concept_id",
		"content" => "content",
		"type" => "type",
		"parent_id" => "parent_id",
		"class" => "class"
	);

	if (isset($node_columns[$val])) {
		$column = $node_columns[$val];
		$sql = "SELECT * FROM node_latest WHERE node_id IN(SELECT node_id FROM map_node_links WHERE map_id = '$map_id')";
		$i = 0;

		if($result = $mysqli->query($sql)){
			while($row = mysqli_fetch_assoc($result)){
				$array = $array + array($i=>$row[$column]);
				$i += 1;
			}
		}

		echo json_encode($array);
		return;
	}

	if ($val == "start_char_id" || $val == "end_char_id") {
		$sql = "SELECT $val FROM paper_annotations WHERE node_id IN(SELECT node_id FROM map_node_links WHERE map_id = '$map_id') AND deleted = 0";
		$i = 0;

		if($result = $mysqli->query($sql)){
			while($row = mysqli_fetch_assoc($result)){
				$array = $array + array($i=>$row[$val]);
				$i += 1;
			}
		}

		echo json_encode($array);
		return;
	}

	if ($val == "parent_map_id") {
		echo json_encode($array);
		return;
	}

	if ($val == "root") {
		$sql = "SELECT content FROM node_latest WHERE parent_id = 'root' AND node_id IN(SELECT node_id FROM map_node_links WHERE map_id = '$map_id')";
		if($result = $mysqli->query($sql)){
			while($row = mysqli_fetch_assoc($result)){
				echo $row["content"];
			}
		}
		return;
	}

	echo json_encode($array);

?>
