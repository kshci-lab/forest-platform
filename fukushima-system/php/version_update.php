<?php
	//hatakeyama
	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");

  	//タイムゾーンの設定
  	date_default_timezone_set('Asia/Tokyo');
	$timestamp = date("Y-m-d H:i:s");
	
	// $id = $_POST["id"];
	// $user_id = $_SESSION['USERID'];
    // $type = $_POST["type"];
    // $concept_id = $_POST["concept_id"];
	// $parent_id = $_POST["parent_id"];
	// $activity = $_POST["activity"];
	// $deleted = 0;
	

	//ノードの挿入
	if($_POST["data"] == "relation"){
		$relation_id = rand();
		$node_id = $_POST["node_id"];
		$map_id = $_SESSION['MAPID'];
		$map_version_id = $_POST["map_version_id"];
		$count = $_POST["count"];

		if($count == 1){	//今回が1回目の編集であればappeared_atだけ更新

		//relationをUPDATE
		$sql_u_relation = "UPDATE map_node_versions SET appeared_at = '".$timestamp."' WHERE disappeared_at IS NULL AND map_version_id = '".$map_version_id."'";
		$result_u_relation = $mysqli->query($sql_u_relation);

		}else{				//2回目以降の編集であればrelationテーブルは更新する

		//それぞれのノードの最新node_version_idを取得 福岡さん
		$sql_get_nvi = "SELECT id FROM node_versions WHERE appeared_at = (SELECT max(appeared_at) FROM node_versions WHERE node_id = '$node_id' GROUP BY node_id )";
		if($result_get_nvi = $mysqli->query($sql_get_nvi)) {
      		while($row = mysqli_fetch_assoc($result_get_nvi)){
				$node_version_id = $row['id'];
      		}
    	}
		//relationをUPDATE	disappearedがNULLで最新map_version_idでないものの終了
		$sql_u_relation = "UPDATE map_node_versions SET disappeared_at = '".$timestamp."' WHERE disappeared_at IS NULL AND map_version_id != '".$map_version_id."'";
		$result_u_relation = $mysqli->query($sql_u_relation);

		//relationをINSERT	最新mapと現存する全てのノードを結びつける
		$sql_i_relation = "INSERT INTO map_node_versions (id, map_version_id, node_version_id, appeared_at, disappeared_at) 
		VALUES ($relation_id, $map_version_id, '".$node_version_id."', '".$timestamp."', NULL)";
		$result_i_relation = $mysqli->query($sql_i_relation);

		}
		
		

	}else if($_POST["data"] == "map"){
		//マップ更新ボタンを押したとき

			//map_versionsをUPDATE
			$sql_mvu = "UPDATE map_versions SET disappeared_at = '".$timestamp."' WHERE map_id = ".$_SESSION['MAPID']." AND disappeared_at IS NULL";
			$result_mvu = $mysqli->query($sql_mvu);
			if($mysqli->error){
				echo "Error: ". $mysqli->error;
			}

			//map_versionsにINSERTする
			$map_version = rand();	//not unique
			$sql_mvi = "INSERT INTO map_versions(map_version_id, map_id, name, appeared_at, disappeared_at)
				VALUES (".$map_version.", '".$_SESSION['MAPID']."', (SELECT name FROM maps WHERE map_id = ".$_SESSION['MAPID']."), '".$timestamp."', NULL)";	//後で理由入れる
			$result_mvi = $mysqli->query($sql_mvi);
			if($mysqli->error){
				echo "Error: ". $mysqli->error;
			}

			// 前回のバージョンから変化があったノードのバージョンを更新
			$sql_update = "SELECT * FROM node_latest WHERE content NOT IN (SELECT content FROM node_versions WHERE node_id IN (SELECT node_id FROM map_node_links WHERE map_id = ".$_SESSION['MAPID'].") AND disappeared_at IS NULL) AND node_id IN (SELECT node_id FROM map_node_links WHERE map_id = ".$_SESSION['MAPID'].") ";

			if($result = $mysqli->query($sql_update)) {
				$rows = [];  // 結果を格納するための配列
				while ($row = $result->fetch_assoc()) {
					$rows[] = $row;  // 各行を配列に追加
				}
				echo json_encode($rows);
			}else if($mysqli->error){
				echo "Error update node_version: ". $mysqli->error;
			}

	//ノードのバージョンを更新
	}else if($_POST["data"] == "node"){
		//node_versionsをUPDATE
		$sql_nvu = "UPDATE node_versions SET disappeared_at = '".$timestamp."' WHERE node_id = '".$_POST['node_id']."' AND disappeared_at IS NULL";
		$result_nvu = $mysqli->query($sql_nvu);
		if($mysqli->error){
			echo "Error update node_version: ". $mysqli->error;
		}

		//node_versionsにINSERTする
		$sql_nvi = "INSERT INTO node_versions(node_version_id, node_id, parent_id, node_type_id, appeared_at, disappeared_at, content, concept_id, x, y)
			VALUES ('".$_POST['node_version_id']."', '".$_POST['node_id']."', '".$_POST['parent_id']."', ".$_POST['node_type_id'].", '".$timestamp."', NULL, '".$_POST['content']."', '".$_POST['concept_id']."', '".$_POST['x']."', '".$_POST['y']."')";
		$result_nvi = $mysqli->query($sql_nvi);
		if($mysqli->error){
			echo "Error insert node_version: ". $mysqli->error;
		}

		//node_historiesをUPDATE
		$sql_nvu = "UPDATE node_histories SET node_version_id = '".$_POST['node_version_id']."' WHERE node_version_id IN (SELECT node_version_id FROM node_versions WHERE node_id = '".$_POST['node_id']."') AND disappeared_at IS NULL";
		$result_nvu = $mysqli->query($sql_nvu);
		if($mysqli->error){
			echo "Error update node_historie: ". $mysqli->error;
		}

	}else if($_POST["data"] == "edit_reason"){
		
		$text = $_POST["text"];
		$node_version_id = $_POST["node_version_id"];
		$sql_learner = "UPDATE node_versions SET updated_reason_by_learner = '".$text."' WHERE id = '".$node_version_id."'";
		$result_learner = $mysqli->query($sql_learner);

	//マップver更新理由の追加
	}else if($_POST["data"] == "map_reason"){
		$id = rand();
		$text = $_POST["text"];
		$map_version_id = $_POST["map_version_id"];
		$sql = "INSERT INTO map_version_reasons(id, map_version_id, reason) VALUE (".$id.", ".$map_version_id.", '".$text."')";
		$result = $mysqli->query($sql);

	//今までにeditしたことあるか確認
	}else if($_POST["data"] == "check_edit"){

		$node_id = $_POST["node_id"];
		$sql_check_edit = "SELECT * FROM node_versions WHERE node_id = '".$node_id."' AND updated_reason_by_system = 'edit'";
		$result_check_edit = $mysqli->query($sql_check_edit);
		$count = mysqli_num_rows($result_check_edit);
		echo json_encode($count);

	//ノードver更新理由を最新順で取得
	}else if($_POST["data"] == "get_node_reason"){
		
		$node_id = $_POST["node_id"];
		$sql = "SELECT updated_reason_by_learner FROM node_versions where node_id = '$node_id' ORDER BY id DESC";

        $i = 0;
    	$get_array = array(999 => 'temp');	//最初にこれ入れとかないと何故かindex($i)がついてくれない
		
    	if($result = $mysqli->query($sql)){

    		while($row = mysqli_fetch_assoc($result)){

    			$get_array[$i] = $row["updated_reason_by_learner"];
				
    			$i += 1;

    		}
        }
		echo json_encode($get_array);

	//ある時間のマップver更新理由を取得
	}else if($_POST["data"] == "get_map_reason"){

		$map_id = $_SESSION['MAPID'];
		$time = $_POST["time"];
		$sql = "SELECT updated_reason FROM map_versions where map_id = $map_id AND appeared_at <= '$time' AND disappeared_at > '$time'";//大きい方が後

        $i = 0;
    	$get_array = array(999 => 'temp');	//最初にこれ入れとかないと何故かindex($i)がついてくれない
		
    	if($result = $mysqli->query($sql)){

    		while($row = mysqli_fetch_assoc($result)){

    			$get_array[$i] = $row["updated_reason"];
				
    			$i += 1;

    		}
        }
		echo json_encode($get_array);

	//ある時間とその前後のmap_version_idを取得
	}else if($_POST["data"] == "map_version_at"){

		$map_id = $_SESSION['MAPID'];
		$time = $_POST["time"];
		$sql = "SELECT appeared_at FROM map_versions where map_id = $map_id AND appeared_at <= '$time' ORDER BY appeared_at DESC LIMIT 2";	//timeより前にappeared_atがある最新のもの2つ

        $i = 0;
    	$get_array = array(999 => 'temp');	//最初にこれ入れとかないと何故かindex($i)がついてくれない
		
    	if($result = $mysqli->query($sql)){

    		while($row = mysqli_fetch_assoc($result)){

    			$get_array[$i] = $row["appeared_at"];
				
    			$i += 1;

    		}
        }
		echo json_encode($get_array);

	//node_version_idを最新順で取得する
	}else if($_POST["data"] == "node_version"){

		$node_id = $_POST["node_id"];
		$sql = "SELECT * FROM node_versions WHERE node_id = '".$node_id."' ORDER BY appeared_at DESC";

		$i = 0;
		$updated_array = array(999 => 'temp');	//最初にこれ入れとかないと何故かindex($i)がついてくれない

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){

				$updated_array[$i] = $row["node_version_id"];

				$i += 1;
			}
		}
		echo json_encode($updated_array);

	//map_version_idを最新順(上位30個)で取得する
	}else if($_POST["data"] == "map_version"){

		$sql = "SELECT * FROM map_versions WHERE map_id = '".$_SESSION['MAPID']."' ORDER BY appeared_at DESC LIMIT 0, 30";

		$i = 0;
		$updated_array = array(999 => 'temp');	//最初にこれ入れとかないと何故かindex($i)がついてくれない

		if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){

				$updated_array[$i] = $row["map_version_id"];

				$i += 1;
			}
		}
		echo json_encode($updated_array);


	//ノードのversion履歴の取得
	}else if($_POST["data"] == "node_version_log"){
	
		$node_id = $_POST["node_id"];
		$sql = "SELECT * FROM node_versions where node_id = '$node_id' AND updated_reason_by_learner IS NOT NULL AND updated_reason_by_learner != '' ORDER BY id DESC";

        $i = 0;
    	$log_array = array();
		
    	if($result = $mysqli->query($sql)){

    		while($row = mysqli_fetch_assoc($result)){

    			$log_array[$i]["updated_reason_by_learner"] = $row["updated_reason_by_learner"];
				$log_array[$i]["content"] = $row["content"];
				$log_array[$i]["appeared_at"] = $row["appeared_at"];
    			$i += 1;

    		}
        }
		echo json_encode($log_array);
	

	//資料作成終了ボタンで新しいシート作成
	}else if($_POST["data"] == "create_sheet"){
		
		//mapの名前を取得
		// $sql_get = "SELECT name FROM maps WHERE user_id = ".$_SESSION['USERID']." AND map_id = ".$_SESSION['MAPID'];
		// if($result_get = $mysqli->query($sql_get)) {
      	// 	while($row = mysqli_fetch_assoc($result_get)){
		// 		$name = $row['name'];
      	// 	}
    	// }
		// $timestamp_2sec = date("Y-m-d H:i:s", strtotime("2 second"));	//Record_rank()と被らないように＋2秒する（よくない）

		// $mode_id = 1; //自己内対話モード
		// $map_mode_link = rand();
	
		// //同じ名前,idのmap作成
		// $sql1 = "INSERT INTO maps (map_id, user_id, name, created_at, updated_at, deleted) 
		// 	VALUES (".$_SESSION['MAPID'].", ".$_SESSION['USERID'].", '".$name."', '".$timestamp_2sec."', '".$timestamp_2sec."','0')";
		// $sql2 = "INSERT INTO map_mode_links (id, map_id, mode_id) VALUES (".$map_mode_link.", ".$_SESSION['MAPID'].", ".$mode_id.")";

		// $result = $mysqli->query($sql1);
		// $result = $mysqli->query($sql2);

	//資料の内容全削除
	}else if($_POST["data"] == "delete_document"){

	$map_id = $_SESSION["MAPID"];

	//スライド
	$sql_s = "UPDATE document_rank SET updated_at='$timestamp', deleted=1 WHERE map_id='$map_id' AND deleted=0";
	$result_s = $mysqli->query($sql_s);

	//コンテント
	$sql_c = "UPDATE document_content_rank SET updated_at='$timestamp', deleted=1 WHERE map_id='$map_id' AND deleted=0";
	$result_c = $mysqli->query($sql_c);

	//items
	$sql_item = "UPDATE items SET updated_at='$timestamp', deleted=1 WHERE map_id='$map_id' deleted = 0";
	$result = $mysqli->query($sql_item);
    //クエリ($sql)のエラー処理
    if ($mysqli->error) {
		echo "Error items: " . $mysqli->error;
	}
    $sql_item_v = "UPDATE item_versions SET disappeared_at='$timestamp' WHERE item_id IN (SELECT item_id FROM items WHERE map_id='$map_id') AND disappeared_at IS NULL";
	$result = $mysqli->query($sql_item_v);
    //クエリ($sql)のエラー処理
    if ($mysqli->error) {
		echo "Error item_versions: " . $mysqli->error;
	}
	$sql_item_h = "UPDATE item_histories SET disappeared_at='$timestamp' WHERE item_version_id IN (SELECT item_version_id FROM item_versions WHERE item_id IN (SELECT item_id FROM items WHERE map_id='$map_id')) AND disappeared_at ";
	$result = $mysqli->query($sql_item_h);
    //クエリ($sql)のエラー処理
    if ($mysqli->error) {
		echo "Error item_histories: " . $mysqli->error;
	}

	//items
	$sql_item = "UPDATE item_contents SET updated_at='$timestamp', deleted=1 WHERE item_id IN (SELECT item_id FROM items WHERE map_id='$map_id') deleted = 0";
	$result = $mysqli->query($sql_item);
    //クエリ($sql)のエラー処理
    if ($mysqli->error) {
		echo "Error items: " . $mysqli->error;
	}
    $sql_item_v = "UPDATE item_content_versions SET disappeared_at='$timestamp' WHERE item_content_id IN (SELECT item_content_id FROM item_contents WHERE item_id IN (SELECT item_id FROM items WHERE map_id='$map_id') AND disappeared_at IS NULL";
	$result = $mysqli->query($sql_item_v);
    //クエリ($sql)のエラー処理
    if ($mysqli->error) {
		echo "Error item_versions: " . $mysqli->error;
	}
	$sql_item_h = "UPDATE item_content_histories SET disappeared_at='$timestamp' WHERE item_content_version_id IN (SELECT item_content_version_id FROM item_content_versions WHERE item_content_id IN (SELECT item_content_id FROM item_contents WHERE item_id IN (SELECT item_id FROM items WHERE map_id='$map_id'))) AND disappeared_at ";
	$result = $mysqli->query($sql_item_h);
    //クエリ($sql)のエラー処理
    if ($mysqli->error) {
		echo "Error item_histories: " . $mysqli->error;
	}

	//スライド関係
	$sql_sr = "UPDATE item_relations SET updated_at='$timestamp', deleted=1 WHERE item1_id IN (SELECT item_id FROM items WHERE map_id = '$map_id') AND deleted=0";
	$result_sr = $mysqli->query($sql_sr);

	//コンテント関係
	$sql_cr = "UPDATE item_content_relations SET updated_at='$timestamp', deleted=1 WHERE item_content1_id IN (SELECT item_content_id FROM item_contents WHERE item_id IN (SELECT item_id FROM items WHERE map_id = '$map_id') AND deleted=0";
	$result_cr = $mysqli->query($sql_cr);

	



	}else if($_POST["data"] == "item_versions"){
		$item_id = $_POST["id"];
		$version_id = uniqid();

		//item_versionsをUPDATE
		$sql_nvu = "UPDATE item_versions SET disappeared_at = '".$timestamp."' WHERE item_id = '".$item_id."' AND disappeared_at IS NULL";
		$result_nvu = $mysqli->query($sql_nvu);
		if($mysqli->error){
			echo "Error update item_version: ". $mysqli->error;
		}

		// item_historiesから最新のレコードを取得
		$sql_latest = "SELECT item_bro_id, node_id, logic_option, title FROM item_histories WHERE item_version_id IN (SELECT item_version_id FROM item_versions WHERE item_id = '$item_id') AND disappeared_at IS NULL ORDER BY appeared_at DESC LIMIT 1";
		$result_latest = $mysqli->query($sql_latest);

		if($mysqli->error) {

			echo "Error fetching latest item_history: " . $mysqli->error;

		} else if ($result_latest) {
			while($row = mysqli_fetch_assoc($result_latest)){

				// item_versionsにINSERTする
				$sql_nvi = "INSERT INTO item_versions(item_version_id, item_id, item_bro_id, node_id, logic_option, title, appeared_at, disappeared_at)
							VALUES ('".$version_id."', '".$item_id."', '".$row['item_bro_id']."', '".$row['node_id']."', '".$row['logic_option']."', '".$row['title']."', '".$timestamp."', NULL)";
				$result_nvi = $mysqli->query($sql_nvi);
				if($mysqli->error) {
					echo "Error insert item_version: " . $mysqli->error;
					echo "item_id: ".$item_id;
				}

				// item_historiesをUPDATE
				$sql_nvu = "UPDATE item_histories SET item_version_id = '$version_id' WHERE item_version_id IN (SELECT item_version_id FROM item_versions WHERE item_id = '$item_id') AND disappeared_at IS NULL";
				$result_nvu = $mysqli->query($sql_nvu);
				if($mysqli->error) {
					echo "Error update item_history: " . $mysqli->error;
				}

				$sql_iu = "UPDATE items SET updated_at = '$timestamp' WHERE item_id = '$item_id'";
				$result_iu = $mysqli->query($sql_iu);
				if($mysqli->error) {
					echo "Error update items: " . $mysqli->error;
				}
			}

    

		}else {
			echo "No item_history found for item_id: $item_id";
		}

	}else if($_POST["data"] == "item_content_versions"){
		$item_content_id = $_POST["id"];
		$version_id = uniqid();

		//item_content_versionsをUPDATE
		$sql_nvu = "UPDATE item_content_versions SET disappeared_at = '".$timestamp."' WHERE item_content_id = '".$item_content_id."' AND disappeared_at IS NULL";
		$result_nvu = $mysqli->query($sql_nvu);
		if($mysqli->error){
			echo "Error update item_content_version: ". $mysqli->error;
		}

		// item_content_historiesから最新のレコードを取得
		$sql_latest = "SELECT item_content_bro_id, node_id, logic_option, title, type FROM item_content_histories WHERE item_content_version_id IN (SELECT item_content_version_id FROM item_content_versions WHERE item_content_id = '$item_content_id') AND disappeared_at IS NULL ORDER BY appeared_at DESC LIMIT 1";
		$result_latest = $mysqli->query($sql_latest);

		if($mysqli->error) {

			echo "Error fetching latest item_content_history: " . $mysqli->error;

		} else if ($result_latest) {
			while($row = mysqli_fetch_assoc($result_latest)){

				// item_content_versionsにINSERTする
				$sql_nvi = "INSERT INTO item_content_versions(item_content_version_id, item_content_id, item_content_bro_id, node_id, logic_option, title, type, appeared_at, disappeared_at)
							VALUES ('".$version_id."', '".$item_content_id."', '".$row['item_content_bro_id']."', '".$row['node_id']."', '".$row['logic_option']."', '".$row['title']."', '".$row['type']."', '".$timestamp."', NULL)";
				$result_nvi = $mysqli->query($sql_nvi);
				if($mysqli->error) {
					echo "Error insert item_content_version: " . $mysqli->error;
					echo "item_content_id: ".$item_content_id;
				}

				// item_content_historiesをUPDATE
				$sql_nvu = "UPDATE item_content_histories SET item_content_version_id = '$version_id' WHERE item_content_version_id IN (SELECT item_content_version_id FROM item_content_versions WHERE item_content_id = '$item_content_id') AND disappeared_at IS NULL";
				$result_nvu = $mysqli->query($sql_nvu);
				if($mysqli->error) {
					echo "Error update item_content_history: " . $mysqli->error;
				}

				$sql_icu = "UPDATE item_contents SET updated_at = '$timestamp' WHERE item_content_id = '$item_content_id'";
				$result_icu = $mysqli->query($sql_icu);
				if($mysqli->error) {
					echo "Error update item_contents: " . $mysqli->error;
				}
			}
    

		}else {
			echo "No item_content_history found for item_content_id: $item_content_id";
		}

	}else if($_POST["data"] == "all_items"){
		$map_id = $_SESSION['MAPID'];
		$item_version_id = uniqid();
		$item_content_version_id = uniqid();

		// item_historiesから最新のレコードを取得
		$sql_latest = "SELECT item_id, item_bro_id, node_id, logic_option, title FROM item_latest WHERE map_id = '$map_id'";
		$result_latest = $mysqli->query($sql_latest);

		if($mysqli->error) {

			echo "Error fetching latest item_history: " . $mysqli->error;

		} else if ($result_latest) {

			while($row = mysqli_fetch_assoc($result_latest)){
				//item_versionsをUPDATE
				$sql_nvu = "UPDATE item_versions SET disappeared_at = '".$timestamp."' WHERE item_id IN '".$row['item_id']."' AND disappeared_at IS NULL";
				$result_nvu = $mysqli->query($sql_nvu);
				if($mysqli->error){
					echo "Error update item_version: ". $mysqli->error;
				}

				// item_historiesをUPDATE
				$sql_nvu = "UPDATE item_histories SET item_version_id = '$item_version_id' WHERE item_version_id IN (SELECT item_version_id FROM item_versions WHERE item_id IN '".$row['item_id']."') AND disappeared_at IS NULL";
				$result_nvu = $mysqli->query($sql_nvu);
				if($mysqli->error) {
					echo "Error update item_history: " . $mysqli->error;
				}

				$sql_iu = "UPDATE items SET updated_at = '$timestamp' WHERE item_id IN '".$row['item_id']."'";
				$result_iu = $mysqli->query($sql_iu);
				if($mysqli->error) {
					echo "Error update items: " . $mysqli->error;
				}
				
				// item_versionsにINSERTする
				$sql_nvi = "INSERT INTO item_versions(item_version_id, item_id, item_bro_id, node_id, logic_option, title, appeared_at, disappeared_at)
							VALUES ('".$item_version_id."', '".$row['item_id']."', '".$row['item_bro_id']."', '".$row['node_id']."', '".$row['logic_option']."', '".$row['title']."', '".$timestamp."', NULL)";
				$result_nvi = $mysqli->query($sql_nvi);
				if($mysqli->error) {
					echo "Error insert item_version: " . $mysqli->error;
					echo "item_id: ".$item_id;
				}
			}

		}else {
			echo "No item_history found for item_id: $item_id";
		}

		// item_content_historiesから最新のレコードを取得
		$sql_latest = "SELECT item_content_id, item_content_bro_id, node_id, logic_option, title, type FROM item_content_latest WHERE map_id = '$map_id'";
		$result_latest = $mysqli->query($sql_latest);
		if($mysqli->error) {

			echo "Error fetching latest item_content_history: " . $mysqli->error;

		} else if ($result_latest) {
			while($row = mysqli_fetch_assoc($result_latest)){

				//item_content_versionsをUPDATE
				$sql_nvu = "UPDATE item_content_versions SET disappeared_at = '".$timestamp."' WHERE item_content_id IN '".$row['item_content_id']."' AND disappeared_at IS NULL";
				$result_nvu = $mysqli->query($sql_nvu);
				if($mysqli->error){
					echo "Error update item_content_version: ". $mysqli->error;
				}

				// item_content_historiesをUPDATE
				$sql_nvu = "UPDATE item_content_histories SET item_content_version_id = '$item_content_version_id' WHERE item_content_version_id IN (SELECT item_content_version_id FROM item_content_versions WHERE item_content_id IN '".$row['item_content_id']."') AND disappeared_at IS NULL";
				$result_nvu = $mysqli->query($sql_nvu);
				if($mysqli->error) {
					echo "Error update item_content_history: " . $mysqli->error;
				}

				$sql_icu = "UPDATE item_contents SET updated_at = '$timestamp' WHERE item_content_id IN '".$row['item_content_id']."'";
				$result_icu = $mysqli->query($sql_icu);
				if($mysqli->error) {
					echo "Error update item_contents: " . $mysqli->error;
				}
		
				// item_content_versionsにINSERTする
				$sql_nvi = "INSERT INTO item_content_versions(item_content_version_id, item_content_id, item_content_bro_id, node_id, logic_option, title, type, appeared_at, disappeared_at)
							VALUES ('".$item_content_version_id."', '".$row['item_content_id']."', '".$row['item_content_bro_id']."', '".$row['node_id']."', '".$row['logic_option']."', '".$row['title']."', '".$row['type']."', '".$timestamp."', NULL)";
				$result_nvi = $mysqli->query($sql_nvi);
				if($mysqli->error) {
					echo "Error insert item_content_version: " . $mysqli->error;
				}
			}
		}else {
			echo "No item_content_history found for item_content_id: $item_content_id";
		}

	}else if($_POST["data"] == "get_past_document"){

		//mapsから資料のタイトルとupdated_at取得
		$sql_get = "SELECT title, updated_at FROM document_titles WHERE map_id = ".$_SESSION['MAPID'];
		$i = 0;
    	$get_array = array();
		if($result_get = $mysqli->query($sql_get)) {
      		while($row = mysqli_fetch_assoc($result_get)){
				$get_array[$i]["scenario_title"] = $row['title'];
				$get_array[$i]["updated_at"] = $row['updated_at'];

				//echo" <option value='".$row['scenario_title']."'": "'".$row['updated_at']."'>"  .$row['scenario_title']. "</option>" ;
				//array_push($array, $row['mt_time']); // あとで取り出せるように配列化
				$i += 1;
      		}
    	}
		echo json_encode($get_array);

	//この資料に含まれる資料一覧を取得
	}else if($_POST["data"] == "get_document"){

		//h_documentsから資料のデータ取得
		$sql_get = "SELECT * FROM h_documents WHERE map_id = ".$_SESSION['MAPID'];
		$i = 0;
		$get_array = array();
		if($result_get = $mysqli->query($sql_get)) {
			while($row = mysqli_fetch_assoc($result_get)){
				$get_array[$i]["id"] = $row['id'];
				$get_array[$i]["title"] = $row['title'];
				$get_array[$i]["updated_at"] = $row['updated_at'];

				//echo" <option value='".$row['scenario_title']."'": "'".$row['updated_at']."'>"  .$row['scenario_title']. "</option>" ;
				//array_push($array, $row['mt_time']); // あとで取り出せるように配列化
				$i += 1;
			}
		}
		echo json_encode($get_array);

		//このシートに含まれる資料を一覧を取得
		// function GetPastDocument_php(){
		// //mapsから資料のタイトルとupdated_at取得
		// require "connect_db.php";
		// $sql_get = "SELECT scenario_title, updated_at FROM maps WHERE user_id = ".$_SESSION['USERID']." AND id = ".$_SESSION['MAPID'];
		// $i = 0;
    	// $get_array = array();
		// if($result_get = $mysqli->query($sql_get)) {
      	// 	while($row = mysqli_fetch_assoc($result_get)){
		// 		// $get_array[$i]["scenario_title"] = $row['scenario_title'];
		// 		// $get_array[$i]["updated_at"] = $row['updated_at'];

		// 		echo" <option value='".$row['scenario_title']."'": "'".$row['updated_at']."'>"  .$row['scenario_title']. "</option>" ;
		// 		//array_push($array, $row['mt_time']); // あとで取り出せるように配列化
		// 		$i += 1;
      	// 	}
    	// }
		// 

	}else if($_POST["data"] == "past_time_log" || $_POST["data"] == "past_version_log" || $_POST["data"] == "current_log" || $_POST["data"] == "relation_advice"){

		$id = rand();
		$data = $_POST["data"];
		$sql = "INSERT INTO hatakeyama_logs(id, timestamp, type, user_id, map_id)
		VALUES ($id, '$timestamp', '$data', ".$_SESSION['USERID'].", ".$_SESSION['MAPID'].")";
		$result = $mysqli->query($sql);


	}

		





	
	

    // //クエリ($sql)のエラー処理
    // if($sql == TRUE){
	// 		error_log('version_update.phpの$sql成功しています'.$timestamp, 0);
	// 	}else if($sql == FALSE){
	// 		error_log($sql.'version_update.phpの$sql失敗です', 0);
	// 		// error_log('失敗しました。'.mysqli_error($link), 0);
	// 	}else{
	// 		error_log('version_update.phpの$sql不明なエラーです', 0);
	// 	}

    // //php($result)のエラー処理
    // if($result == TRUE){
	// 		error_log('version_update.phpの$result成功しています'.$timestamp, 0);
	// 	}else if($result == FALSE){
	// 		error_log($result.'version_update.phpの$result失敗です'.$mysqli->error, 0);
	// 		// error_log('失敗しました。'.mysqli_error($link), 0);
	// 	}else{
	// 		error_log('version_update.phpの$result不明なエラーです', 0);
	// 	}

		
//header("Content-Type: application/json; charset=utf-8");
//$json_result = "[{version: '$id', node_id: '$node_id', S: '$timestamp', T: 'null', map_id: '$map_id', parent_id: '$parent_id'}]";
//echo $json_result;

//versions



//総じて外部キーのエラーが起きている。外部キー消したら動くけど、値同じなのになぜなのかは不明。

//if文は並べるんじゃなくてelse ifで書かないとDBに入ってくれない？
//MySQLでは同一テーブルのサブクエリからのUPDATE文はエラーが発生する

//ここの文書き換えた時必ずノード追加してテーブルに追加されるか確認すること！！

?>