<?php

	session_start();

	if (function_exists('mysqli_report')) {
		mysqli_report(MYSQLI_REPORT_OFF);
	}
	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');

	$timestamp = date("Y-m-d H:i:s");
	$send_annotation_id = isset($_POST["id"]) ? (int)$_POST["id"] : 0;
	$start_char_id = isset($_POST["start_char_id"]) ? (int)$_POST["start_char_id"] : null;
	$end_char_id = isset($_POST["end_char_id"]) ? (int)$_POST["end_char_id"] : null;
	$paper_content = isset($_POST["content"]) ? $_POST["content"] : "";
	$node_id = isset($_POST["node_id"]) ? $_POST["node_id"] : "";

	if ($send_annotation_id <= 0 || $send_annotation_id > 2147483647) {
		$send_annotation_id = mt_rand(1, 2147483647);
	}

	if ($start_char_id === null || $end_char_id === null || $node_id === "") {
		http_response_code(400);
		echo "invalid annotation data";
		exit();
	}

	$sql = "INSERT INTO paper_annotations (annotation_id, node_id, start_char_id, end_char_id, content, created_at, deleted)
		VALUES (?, ?, ?, ?, ?, ?, 0)";
	try {
		$stmt = $mysqli->prepare($sql);
	} catch (Throwable $e) {
		http_response_code(500);
		echo "Error annotations prepare: ".$e->getMessage();
		exit();
	}

	if (!$stmt) {
		http_response_code(500);
		echo "Error annotations prepare: ".$mysqli->error;
		exit();
	}

	$inserted = false;
	for ($retry = 0; $retry < 5; $retry++) {
		$stmt->bind_param("isiiss", $send_annotation_id, $node_id, $start_char_id, $end_char_id, $paper_content, $timestamp);
		try {
			if ($stmt->execute()) {
				$inserted = true;
				break;
			}
		} catch (Throwable $e) {
			if (strpos($e->getMessage(), "Duplicate entry") === false) {
				http_response_code(500);
				echo "Error annotations insert: ".$e->getMessage();
				exit();
			}
		}

		if ($stmt->errno == 1062 || $mysqli->errno == 1062) {
			$send_annotation_id = mt_rand(1, 2147483647);
			continue;
		}

		break;
	}

	if (!$inserted) {
		http_response_code(500);
		echo "Error annotations insert: ".$stmt->error;
		exit();
	}

	echo json_encode(array("annotation_id" => $send_annotation_id));

?>
