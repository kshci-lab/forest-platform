<?php

	session_start();

	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');

	$user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
	$purpose = $_POST['purpose'];  //記録(record)か，更新(update)か，削除(delete)か

	$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

	function trigger_process_edge_id($trigger_id, $direction){
		$prefix = ($direction === 'from') ? 'tf_' : 'tt_';
		return $prefix . substr(hash('sha256', (string)$trigger_id), 0, 42);
	}

	function upsert_trigger_process_edge($mysqli, $edge_id, $edge_start, $edge_end, $timestamp, &$error_message){
		$sql = "INSERT INTO process_edges (process_edge_id, edge_start, edge_end, label, created_at, updated_at, deleted)
				VALUES (?, ?, ?, '', ?, ?, 0)
				ON DUPLICATE KEY UPDATE
					edge_start = VALUES(edge_start),
					edge_end = VALUES(edge_end),
					label = '',
					updated_at = VALUES(updated_at),
					deleted = 0";
		if(!($stmt = $mysqli->prepare($sql))){
			$error_message = $mysqli->error;
			return false;
		}
		$stmt->bind_param('sssss', $edge_id, $edge_start, $edge_end, $timestamp, $timestamp);
		$ok = $stmt->execute();
		if(!$ok){
			$error_message = $stmt->error;
		}
		$stmt->close();
		return $ok;
	}
	
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
			$trigger_id = isset($_POST["trigger_id"]) ? trim((string)$_POST["trigger_id"]) : '';
			$activity_id = isset($_POST["activity_id"]) ? trim((string)$_POST["activity_id"]) : '';
			$node_version_from = isset($_POST["from"]) ? trim((string)$_POST["from"]) : (isset($_POST["node_version_from"]) ? trim((string)$_POST["node_version_from"]) : '');
			$node_version_to = isset($_POST["to"]) ? trim((string)$_POST["to"]) : (isset($_POST["node_version_to"]) ? trim((string)$_POST["node_version_to"]) : '');
			$activity_time = isset($_POST["activity_time"]) ? trim((string)$_POST["activity_time"]) : '';
			$activity_type = isset($_POST["activity_type"]) ? trim((string)$_POST["activity_type"]) : '';
			$content = isset($_POST["content"]) ? (string)$_POST["content"] : '';
			$x = isset($_POST["x"]) && is_numeric($_POST["x"]) ? (int)$_POST["x"] : 0;
			$y = isset($_POST["y"]) && is_numeric($_POST["y"]) ? (int)$_POST["y"] : 0;
			$trigger_id = function_exists('mb_substr') ? mb_substr($trigger_id, 0, 45, 'UTF-8') : substr($trigger_id, 0, 45);
			$activity_id = function_exists('mb_substr') ? mb_substr($activity_id, 0, 45, 'UTF-8') : substr($activity_id, 0, 45);
			$node_version_from = function_exists('mb_substr') ? mb_substr($node_version_from, 0, 45, 'UTF-8') : substr($node_version_from, 0, 45);
			$node_version_to = function_exists('mb_substr') ? mb_substr($node_version_to, 0, 45, 'UTF-8') : substr($node_version_to, 0, 45);
			$activity_type = function_exists('mb_substr') ? mb_substr($activity_type, 0, 100, 'UTF-8') : substr($activity_type, 0, 100);
			$content = function_exists('mb_substr') ? mb_substr($content, 0, 999, 'UTF-8') : substr($content, 0, 999);
			if($trigger_id === ''){
				echo "Error triggers insert: trigger_id is empty";
				exit;
			}
			if($node_version_from === ''){
				$node_version_from = '0';
			}
			if($activity_time === ''){
				$activity_time = null;
			}
			$sql = "INSERT INTO triggers (trigger_id, activity_id, `from`, `to`, activity_time, activity_type, content, add_time, x, y, deleted)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
					ON DUPLICATE KEY UPDATE
						activity_id = VALUES(activity_id),
						`from` = VALUES(`from`),
						`to` = VALUES(`to`),
						activity_time = VALUES(activity_time),
						activity_type = VALUES(activity_type),
						content = VALUES(content),
						add_time = VALUES(add_time),
						x = VALUES(x),
						y = VALUES(y),
						deleted = 0";
			$mysqli->begin_transaction();
			$save_ok = false;
			$error_message = '';
			if($stmt = $mysqli->prepare($sql)){
				$stmt->bind_param(
					'ssssssssii',
					$trigger_id,
					$activity_id,
					$node_version_from,
					$node_version_to,
					$activity_time,
					$activity_type,
					$content,
					$timestamp,
					$x,
					$y
				);
				$save_ok = $stmt->execute();
				if(!$save_ok){
					$error_message = $stmt->error;
				}
				$stmt->close();
			}else{
				$error_message = $mysqli->error;
			}

			if($save_ok && $node_version_from !== '' && $node_version_from !== '0'){
				$from_edge_id = trigger_process_edge_id($trigger_id, 'from');
				$save_ok = upsert_trigger_process_edge($mysqli, $from_edge_id, $node_version_from, $trigger_id, $timestamp, $error_message);
			}
			if($save_ok && $node_version_to !== ''){
				$to_edge_id = trigger_process_edge_id($trigger_id, 'to');
				$save_ok = upsert_trigger_process_edge($mysqli, $to_edge_id, $trigger_id, $node_version_to, $timestamp, $error_message);
			}

			if($save_ok){
				$mysqli->commit();
			}else{
				$mysqli->rollback();
				http_response_code(500);
				echo "Error trigger/process_edges insert: " . $error_message;
			}
		}
	}else if($purpose === 'update'){
		$update_thing = $_POST['update_thing'];
		if($update_thing === 'trigger_point'){
			$trigger_id = isset($_POST["trigger_id"]) ? trim((string)$_POST["trigger_id"]) : '';
			$x = isset($_POST["x"]) && is_numeric($_POST["x"]) ? (int)$_POST["x"] : 0;
			$y = isset($_POST["y"]) && is_numeric($_POST["y"]) ? (int)$_POST["y"] : 0;
			if($trigger_id !== ''){
				if($stmt = $mysqli->prepare("UPDATE triggers SET x = ?, y = ? WHERE trigger_id = ? AND deleted = 0")){
					$stmt->bind_param('iis', $x, $y, $trigger_id);
					if(!$stmt->execute()){
						echo "Error trigger point update: " . $stmt->error;
					}
					$stmt->close();
				}else{
					echo "Error trigger point prepare: " . $mysqli->error;
				}
			}
		}else if($update_thing === 'node'){
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
			$node_id = isset($_POST["node_id"]) ? trim((string)$_POST["node_id"]) : '';
			if($node_id === ''){
				http_response_code(400);
				echo "Error (node delete): node_id is empty";
			}else if($stmt = $mysqli->prepare("UPDATE process_nodes SET deleted = 1, updated_at = ? WHERE process_node_id = ?")){
				$stmt->bind_param('ss', $timestamp, $node_id);
				if(!$stmt->execute()){
					http_response_code(500);
					echo "Error (node delete): " . $stmt->error;
				}
				$stmt->close();
			}else{
				http_response_code(500);
				echo "Error (node delete): " . $mysqli->error;
			}
		}else if($delete_thing === 'trigger'){
			$trigger_id = isset($_POST["trigger_id"]) ? trim((string)$_POST["trigger_id"]) : '';
			$from_edge_id = trigger_process_edge_id($trigger_id, 'from');
			$to_edge_id = trigger_process_edge_id($trigger_id, 'to');
			$delete_ok = ($trigger_id !== '');
			$error_message = '';
			$mysqli->begin_transaction();
			if($delete_ok && ($stmt = $mysqli->prepare("UPDATE triggers SET deleted = 1 WHERE trigger_id = ?"))){
				$stmt->bind_param('s', $trigger_id);
				$delete_ok = $stmt->execute();
				if(!$delete_ok) $error_message = $stmt->error;
				$stmt->close();
			}else if($delete_ok){
				$delete_ok = false;
				$error_message = $mysqli->error;
			}
			if($delete_ok && ($stmt = $mysqli->prepare("UPDATE process_edges SET deleted = 1, updated_at = ? WHERE process_edge_id IN (?, ?)"))){
				$stmt->bind_param('sss', $timestamp, $from_edge_id, $to_edge_id);
				$delete_ok = $stmt->execute();
				if(!$delete_ok) $error_message = $stmt->error;
				$stmt->close();
			}else if($delete_ok){
				$delete_ok = false;
				$error_message = $mysqli->error;
			}
			if($delete_ok){
				$mysqli->commit();
			}else{
				$mysqli->rollback();
				http_response_code(500);
				echo "Error (trigger/process edge delete): " . $error_message;
			}
		}else if($delete_thing === 'edge'){
			$edge_start = isset($_POST["edge_start"]) ? trim((string)$_POST["edge_start"]) : '';
			$edge_end = isset($_POST["edge_end"]) ? trim((string)$_POST["edge_end"]) : '';
			$edge_id = isset($_POST['edge_id']) ? trim((string)$_POST['edge_id']) : '';
			$stmt = null;
			$value = '';
			if($edge_start === '' && $edge_end !== ''){
				$stmt = $mysqli->prepare("UPDATE process_edges SET deleted = 1, updated_at = ? WHERE edge_end = ?");
				$value = $edge_end;
			}else if($edge_end === '' && $edge_start !== ''){
				$stmt = $mysqli->prepare("UPDATE process_edges SET deleted = 1, updated_at = ? WHERE edge_start = ?");
				$value = $edge_start;
			}else if($edge_id !== ''){
				$stmt = $mysqli->prepare("UPDATE process_edges SET deleted = 1, updated_at = ? WHERE process_edge_id = ?");
				$value = $edge_id;
			}else{
				http_response_code(400);
				echo "Error (edge delete): edge identifier is empty";
			}

			if($stmt){
				$stmt->bind_param('ss', $timestamp, $value);
				if(!$stmt->execute()){
					http_response_code(500);
					echo "Error (edge delete): " . $stmt->error;
				}
				$stmt->close();
			}else if(http_response_code() < 400){
				http_response_code(500);
				echo "Error (edge delete): " . $mysqli->error;
			}
		}
	}else if($purpose === 'share_fragment'){
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
		$experience_type_sql = $experience_type === '' ? "NULL" : "'" . $mysqli->real_escape_string($experience_type) . "'";

		// PHP側で整数IDを生成して挿入する（競合を避けるためトランザクションで最後のIDをロックして +1）
		if(!$mysqli->begin_transaction()){
			// begin_transaction が使えない場合は普通にINSERTしてinsert_idを使う
			$insert_sql = "INSERT INTO experience_knowledges (remarked_utterance_id, used_remarked_utterance, thought_experience_node_id, experience_type, selected_contents, knowledge_fragment_content, user_id, stage1, stage2, stage3, created_at, updated_at, deleted, discussed) 
							VALUES (NULL, 0, $thought_node_sql, $experience_type_sql, $selected_sql, $kf_sql, " . ($user_sql === 'NULL' ? 'NULL' : $user_sql) . ", $stage1_sql, $stage2_sql, $stage3_sql, '$timestamp', '$timestamp', 0, 'YET')";
			$mysqli->query($insert_sql);
			if($mysqli->error){
				echo "Error experience_knowledges insert: " . $mysqli->error;
				exit;
			}
			$ec_id = (int)$mysqli->insert_id;
		}else{
			// ロックして現在最大のID取得
			$maxres = $mysqli->query("SELECT experience_knowledge_id FROM experience_knowledges ORDER BY experience_knowledge_id DESC LIMIT 1 FOR UPDATE");
			if($maxres && $row = $maxres->fetch_assoc()){
				$new_id = intval($row['experience_knowledge_id']) + 1;
			}else{
				$new_id = 1;
			}

			$insert_sql = "INSERT INTO experience_knowledges (experience_knowledge_id, remarked_utterance_id, used_remarked_utterance, thought_experience_node_id, experience_type, selected_contents, knowledge_fragment_content, user_id, stage1, stage2, stage3, created_at, updated_at, deleted, discussed) 
							VALUES (" . $new_id . ", NULL, 0, $thought_node_sql, $experience_type_sql, $selected_sql, $kf_sql, " . ($user_sql === 'NULL' ? 'NULL' : $user_sql) . ", $stage1_sql, $stage2_sql, $stage3_sql, '$timestamp', '$timestamp', 0, 'YET')";
			$mysqli->query($insert_sql);
			if($mysqli->error){
				$mysqli->rollback();
				echo "Error experience_knowledges insert: " . $mysqli->error;
				exit;
			}
			$mysqli->commit();
			$ec_id = $new_id;
		}

		if($group_id !== ''){
			$shared_id = rand();
			$group_id_sql = $mysqli->real_escape_string($group_id);
			$mysqli->query("INSERT INTO shared_nodes (id, experience_knowledge_id, knowledge_group_id, created_at, updated_at, deleted) 
				VALUES ('$shared_id', '$ec_id', '$group_id_sql', '$timestamp', '$timestamp', 0)");
			if($mysqli->error){
				echo "Error shared_nodes insert: " . $mysqli->error;
				exit;
			}
		}

		echo json_encode(['status'=>'ok', 'experience_knowledge_id'=>$ec_id]);
		exit;
	}

?>
