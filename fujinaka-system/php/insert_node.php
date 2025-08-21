<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');

	//jsmind.js
	if($_POST["insert"] == "node"){

		$created_at = date("Y-m-d H:i:s");
		$deleted = 0;

		if($_POST["type"] == "root"){

			$id = $_SESSION["SHEETID"];

			$sql = "SELECT * FROM nodes WHERE sheet_id = '$id'";

			if($result = $mysqli->query($sql)){

				while($row = mysqli_fetch_assoc($result)){

					$root = $row["id"];

				}

			}
			if(is_array($root) || $root instanceof Countable) {
				if(count($root) === 0){

					$node_sql = "INSERT INTO nodes (id, user_id, created_at, updated_at, type, concept_id, content, x, y, deleted, sheet_id, parent_id, class)
					VALUES ('".$_POST['id']."','".$_SESSION['USERID']."','".$created_at."','".$created_at."','".$_POST['type']."','".$_POST['concept_id']."','".$_POST['content']."','".$_POST['x']."','".$_POST['y']."','".$deleted."','".$_SESSION['SHEETID']."','".$_POST['parent_id']."','".$_POST['class']."')";
					$n_result = $mysqli->query($node_sql);
					if(!$n_result){
						echo "error";
					}
	
				}
			}else{

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

			$sql = "INSERT INTO nodes (id, user_id, created_at, updated_at, type, concept_id, content, x, y, deleted, sheet_id, parent_id, class, edit_mode)
			VALUES ('$send_node_id', '".$_SESSION['USERID']."','$created_at', '$created_at','$send_type','$send_concept_id','$send_content','$send_x','$send_y','$deleted', '".$_SESSION['SHEETID']."','$send_parent_id','$send_class','$edit_mode')";
			$result = $mysqli->query($sql);
			if($result == TRUE){

				

			}else if($result == FALSE){

				echo "error";

			}

		}

	}else if($_POST["insert"] == "logic_node"){
		// logic_networkから追加されたノード専用の処理
		$send_node_id = $_POST["id"];
		$send_type = $_POST["type"]; // 常に "answer"
		$send_concept_id = $_POST["concept_id"];
		$send_content = $_POST["content"]; // logic_networkのラベル
		$send_x = $_POST["x"];
		$send_y = $_POST["y"];
		$send_parent_id = $_POST["parent_id"];
		$send_class = $_POST["class"];
		$logic_node_id = $_POST["logic_node_id"] ?? null; // 元のlogic_networkノードID
		$created_at = date("Y-m-d H:i:s");
		$deleted = 0;
		$edit_mode = 0;

		// ノードをデータベースに挿入
		$sql = "INSERT INTO nodes (id, user_id, created_at, updated_at, type, concept_id, content, x, y, deleted, sheet_id, parent_id, class, edit_mode)
		VALUES ('$send_node_id', '".$_SESSION['USERID']."','$created_at', '$created_at','$send_type','$send_concept_id','$send_content','$send_x','$send_y','$deleted', '".$_SESSION['SHEETID']."','$send_parent_id','$send_class','$edit_mode')";
		$result = $mysqli->query($sql);
		
		if($result == TRUE){
			// logic_networkから追加されたノードの関連情報を記録
			if($logic_node_id !== null){
				// テーブルが存在しない場合は作成
				$check_table = "CREATE TABLE IF NOT EXISTS logic_forest_relations (
					id varchar(45) NOT NULL PRIMARY KEY,
					user_id varchar(45) NOT NULL,
					sheet_id varchar(45) NOT NULL,
					created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
					forest_node_id varchar(45) NOT NULL,
					logic_node_id varchar(45) NOT NULL,
					relation_type varchar(20) NOT NULL DEFAULT 'logic_to_forest'
				) ENGINE=InnoDB DEFAULT CHARSET=utf8";
				$mysqli->query($check_table);
				
				$relation_id = rand();
				$relation_sql = "INSERT INTO logic_forest_relations (id, user_id, sheet_id, created_at, forest_node_id, logic_node_id, relation_type)
				VALUES ('$relation_id', '".$_SESSION['USERID']."', '".$_SESSION['SHEETID']."', '$created_at', '$send_node_id', '$logic_node_id', 'logic_to_forest')";
				$mysqli->query($relation_sql);
			}
			
			echo json_encode(array(
				"status" => "success",
				"message" => "Logic nodeが正常に追加されました",
				"node_id" => $send_node_id,
				"type" => $send_type,
				"source" => "logic_network"
			));
		} else {
			echo json_encode(array(
				"status" => "error",
				"message" => "Logic nodeの追加に失敗しました: " . $mysqli->error
			));
		}

	}else if($_POST["insert"] == "rationality"){

		$created_at = date("Y-m-d H:i:s");
		$id = rand();


		$sql = "INSERT INTO rationality_nodes(id, user_id, sheet_id, created_at, rationality_id, node_id)
		VALUES ('".$id."', '".$_SESSION["USERID"]."', '".$_SESSION['SHEETID']."', '".$created_at."', '".$_POST['rationality_id']."', '".$_POST['node_id']."')";
		$result = $mysqli->query($sql);

	}else if($_POST["insert"] == "edit_reason"){

		$created_at = date("Y-m-d H:i:s");
		$id = rand();

		$sql = "INSERT INTO edit_reason(id, user_id, sheet_id, created_at, updated_at, node_id, content)
		VALUES ('".$id."', '".$_SESSION['USERID']."','".$_SESSION['SHEETID']."', '".$created_at."', '".$created_at."', '".$_POST['node_id']."', '".$_POST['content']."')";
		$result = $mysqli->query($sql);

	}

?>
