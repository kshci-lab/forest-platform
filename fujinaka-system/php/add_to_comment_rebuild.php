<?php

    session_start();

    require("connect_db.php");

    $id = $_POST["version_id"];

    $sql = "SELECT id, type, comment_id FROM add_to_comment WHERE deleted=0 and version_id='$id' ORDER BY 'created_at' DESC";

        $adds = array();

        if($result = $mysqli->query($sql)){

            while($row = mysqli_fetch_assoc($result)){

                $adds[] = array(
                    'id'=> $row["id"],
                    'type' => $row["type"],
                    'comment_id'=> $row["comment_id"]
                );
            }
        }

    echo json_encode($adds);

?>