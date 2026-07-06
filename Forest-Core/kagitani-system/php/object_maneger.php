<?php

	session_start();

	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');

	$user_id = $_SESSION['USERID'];      //ユーザID
    $map_id = $_SESSION['MAPID'];    //シートID
	$purpose = $_POST['purpose'];  //記録(record)か，更新(update)か，削除(delete)か

	$object_h_id = uniqid(rand(0,64));
	$edge_h_id = uniqid(rand(0,64));
	$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
	
	if($purpose === 'record'){
		$record_thing = $_POST['record_thing'];  //nodeか，edgeか，ネットワークとマインドマップの繋がり(connection)，オントロジーとのつながり(ontology)，採用不採用(recruit)
		//ノードの記録
		if ($record_thing === 'node') {
			$node_id = $_POST["node_id"];
			$label = $_POST["label"];
			$x = $_POST["x"];
			$y = $_POST["y"];
			$status = $_POST["status"];
			$selected_node_id = $_POST["selected_node_id"];
			$node_type = $_POST["node_type"];
		
			$sql = "INSERT INTO object_nodes 
				(object_node_id, node_id, content, object_nodes_type, node_x, node_y, status, created_at, updated_at, deleted)
				VALUES ('$node_id', '$selected_node_id', '$label', '$node_type', '$x', '$y', '$status', '$timestamp', '$timestamp', 0)";

			$h_sql = "INSERT INTO object_nodes_histories 
			(object_node_history_id, object_node_id, object_node_type, status, appeared_at, disappeared_at, content, x, y)
			VALUES ('".$object_h_id."', '".$node_id."','".$node_type."','".$status."', '".$timestamp."', NULL,'".$label."','$x', '$y')";

		
			if ($mysqli->query($sql)) {
				echo json_encode(["success" => true]);
			} else {
				// エラーログを返す
				echo json_encode([
					"success" => false,
					"error" => $mysqli->error,
					"sql" => $sql
				]);
			}

			if ($mysqli->query($h_sql)) {
				echo json_encode(["success" => true]);
			} else {
				// エラーログを返す
				echo json_encode([
					"success" => false,
					"error" => $mysqli->error,
					"sql" => $h_sql
				]);
			}
			echo json_encode([
				"success" => false,
				"step" => "histories insert",
				"h_sql" => $h_sql,
				"mysqli_error" => $mysqli->error
			]);
			exit;
		
		}else if($record_thing === 'edge'){
			//エッジの記録
			$edge_id = $_POST['edge_id'];
			$edge_start = $_POST["edge_start"];          //エッジ開始
			$edge_end = $_POST["edge_end"];              //エッジ終了
			$label = $_POST["label"] ?? '';              //エッジのラベル
			
			$selected_node_id = $_POST["selected_node_id"];
			
			// デバッグ：テーブル構造を確認
			$table_info = $mysqli->query("DESCRIBE object_edges_histories");
			$columns = [];
			while ($row = $table_info->fetch_assoc()) {
				$columns[] = $row;
			}
			error_log("object_edges_histories table structure: " . json_encode($columns));
			
			// object_edgesテーブルにエッジを保存
			$edge_sql = "INSERT INTO object_edges (object_edge_id, edge_start, edge_end, label, created_at, updated_at, deleted)
			             VALUES ('$edge_id', '$edge_start', '$edge_end', '$label', '$timestamp', '$timestamp', 0)";
			$result_edge = $mysqli->query($edge_sql);
			
			if (!$result_edge) {
				echo json_encode([
					"success" => false,
					"error" => "エッジ保存エラー: " . $mysqli->error,
					"sql" => $edge_sql
				]);
				exit;
			}
			
			// object_edges_historiesテーブルにエッジの履歴を保存
			$edge_h_sql = "INSERT INTO object_edges_histories 
			               (object_edges_history_id, object_edge_id, edge_start, edge_end, label, appeared_at, disappeared_at)
			               VALUES ('$edge_h_id', '$edge_id', '$edge_start', '$edge_end', '$label', '$timestamp', NULL)";
			
			// デバッグ用：実行前にSQL文とパラメータを出力
			error_log("Edge history SQL: " . $edge_h_sql);
			error_log("edge_h_id: " . $edge_h_id);
			error_log("edge_id: " . $edge_id);
			error_log("edge_start: " . $edge_start);
			error_log("edge_end: " . $edge_end);
			error_log("label: " . $label);
			error_log("timestamp: " . $timestamp);
			
			$result_edge_h = $mysqli->query($edge_h_sql);
			
			if (!$result_edge_h) {
				echo json_encode([
					"success" => false,
					"error" => "エッジ履歴保存エラー: " . $mysqli->error,
					"sql" => $edge_h_sql,
					"mysqli_errno" => $mysqli->errno,
					"debug_info" => [
						"edge_h_id" => $edge_h_id,
						"edge_id" => $edge_id,
						"edge_start" => $edge_start,
						"edge_end" => $edge_end,
						"label" => $label,
						"timestamp" => $timestamp
					]
				]);
			} else {
				// 成功時も詳細情報を出力
				echo json_encode([
					"success" => true,
					"message" => "エッジと履歴の両方が正常に保存されました",
					"edge_sql" => $edge_sql,
					"edge_h_sql" => $edge_h_sql,
					"affected_rows" => $mysqli->affected_rows,
					"insert_id" => $mysqli->insert_id
				]);
			}
			exit;
		}else if($record_thing === 'reflection'){
			//内省の記録
			$object_reflection_id = uniqid('reflection_', true); // edge_で始まる一意のIDを生成
			$object_node_id = $_POST["object_node_id"]; 
			$action_reason = $_POST["action_reason"];   
			$completion_reason = $_POST["completion_reason"];     
			$challenges_learnings = $_POST["challenges_learnings"];                //エッジ終了
			$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
			$mysqli->query("UPDATE object_nodes SET action_reason = '$action_reason', completion_reason = '$completion_reason',challenges_learnings = '$challenges_learnings',updated_at = '$timestamp' 
				WHERE  object_node_id = '$object_node_id' ");
			$h_sql = "INSERT INTO object_nodes_histories
				(object_node_history_id, object_node_id, object_node_type, status, appeared_at, disappeared_at, content, x, y,
				action_reason, completion_reason, challenges_learnings)
				SELECT
				'$object_h_id',
				object_node_id,
				object_nodes_type,
				status,
				'$timestamp',
				NULL,
				content,
				node_x,
				node_y,
				'$action_reason',
				'$completion_reason',
				'$challenges_learnings'
				FROM object_nodes
				WHERE object_node_id = '$object_node_id'";
			$result = $mysqli->query($h_sql);
			if ($mysqli->error) {
				// echo "Error inserting into histories: " . $mysqli->error;
			} else {
				// echo "Inserted reflection into histories successfully!";
			}
			
		}else if($record_thing === 'reason'){
			//理由の記録
			$node_id = $_POST["node_id"];
			$reason_node_id = $_POST["reason_node_id"];
			$reason_text = $_POST["reason_text"];
			
			// まず既存の履歴レコードのdisappeared_atを更新
			$update_history_sql = "UPDATE object_nodes_histories 
				SET disappeared_at = '$timestamp' 
				WHERE object_node_id = '$node_id' AND disappeared_at IS NULL";
			$mysqli->query($update_history_sql);
			
			// メインテーブルを更新
			$sql = "UPDATE object_nodes SET purpose = '$reason_text', updated_at = '$timestamp' WHERE object_node_id = '$node_id'";
			
			if ($mysqli->query($sql)) {
				// 新しい履歴レコードを追加
				$h_sql = "INSERT INTO object_nodes_histories 
					(object_node_history_id, object_node_id, object_node_type, status, appeared_at, disappeared_at, content, x, y, purpose, action_reason, completion_reason, challenges_learnings, estimated_time)
					SELECT 
						'$object_h_id',
						object_node_id,
						object_nodes_type,
						status,
						'$timestamp',
						NULL,
						content,
						node_x,
						node_y,
						purpose,
						action_reason,
						completion_reason,
						challenges_learnings,
						estimated_time
					FROM object_nodes
					WHERE object_node_id = '$node_id'";
				
				$result = $mysqli->query($h_sql);
				if ($mysqli->error) {
					echo json_encode([
						"success" => false,
						"error" => "履歴保存エラー: " . $mysqli->error,
						"sql" => $h_sql
					]);
				} else {
					echo json_encode(["success" => true]);
				}
			} else {
				echo json_encode([
					"success" => false,
					"error" => $mysqli->error,
					"sql" => $sql
				]);
			}
			
		}else if($record_thing === 'estimated_time'){
			//完了予定の記録
			$node_id = $_POST["node_id"];
			$time_node_id = $_POST["time_node_id"];
			$time_text = $_POST["time_text"];
			
			// まず既存の履歴レコードのdisappeared_atを更新
			$update_history_sql = "UPDATE object_nodes_histories 
				SET disappeared_at = '$timestamp' 
				WHERE object_node_id = '$node_id' AND disappeared_at IS NULL";
			$mysqli->query($update_history_sql);
			
			// メインテーブルを更新
			$sql = "UPDATE object_nodes SET estimated_time = '$time_text', updated_at = '$timestamp' WHERE object_node_id = '$node_id'";
			
			if ($mysqli->query($sql)) {
				// 新しい履歴レコードを追加
				$h_sql = "INSERT INTO object_nodes_histories 
					(object_node_history_id, object_node_id, object_node_type, status, appeared_at, disappeared_at, content, x, y, purpose, action_reason, completion_reason, challenges_learnings, estimated_time)
					SELECT 
						'$object_h_id',
						object_node_id,
						object_nodes_type,
						status,
						'$timestamp',
						NULL,
						content,
						node_x,
						node_y,
						purpose,
						action_reason,
						completion_reason,
						challenges_learnings,
						estimated_time
					FROM object_nodes
					WHERE object_node_id = '$node_id'";
				
				$result = $mysqli->query($h_sql);
				if ($mysqli->error) {
					echo json_encode([
						"success" => false,
						"error" => "履歴保存エラー: " . $mysqli->error,
						"sql" => $h_sql
					]);
				} else {
					echo json_encode(["success" => true]);
				}
			} else {
				echo json_encode([
					"success" => false,
					"error" => $mysqli->error,
					"sql" => $sql
				]);
			}
			
		}else if($record_thing === 'reflection'){
			//内省情報の記録
			$object_node_id = $_POST["object_node_id"];
			$action_reason = $_POST["action_reason"];
			$completion_reason = $_POST["completion_reason"];
			$challenges_learnings = $_POST["challenges_learnings"];
			
			// まず既存の履歴レコードのdisappeared_atを更新
			$update_history_sql = "UPDATE object_nodes_histories 
				SET disappeared_at = '$timestamp' 
				WHERE object_node_id = '$object_node_id' AND disappeared_at IS NULL";
			$mysqli->query($update_history_sql);
			
			// メインテーブルを更新
			$sql = "UPDATE object_nodes SET 
				action_reason = '$action_reason', 
				completion_reason = '$completion_reason', 
				challenges_learnings = '$challenges_learnings', 
				updated_at = '$timestamp' 
				WHERE object_node_id = '$object_node_id'";
			
			if ($mysqli->query($sql)) {
				// 新しい履歴レコードを追加
				$h_sql = "INSERT INTO object_nodes_histories 
					(object_node_history_id, object_node_id, object_node_type, status, appeared_at, disappeared_at, content, x, y, purpose, action_reason, completion_reason, challenges_learnings, estimated_time)
					SELECT 
						'$object_h_id',
						object_node_id,
						object_nodes_type,
						status,
						'$timestamp',
						NULL,
						content,
						node_x,
						node_y,
						purpose,
						action_reason,
						completion_reason,
						challenges_learnings,
						estimated_time
					FROM object_nodes
					WHERE object_node_id = '$object_node_id'";
				
				$result = $mysqli->query($h_sql);
				if ($mysqli->error) {
					echo json_encode([
						"success" => false,
						"error" => "履歴保存エラー: " . $mysqli->error,
						"sql" => $h_sql
					]);
				} else {
					echo json_encode(["success" => true]);
				}
			} else {
				echo json_encode([
					"success" => false,
					"error" => $mysqli->error,
					"sql" => $sql
				]);
			}
			
		}
	}else if($purpose === 'update'){
		$update_thing = $_POST['update_thing'];
		if($update_thing === 'node'){
			$select_update = $_POST['select_update'];   //座標(point) or 内容(label)
			$node_id = $_POST["node_id"];
			$node_update_thing1 = $_POST['node_update_thing1'];
			$node_update_thing2 = $_POST['node_update_thing2'];
	
			// 1. 最新の履歴IDを取得
			$latest_history_id = null;
			$sql_select_latest_history = "
				SELECT object_node_history_id
				FROM object_nodes_histories
				WHERE object_node_id = '$node_id'
				ORDER BY appeared_at DESC
				LIMIT 1
			";
			$res = $mysqli->query($sql_select_latest_history);
			if ($res && $res->num_rows > 0) {
				$row = $res->fetch_assoc();
				$latest_history_id = $row['object_node_history_id'];
		
				// 2. disappeared_at を更新
				$sql_update_disappeared = "
					UPDATE object_nodes_histories
					SET disappeared_at = '$timestamp'
					WHERE object_node_history_id = '$latest_history_id'
				";
				$mysqli->query($sql_update_disappeared);
		
				if ($mysqli->error) {
					echo "Error updating disappeared_at: " . $mysqli->error;
				}
			}


			if ($select_update === 'point') {
			
				// 3. object_nodes の座標を更新
				$update_node_sql = "
					UPDATE object_nodes 
					SET 
						node_x = '$node_update_thing1',
						node_y = '$node_update_thing2',
						updated_at = '$timestamp' 
					WHERE object_node_id = '$node_id'
				";
				$mysqli->query($update_node_sql);
				if ($mysqli->error) {
					echo "Error point update: " . $mysqli->error;
				}
			
				// 4. object_nodes_histories に新規レコードを追加（全カラムを含む）
				$insert_history_sql = "
					INSERT INTO object_nodes_histories 
						(object_node_history_id, object_node_id, object_node_type, status, appeared_at, disappeared_at, content, x, y, purpose, action_reason, completion_reason, challenges_learnings, estimated_time)
					SELECT 
						'$object_h_id',
						object_node_id,
						object_nodes_type,
						status,
						'$timestamp',
						NULL,
						content,
						'$node_update_thing1',
						'$node_update_thing2',
						purpose,
						action_reason,
						completion_reason,
						challenges_learnings,
						estimated_time
					FROM object_nodes
					WHERE object_node_id = '$node_id'
				";
				$mysqli->query($insert_history_sql);
				if ($mysqli->error) {
					echo "Error inserting new history: " . $mysqli->error;
				}
			}
			else if($select_update === 'label'){
				// メインテーブルを更新
				$mysqli->query("UPDATE object_nodes 
								SET content = '$node_update_thing1', 
									updated_at = '$timestamp' 
								WHERE object_node_id = '$node_id'");
				if($mysqli->error){
					echo "Error update content: " . $mysqli->error;
				}
			
				// 履歴レコードを追加（全カラムを含む）
				$h_sql = "INSERT INTO object_nodes_histories 
						  (object_node_history_id, object_node_id, object_node_type, status, appeared_at, disappeared_at, content, x, y, purpose, action_reason, completion_reason, challenges_learnings, estimated_time)
						  SELECT 
							'$object_h_id',
							object_node_id,
							object_nodes_type,
							status,
							'$timestamp',
							NULL,
							content,
							node_x,
							node_y,
							purpose,
							action_reason,
							completion_reason,
							challenges_learnings,
							estimated_time
						  FROM object_nodes
						  WHERE object_node_id = '$node_id'";
			
				// echo "DEBUG INSERT SQL: $h_sql\n";
			
				$result = $mysqli->query($h_sql);
				if($mysqli->error){
					echo "Error history insert: " . $mysqli->error;
				} else {
					echo "History insert successful!\n";
				}
			}else if($select_update === 'status'){

				// ① object_nodes テーブルの status を更新
				$mysqli->query("UPDATE object_nodes 
								SET status = '$node_update_thing1', 
									updated_at = '$timestamp' 
								WHERE object_node_id = '$node_id'");
				if($mysqli->error){
					echo "Error update status: " . $mysqli->error;
				}
			
				// ② object_nodes_histories テーブルで、同じ object_node_id の中で appeared_at が最新で disappeared_at が NULL の履歴を探す
				$sub_sql = "
					SELECT object_node_history_id 
					FROM object_nodes_histories 
					WHERE object_node_id = '$node_id' 
					  AND disappeared_at IS NULL 
					ORDER BY appeared_at DESC 
					LIMIT 1
				";
				$result = $mysqli->query($sub_sql);
				if ($result && $row = $result->fetch_assoc()) {
					$latest_history_id = $row['object_node_history_id'];
			
					// ③ 該当履歴の disappeared_at を現在の timestamp で更新
					$update_sql = "
						UPDATE object_nodes_histories 
						SET disappeared_at = '$timestamp' 
						WHERE object_node_history_id = '$latest_history_id'
					";
					$mysqli->query($update_sql);
					if ($mysqli->error) {
						echo "Error updating disappeared_at: " . $mysqli->error;
					}
				}
			
				// ④ object_nodes の内容を元に、新しい履歴を object_nodes_histories に挿入
				$h_sql = "INSERT INTO object_nodes_histories 
						  (object_node_history_id, object_node_id, object_node_type, status, appeared_at, disappeared_at, content, x, y)
						  SELECT 
							'$object_h_id',
							object_node_id,
							object_nodes_type,
							'$node_update_thing1',
							'$timestamp',
							NULL,
							content,
							node_x,
							node_y
						  FROM object_nodes
						  WHERE object_node_id = '$node_id'";
			
				// デバッグ用
				// echo "DEBUG INSERT SQL: $h_sql\n";
			
				$result = $mysqli->query($h_sql);
				if($mysqli->error){
					echo "Error history insert: " . $mysqli->error;
				} else {
					// echo "History insert successful!\n";
				}
			}
		}			
	}else if($purpose === 'delete'){
		$delete_thing = $_POST['delete_thing'];
		if($delete_thing === 'node'){
			$node_id = $_POST["node_id"];
			// 1. 最新の履歴IDを取得
			$latest_history_id = null;
			$sql_select_latest_history = "
				SELECT object_node_history_id
				FROM object_nodes_histories
				WHERE object_node_id = '$node_id'
				ORDER BY appeared_at DESC
				LIMIT 1
			";
			$res = $mysqli->query($sql_select_latest_history);
			if ($res && $res->num_rows > 0) {
				$row = $res->fetch_assoc();
				$latest_history_id = $row['object_node_history_id'];
		
				// 2. disappeared_at を更新
				$sql_update_disappeared = "
					UPDATE object_nodes_histories
					SET disappeared_at = '$timestamp'
					WHERE object_node_history_id = '$latest_history_id'
				";
				$mysqli->query($sql_update_disappeared);
		
				if ($mysqli->error) {
					echo "Error updating disappeared_at: " . $mysqli->error;
				}
			}
			// 1. object_nodesのdeletedフラグを立てる
			$result = $mysqli->query("UPDATE object_nodes SET deleted = 1, updated_at = '$timestamp' WHERE object_node_id = '$node_id'");
			if (!$result) {
				echo "Error (node delete): " . $mysqli->error;
				exit;
			}
	
			// 2. object_nodes_historiesに履歴を保存
			// 新しい履歴IDを作成（例としてuniqidを利用）
			$object_h_id = uniqid('history_', true);
	
			// 削除日時をdisappeared_atに入れるための日時（$timestamp）
			// 既存のノード情報を取得してINSERTする
			$h_sql = "INSERT INTO object_nodes_histories
					  (object_node_history_id, object_node_id, object_node_type, status, appeared_at, disappeared_at, content, x, y)
					  SELECT
						'$object_h_id',
						object_node_id,
						object_nodes_type,
						status,
						appeared_at,
						'$timestamp',  -- 削除日時をdisappeared_atにセット
						content,
						node_x,
						node_y
					  FROM object_nodes
					  WHERE object_node_id = '$node_id'";
	
			$result_h = $mysqli->query($h_sql);
			if (!$result_h) {
				echo "Error inserting delete history: " . $mysqli->error;
			} else {
				echo "Delete history recorded successfully.";
			}
		}else if($delete_thing === 'trigger'){
			$trigger_id = $_POST["trigger_id"];
			$result = $mysqli->query("UPDATE triggers SET deleted = 1 WHERE trigger_id = '$trigger_id'");
			if (!$result) {
				echo "Error (trigger delete): " . $mysqli->error;
			}
		} else if($delete_thing === 'edge'){
			$edge_start = $_POST["edge_start"];
			$edge_end = $_POST["edge_end"];
			$edge_id = $_POST['edge_id'];
			
			// 削除前に既存のエッジ履歴のdisappeared_atを更新
			if($edge_id !== ""){
				$update_edge_history_sql = "UPDATE object_edges_histories 
					SET disappeared_at = '$timestamp' 
					WHERE object_edge_id = '$edge_id' AND disappeared_at IS NULL";
				$mysqli->query($update_edge_history_sql);
				
				if ($mysqli->error) {
					echo "Error updating edge history disappeared_at: " . $mysqli->error;
				}
			}
			
			// エッジを削除（deletedフラグを立てる）
			if($edge_start === ""){
				$result = $mysqli->query("UPDATE object_edges SET deleted = 1, updated_at = '$timestamp' WHERE edge_end = '$edge_end'");
			} else if($edge_end === ""){
				$result = $mysqli->query("UPDATE object_edges SET deleted = 1, updated_at = '$timestamp' WHERE edge_start = '$edge_start'");
			} else {
				$result = $mysqli->query("UPDATE object_edges SET deleted = 1, updated_at = '$timestamp' WHERE object_edge_id = '$edge_id'");
			}
			
			if (!$result) {
				echo "Error (edge delete): " . $mysqli->error;
			} else {
				echo "Edge deleted successfully.";
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
