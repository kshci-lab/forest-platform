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
    //20251024 yamashita変更
    if($_POST["type"] == "insert"){

    $rationality_id = $_POST['rationality_id'];
    $node_id = $_POST['node_id'];
    $concept_id = $_POST['concept_id'];
    $nodetype = $_POST['nodetype'];

    $sql = "INSERT INTO fujinaka_rationality (user_id, sheet_id, created_at, rationality_id, node_id, concept_id, type)
    VALUES ('$user_id', '$sheet_id', '$timestamp', '$rationality_id ', '$node_id', '$concept_id', '$nodetype')";
    $result = $mysqli->query($sql);
    }
    //20251024 yamashita変更
    else if ($_POST["type"] == "content") {

        $node_id = $_POST['node_id'];
        $parent_id = $_POST['parent_id'];
        $nodetype = $_POST['nodetype'];

        $sql = "INSERT INTO fujinaka_rationality (user_id, sheet_id, created_at, rationality_id, node_id, concept_id, type) 
        SELECT user_id, sheet_id, '". $timestamp ."', '" . $node_id . "', node_id, concept_id, '" . $nodetype . "'
        FROM fujinaka_rationality WHERE rationality_id = '" . $parent_id . "'";

        $result = $mysqli->query($sql);

        //php($sql)のエラー処理
        if($sql == TRUE){
            
            error_log('$sql:fujinaka_rationality_insert_answer成功', 0);
        }else if($sql == FALSE){
            error_log($sql.'$sql:fujinaka_rationality_insert_answer失敗', 0);
        }else{
            error_log('$sql:fujinaka_rationality_insert_answer不明なエラー', 0);
        }
        
        //php($result)のエラー処理
        if($result == TRUE){
            
            error_log('$result:fujinaka_rationality_insert_answer成功', 0);
        }else if($result == FALSE){
            error_log($result.'$result:fujinaka_rationality_insert_answer失敗'.$mysqli->error, 0);
        }else{
            error_log('$result:fujinaka_rationality_insert_answer不明なエラー', 0);
        }

    } 
    else if ($_POST["type"] == "get_nodeid") {

        $sql = "SELECT node_id FROM feedback WHERE sheet_id='$sheet_id' AND node_concept='考えた合理性'";

        $result = $mysqli->query($sql);

        $data = array();

        if($result = $mysqli->query($sql)){

            while($row = mysqli_fetch_assoc($result)){
                $data[] = array(
                    'id' => $row["node_id"]
                );
            }
        }



    } else if ($_POST["type"] == "delete"){

        if(!($_POST['rationality_id'])){ //合理性ノードを消した際

            $rationality_id = $_POST['rationality_id'];
            
            $sql = "UPDATE fujinaka_rationality SET deleted = 1 WHERE rationality_id='$rationality_id'";
        
            $result = $mysqli->query($sql);

        } else {//合理性を考えたノード（合理性を考える時に選択したノード）と考えられる際（実際はわからん）

            $node_id = $_POST['node_id'];

            $sql = "UPDATE fujinaka_rationality SET deleted = 1 WHERE rationality_id=(SELECT rationality_id FROM fujinaka_rationality WHERE node_id='$node_id')";
        
            $result = $mysqli->query($sql);

        }


    } 
    else if($_POST["type"] == "concept"){

        $reflect_node_id = $_POST["id"];

        $sql = "SELECT concept_id FROM fujinaka_rationality WHERE rationality_id=(SELECT rationality_id FROM fujinaka_rationality WHERE node_id='$reflect_node_id' AND deleted = 0) AND deleted = 0";

        $condata = array();

        if($result = $mysqli->query($sql)){

        while($row = mysqli_fetch_assoc($result)){
                $condata[] = array(
                    'concept_id' => $row["concept_id"]
                );
            }
        }

    }
    else if ($_POST["type"] == "id"){

        $unreflect_rationality_id = $_POST["id"];

        $sql = "SELECT node_id FROM fujinaka_rationality WHERE rationality_id='$unreflect_rationality_id' AND deleted = 0";

        $iddata = array();

        if($result = $mysqli->query($sql)){

        while($row = mysqli_fetch_assoc($result)){
                $iddata[] = array(
                    'id' => $row["node_id"]
                );
            }
        }

    }
    else if($_POST["type"] == "other_id"){

        $influence_node_id = $_POST["node_id"];

        $sql = "SELECT node_id FROM fujinaka_rationality WHERE rationality_id=(SELECT rationality_id FROM fujinaka_rationality WHERE node_id='$influence_node_id' AND deleted = 0) AND deleted = 0 AND nodeid != '$influence_node_id'";

        $condata = array();

        if($result = $mysqli->query($sql)){

            while($row = mysqli_fetch_assoc($result)){
                    $condata[] = array(
                        'node_id' => $row["node_id"]
                    );
            }
        }
    }
    // 20251024 yamashita変更
    else if($_POST["type"] == "slide"){
        $slide_id = $_POST["id"];             //スライドID
		$activity_id = uniqid();

		$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

		$sql = "INSERT INTO slide (id, sheet_id, slide_title, user_id, created_at, updated_at, deleted, from_slide)
		VALUES ('$slide_id', '$sheet_id', NULL, '$user_id','$timestamp', '$timestamp', 0, '$sheet_id')";

		$result = $mysqli->query($sql);
    }
    else if($_POST["type"] == "chapter"){
        //章挿入処理
        $chapter_id = $_POST["id"];                //章ID
        $rank = $_POST["rank"];    

        $sql = "INSERT INTO chapter (chapter_id, user_id, sheet_id, rank, created_at)
        VALUES ('$chapter_id', '$user_id', '$sheet_id', '$rank', '$timestamp')";

        $result = $mysqli->query($sql);

        if ($result === TRUE) {
            // 成功時は JSON を返す
            http_response_code(200);
            echo json_encode([
                "status" => "ok",
                "action" => "chapter_insert",
                "id" => $chapter_id
            ]);
        } else {
            // エラーはログに残して JSON と 500 を返す
            error_log('chapter_insert 失敗 - ' . $mysqli->error, 0);
            http_response_code(500);
            echo json_encode([
                "status" => "error",
                "action" => "chapter_insert",
                "message" => $mysqli->error
            ]);
        }
        exit;
    }
    else if($_POST["type"] == "section"){
        //節挿入処理
    }
}

?>