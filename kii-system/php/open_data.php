<?php

	session_start();

	/*add_node.jsで木構造を復元するために使用*/

	require("connect_db.php");

	$id = $_SESSION["MAPID"];
	$val = isset($_POST["val"]) ? $_POST["val"] : "";

	if ($val === "all") {
		header('Content-Type: application/json; charset=utf-8');
		$nodes = array();
		$node_indexes = array();
		$warnings = array();
		$sql_nodes = "SELECT DISTINCT latest.node_id, latest.parent_id, latest.content,
				latest.concept_id, latest.type, latest.class, latest.appeared_at
			FROM node_latest latest
			INNER JOIN map_node_links link ON link.node_id = latest.node_id
			WHERE link.map_id = ?
			ORDER BY latest.appeared_at ASC, latest.node_id ASC";

		try {
			$stmt = $mysqli->prepare($sql_nodes);
			if (!$stmt) {
				throw new Exception($mysqli->error);
			}
			$stmt->bind_param('s', $id);
			$stmt->execute();
			$result = $stmt->get_result();
			while ($row = $result->fetch_assoc()) {
				$row['start_char_id'] = null;
				$row['end_char_id'] = null;
				$row['is_edited'] = false;
				$row['has_reflection'] = false;
				$node_indexes[$row['node_id']] = count($nodes);
				$nodes[] = $row;
			}
			$stmt->close();
		} catch (Throwable $e) {
			http_response_code(500);
			echo json_encode(array('success' => false, 'error' => 'Failed to load mind map nodes.'));
			error_log('open_data all nodes: ' . $e->getMessage());
			return;
		}

		// Optional metadata must not prevent the core mind map from loading.
		try {
			$stmt = $mysqli->prepare("SELECT pa.node_id, pa.start_char_id, pa.end_char_id
				FROM paper_annotations pa
				INNER JOIN map_node_links link ON link.node_id = pa.node_id
				WHERE link.map_id = ? AND pa.deleted = 0
				ORDER BY pa.created_at ASC, pa.annotation_id ASC");
			if (!$stmt) { throw new Exception($mysqli->error); }
			$stmt->bind_param('s', $id);
			$stmt->execute();
			$result = $stmt->get_result();
			while ($row = $result->fetch_assoc()) {
				if (isset($node_indexes[$row['node_id']])) {
					$index = $node_indexes[$row['node_id']];
					$nodes[$index]['start_char_id'] = $row['start_char_id'];
					$nodes[$index]['end_char_id'] = $row['end_char_id'];
				}
			}
			$stmt->close();
		} catch (Throwable $e) {
			$warnings[] = 'annotations';
			error_log('open_data all annotations: ' . $e->getMessage());
		}

		try {
			$stmt = $mysqli->prepare("SELECT DISTINCT reflection.node_id
				FROM paper_reading_reflections reflection
				INNER JOIN map_node_links link ON link.node_id = reflection.node_id
				WHERE link.map_id = ?");
			if (!$stmt) { throw new Exception($mysqli->error); }
			$stmt->bind_param('s', $id);
			$stmt->execute();
			$result = $stmt->get_result();
			while ($row = $result->fetch_assoc()) {
				if (isset($node_indexes[$row['node_id']])) {
					$nodes[$node_indexes[$row['node_id']]]['has_reflection'] = true;
				}
			}
			$stmt->close();
		} catch (Throwable $e) {
			$warnings[] = 'reflections';
			error_log('open_data all reflections: ' . $e->getMessage());
		}

		try {
			$stmt = $mysqli->prepare("SELECT DISTINCT changed.node_id
				FROM view_changed_content_vs_latest changed
				INNER JOIN map_node_links link ON link.node_id = changed.node_id
				WHERE link.map_id = ?");
			if (!$stmt) { throw new Exception($mysqli->error); }
			$stmt->bind_param('s', $id);
			$stmt->execute();
			$result = $stmt->get_result();
			while ($row = $result->fetch_assoc()) {
				if (isset($node_indexes[$row['node_id']])) {
					$nodes[$node_indexes[$row['node_id']]]['is_edited'] = true;
				}
			}
			$stmt->close();
		} catch (Throwable $e) {
			$warnings[] = 'edited_nodes';
			error_log('open_data all edited nodes: ' . $e->getMessage());
		}

		echo json_encode(array('success' => true, 'nodes' => $nodes, 'warnings' => $warnings));
		return;
	}

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
