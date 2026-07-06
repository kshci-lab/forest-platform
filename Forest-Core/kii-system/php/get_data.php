<?php

	session_start();

	require "connect_db.php";

	if($_POST["val"] == "rationality"){
		$map_id = $_SESSION["MAPID"];
		$rationality_id = $_POST["rationality_id"];

		$sql = "SELECT * FROM rationality_nodes WHERE rationality_id = '".$rationality_id."'";

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
		$sql = "SELECT * FROM node_latest WHERE node_id = '".$_POST["node_id"]."'";
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

		if($mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){

				$updated_array = $updated_array + array($i=>$row["node_id"]);

				$i += 1;

			}

		}
	}
	// js/create_other_question.jsで使用

	// else if($_POST["val"] == "get_other_answer"){

	// 	$node_id = $_POST["id"];

	// 	$i = 0;

	// 	$sql = "SELECT user_id, content, parent_map_id, map_id FROM nodes WHERE id = '$node_id'";
	// 	if ($result = $mysqli->query($sql)) {

    //         while ($row = mysqli_fetch_assoc($result)) {

	// 			$sql2 = "SELECT name FROM users WHERE user_id = '".$row['user_id']."'";
	// 			$result2 = $mysqli->query($sql2);

	// 			$row2 = mysqli_fetch_assoc($result2);
	// 			$user_array[0] = array(
	// 				"name" => $row2["name"]
	// 			);

	// 			//後でcheckしよう kawa
	// 			$sql3 = "SELECT summary FROM maps WHERE map_id ='".$row['parent_map_id']."'";
	// 			$result3 = $mysqli->query($sql3);

	// 			$row3 = mysqli_fetch_assoc($result3);
	// 			$summary_array[0] = array(
	// 				"summary" => $row3["summary"]
	// 			);

    //             $data_array[$i] = array(
	// 				"parent_map_id" => $row["parent_map_id"],
	// 				"map_id" => $row["map_id"],
    //                 "content" => $row["content"],
	// 				"name" => $user_array[0]["name"],
	// 				"summary" => $summary_array[0]["summary"]

    //             );

    //             $i++;
    //         }
    //         echo json_encode($data_array);
    //     }
	// }

// MTタイムを選択した時の処理
	else if($_POST["val"] == "time"){

		echo "ok";

	}

?>
