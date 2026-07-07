<?php

	session_start();

	require "connect_db.php";

	if($_POST["val"] == "rationality"){
		$map_id = $_SESSION["MAPID"];
		$rationality_id = $_POST["rationality_id"];

		$sql = "SELECT rationality_id, node_id FROM rationality_nodes WHERE node_id IN (SELECT node_id FROM map_node_links WHERE map_id='$map_id') AND deleted='0'";

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

		$sql = "SELECT * FROM nodes WHERE user_id = ".$_SESSION["USERID"]." AND map_id = ".$_SESSION["MAPID"]." AND updated_at = (select max(updated_at) from nodes)";
		

		$i = 0;
		$updated_array = array();

		if($$mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){

				$updated_array = $updated_array + array($i=>$row["id"]);

				$i += 1;

			}

		}

		echo json_encode($updated_array);

// MTタイムを選択した時の処理
	}else if($_POST["val"] == "time"){

		echo "ok";

	}

?>
