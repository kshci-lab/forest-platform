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
		$process_node_id = isset($_POST['process_node_id']) ? $_POST['process_node_id'] : '';
		$selected_contents = isset($_POST['selected_contents']) ? $_POST['selected_contents'] : '';
		$thought_experience_node_id = isset($_POST['thought_experience_node_id']) ? $_POST['thought_experience_node_id'] : '';
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

		$stage1 = $mysqli->real_escape_string(implode("\n", $stage1_items));
		$stage2 = $mysqli->real_escape_string(implode("\n", $stage2_items));
		$stage3 = $mysqli->real_escape_string(implode("\n", $stage3_items));

		// knowledge_fragment_content は現在の title を入れる
		$kf_content = $knowledge_fragment_title === NULL ? NULL : $mysqli->real_escape_string($knowledge_fragment_title);

		// 値準備
		$selected_sql = "'" . $mysqli->real_escape_string($selected_contents) . "'";
		$kf_sql = $kf_content === NULL ? "''" : "'" . $mysqli->real_escape_string($kf_content) . "'";
		$stage1_sql = "'" . $mysqli->real_escape_string($stage1) . "'";
		$stage2_sql = $stage2 === '' ? "NULL" : "'" . $mysqli->real_escape_string($stage2) . "'";
		$stage3_sql = $stage3 === '' ? "NULL" : "'" . $mysqli->real_escape_string($stage3) . "'";
		$user_id_int = isset($user_id) ? intval($user_id) : null;
		$user_sql = $user_id_int === null ? 'NULL' : $user_id_int;
		$thought_node_sql = ($thought_experience_node_id === '' || $thought_experience_node_id === null) ? "NULL" : "'" . $mysqli->real_escape_string($thought_experience_node_id) . "'";

		// PHP側で整数IDを生成して挿入する（競合を避けるためトランザクションで最後のIDをロックして +1）
		if(!$mysqli->begin_transaction()){
			// begin_transaction が使えない場合は普通にINSERTしてinsert_idを使う
			$insert_sql = "INSERT INTO externalized_contents (remarked_utterance_id, used_remarked_utterance, thought_experience_node_id, selected_contents, knowledge_fragment_content, user_id, stage1, stage2, stage3, created_at, updated_at, deleted, discussed) VALUES (NULL, 0, $thought_node_sql, $selected_sql, $kf_sql, " . ($user_sql === 'NULL' ? 'NULL' : $user_sql) . ", $stage1_sql, $stage2_sql, $stage3_sql, '$timestamp', '$timestamp', 0, 'YET')";
			$mysqli->query($insert_sql);
			if($mysqli->error){
				echo "Error externalized_contents insert: " . $mysqli->error;
				exit;
			}
			$ec_id = (int)$mysqli->insert_id;
		}else{
			// ロックして現在最大のID取得
			$maxres = $mysqli->query("SELECT externalized_contents_id FROM externalized_contents ORDER BY externalized_contents_id DESC LIMIT 1 FOR UPDATE");
			if($maxres && $row = $maxres->fetch_assoc()){
				$new_id = intval($row['externalized_contents_id']) + 1;
			}else{
				$new_id = 1;
			}

			$insert_sql = "INSERT INTO externalized_contents (externalized_contents_id, remarked_utterance_id, used_remarked_utterance, thought_experience_node_id, selected_contents, knowledge_fragment_content, user_id, stage1, stage2, stage3, created_at, updated_at, deleted, discussed) VALUES (" . $new_id . ", NULL, 0, $thought_node_sql, $selected_sql, $kf_sql, " . ($user_sql === 'NULL' ? 'NULL' : $user_sql) . ", $stage1_sql, $stage2_sql, $stage3_sql, '$timestamp', '$timestamp', 0, 'YET')";
			$mysqli->query($insert_sql);
			if($mysqli->error){
				$mysqli->rollback();
				echo "Error externalized_contents insert: " . $mysqli->error;
				exit;
			}
			$mysqli->commit();
			$ec_id = $new_id;
		}

		if($group_id !== ''){
			$shared_id = rand();
			$group_id_sql = $mysqli->real_escape_string($group_id);
			$mysqli->query("INSERT INTO shared_nodes (id, externalized_contents_id, knowledge_group_id, created_at, updated_at, deleted) 
				VALUES ('$shared_id', '$ec_id', '$group_id_sql', '$timestamp', '$timestamp', 0)");
			if($mysqli->error){
				echo "Error shared_nodes insert: " . $mysqli->error;
				exit;
			}
		}

		echo json_encode(['status'=>'ok', 'externalized_contents_id'=>$ec_id]);
		exit;
	}

?>
