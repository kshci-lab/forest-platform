<?php
session_start();

require "connect_db.php";


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


?>