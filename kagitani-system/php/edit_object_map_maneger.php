<?php

	session_start();

	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');

	$user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
	$purpose = $_POST['purpose'];  //記録(record)か，更新(update)か，削除(delete)か

	$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
	
	if($purpose === 'record'){
		$record_thing = $_POST['record_thing'];  //nodeか，edgeか，ネットワークとマインドマップの繋がり(connection)，オントロジーとのつながり(ontology)，採用不採用(recruit)
		//ノードの記録
		if($record_thing === 'node'){
			$node_id = $_POST["node_id"]; //ノードID
			$label = $_POST["label"];    //ラベル
			$x = $_POST["x"];  //x座標
			$y = $_POST["y"];  //y座標
			$selected_node_id = $_POST["selected_node_id"];
			$node_type = $_POST["node_type"];
			$mysqli->query("INSERT INTO process_nodes (process_node_id, node_id, content, process_node_type, node_x, node_y, created_at, updated_at, deleted)
			                VALUES ('$node_id', '$selected_node_id', '$label', '$node_type', '$x', '$y', '$timestamp',  '$timestamp', 0)");
		}else if($record_thing === 'edge'){
			//エッジの記録
			$edge_id = $_POST['edge_id'];
			$edge_start = $_POST["edge_start"];          //エッジ開始
			$edge_end = $_POST["edge_end"];              //エッジ終了
			$mysqli->query("INSERT INTO object_edges (object_edge_id, edge_start, edge_end, label, created_at, updated_at, deleted)
			                VALUES ('$edge_id', '$edge_start', '$edge_end', '', '$timestamp', '$timestamp', 0)");
		}else if($record_thing === 'trigger'){
			
			$mysqli->query("INSERT INTO triggers (trigger_id, activity_id, node_version_from, node_version_to, activity_time, activity_type, content, add_time, x, y, deleted)
				VALUES ('".$_POST["trigger_id"]."', '".$_POST["activity_id"]."', '".$_POST["node_version_from"]."', '".$_POST["node_version_to"]."', '".$_POST["activity_time"]."', '".$_POST["activity_type"]."', '".$_POST["content"]."', '$timestamp', ".$_POST["x"].", ".$_POST["y"].", 0);");
			if($mysqli->error){
				echo "Error triggers insert: " . $mysqli->error;
			}
		}
	}else if($purpose === 'update'){
		$update_thing = $_POST['update_thing'];
		if($update_thing === 'node'){
			$select_update = $_POST['select_update'];   //ノードの変更するもの(座標(point),内容(label))
			$node_id = $_POST["node_id"]; //ノードID
			$node_update_thing1 = $_POST['node_update_thing1'];
			$node_update_thing2 = $_POST['node_update_thing2'];
			if($select_update === 'point'){
				
				$mysqli->query("UPDATE process_nodes SET node_x = '$node_update_thing1', node_y = '$node_update_thing2', updated_at = '$timestamp' WHERE process_node_id = '$node_id'");
				if($mysqli->error){
					echo "Error point update: " . $mysqli->error;
				}
			}else if($select_update === 'label'){
				
				$mysqli->query("UPDATE process_nodes SET content = '$node_update_thing1', updated_at = '$timestamp' WHERE process_node_id = '$node_id'");
				if($mysqli->error){
					echo "Error update content: " . $mysqli->error;
				}
			}
		}

	}else if($purpose === 'delete'){
		$delete_thing = $_POST['delete_thing'];
		if($delete_thing === 'node'){
			$node_id = $_POST["node_id"];
			$mysqli->query("UPDATE process_nodes SET deleted = 1, updated_at = '$timestamp' WHERE process_node_id = '$node_id'");
			if (!$mysqli->query($query)) {
				echo "Error (node delete): " . $mysqli->error;
			}
		}else if($delete_thing === 'trigger'){
			$trigger_id = $_POST["trigger_id"];
			$mysqli->query("UPDATE triggers SET deleted = 1 WHERE trigger_id = '$trigger_id'");
			if (!$mysqli->query($query)) {
				echo "Error (trigger delete): " . $mysqli->error;
			}
		}else if($delete_thing === 'edge'){
			$edge_start = $_POST["edge_start"];          //エッジ開始
			$edge_end = $_POST["edge_end"]; 
			$edge_id = $_POST['edge_id'];
			if($edge_start === ""){
				$mysqli->query("UPDATE process_edges SET deleted = 1, updated_at = '$timestamp' WHERE edge_end = '$edge_end'");
			}else if($edge_end === ""){
				$mysqli->query("UPDATE process_edges SET deleted = 1, updated_at = '$timestamp' WHERE edge_start = '$edge_start'");
			}else{
				$mysqli->query("UPDATE process_edges SET deleted = 1, updated_at = '$timestamp' WHERE process_edge_id = '$edge_id'");
			}

			if (!$mysqli->query($query)) {
				echo "Error (edge delete): " . $mysqli->error;
			}
		}
	}

	

	//時間設定はいる
	
	// //クエリ($sql)のエラー処理
    // if($sql == TRUE){
	// 	echo "true";
	// 	error_log('$sql成功しています！'.$timestamp, 0);
	// }else if($sql == FALSE){
	// 	error_log($sql.'$sql失敗です', 0);
	// 	// error_log('失敗しました。'.mysqli_error($link), 0);
	// }else{
	// 	error_log('$sql不明なエラーです', 0);
	// }
    // //php($result)のエラー処理
    // if($result == TRUE){
	// 	echo "true";
	// 	error_log('$result成功しています！'.$timestamp, 0);
	// }else if($result == FALSE){
	// 	error_log($result.'$result失敗です'.$mysqli->error, 0);
	// 	// error_log('失敗しました。'.mysqli_error($link), 0);
	// }else{
	// 	error_log('$result不明なエラーです', 0);
	// }
?>
