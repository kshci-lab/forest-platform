<?php

session_start();
require("connect_db.php");
date_default_timezone_set('Asia/Tokyo');

// --- 追加: 一貫したミリ秒付きタイムスタンプを生成 ---
$mtime = microtime(true);
$ms = sprintf("%03d", ($mtime - floor($mtime)) * 1000);
$timestamp = date("Y-m-d H:i:s", (int)$mtime) . "." . $ms;

header('Content-Type: application/json'); // JSON 形式でレスポンスを返す

if (!isset($_SESSION['USERID'])) {
    echo json_encode(["status" => "error", "message" => "ユーザーIDが設定されていません"]);
    exit;
}

$user_id = $_SESSION['USERID'];		//ユーザID
$sheet_id = $_SESSION['SHEETID'];	//シートID
$purpose =$_POST['purpose'];
//DBに登録する
if($purpose === 'record'){
    $record_thing = $_POST['record_thing'];
    //20251024 yamashita変更　なにしてるかよくわからん
    // if($_POST["type"] == "insert"){

    // $rationality_id = $_POST['rationality_id'];
    // $node_id = $_POST['node_id'];
    // $concept_id = $_POST['concept_id'];
    // $nodetype = $_POST['nodetype'];

    // $sql = "INSERT INTO fujinaka_rationality (user_id, sheet_id, created_at, rationality_id, node_id, concept_id, type)
    // VALUES ('$user_id', '$sheet_id', '$timestamp', '$rationality_id ', '$node_id', '$concept_id', '$nodetype')";
    // $result = $mysqli->query($sql);
    // }
    // else if ($_POST["type"] == "content") {

    //     $node_id = $_POST['node_id'];
    //     $parent_id = $_POST['parent_id'];
    //     $nodetype = $_POST['nodetype'];

    //     $sql = "INSERT INTO fujinaka_rationality (user_id, sheet_id, created_at, rationality_id, node_id, concept_id, type) 
    //     SELECT user_id, sheet_id, '". $timestamp ."', '" . $node_id . "', node_id, concept_id, '" . $nodetype . "'
    //     FROM fujinaka_rationality WHERE rationality_id = '" . $parent_id . "'";

    //     $result = $mysqli->query($sql);

    //     //php($sql)のエラー処理
    //     if($sql == TRUE){
            
    //         error_log('$sql:fujinaka_rationality_insert_answer成功', 0);
    //     }else if($sql == FALSE){
    //         error_log($sql.'$sql:fujinaka_rationality_insert_answer失敗', 0);
    //     }else{
    //         error_log('$sql:fujinaka_rationality_insert_answer不明なエラー', 0);
    //     }
        
    //     //php($result)のエラー処理
    //     if($result == TRUE){
            
    //         error_log('$result:fujinaka_rationality_insert_answer成功', 0);
    //     }else if($result == FALSE){
    //         error_log($result.'$result:fujinaka_rationality_insert_answer失敗'.$mysqli->error, 0);
    //     }else{
    //         error_log('$result:fujinaka_rationality_insert_answer不明なエラー', 0);
    //     }

    // } 
    // else if ($_POST["type"] == "get_nodeid") {

    //     $sql = "SELECT node_id FROM feedback WHERE sheet_id='$sheet_id' AND node_concept='考えた合理性'";

    //     $result = $mysqli->query($sql);

    //     $data = array();

    //     if($result = $mysqli->query($sql)){

    //         while($row = mysqli_fetch_assoc($result)){
    //             $data[] = array(
    //                 'id' => $row["node_id"]
    //             );
    //         }
    //     }



    // } else if ($_POST["type"] == "delete"){

    //     if(!($_POST['rationality_id'])){ //合理性ノードを消した際

    //         $rationality_id = $_POST['rationality_id'];
            
    //         $sql = "UPDATE fujinaka_rationality SET deleted = 1 WHERE rationality_id='$rationality_id'";
        
    //         $result = $mysqli->query($sql);

    //     } else {//合理性を考えたノード（合理性を考える時に選択したノード）と考えられる際（実際はわからん）

    //         $node_id = $_POST['node_id'];

    //         $sql = "UPDATE fujinaka_rationality SET deleted = 1 WHERE rationality_id=(SELECT rationality_id FROM fujinaka_rationality WHERE node_id='$node_id')";
        
    //         $result = $mysqli->query($sql);

    //     }


    // } 
    // //20251025かぶるからいったん変更
    // else if($_POST["type"] == "a_concept"){

    //     $reflect_node_id = $_POST["id"];

    //     $sql = "SELECT concept_id FROM fujinaka_rationality WHERE rationality_id=(SELECT rationality_id FROM fujinaka_rationality WHERE node_id='$reflect_node_id' AND deleted = 0) AND deleted = 0";

    //     $condata = array();

    //     if($result = $mysqli->query($sql)){

    //     while($row = mysqli_fetch_assoc($result)){
    //             $condata[] = array(
    //                 'concept_id' => $row["concept_id"]
    //             );
    //         }
    //     }
    // }
    // else if ($_POST["type"] == "id"){

    //     $unreflect_rationality_id = $_POST["id"];

    //     $sql = "SELECT node_id FROM fujinaka_rationality WHERE rationality_id='$unreflect_rationality_id' AND deleted = 0";

    //     $iddata = array();

    //     if($result = $mysqli->query($sql)){

    //     while($row = mysqli_fetch_assoc($result)){
    //             $iddata[] = array(
    //                 'id' => $row["node_id"]
    //             );
    //         }
    //     }

    // }
    // else if($_POST["type"] == "other_id"){

    //     $influence_node_id = $_POST["node_id"];

    //     $sql = "SELECT node_id FROM fujinaka_rationality WHERE rationality_id=(SELECT rationality_id FROM fujinaka_rationality WHERE node_id='$influence_node_id' AND deleted = 0) AND deleted = 0 AND nodeid != '$influence_node_id'";

    //     $condata = array();

    //     if($result = $mysqli->query($sql)){

    //         while($row = mysqli_fetch_assoc($result)){
    //                 $condata[] = array(
    //                     'node_id' => $row["node_id"]
    //                 );
    //         }
    //     }
    // }
    // //ここまでなにしてるかよーわからん
    // 20251024 yamashita変更
    if($record_thing == "slide"){
        $slide_id = $_POST["id"];             //スライドID
		$activity_id = uniqid();

		$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

		$sql = "INSERT INTO slide (id, sheet_id, slide_title, user_id, created_at, updated_at, deleted, from_slide)
		VALUES ('$slide_id', '$sheet_id', NULL, '$user_id','$timestamp', '$timestamp', 0, '$sheet_id')";

		if ($mysqli->query($sql)) {
			echo json_encode(["status" => "success", "message" => "スライドが記録されました"]);
		} else {
			echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
		}
    }
    else if($record_thing == "chapter"){
        //章挿入処理
        $chapter_id = $_POST["id"];                //章ID
        $rank = $_POST["rank"];    

        $sql = "INSERT INTO chapter (chapter_id, user_id, sheet_id, rank, created_at)
        VALUES ('$chapter_id', '$user_id', '$sheet_id', '$rank', '$timestamp')";

        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "章が記録されました"]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    }
    else if($record_thing == "section"){
        //節挿入処理
        $section_id = $_POST["id"];				//節ID
        $chapter_id = $_POST["chapter_id"];	    //章ID
	    $rank = $_POST["rank"];					//章順番
        $sql = "INSERT INTO section (section_id, user_id, sheet_id, chapter_id, rank, created_at)
	    VALUES ('$section_id', '$user_id', '$sheet_id','$chapter_id', '$rank', '$timestamp')";
        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "節が記録されました"]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    }
    else if($record_thing == "paragraph"){
        //段落挿入処理
        $section_id = $_POST["section_id"];	//節ID
        $paragraph_id = $_POST["id"];       //パラグラフID
	    $rank = $_POST["rank"]; 		    //パラグラフ順番
        $sql = "INSERT INTO paragraph (paragraph_id, user_id, sheet_id, section_id, rank, created_at)
	    VALUES ('$paragraph_id', '$user_id', '$sheet_id', '$section_id', '$rank', '$timestamp')";

        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "段落が記録されました"]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    }
    else if($record_thing == "content"){
        // 段落内容 UPSERT（content_id + sheet_id で一意にする）
        $id = $_POST["id"];
        $content_id = $_POST["content_id"];
        $rank = $_POST["rank"];
        $slide_id = $_POST["slide_id"];
        $content = $_POST["content"];
        $node_id = $_POST["node_id"];
        $type = $_POST["type"];
        $indent = $_POST["indent"];
        $concept_id = $_POST["concept_id"];

        $chk = "SELECT id FROM slide_content_rank WHERE content_id='$content_id' AND sheet_id='$sheet_id' LIMIT 1";
        if ($res = $mysqli->query($chk)) {
            if ($res->num_rows > 0) {
                // 既存→UPDATE（deletedは復活させる）
                $upd = "UPDATE slide_content_rank
                        SET node_id='$node_id', concept_id='$concept_id', rank='$rank', content='$content',
                            slide_id='$slide_id', type='$type', indent='$indent',
                            updated_at='$timestamp', user_id='$user_id', deleted=0
                        WHERE content_id='$content_id' AND sheet_id='$sheet_id'";
                $ok = $mysqli->query($upd);
            } else {
                // 新規→INSERT
                $ins = "INSERT INTO slide_content_rank
                        (id, content_id, node_id, concept_id, rank, content, slide_id, type, indent,
                         created_at, updated_at, user_id, sheet_id, deleted)
                        VALUES
                        ('$id', '$content_id', '$node_id', '$concept_id', '$rank', '$content', '$slide_id', '$type', '$indent',
                         '$timestamp', '$timestamp', '$user_id', '$sheet_id', 0)";
                $ok = $mysqli->query($ins);
            }
            $res->close();
        } else {
            $ok = false;
        }

        if ($ok) {
            echo json_encode([
                "status" => "success",
                "message" => "段落の内容が記録されました",
                "content_id" => $content_id,
                "slide_id" => $slide_id
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    }
}
else if($purpose === "update"){
    $update_thing = $_POST['update_thing'];
    if ($update_thing == "slide"){
        $slide_id = $_POST["id"]; //スライドID
        $slide_title = $_POST["content"]; //スライドタイトル
        $sql = "SELECT slide_title FROM slide WHERE id = '$slide_id'";
        if($result = $mysqli->query($sql)) {
        while($row = mysqli_fetch_assoc($result)){
            $pre_title = $row['slide_title'];
        }
        }
        if($slide_title != $pre_title){

        $sql = "UPDATE slide SET updated_at='$timestamp', slide_title='$slide_title' WHERE id='$slide_id'";
        } 
        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "スライドが更新されました"]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    }
    else if( $update_thing == "scenario_title"){
        //タイトル更新処理
        $title = $_POST["title"]; //論文タイトル
        $sql = "SELECT scenario_title FROM sheets WHERE id='$sheet_id'";

        if($result = $mysqli->query($sql)) {
            while($row = mysqli_fetch_assoc($result)){
                $pre_title = $row['scenario_title'];
            }
        }

        if($title != $pre_title){	//変更があれば更新

            $sql = "UPDATE sheets SET updated_at='$timestamp', scenario_title='$title' WHERE id='$sheet_id'";
        }
        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "タイトルが更新されました"]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    }
    else if ($update_thing == "chapter"){
        //章更新処理
        $chapter_id = $_POST["id"]; //章ID

        $sql = "SELECT title FROM chapter WHERE chapter_id = '$chapter_id'";

        if($result = $mysqli->query($sql)) {
            while($row = mysqli_fetch_assoc($result)){
            $pre_title = $row['title'];
            }
        }

        $title = $_POST["title"]; //章タイトル

        if($title != $pre_title){	//変更があれば更新

            $sql = "UPDATE chapter SET title='$title' WHERE chapter_id='$chapter_id'";
            if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "章が更新されました"]);
            } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
            }                    
        }
    }
    else if ($update_thing == "section"){
        //節更新処理
        $section_id = $_POST["id"]; //章ID

        $sql = "SELECT title FROM section WHERE section_id = '$section_id'";

        if($result = $mysqli->query($sql)) {
            while($row = mysqli_fetch_assoc($result)){
            $pre_title = $row['title'];
            }
        }

        $title = $_POST["title"]; //章タイトル

        if($title != $pre_title){	//変更があれば更新

            $sql = "UPDATE section SET title='$title' WHERE section_id='$section_id'";
            if ($mysqli->query($sql)) {
                echo json_encode(["status" => "success", "message" => "節が更新されました"]);
                } else {
                echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
            }
        }
    }
    else if ($update_thing == "paragraph"){
        //段落更新処理
        $paragraph_id = $_POST["id"]; //パラグラフID
        if($_POST["update"] == "title"){

            $sql = "SELECT title FROM paragraph WHERE paragraph_id = '$paragraph_id'";

            if($result = $mysqli->query($sql)) {
                while($row = mysqli_fetch_assoc($result)){
                    $pre_title = $row['title'];
                }
            }

            $title = $_POST["title"];

            if($title != $pre_title){

                $sql = "UPDATE paragraph SET title='$title' WHERE paragraph_id = '$paragraph_id'";
                if ($mysqli->query($sql)) {
                    echo json_encode(["status" => "success", "message" => "節が更新されました"]);
                    } else {
                    echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
                }
            }
        }
        else if($_POST["update"] == "content"){

		$content = $_POST["content"];
		
		$sql = "UPDATE paragraph SET content = '$content' WHERE paragraph_id = '$paragraph_id'";
		if ($mysqli->query($sql)) {
                echo json_encode(["status" => "success", "message" => "節が更新されました"]);
                } else {
                echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
            }
	    }
    }
    else if ($update_thing == "content"){
        // 段落内容更新（slide_content_rankを参照）
        $content_id = $_POST["id"];
        $content = $_POST["content"];

        $sql = "SELECT content FROM slide_content_rank WHERE content_id = '$content_id' AND sheet_id='$sheet_id' AND deleted=0";
        $pre_content = null;
        if($result = $mysqli->query($sql)) {
            if ($row = $result->fetch_assoc()){
                $pre_content = $row['content'];
            }
            $result->close();
        }

        if($pre_content === null || $content != $pre_content){
            $sql = "UPDATE slide_content_rank SET updated_at='$timestamp', content='$content'
                    WHERE content_id='$content_id' AND sheet_id='$sheet_id'";
            if ($mysqli->query($sql)) {
                echo json_encode(["status" => "success", "message" => "段落の内容が更新されました"]);
            } else {
                echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
            }
        } else {
            echo json_encode(["status" => "success", "message" => "変更なし"]);
        }
    }
}
else if($purpose === "delete"){
    $delete_thing = $_POST['delete_thing'];
    if ($delete_thing == "slide"){
        $slide_id = $_POST["id"];  
        $sql = "UPDATE slide SET updated_at='$timestamp', deleted=1 WHERE id='$slide_id'";

		if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "スライドが削除されました"]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }      
    }
    else if ($delete_thing == "chapter"){
        // 章削除処理（章→節→パラグラフ→コンテントの順に論理削除）
        $chapter_id = $mysqli->real_escape_string($_POST["id"]); // エスケープ

        // トランザクション開始
        $mysqli->begin_transaction();

        try {
            // 1) この章に属し未削除の節IDをロック取得
            $sectionIds = [];
            $sqlSec = "SELECT section_id FROM section WHERE chapter_id='$chapter_id' AND deleted = 0 FOR UPDATE";
            if ($resSec = $mysqli->query($sqlSec)) {
                while ($row = $resSec->fetch_assoc()) {
                    $sectionIds[] = $row['section_id'];
                }
                $resSec->close();
            } else {
                throw new Exception($mysqli->error);
            }

            // IN句生成
            $inSection = '';
            if (!empty($sectionIds)) {
                $escaped = array_map([$mysqli, 'real_escape_string'], $sectionIds);
                $inSection = "'" . implode("','", $escaped) . "'";
            }

            // 2) 上記節に属し未削除のパラグラフIDをロック取得
            $paragraphIds = [];
            if (!empty($inSection)) {
                $sqlPar = "SELECT paragraph_id FROM paragraph WHERE section_id IN ($inSection) AND deleted = 0 FOR UPDATE";
                if ($resPar = $mysqli->query($sqlPar)) {
                    while ($row = $resPar->fetch_assoc()) {
                        $paragraphIds[] = $row['paragraph_id'];
                    }
                    $resPar->close();
                } else {
                    throw new Exception($mysqli->error);
                }
            }
            $inPara = '';
            if (!empty($paragraphIds)) {
                $escapedPara = array_map([$mysqli, 'real_escape_string'], $paragraphIds);
                $inPara = "'" . implode("','", $escapedPara) . "'";
            }

            // 3) 論理削除（章→節→パラグラフ→コンテント）
            $q1 = "UPDATE chapter SET deleted = 1 WHERE chapter_id='$chapter_id'";
            $q2 = "UPDATE section SET deleted = 1 WHERE chapter_id='$chapter_id'";
            $q3 = !empty($inSection)
                ? "UPDATE paragraph SET deleted = 1 WHERE section_id IN ($inSection)"
                : null;
            // slide_content_rank は slide_id を参照
            $q4 = !empty($inPara)
                ? "UPDATE slide_content_rank SET deleted = 1, updated_at='$timestamp' WHERE slide_id IN ($inPara) AND sheet_id='$sheet_id'"
                : null;

            if (!$mysqli->query($q1)) throw new Exception($mysqli->error);
            if (!$mysqli->query($q2)) throw new Exception($mysqli->error);
            if ($q3 && !$mysqli->query($q3)) throw new Exception($mysqli->error);
            if ($q4 && !$mysqli->query($q4)) throw new Exception($mysqli->error);

            // コミット
            $mysqli->commit();
            echo json_encode([
                "status" => "success",
                "message" => "章が削除されました",
                "section_ids_deleted" => $sectionIds,
                "paragraph_ids_deleted" => $paragraphIds
            ]);
        } catch (Exception $e) {
            // ロールバック
            $mysqli->rollback();
            error_log('chapter delete failed: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $e->getMessage()]);
        }
    }
    else if ($delete_thing == "section"){
        //節削除処理
        $section_id = $mysqli->real_escape_string($_POST["id"]); // エスケープ

        // トランザクション開始
        $mysqli->begin_transaction();

        try {
            // 対象節配下の段落IDを取得（未削除のみをロック）
            $paragraphIds = [];
            $sqlPar = "SELECT paragraph_id FROM paragraph WHERE section_id='$section_id' AND deleted = 0 FOR UPDATE";
            if ($resPar = $mysqli->query($sqlPar)) {
                while ($row = $resPar->fetch_assoc()) {
                    $paragraphIds[] = $row['paragraph_id'];
                }
                $resPar->close();
            } else {
                throw new Exception($mysqli->error);
            }
            $inPara = '';
            if (!empty($paragraphIds)) {
                $escapedPara = array_map([$mysqli, 'real_escape_string'], $paragraphIds);
                $inPara = "'" . implode("','", $escapedPara) . "'";
            }

            $q1 = "UPDATE section SET deleted = 1 WHERE section_id='$section_id'";
            $q2 = "UPDATE paragraph SET deleted = 1 WHERE section_id='$section_id'";
            // slide_content_rank の外部キーは slide_id
            $q3 = !empty($inPara)
                ? "UPDATE slide_content_rank SET deleted = 1, updated_at='$timestamp' WHERE slide_id IN ($inPara) AND sheet_id='$sheet_id'"
                : null;

            if (!$mysqli->query($q1)) throw new Exception($mysqli->error);
            if (!$mysqli->query($q2)) throw new Exception($mysqli->error);
            if ($q3 && !$mysqli->query($q3)) throw new Exception($mysqli->error);

            $mysqli->commit();
            echo json_encode(["status" => "success", "message" => "節が削除されました", "paragraph_ids_deleted" => $paragraphIds]);
        } catch (Exception $e) {
            $mysqli->rollback();
            error_log('section delete failed: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $e->getMessage()]);
        }
    }
    else if ($delete_thing == "paragraph"){
        //段落削除処理
        $paragraph_id = $mysqli->real_escape_string($_POST["id"]); // エスケープ

        // トランザクション開始
        $mysqli->begin_transaction();

        try {
            $q1 = "UPDATE paragraph SET deleted = 1 WHERE paragraph_id='$paragraph_id'";
            // slide_content_rank は slide_id を参照
            $q2 = "UPDATE slide_content_rank SET deleted = 1, updated_at='$timestamp' WHERE slide_id='$paragraph_id' AND sheet_id='$sheet_id'";

            if (!$mysqli->query($q1)) throw new Exception($mysqli->error);
            if (!$mysqli->query($q2)) throw new Exception($mysqli->error);

            $mysqli->commit();
            echo json_encode(["status" => "success", "message" => "段落が削除されました"]);
        } catch (Exception $e) {
            $mysqli->rollback();
            error_log('paragraph delete failed: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $e->getMessage()]);
        }
    }
    else if ($delete_thing == "content"){
        // id でも content_id でも対応し、sheet_id でスコープ
        $content_id = $_POST["id"];
        $sql = "UPDATE slide_content_rank
                SET updated_at='$timestamp', deleted=1
                WHERE sheet_id='$sheet_id' AND (id='$content_id' OR content_id='$content_id')";
        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "段落の内容が削除されました"]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    }
}

?>