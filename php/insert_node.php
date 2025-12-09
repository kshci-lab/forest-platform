<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');

	//jsmind.js
	if($_POST["insert"] == "node"){

		$created_at = date("Y-m-d H:i:s");
		$deleted = 0;
		$id = $_SESSION["MAPID"];

		if($_POST["type"] == 0){


			$sql = "SELECT * FROM nodes WHERE node_id IN (SELECT node_id FROM map_node_links WHERE map_id = ".$id.") AND deleted = 0";

			if($result = $mysqli->query($sql)){

				while($row = mysqli_fetch_assoc($result)){

					$root = $row["node_id"];

				}

			}

			if(count($root) === 0){

				$node_sql = "INSERT INTO nodes (id, user_id, created_at, updated_at, type, concept_id, content, x, y, deleted, map_id, parent_id, class)
				VALUES ('".$_POST['id']."','".$_SESSION['USERID']."','".$created_at."','".$created_at."','".$_POST['type']."','".$_POST['concept_id']."','".$_POST['content']."','".$_POST['x']."','".$_POST['y']."','".$deleted."','".$_SESSION['MAPID']."','".$_POST['parent_id']."','".$_POST['class']."')";
				$n_result = $mysqli->query($node_sql);
				if(!$n_result){
					echo "error";
				}

			}

		}else{
			$send_node_id = $_POST["id"]; //yoshioka
			$send_type = $_POST["type"]; //yoshioka
			$send_concept_id = $_POST["concept_id"]; //yoshioka
			$send_content = $_POST["content"]; //yoshioka
			$send_x = $_POST["x"]; //yoshioka
			$send_y = $_POST["y"]; //yoshioka
			$send_parent_id = $_POST["parent_id"]; //yoshioka
			$send_class = $_POST["class"]; //yoshioka
			$created_at = date("Y-m-d H:i:s");
			$deleted = 0;
			$edit_mode = 0;

			$sql = "INSERT INTO nodes (id, user_id, created_at, updated_at, type, concept_id, content, x, y, deleted, map_id, parent_id, class, edit_mode)
			VALUES ('$send_node_id', '".$_SESSION['USERID']."','$created_at', '$created_at','$send_type','$send_concept_id','$send_content','$send_x','$send_y','$deleted', '".$_SESSION['MAPID']."','$send_parent_id','$send_class','$edit_mode')";
			$result = $mysqli->query($sql);
			if($result == TRUE){

				echo "true";
				print_r("test");

			}else if($result == FALSE){

				echo "error";

			}
			//hatakeyama　h_nodesにINSERTする
			$sql_hn = "INSERT INTO h_nodes (node_id, created_at, deleted_at, type, concept_id, user_id, map_id, deleted)
			VALUES ('$send_node_id', '$created_at', NULL, '$send_type', '$send_concept_id', '".$_SESSION['USERID']."', '".$_SESSION['MAPID']."', '$deleted')";
			$result_hn = $mysqli->query($sql_hn);

		}

	}else if($_POST["insert"] == "rationality"){

		$created_at = date("Y-m-d H:i:s");
		$id = rand();


		$sql = "INSERT INTO rationality_nodes(id, created_at, rationality_id, node_id)
		VALUES ('".$id."', NOW(), '".$_POST['rationality_id']."', '".$_POST['node_id']."')";
		$result = $mysqli->query($sql);

	}else if($_POST["insert"] == "edit_reason"){

		$created_at = date("Y-m-d H:i:s");
		$id = rand();

		$sql = "INSERT INTO edit_reason(id, user_id, map_id, created_at, updated_at, node_id, content)
		VALUES ('".$id."', '".$_SESSION['USERID']."','".$_SESSION['MAPID']."', '".$created_at."', '".$created_at."', '".$_POST['node_id']."', '".$_POST['content']."')";
		$result = $mysqli->query($sql);

	}

?>
