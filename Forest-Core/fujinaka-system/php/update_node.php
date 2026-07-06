<?php

	session_start();

	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');

	$updated_at = date("Y-m-d H:i:s");
	$node_history_id = uniqid(rand(0,64));
	$node_action_id = uniqid(rand(0,64));

	if($_POST["update"] == "content"){

		// TEMPORARY TABLEを用いてnode_historiesから必要箇所のみ変更し，新しいタプルとして挿入
		// 挿入順を変えるとappeared_at，disappeared_atが狂うので注意
		$sql_new_1 = "CREATE TEMPORARY TABLE tmp_node_histories AS SELECT * FROM node_histories WHERE node_history_id = (SELECT node_history_id FROM node_latest WHERE node_id = '".$_POST['id']."');";
		$sql_update = "UPDATE node_histories SET disappeared_at = '".$updated_at."' WHERE node_history_id = (SELECT node_history_id FROM tmp_node_histories);";
		$sql_new_2 = "UPDATE tmp_node_histories set node_history_id = '".$node_history_id."', content = '".$_POST['content']."', appeared_at = '".$updated_at."', disappeared_at = NULL;";
		$sql_new_3 = "INSERT INTO node_histories SELECT * FROM tmp_node_histories;";
		$sql_act = "INSERT INTO node_actions  (node_action_id, node_history_id, time, act)
						VALUES ('".$node_action_id."', '".$node_history_id."', '".$updated_at."','edit');";

		// TEMPORARY TABLEを削除
		$sql_drop = "DROP TEMPORARY TABLE IF EXISTS tmp_node_histories;";

		$result_new_1 = $mysqli->query($sql_new_1);
		if ($mysqli->error) {
			echo "Error creating temporary table: " . $mysqli->error;
		}
		$result_update = $mysqli->query($sql_update);
		if ($mysqli->error) {
			echo "Error creating temporary table: " . $mysqli->error;
		}
		$result_new_2 = $mysqli->query($sql_new_2);
		if ($mysqli->error) {
			echo "Error creating temporary table: " . $mysqli->error;
		}
		$result_new_3 = $mysqli->query($sql_new_3);
		if ($mysqli->error) {
			echo "Error creating temporary table: " . $mysqli->error;
		}
		$result_act = $mysqli->query($sql_act);
		if ($mysqli->error) {
			echo "Error creating temporary table: " . $mysqli->error;
		}
		$result_drop = $mysqli->query($sql_drop);
		if ($mysqli->error) {
			echo "Error creating temporary table: " . $mysqli->error;
		}

		//旧Forestではrootとそうでないもので分けて処理していた　なぜ？
		// if($id != "root"){

		// }else{
		// 	$sql = "UPDATE nodes SET content = '".$_POST['content']."', updated_at = '".$updated_at."' WHERE type = 'root' AND map_id = ".$_SESSION['MAPID'];
		// 	$result = $mysqli->query($sql);
		// 	if(!$result){
		// 		echo "error";
		// 	}
		// }

	}else if($_POST["update"] == "parent"){
		// TEMPORARY TABLEを用いてnode_historiesから必要箇所のみ変更し，新しいタプルとして挿入
		// 挿入順を変えるとappeared_at，disappeared_atが狂うので注意
		$sql_new_1 = "CREATE TEMPORARY TABLE tmp_node_histories AS SELECT * FROM node_histories WHERE node_history_id = (SELECT node_history_id FROM node_latest WHERE node_id = '".$_POST['id']."');";
		$sql_update = "UPDATE node_histories SET disappeared_at = '".$updated_at."' WHERE node_history_id = (SELECT node_history_id FROM tmp_node_histories);";
		$sql_new_2 = "UPDATE tmp_node_histories set node_history_id = '".$node_history_id."', parent_id = '".$_POST['parent_id']."', concept_id = '".$_POST['concept_id']."', appeared_at = '".$updated_at."', disappeared_at = NULL;";
		$sql_new_3 = "INSERT INTO node_histories SELECT * FROM tmp_node_histories;";
		$sql_act = "INSERT INTO node_actions  (node_action_id, node_history_id, time, act)
						VALUES ('".$node_action_id."', '".$node_history_id."', '".$updated_at."','edit');";

		// TEMPORARY TABLEを削除
		$sql_drop = "DROP TEMPORARY TABLE IF EXISTS tmp_node_histories;";

		$result_new_1 = $mysqli->query($sql_new_1);
		if ($mysqli->error) {
			echo "Error creating temporary table: " . $mysqli->error;
		}
		$result_update = $mysqli->query($sql_update);
		if ($mysqli->error) {
			echo "Error creating temporary table: " . $mysqli->error;
		}
		$result_new_2 = $mysqli->query($sql_new_2);
		if ($mysqli->error) {
			echo "Error creating temporary table: " . $mysqli->error;
		}
		$result_new_3 = $mysqli->query($sql_new_3);
		if ($mysqli->error) {
			echo "Error creating temporary table: " . $mysqli->error;
		}
		$result_act = $mysqli->query($sql_act);
		if ($mysqli->error) {
			echo "Error creating temporary table: " . $mysqli->error;
		}
		$result_drop = $mysqli->query($sql_drop);
		if ($mysqli->error) {
			echo "Error creating temporary table: " . $mysqli->error;
		}

	}else if($_POST["update"] == "delete"){
		$deleted = 1;

		$sql_latest_node_history_id = "SELECT node_history_id FROM node_histories WHERE node_version_id IN (SELECT node_version_id FROM node_versions WHERE node_id = '".$_POST['id']."') ORDER BY appeared_at DESC LIMIT 1";
		$result_latest_id = $mysqli->query($sql_latest_node_history_id);

		if ($result_latest_id) {
			$row = $result_latest_id->fetch_assoc();
			$latest_node_history_id = $row['node_history_id'];

			$sql_act = "INSERT INTO node_actions  (node_action_id, node_history_id, time, act)
							VALUES ('".$node_action_id."', '".$latest_node_history_id."', '".$updated_at."','deleted');";
			$sql_h_update = "UPDATE node_histories SET disappeared_at = '".$updated_at."' WHERE node_history_id = '".$latest_node_history_id."';";
			$sql_v_update = "UPDATE node_versions SET disappeared_at = '".$updated_at."' WHERE node_version_id = (SELECT node_version_id FROM node_histories WHERE node_history_id = '".$latest_node_history_id."');";
			$sql_link_update = "UPDATE map_node_links SET disappeared_at = '".$updated_at."' WHERE node_id = '".$_POST['id']."';";

			$result_act = $mysqli->query($sql_act);
			if ($mysqli->error) {
				echo "Error inserting into node_actions: " . $mysqli->error;
			}
			$result_h_update = $mysqli->query($sql_h_update);
			if ($mysqli->error) {
				echo "Error updating node_histories: " . $mysqli->error;
			}
			$result_v_update = $mysqli->query($sql_v_update);
			if ($mysqli->error) {
				echo "Error updating node_versions: " . $mysqli->error;
			}
			$result_link_update = $mysqli->query($sql_link_update);
			if ($mysqli->error) {
				echo "Error updating map_node_links: " . $mysqli->error;
			}
			
			$sql_n_update = "UPDATE nodes SET deleted = '".$deleted."' WHERE node_id = '".$_POST['id']."';";
			
			$result_n_update = $mysqli->query($sql_n_update);
			if ($mysqli->error) {
				echo "Error updating nodes: " . $mysqli->error;
			}
		}

	}else if($_POST["update"] == "map"){

		// $sql = "UPDATE maps SET updated_at = '".$updated_at."' WHERE id = '".$_POST['id']."'";
		$sql = "UPDATE maps SET updated_at = '".$updated_at."' WHERE map_id = '".$_SESSION['MAPID']."'";
		$result = $mysqli->query($sql);

	}else if($_POST["update"] == "type"){
		$sql_n = "UPDATE nodes SET node_type_id = (SELECT node_type_id FROM node_types WHERE type = '".$_POST['type']."') WHERE node_id = '".$_POST['id']."'";
		$sql_nv = "UPDATE node_versions SET node_type_id = (SELECT node_type_id FROM node_types WHERE type = '".$_POST['type']."') WHERE node_id = '".$_POST['id']."' ORDER BY appeared_at DESC LIMIT 1";
		$sql_nh = "UPDATE node_histories SET node_type_id = (SELECT node_type_id FROM node_types WHERE type = '".$_POST['type']."') WHERE node_version_id = (SELECT node_version_id from node_versions WHERE node_id = '".$_POST['id']."') ORDER BY appeared_at DESC LIMIT 1 ";
		
		$result_n = $mysqli->query($sql_n);	
		if ($mysqli->error) {
			echo "Error updating nodes: " . $mysqli->error;
		}
		$result_v_update = $mysqli->query($sql_nv);
		if ($mysqli->error) {
			echo "Error updating node_versions: " . $mysqli->error;
		}
		$result_h_update = $mysqli->query($sql_nh);
		if ($mysqli->error) {
			echo "Error updating node_histories: " . $mysqli->error;
		}
	}else if($_POST["update"] == "edit_reason"){

		$sql = "UPDATE edit_reason SET updated_at = '".$updated_at."', content = '".$_POST['content']."' WHERE node_id = '".$_POST['node_id']."'";
		$result = $mysqli->query($sql);

	}else if($_POST["update"] == "return"){

		$deleted = 0;

		$sql = "UPDATE nodes SET updated_at = '".$updated_at."', deleted = '".$deleted."' WHERE id = '".$_POST['id']."'";

		$i = 0;
		$updated_array = array();

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){

				$updated_array = $updated_array + array($i=>$row["id"]);

				$i += 1;

			}

		}

	}

?>
