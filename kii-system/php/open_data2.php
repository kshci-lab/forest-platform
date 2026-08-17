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

	if ($val === "all") {
		header('Content-Type: application/json; charset=utf-8');

		$nodes = array();
		$node_ids = array();
		$sql = "SELECT latest.node_id, latest.parent_id, latest.content,
				latest.concept_id, latest.type, latest.class,
				annotation.start_char_id, annotation.end_char_id
			FROM node_latest latest
			INNER JOIN map_node_links link ON link.node_id = latest.node_id
			LEFT JOIN paper_annotations annotation
				ON annotation.annotation_id = (
					SELECT pa.annotation_id
					FROM paper_annotations pa
					WHERE pa.node_id = latest.node_id AND pa.deleted = 0
					ORDER BY pa.created_at DESC, pa.annotation_id DESC
					LIMIT 1
				)
			WHERE link.map_id = ?
			ORDER BY latest.appeared_at ASC, latest.node_id ASC";
		$stmt = $mysqli->prepare($sql);

		if (!$stmt) {
			http_response_code(500);
			echo json_encode(array('success' => false, 'error' => $mysqli->error));
			return;
		}

		$stmt->bind_param('s', $map_id);
		$stmt->execute();
		$result = $stmt->get_result();

		while ($row = $result->fetch_assoc()) {
			$node_ids[$row['node_id']] = true;
			$nodes[] = $row;
		}
		$stmt->close();

		$root_node_ids = array();
		$response_nodes = array();
		foreach ($nodes as $node) {
			$parent_id = $node['parent_id'];
			if ($parent_id === '' || $parent_id === null || $parent_id === 'root' || !isset($node_ids[$parent_id])) {
				$parent_id = 'root';
				$root_node_ids[] = $node['node_id'];
			}

			$response_nodes[] = array(
				'id' => $node['node_id'],
				'parent_id' => $parent_id,
				'topic' => $node['content'],
				'concept_id' => $node['concept_id'],
				'type' => $node['type'],
				'class' => $node['class'],
				'start_char_id' => $node['start_char_id'],
				'end_char_id' => $node['end_char_id']
			);
		}

		echo json_encode(array(
			'success' => true,
			'map_id' => $map_id,
			'root_node_ids' => $root_node_ids,
			'nodes' => $response_nodes
		));
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
