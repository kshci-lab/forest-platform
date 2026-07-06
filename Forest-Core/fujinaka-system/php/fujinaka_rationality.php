<?php

session_start();

require("connect_db.php");

date_default_timezone_set('Asia/Tokyo');


$user_id = $_SESSION['USERID'];		//ユーザID
$map_id = $_SESSION['MAPID'];	//シートID
$timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);



	

if($_POST["type"] == "insert"){

    $rationality_id = $_POST['rationality_id'];
    $node_id = $_POST['node_id'];
    $concept_id = $_POST['concept_id'];
    $nodetype = $_POST['nodetype'];

    $sql = "INSERT INTO fujinaka_rationality (user_id, map_id, created_at, rationality_id, node_id, concept_id, type)
    VALUES ('$user_id', '$map_id', '$timestamp', '$rationality_id ', '$node_id', '$concept_id', '$nodetype')";
    $result = $mysqli->query($sql);

    //php($sql)のエラー処理
    if($sql == TRUE){
        
        error_log('$sql:fujinaka_rationality_insert成功', 0);
    }else if($sql == FALSE){
        error_log($sql.'$sql:fujinaka_rationality_insert失敗', 0);
    }else{
        error_log('$sql:fujinaka_rationality_insert不明なエラー', 0);
    }
    
    //php($result)のエラー処理
    if($result == TRUE){
        
        error_log('$result:fujinaka_rationality_insert成功', 0);
    }else if($result == FALSE){
        error_log($result.'$result:fujinaka_rationality_insert失敗'.$mysqli->error, 0);
    }else{
        error_log('$result:fujinaka_rationality_insert不明なエラー', 0);
    }

} else if ($_POST["type"] == "insert_answer") {

    $node_id = $_POST['node_id'];
    $parent_id = $_POST['parent_id'];
    $nodetype = $_POST['nodetype'];

    $sql = "INSERT INTO fujinaka_rationality (user_id, map_id, created_at, rationality_id, node_id, concept_id, type) 
    SELECT user_id, map_id, '". $timestamp ."', '" . $node_id . "', node_id, concept_id, '" . $nodetype . "'
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

} else if ($_POST["type"] == "get_nodeid") {

    $sql = "SELECT node_id FROM feedback WHERE map_id='$map_id' AND node_concept='考えた合理性'";

    $result = $mysqli->query($sql);

    $data = array();

    if($result = $mysqli->query($sql)){

        while($row = mysqli_fetch_assoc($result)){
            $data[] = array(
                'id' => $row["node_id"]
            );
        }
    }

    //php($sql)のエラー処理
    if($sql == TRUE){
        
        error_log('$sql:fujinaka_rationality_get_nodeid成功', 0);
    }else if($sql == FALSE){
        error_log($sql.'$sql:fujinaka_rationality_get_nodeid失敗', 0);
    }else{
        error_log('$sql:fujinaka_rationality_get_nodeid不明なエラー', 0);
    }
    
    //php($result)のエラー処理
    if($result == TRUE){
        
        error_log('$result:fujinaka_rationality_get_nodeid成功', 0);
    }else if($result == FALSE){
        error_log($result.'$result:fujinaka_rationality_get_nodeid失敗'.$mysqli->error, 0);
    }else{
        error_log('$result:fujinaka_rationality_get_nodeid不明なエラー', 0);
    }

    echo json_encode($data);


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

	//php($sql)のエラー処理
	if($sql == TRUE){
		error_log('$sql:fujinaka_rationality_delete成功', 0);
	}else if($sql == FALSE){
		error_log($sql.'$sql:fujinaka_rationality_delete失敗', 0);
	}else{
		error_log('$sql:fujinaka_rationality_delete不明なエラー', 0);
	}
	
	//php($result)のエラー処理
	if($result == TRUE){
		error_log('$result:fujinaka_rationality_delete成功', 0);
	}else if($result == FALSE){
		error_log($result.'$result:fujinaka_rationality_delete失敗'.$mysqli->error, 0);
	}else{
		error_log('$result:fujinaka_rationality_delete不明なエラー', 0);
	}

} else if($_POST["type"] == "concept"){

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

    //php($sql)のエラー処理
    if($sql == TRUE){
        error_log('$sql:fujinaka_rationality_get_concept成功', 0);
    }else if($sql == FALSE){
        error_log($sql.'$sql:fujinaka_rationality_get_concept失敗', 0);
    }else{
        error_log('$sql:fujinaka_rationality_get_concept不明なエラー', 0);
    }
    
    //php($result)のエラー処理
    if($result == TRUE){
        error_log('$result:fujinaka_rationality_get_concept成功', 0);
    }else if($result == FALSE){
        error_log($result.'$result:fujinaka_rationality_get_concept失敗'.$mysqli->error, 0);
    }else{
        error_log('$result:fujinaka_rationality_get_concept不明なエラー', 0);
    }

    echo json_encode($condata);

}else if ($_POST["type"] == "id"){

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

    //php($sql)のエラー処理
    if($sql == TRUE){
        error_log('$sql:fujinaka_rationality_get_id成功', 0);
    }else if($sql == FALSE){
        error_log($sql.'$sql:fujinaka_rationality_get_id失敗', 0);
    }else{
        error_log('$sql:fujinaka_rationality_get_id不明なエラー', 0);
    }
    
    //php($result)のエラー処理
    if($result == TRUE){
        error_log('$result:fujinaka_rationality_get_id成功', 0);
    }else if($result == FALSE){
        error_log($result.'$result:fujinaka_rationality_get_id失敗'.$mysqli->error, 0);
    }else{
        error_log('$result:fujinaka_rationality_get_id不明なエラー', 0);
    }

    echo json_encode($iddata);

}else if($_POST["type"] == "other_id"){

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

    //php($sql)のエラー処理
    if($sql == TRUE){
        error_log('$sql:fujinaka_rationality_get_concept成功', 0);
    }else if($sql == FALSE){
        error_log($sql.'$sql:fujinaka_rationality_get_concept失敗', 0);
    }else{
        error_log('$sql:fujinaka_rationality_get_concept不明なエラー', 0);
    }
    
    //php($result)のエラー処理
    if($result == TRUE){
        error_log('$result:fujinaka_rationality_get_concept成功', 0);
    }else if($result == FALSE){
        error_log($result.'$result:fujinaka_rationality_get_concept失敗'.$mysqli->error, 0);
    }else{
        error_log('$result:fujinaka_rationality_get_concept不明なエラー', 0);
    }

    echo json_encode($condata);

}
?>
