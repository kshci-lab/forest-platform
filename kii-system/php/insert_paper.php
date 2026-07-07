<?php

	session_start();

	/*ノード情報をDBに格納する際に使用*/
	require("connect_db.php");
	date_default_timezone_set('Asia/Tokyo');
	$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

	$map_id = rand();
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
    $deleted = 0;
    $map_mode_link = rand();
    $map_version = rand();
    $mode_id = 2; //論文読解モード
    
    // papersに挿入
    $paper_id = $_POST["id"];
	$content = $_POST["content"];
	$paper_title = $_POST["paper_title"];

	$sql = "INSERT INTO papers (id, paper_content, created_at, paper_title) VALUE ('$paper_id','$content','$timestamp', '$paper_title')";
	$result = $mysqli->query($sql);

    //php($result)のエラー処理
    if($mysqli->error){
        echo "Error papers insert: ".$mysqli->error;
    }

    $sql1 = "INSERT INTO maps (map_id, user_id, name, paper_id, created_at, updated_at, deleted) 
        VALUES (".$map_id.", ".$_SESSION['USERID'].", '".$_POST['mapname']."', '".$paper_id."', '".$timestamp."', '".$timestamp."','".$deleted."')";			
    $sql2 = "INSERT INTO map_mode_links (id, map_id, mode_id) VALUES (".$map_mode_link.", ".$map_id.", ".$mode_id.")";

    $result = $mysqli->query($sql1);
    if ($mysqli->error) {
        echo "Error map insert: ". $mysqli->error;
        exit();
    }
	$result = $mysqli->query($sql2);
    if ($mysqli->error) {
        echo "Error map_mode insert: ". $mysqli->error;
        exit();
    }

    $sql_mv = "INSERT INTO map_versions (map_version_id, map_id, name, appeared_at, disappeared_at) VALUES (".$map_version.", '".$map_id."', '".$_POST['mapname']."', '".$timestamp."', NULL)";
    $result = $mysqli->query($sql_mv);
	if ($mysqli->error) {
        echo "Error map_version insert: ". $mysqli->error;
        exit();
    }

    // header("Location: index.php");
	
?>

