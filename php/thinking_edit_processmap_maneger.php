<?php

	session_start();

	require("connect_db.php");
	require_once("ok_core_bridge.php");
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
			
			$selected_node_id = $_POST["selected_node_id"];
			$mysqli->query("INSERT INTO process_edges (process_edge_id, edge_start, edge_end, label, created_at, updated_at, deleted)
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
	}else if($purpose === 'share_fragment'){
		header('Content-Type: application/json; charset=UTF-8');
		$process_node_id = isset($_POST['process_node_id']) ? $_POST['process_node_id'] : '';
		$selected_contents = isset($_POST['selected_contents']) ? $_POST['selected_contents'] : '';
		$thought_experience_node_id = isset($_POST['thought_experience_node_id']) ? $_POST['thought_experience_node_id'] : '';
		$experience_type = isset($_POST['experience_type']) ? $_POST['experience_type'] : '';
		$contents_json = isset($_POST['contents']) ? $_POST['contents'] : '[]';
		$knowledge_fragment_title = isset($_POST['knowledge_fragment_title']) ? $_POST['knowledge_fragment_title'] : NULL;
		$group_id = isset($_POST['group_id']) ? $_POST['group_id'] : '';

		// stage1/2/3 に振り分け
		$stage1_items = [];
		$stage2_items = [];
		$stage3_items = [];

		$contents = json_decode($contents_json, true);
		if(is_array($contents)){
			foreach($contents as $c){
				$type = isset($c['type']) ? $c['type'] : '';
				$content = isset($c['content']) ? $c['content'] : '';
				if(trim($content) === '') continue;
				switch($type){
					case 'stage1':
						$stage1_items[] = $content;
						break;
					case 'stage2':
						$stage2_items[] = $content;
						break;
					case 'stage3':
						$stage3_items[] = $content;
						break;
					default:
						// 未指定のtypeはstage1へ
						$stage1_items[] = $content;
				}
			}
		}

		$stage1 = implode("\n", $stage1_items);
		$stage2 = implode("\n", $stage2_items);
		$stage3 = implode("\n", $stage3_items);
		$user_id_int = intval($user_id);

		try {
			$result = kf_sync_create_fragment($mysqli, [
				'user_id' => $user_id_int,
				'sso_sub' => isset($_SESSION['HCIMLAB_SSO_SUB']) ? (string)$_SESSION['HCIMLAB_SSO_SUB'] : '',
				'map_id' => isset($map_id) ? intval($map_id) : 0,
				'group_id' => intval($group_id),
				'selected_contents' => $selected_contents,
				'knowledge_fragment_content' => $knowledge_fragment_title === NULL ? '' : $knowledge_fragment_title,
				'stage1' => $stage1,
				'stage2' => $stage2,
				'stage3' => $stage3,
				'thought_experience_node_id' => $thought_experience_node_id,
				'experience_type' => $experience_type,
				'timestamp' => $timestamp
			]);

			echo json_encode([
				'status' => 'ok',
				'experience_knowledge_id' => $result['experience_knowledge_id'],
				'context_package_id' => $result['context_package_id'],
				'source_revision' => $result['source_revision'],
				'outbox_id' => $result['outbox_id'],
				'ok_core' => $result['ok_core']
			], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
		} catch (Throwable $error) {
			http_response_code(500);
			echo json_encode([
				'status' => 'error',
				'message' => $error->getMessage()
			], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
		}
		exit;
	}

?>
