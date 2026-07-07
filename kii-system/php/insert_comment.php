<?php

session_start();

/*ノード情報をDBに格納する際に使用*/
require("connect_db.php");
date_default_timezone_set('Asia/Tokyo');

if($_POST["insert"] == "comment"){
    $id = $_POST["id"];
    $user_id = $_SESSION["USERID"];
    $nodeid = $_POST["nodeid"];
    $comment = $_POST["comment"];
    $map_id = $_POST["map_id"];
    
    $sql = "INSERT INTO comments (id, user_id, node_id, comment, map_id) VALUES ($id, $user_id, '$nodeid','$comment',$map_id)";
    $result = $mysqli->query($sql);
    echo $result;
}

?>
