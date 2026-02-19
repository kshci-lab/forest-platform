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

			// activity: 1 = 手段をrecordする時
			$h_sql = "INSERT INTO object_nodes_histories 
			(object_node_history_id, object_node_id, object_node_type, status, appeared_at, disappeared_at, content, x, y, activity)
			VALUES ('".$object_h_id."', '".$node_id."','".$node_type."','".$status."', '".$timestamp."', NULL,'".$label."','$x', '$y', 1)";

		
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

			// 重複チェック（record->node: activity=1）
			$dup_check_sql = "SELECT COUNT(*) AS cnt FROM object_nodes_histories WHERE object_node_id = '$node_id' AND appeared_at = '$timestamp' AND activity = 1";
			$dup_res = $mysqli->query($dup_check_sql);
			$dup_count = 0;
			if ($dup_res) {
				$row_dup = $dup_res->fetch_assoc();
				$dup_count = (int)$row_dup['cnt'];
			}
			if ($dup_count === 0) {
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
			} else {
				error_log("Skip duplicate history insert for node $node_id at $timestamp (record->node)");
				echo json_encode(["success" => true, "note" => "duplicate skipped"]);
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
		}else if($record_thing === 'reason'){
			// 理由（purpose）の記録: 主ノード(object_nodes.object_node_id)に対して purpose を保存し、履歴にも残す
			$node_id = $_POST['node_id'];
			$reason_node_id = isset($_POST['reason_node_id']) ? $_POST['reason_node_id'] : '';
			$reason_text = isset($_POST['reason_text']) ? $_POST['reason_text'] : '';

			// safety: trim
			$reason_text = trim($reason_text);
			if ($reason_text === '') {
				echo json_encode(["success"=>false, "error"=>"empty reason_text"]);
				exit;
			}

			// object_nodes テーブルに purpose カラムがある場合は更新
			$col_check_purpose = $mysqli->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'object_nodes' AND COLUMN_NAME = 'purpose'");
			if ($col_check_purpose && $col_check_purpose->fetch_assoc()) {
				$update_sql = "UPDATE object_nodes SET purpose = '" . $mysqli->real_escape_string($reason_text) . "', updated_at = '$timestamp' WHERE object_node_id = '" . $mysqli->real_escape_string($node_id) . "'";
				$mysqli->query($update_sql);
				if ($mysqli->error) {
					echo json_encode(["success"=>false, "error"=>"failed update purpose: " . $mysqli->error]);
					exit;
				}
			}

			// 履歴テーブルに挿入する。object_nodes_histories に purpose カラムがあるかを確認して動的に組み立てる
			$existingCols = [];
			$cols_res = $mysqli->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'object_nodes_histories'");
			if ($cols_res) {
				while ($crow = $cols_res->fetch_assoc()) {
					$existingCols[] = $crow['COLUMN_NAME'];
				}
			}

			$insertCols = [ 'object_node_history_id', 'object_node_id', 'object_node_type', 'status', 'appeared_at', 'disappeared_at', 'content', 'x', 'y' ];
			$selectParts = [ "'$object_h_id'", 'object_node_id', 'object_nodes_type', 'status', "'$timestamp'", 'NULL', 'content', 'node_x', 'node_y' ];

			if (in_array('purpose', $existingCols)) {
				$insertCols[] = 'purpose';
				$selectParts[] = 'purpose';
			}

			// activity: 3 = 理由を記述
			if (!in_array('activity', $insertCols)) $insertCols[] = 'activity';
			$selectParts[] = '3';

			$h_sql = "INSERT INTO object_nodes_histories (" . implode(', ', $insertCols) . ") SELECT " . implode(', ', $selectParts) . " FROM object_nodes WHERE object_node_id = '" . $mysqli->real_escape_string($node_id) . "'";

			$result = $mysqli->query($h_sql);
			if ($mysqli->error) {
				echo json_encode(["success"=>false, "error"=>"history insert error: " . $mysqli->error, "sql"=>$h_sql]);
			} else {
				echo json_encode(["success"=>true]);
			}
			exit;
		}else if($record_thing === 'reflection'){
			//内省の記録
			$object_reflection_id = uniqid('reflection_', true); // edge_で始まる一意のIDを生成
			$object_node_id = $_POST["object_node_id"]; 
			// successPoints -> evaluation_good, failurePoints -> evaluation_bad
			// Use NULL when a field is not supplied so DB NULLs are preserved
			$evaluation_good = isset($_POST["success_points"]) ? $_POST["success_points"] : (isset($_POST["evaluation_good"]) ? $_POST["evaluation_good"] : NULL);
			$evaluation_bad = isset($_POST["failure_points"]) ? $_POST["failure_points"] : (isset($_POST["evaluation_bad"]) ? $_POST["evaluation_bad"] : NULL);
			$attribution_good = isset($_POST['attribution_good']) ? $_POST['attribution_good'] : NULL;
			$attribution = $attribution_good; // only store 'good' in attribution column
			$attribution_bad = isset($_POST['attribution_bad']) ? $_POST['attribution_bad'] : NULL;
			$application = isset($_POST["application"]) ? $_POST["application"] : NULL;                //エッジ終了
			// クライアントから送られてくる「いつ活かせそうか」フィールドを受け取る（`application_timing` を優先し、互換で `opportunity` も許容）
			$application_timing = isset($_POST["application_timing"]) ? $_POST["application_timing"] : (isset($_POST['opportunity']) ? $_POST['opportunity'] : '');
			$opportunity_esc = $mysqli->real_escape_string($application_timing);
			$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
			// application は object_nodes に保存しない（教訓は別テーブルへ保存するため）
			// Update object_nodes; include attribution_bad if the column exists in this schema
			$update_parts = [];
			if ($evaluation_good !== NULL) $update_parts[] = "evaluation_good = '" . $mysqli->real_escape_string($evaluation_good) . "'";
			if ($evaluation_bad !== NULL) $update_parts[] = "evaluation_bad = '" . $mysqli->real_escape_string($evaluation_bad) . "'";
			if ($attribution !== NULL) $update_parts[] = "attribution = '" . $mysqli->real_escape_string($attribution) . "'";
			// check for attribution_bad column
			$col_check = $mysqli->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'object_nodes' AND COLUMN_NAME = 'attribution_bad'");
			if ($col_check && $col_check->fetch_assoc()) {
				if ($attribution_bad !== NULL) $update_parts[] = "attribution_bad = '" . $mysqli->real_escape_string($attribution_bad) . "'";
			}
			if (count($update_parts) > 0) {
				$update_sql = "UPDATE object_nodes SET " . implode(', ', $update_parts) . ", updated_at = '$timestamp' WHERE object_node_id = '$object_node_id'";
				$mysqli->query($update_sql);
			}
			// reflection は内省（activity=8）を履歴に残す（ただし application は履歴に含めない）
			// object_nodes_histories のテーブル定義が環境によって異なるため、存在するカラムのみを動的に組み立てて挿入する
				$eval_good_esc = ($evaluation_good !== NULL) ? $mysqli->real_escape_string($evaluation_good) : NULL;
				$eval_bad_esc = ($evaluation_bad !== NULL) ? $mysqli->real_escape_string($evaluation_bad) : NULL;
				$attrib_esc = ($attribution !== NULL) ? $mysqli->real_escape_string($attribution) : NULL;
				$attrib_bad_esc = ($attribution_bad !== NULL) ? $mysqli->real_escape_string($attribution_bad) : NULL;

			$existingCols = [];
			$cols_res = $mysqli->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'object_nodes_histories'");
			if ($cols_res) {
				while ($crow = $cols_res->fetch_assoc()) {
					$existingCols[] = $crow['COLUMN_NAME'];
				}
			}

			$insertCols = [ 'object_node_history_id', 'object_node_id', 'object_node_type', 'status', 'appeared_at', 'disappeared_at', 'content', 'x', 'y' ];
			$selectParts = [ "'$object_h_id'", 'object_node_id', 'object_nodes_type', 'status', "'$timestamp'", 'NULL', 'content', 'node_x', 'node_y' ];

			if (in_array('evaluation_good', $existingCols)) {
				$insertCols[] = 'evaluation_good';
				$selectParts[] = ($eval_good_esc !== NULL) ? "'" . $eval_good_esc . "'" : 'NULL';
			}
			if (in_array('evaluation_bad', $existingCols)) {
				$insertCols[] = 'evaluation_bad';
				$selectParts[] = ($eval_bad_esc !== NULL) ? "'" . $eval_bad_esc . "'" : 'NULL';
			}
			if (in_array('attribution', $existingCols)) {
				$insertCols[] = 'attribution';
				$selectParts[] = ($attrib_esc !== NULL) ? "'" . $attrib_esc . "'" : 'NULL';
			}
			if (in_array('attribution_bad', $existingCols)) {
				$insertCols[] = 'attribution_bad';
				$selectParts[] = ($attrib_bad_esc !== NULL) ? "'" . $attrib_bad_esc . "'" : 'NULL';
			}

			// activity カラムは通常存在すると想定
			if (!in_array('activity', $insertCols)) $insertCols[] = 'activity';
			$selectParts[] = '8';

			$h_sql = "INSERT INTO object_nodes_histories (" . implode(', ', $insertCols) . ") SELECT " . implode(', ', $selectParts) . " FROM object_nodes WHERE object_node_id = '" . $mysqli->real_escape_string($object_node_id) . "'";

			// 教訓の保存処理
			// 1. lessons_json がある場合（新しい複数教訓形式）: 各教訓を個別に保存
			// 2. application のみの場合（従来形式）: 空行で分割して保存
			$lessons_json = isset($_POST['lessons_json']) ? $_POST['lessons_json'] : null;
			
			if ($lessons_json !== null && $lessons_json !== '') {
				// 新しい形式: JSON配列から各教訓を個別に保存
				$lessons_array = json_decode($lessons_json, true);
				if (is_array($lessons_array) && count($lessons_array) > 0) {
					// まず既存の教訓を取得
					$existing_lessons_sql = "SELECT object_le_id FROM `object_lesson-learneds` WHERE object_node_id = '" . $mysqli->real_escape_string($object_node_id) . "' AND deleted = 0 ORDER BY created_at ASC";
					$existing_res = $mysqli->query($existing_lessons_sql);
					$existing_ids = [];
					while ($existing_res && $row = $existing_res->fetch_assoc()) {
						$existing_ids[] = $row['object_le_id'];
					}
					
					foreach ($lessons_array as $idx => $lesson_item) {
						$lesson_text = isset($lesson_item['lesson']) ? trim($lesson_item['lesson']) : '';
						$lesson_opp = isset($lesson_item['opportunity']) ? $mysqli->real_escape_string(trim($lesson_item['opportunity'])) : '';
						$lesson_db_id = isset($lesson_item['object_le_id']) ? trim($lesson_item['object_le_id']) : '';
						
						if ($lesson_text === '') continue;
						
						$lesson_text_esc = $mysqli->real_escape_string($lesson_text);
						
						// object_le_id が指定されている場合は更新、なければ既存IDを使用または新規挿入
						if ($lesson_db_id !== '') {
							// 既存レコードを更新
							$update_sql = "UPDATE `object_lesson-learneds` SET lesson_learned = '" . $lesson_text_esc . "', opportunity = '" . $lesson_opp . "', updated_at = '" . $timestamp . "' WHERE object_le_id = '" . $mysqli->real_escape_string($lesson_db_id) . "'";
							$mysqli->query($update_sql);
							if ($mysqli->error) {
								error_log('Update lesson error: ' . $mysqli->error);
							}
						} elseif ($idx < count($existing_ids)) {
							// 既存のIDがあれば更新
							$use_id = $existing_ids[$idx];
							$update_sql = "UPDATE `object_lesson-learneds` SET lesson_learned = '" . $lesson_text_esc . "', opportunity = '" . $lesson_opp . "', updated_at = '" . $timestamp . "' WHERE object_le_id = '" . $mysqli->real_escape_string($use_id) . "'";
							$mysqli->query($update_sql);
							if ($mysqli->error) {
								error_log('Update lesson error: ' . $mysqli->error);
							}
						} else {
							// 新規挿入
							$new_lesson_id = uniqid('lesson_', true);
							$insert_sql = "INSERT INTO `object_lesson-learneds` (`object_le_id`,`object_node_id`,`lesson_learned`,`opportunity`,`created_at`,`updated_at`,`deleted`) VALUES ('" . $new_lesson_id . "','" . $mysqli->real_escape_string($object_node_id) . "','" . $lesson_text_esc . "','" . $lesson_opp . "','" . $timestamp . "','" . $timestamp . "',0)";
							$mysqli->query($insert_sql);
							if ($mysqli->error) {
								error_log('Insert lesson error: ' . $mysqli->error);
							}
						}
					}
				}
			} else {
				// 従来形式: application を空行で分割して保存
				$app_trim = ($application !== NULL) ? trim($application) : '';
				if ($app_trim !== '') {
					// split on one or more blank lines (allow spaces)
					$parts = preg_split('/\r?\n\s*\r?\n/', $application);
					$parts = array_map('trim', $parts);
					$parts = array_filter($parts, function($p){ return $p !== ''; });
					$parts = array_values($parts);
					if (count($parts) > 0) {
						// first part: update existing latest lesson if exists, else insert
						$first = $parts[0];
						$lesson_text = $mysqli->real_escape_string($first);
						$check_sql = "SELECT object_le_id FROM `object_lesson-learneds` WHERE object_node_id = '" . $mysqli->real_escape_string($object_node_id) . "' AND deleted = 0 ORDER BY created_at DESC LIMIT 1";
						$res_check = $mysqli->query($check_sql);
						if ($res_check && $row_check = $res_check->fetch_assoc()) {
							$existing_le_id = $row_check['object_le_id'];
							$update_lesson_sql = "UPDATE `object_lesson-learneds` SET lesson_learned = '" . $lesson_text . "', opportunity = '" . $opportunity_esc . "', updated_at = '" . $timestamp . "' WHERE object_le_id = '" . $mysqli->real_escape_string($existing_le_id) . "'";
							$mysqli->query($update_lesson_sql);
							if ($mysqli->error) {
								error_log('Update lesson error: ' . $mysqli->error . ' SQL: ' . $update_lesson_sql);
							}
						} else {
							$lesson_id = uniqid('lesson_', true);
							$insert_lesson_sql = "INSERT INTO `object_lesson-learneds` (`object_le_id`,`object_node_id`,`lesson_learned`,`opportunity`,`created_at`,`updated_at`,`deleted`) VALUES ('" . $lesson_id . "','" . $object_node_id . "','" . $lesson_text . "','" . $opportunity_esc . "','" . $timestamp . "','" . $timestamp . "',0)";
							$mysqli->query($insert_lesson_sql);
							if ($mysqli->error) {
								error_log('Insert lesson error: ' . $mysqli->error . ' SQL: ' . $insert_lesson_sql);
							}
						}

						// remaining parts: always insert as new lesson records
						for ($i = 1; $i < count($parts); $i++) {
							$part = $parts[$i];
							if (trim($part) === '') continue;
							$lesson_text_part = $mysqli->real_escape_string($part);
							$lesson_id_part = uniqid('lesson_', true);
							$insert_sql_part = "INSERT INTO `object_lesson-learneds` (`object_le_id`,`object_node_id`,`lesson_learned`,`opportunity`,`created_at`,`updated_at`,`deleted`) VALUES ('" . $lesson_id_part . "','" . $object_node_id . "','" . $lesson_text_part . "','" . $opportunity_esc . "','" . $timestamp . "','" . $timestamp . "',0)";
							$mysqli->query($insert_sql_part);
							if ($mysqli->error) {
								error_log('Insert lesson error (additional part): ' . $mysqli->error . ' SQL: ' . $insert_sql_part);
							}
						}
					}
				}
			}

			// 重複チェック（record->reflection: activity=8）
			$dup_check_sql = "SELECT COUNT(*) AS cnt FROM object_nodes_histories WHERE object_node_id = '$object_node_id' AND appeared_at = '$timestamp' AND activity = 8";
			$dup_res = $mysqli->query($dup_check_sql);
			$dup_count = 0;
			if ($dup_res) {
				$row_dup = $dup_res->fetch_assoc();
				$dup_count = (int)$row_dup['cnt'];
			}
			if ($dup_count === 0) {
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
				error_log("Skip duplicate history insert for node $object_node_id at $timestamp (record->reflection)");
				echo json_encode(["success" => true, "note" => "duplicate skipped"]);
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
				// 新しい履歴レコードを追加（application は含めない）
				// evaluation_good, evaluation_bad, attribution, estimated_time はテーブルに存在しない場合があるため除外
				$h_sql = "INSERT INTO object_nodes_histories 
					(object_node_history_id, object_node_id, object_node_type, status, appeared_at, disappeared_at, content, x, y, purpose, activity)
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
						4
					FROM object_nodes
					WHERE object_node_id = '$node_id'";
				
				// 重複チェック（estimated_time: activity=4）
				$dup_check_sql = "SELECT COUNT(*) AS cnt FROM object_nodes_histories WHERE object_node_id = '$node_id' AND appeared_at = '$timestamp' AND activity = 4";
				$dup_res = $mysqli->query($dup_check_sql);
				$dup_count = 0;
				if ($dup_res) {
					$row_dup = $dup_res->fetch_assoc();
					$dup_count = (int)$row_dup['cnt'];
				}
				if ($dup_count === 0) {
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
					error_log("Skip duplicate history insert for node $node_id at $timestamp (estimated_time)");
					echo json_encode(["success" => true, "note" => "duplicate skipped"]);
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
			// successPoints -> evaluation_good, failurePoints -> evaluation_bad
			$evaluation_good = isset($_POST["success_points"]) ? $_POST["success_points"] : (isset($_POST["evaluation_good"]) ? $_POST["evaluation_good"] : '');
			$evaluation_bad = isset($_POST["failure_points"]) ? $_POST["failure_points"] : (isset($_POST["evaluation_bad"]) ? $_POST["evaluation_bad"] : '');
			$attribution_good = isset($_POST['attribution_good']) ? $_POST['attribution_good'] : '';
			$attribution = $attribution_good; // only store 'good' in attribution column
			$attribution_bad = isset($_POST['attribution_bad']) ? $_POST['attribution_bad'] : '';
			$application = isset($_POST["application"]) ? $_POST["application"] : '';
			// クライアントから送られてくる「いつ活かせそうか」フィールドを受け取る（互換で `opportunity` も許容）
			$application_timing = isset($_POST["application_timing"]) ? $_POST["application_timing"] : (isset($_POST['opportunity']) ? $_POST['opportunity'] : '');
			$opportunity_esc = $mysqli->real_escape_string($application_timing);
			
			// まず既存の履歴レコードのdisappeared_atを更新
			$update_history_sql = "UPDATE object_nodes_histories 
				SET disappeared_at = '$timestamp' 
				WHERE object_node_id = '$object_node_id' AND disappeared_at IS NULL";
			$mysqli->query($update_history_sql);
			
			// メインテーブルを更新（application は保存しない）
			// Update object_nodes and include attribution_bad if column exists
			$upd_parts = [];
			$upd_parts[] = "evaluation_good = '" . $mysqli->real_escape_string($evaluation_good) . "'";
			$upd_parts[] = "evaluation_bad = '" . $mysqli->real_escape_string($evaluation_bad) . "'";
			$upd_parts[] = "attribution = '" . $mysqli->real_escape_string($attribution) . "'";
			$col_check2 = $mysqli->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'object_nodes' AND COLUMN_NAME = 'attribution_bad'");
			if ($col_check2 && $col_check2->fetch_assoc()) {
				$upd_parts[] = "attribution_bad = '" . $mysqli->real_escape_string($attribution_bad) . "'";
			}
			$sql = "UPDATE object_nodes SET " . implode(', ', $upd_parts) . ", updated_at = '$timestamp' WHERE object_node_id = '$object_node_id'";
			if ($mysqli->query($sql)) {
				// 新しい履歴レコードを追加
				// activity: 8 = 内省を記録した時
				// 新しい履歴レコードを追加（application は含めない）
				// テーブル定義差異に対応するため、挿入カラムを動的に組み立てる
				$eval_good_esc = $mysqli->real_escape_string($evaluation_good);
				$eval_bad_esc = $mysqli->real_escape_string($evaluation_bad);
				$attrib_esc = $mysqli->real_escape_string($attribution);

				$existingCols = [];
				$cols_res = $mysqli->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'object_nodes_histories'");
				if ($cols_res) {
					while ($crow = $cols_res->fetch_assoc()) {
						$existingCols[] = $crow['COLUMN_NAME'];
					}
				}

				$insertCols = [ 'object_node_history_id', 'object_node_id', 'object_node_type', 'status', 'appeared_at', 'disappeared_at', 'content', 'x', 'y' ];
				$selectParts = [ "'$object_h_id'", 'object_node_id', 'object_nodes_type', 'status', "'$timestamp'", 'NULL', 'content', 'node_x', 'node_y' ];

				if (in_array('purpose', $existingCols)) {
					$insertCols[] = 'purpose';
					$selectParts[] = 'purpose';
				}
				if (in_array('evaluation_good', $existingCols)) {
					$insertCols[] = 'evaluation_good';
					$selectParts[] = "'" . $eval_good_esc . "'";
				}
				if (in_array('evaluation_bad', $existingCols)) {
					$insertCols[] = 'evaluation_bad';
					$selectParts[] = "'" . $eval_bad_esc . "'";
				}
				if (in_array('attribution', $existingCols)) {
					$insertCols[] = 'attribution';
					$selectParts[] = "'" . $attrib_esc . "'";
				}
				if (in_array('estimated_time', $existingCols)) {
					$insertCols[] = 'estimated_time';
					$selectParts[] = 'estimated_time';
				}

				if (!in_array('activity', $insertCols)) $insertCols[] = 'activity';
				$selectParts[] = '8';

				$h_sql = "INSERT INTO object_nodes_histories (" . implode(', ', $insertCols) . ") SELECT " . implode(', ', $selectParts) . " FROM object_nodes WHERE object_node_id = '" . $mysqli->real_escape_string($object_node_id) . "'";

				// POST の application（教訓）があれば lessons テーブルに保存する（複数パート対応）
				$app_trim2 = trim($application);
				if ($app_trim2 !== '') {
					$parts2 = preg_split('/\r?\n\s*\r?\n/', $application);
					$parts2 = array_map('trim', $parts2);
					$parts2 = array_filter($parts2, function($p){ return $p !== ''; });
					$parts2 = array_values($parts2);
					if (count($parts2) > 0) {
						// first part: update existing latest lesson if exists, else insert
						$first2 = $parts2[0];
						$lesson_text2 = $mysqli->real_escape_string($first2);
						$check_sql2 = "SELECT object_le_id FROM `object_lesson-learneds` WHERE object_node_id = '" . $mysqli->real_escape_string($object_node_id) . "' AND deleted = 0 ORDER BY created_at DESC LIMIT 1";
						$res_check2 = $mysqli->query($check_sql2);
						if ($res_check2 && $row_check2 = $res_check2->fetch_assoc()) {
							$existing_le_id2 = $row_check2['object_le_id'];
							$update_lesson_sql2 = "UPDATE `object_lesson-learneds` SET lesson_learned = '" . $lesson_text2 . "', opportunity = '" . $opportunity_esc . "', updated_at = '" . $timestamp . "' WHERE object_le_id = '" . $mysqli->real_escape_string($existing_le_id2) . "'";
							$mysqli->query($update_lesson_sql2);
							if ($mysqli->error) {
								error_log('Update lesson error (reflection bottom): ' . $mysqli->error . ' SQL: ' . $update_lesson_sql2);
							}
						} else {
							$lesson_id2 = uniqid('lesson_', true);
							$insert_lesson_sql2 = "INSERT INTO `object_lesson-learneds` (`object_le_id`,`object_node_id`,`lesson_learned`,`opportunity`,`created_at`,`updated_at`,`deleted`) VALUES ('" . $lesson_id2 . "','" . $object_node_id . "','" . $lesson_text2 . "','" . $opportunity_esc . "','" . $timestamp . "','" . $timestamp . "',0)";
							$mysqli->query($insert_lesson_sql2);
							if ($mysqli->error) {
								error_log('Insert lesson error (reflection bottom): ' . $mysqli->error . ' SQL: ' . $insert_lesson_sql2);
							}
						}

						// remaining parts: always insert as new records
						for ($j = 1; $j < count($parts2); $j++) {
							$partj = $parts2[$j];
							if (trim($partj) === '') continue;
							$lesson_text_partj = $mysqli->real_escape_string($partj);
							$lesson_id_partj = uniqid('lesson_', true);
							$insert_sql_partj = "INSERT INTO `object_lesson-learneds` (`object_le_id`,`object_node_id`,`lesson_learned`,`opportunity`,`created_at`,`updated_at`,`deleted`) VALUES ('" . $lesson_id_partj . "','" . $object_node_id . "','" . $lesson_text_partj . "','" . $opportunity_esc . "','" . $timestamp . "','" . $timestamp . "',0)";
							$mysqli->query($insert_sql_partj);
							if ($mysqli->error) {
								error_log('Insert lesson error (additional part, reflection bottom): ' . $mysqli->error . ' SQL: ' . $insert_sql_partj);
							}
						}
					}
				}
				
				// 重複チェック（record->reflection bottom: activity=8）
				$dup_check_sql = "SELECT COUNT(*) AS cnt FROM object_nodes_histories WHERE object_node_id = '$object_node_id' AND appeared_at = '$timestamp' AND activity = 8";
				$dup_res = $mysqli->query($dup_check_sql);
				$dup_count = 0;
				if ($dup_res) {
					$row_dup = $dup_res->fetch_assoc();
					$dup_count = (int)$row_dup['cnt'];
				}
				if ($dup_count === 0) {
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
					error_log("Skip duplicate history insert for node $object_node_id at $timestamp (reflection bottom)");
					echo json_encode(["success" => true, "note" => "duplicate skipped"]);
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
			$node_update_thing1 = isset($_POST['node_update_thing1']) ? $_POST['node_update_thing1'] : '';
			$node_update_thing2 = isset($_POST['node_update_thing2']) ? $_POST['node_update_thing2'] : '';
	
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
			
				// 4. object_nodes_histories に新規レコードを追加（application は含めない）
				// evaluation_good, evaluation_bad, attribution, estimated_time はテーブルに存在しない場合があるためNULLを使用
				$insert_history_sql = "
					INSERT INTO object_nodes_histories 
						(object_node_history_id, object_node_id, object_node_type, status, appeared_at, disappeared_at, content, x, y, purpose, drag)
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
						1
					FROM object_nodes
					WHERE object_node_id = '$node_id'
				";
				// 重複チェック（同一ノード・同時刻のレコードが既にあるか）
				$dup_check_sql = "SELECT COUNT(*) AS cnt FROM object_nodes_histories WHERE object_node_id = '$node_id' AND appeared_at = '$timestamp'";
				$dup_res = $mysqli->query($dup_check_sql);
				$dup_count = 0;
				if ($dup_res) {
					$row_dup = $dup_res->fetch_assoc();
					$dup_count = (int)$row_dup['cnt'];
				}
				if ($dup_count === 0) {
					$mysqli->query($insert_history_sql);
					if ($mysqli->error) {
						echo "Error inserting new history: " . $mysqli->error;
					}
				} else {
					// duplicate detected: skip insert
					error_log("Skip duplicate history insert for node $node_id at $timestamp (point update)");
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
			
				// 履歴レコードを追加（application は含めない） - label 更新は activity=2 とする
				// evaluation_good, evaluation_bad, attribution, estimated_time はテーブルに存在しない場合があるためNULLを使用
				$h_sql = "INSERT INTO object_nodes_histories 
					(object_node_history_id, object_node_id, object_node_type, status, appeared_at, disappeared_at, content, x, y, purpose, activity)
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
					2
					FROM object_nodes
					WHERE object_node_id = '$node_id'";
			
				// echo "DEBUG INSERT SQL: $h_sql\n";
			
				// 重複チェック（同一ノード・同時刻・activity=2 のレコードが既にあるか）
				$dup_check_sql = "SELECT COUNT(*) AS cnt FROM object_nodes_histories WHERE object_node_id = '$node_id' AND appeared_at = '$timestamp' AND activity = 2";
				$dup_res = $mysqli->query($dup_check_sql);
				$dup_count = 0;
				if ($dup_res) {
					$row_dup = $dup_res->fetch_assoc();
					$dup_count = (int)$row_dup['cnt'];
				}
				if ($dup_count === 0) {
					$result = $mysqli->query($h_sql);
					if($mysqli->error){
						echo "Error history insert: " . $mysqli->error;
					} else {
						echo "History insert successful!\n";
					}
				} else {
					error_log("Skip duplicate history insert for node $node_id at $timestamp (label update)");
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
			
				// ストレージエンジンを確認して、InnoDB の場合は FOR UPDATE を使ったトランザクション、
				// それ以外はフォールバック（従来の処理）を行う
				$engine_res = $mysqli->query("SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'object_nodes_histories'");
				$engine = null;
				if ($engine_res && $erow = $engine_res->fetch_assoc()) {
					$engine = strtoupper($erow['ENGINE']);
				}

				if ($engine === 'INNODB') {
					try {
						$mysqli->begin_transaction();
						$sub_sql = "
							SELECT * 
							FROM object_nodes_histories 
							WHERE object_node_id = '$node_id' 
							  AND disappeared_at IS NULL 
							ORDER BY appeared_at DESC 
							LIMIT 1
							FOR UPDATE
						";
						$result = $mysqli->query($sub_sql);
						$should_insert = true;
						if ($result && $row = $result->fetch_assoc()) {
							$latest_history_id = $row['object_node_history_id'];

							// 直近の開いた履歴が既に同じ status/activity なら挿入をスキップ
							if (isset($row['status']) && isset($row['activity']) && $row['status'] === $node_update_thing1 && (string)$row['activity'] === (string)$node_update_thing2) {
								$should_insert = false;
							} else {
								$update_sql = "UPDATE object_nodes_histories SET disappeared_at = '$timestamp' WHERE object_node_history_id = '$latest_history_id'";
								$mysqli->query($update_sql);
								if ($mysqli->error) {
									throw new Exception('Error updating disappeared_at: ' . $mysqli->error);
								}
							}
						}

						if ($should_insert) {
							// 挿入前に重複チェック（同一ノード・同時刻・同ステータス・同 activity）
							$dup_check_sql = "SELECT COUNT(*) AS cnt FROM object_nodes_histories WHERE object_node_id = '$node_id' AND appeared_at = '$timestamp' AND status = '$node_update_thing1' AND activity = '$node_update_thing2'";
							$dup_res = $mysqli->query($dup_check_sql);
							$dup_count = 0;
							if ($dup_res) {
								$row_dup = $dup_res->fetch_assoc();
								$dup_count = (int)$row_dup['cnt'];
							}
							if ($dup_count === 0) {
								$h_sql = "INSERT INTO object_nodes_histories 
								  (object_node_history_id, object_node_id, object_node_type, status, appeared_at, disappeared_at, content, x, y,activity)
								  SELECT 
									'$object_h_id',
									object_node_id,
									object_nodes_type,
									'$node_update_thing1',
									'$timestamp',
									NULL,
									content,
									node_x,
									node_y,
									'$node_update_thing2'
								  FROM object_nodes
								  WHERE object_node_id = '$node_id'";

								$result = $mysqli->query($h_sql);
								if ($mysqli->error) {
									throw new Exception('Error history insert: ' . $mysqli->error);
								}
							} else {
								// duplicate - nothing to do
								error_log("Skip duplicate history insert for node $node_id at $timestamp (status update - InnoDB)");
							}
						} else {
							// duplicate - nothing to do
						}

						$mysqli->commit();
					} catch (Exception $e) {
						$mysqli->rollback();
						error_log('object_maneger status-update transaction error: ' . $e->getMessage());
						echo json_encode(["success" => false, "error" => $e->getMessage()]);
					}
				} else {
					// InnoDB 以外（例: MyISAM）の場合は FOR UPDATE を使わずに従来処理だが同一チェックを行う
					$sub_sql = "SELECT * FROM object_nodes_histories WHERE object_node_id = '$node_id' AND disappeared_at IS NULL ORDER BY appeared_at DESC LIMIT 1";
					$result = $mysqli->query($sub_sql);
					$should_insert = true;
					if ($result && $row = $result->fetch_assoc()) {
						$latest_history_id = $row['object_node_history_id'];
						if (isset($row['status']) && isset($row['activity']) && $row['status'] === $node_update_thing1 && (string)$row['activity'] === (string)$node_update_thing2) {
							$should_insert = false;
						} else {
							$update_sql = "UPDATE object_nodes_histories SET disappeared_at = '$timestamp' WHERE object_node_history_id = '$latest_history_id'";
							$mysqli->query($update_sql);
						}
					}

					if ($should_insert) {
						// フォールバック側でも挿入前に重複チェック
						$dup_check_sql = "SELECT COUNT(*) AS cnt FROM object_nodes_histories WHERE object_node_id = '$node_id' AND appeared_at = '$timestamp' AND status = '$node_update_thing1' AND activity = '$node_update_thing2'";
						$dup_res = $mysqli->query($dup_check_sql);
						$dup_count = 0;
						if ($dup_res) {
							$row_dup = $dup_res->fetch_assoc();
							$dup_count = (int)$row_dup['cnt'];
						}
						if ($dup_count === 0) {
							$h_sql = "INSERT INTO object_nodes_histories 
							  (object_node_history_id, object_node_id, object_node_type, status, appeared_at, disappeared_at, content, x, y,activity)
							  SELECT 
								'$object_h_id',
								object_node_id,
								object_nodes_type,
								'$node_update_thing1',
								'$timestamp',
								NULL,
								content,
								node_x,
								node_y,
								'$node_update_thing2'
							  FROM object_nodes
							  WHERE object_node_id = '$node_id'";

							$mysqli->query($h_sql);
							if ($mysqli->error) {
								error_log('object_maneger status-update insert error (fallback): ' . $mysqli->error);
								echo json_encode(["success" => false, "error" => $mysqli->error]);
							}
						} else {
							// duplicate - skip insert
							error_log("Skip duplicate history insert for node $node_id at $timestamp (status update - fallback)");
						}
					} else {
						// duplicate - skip insert
					}
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
	
			// 重複チェック（delete history: 同一ノード・同じ disappeared_at が既にあるか）
			$dup_check_sql = "SELECT COUNT(*) AS cnt FROM object_nodes_histories WHERE object_node_id = '$node_id' AND disappeared_at = '$timestamp'";
			$dup_res = $mysqli->query($dup_check_sql);
			$dup_count = 0;
			if ($dup_res) {
				$row_dup = $dup_res->fetch_assoc();
				$dup_count = (int)$row_dup['cnt'];
			}
			if ($dup_count === 0) {
				$result_h = $mysqli->query($h_sql);
				if (!$result_h) {
					echo "Error inserting delete history: " . $mysqli->error;
				} else {
					echo "Delete history recorded successfully.";
				}
			} else {
				error_log("Skip duplicate delete history insert for node $node_id at $timestamp");
				echo "Delete history skipped (duplicate).";
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
