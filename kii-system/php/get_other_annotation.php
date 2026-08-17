<?php
session_start();
require "connect_db.php";

    $map_id = $_SESSION["MAPID"];
    $paper_id = $_SESSION["PAPERID"]; 

	if($_POST["val"] == "get_conceptid"){
		$id = $_POST["id"];

        $i = 0;
        $node_id_array = array();

        $sql = "SELECT * FROM node_latest WHERE node_id = '".$id."' AND (node_type_id = 1 OR node_type_id = 3)";

        if($result = $mysqli->query($sql)){

			while($row = mysqli_fetch_assoc($result)){

				$node_id_array = $node_id_array + array($i=>$row["concept_id"]);

				$i += 1;

			}
        }
    
        echo json_encode($node_id_array);

    }


    else if ($_POST["val"] == "get_question") {

        $id = isset($_POST["id"]) ? $_POST["id"] : "";
        $data_array = array();
        $map_id = $_SESSION["MAPID"];
        $paper_id = $_SESSION["PAPERID"];

        if ($id === "" || $id === null) {
            echo json_encode($data_array);
            exit;
        }

        $sql = "SELECT nl.content, nl.node_id, nl.parent_id, ml.map_id
                    FROM node_latest nl
                    JOIN map_node_links ml ON nl.node_id = ml.node_id
                    JOIN maps m ON ml.map_id = m.map_id
                    WHERE nl.concept_id = ?
                        AND nl.type = 'predict'
                        AND ml.map_id <> ?
                        AND m.paper_id = ?
                        AND (ml.disappeared_at IS NULL OR ml.disappeared_at = '')";

        if ($stmt = $mysqli->prepare($sql)) {
            $stmt->bind_param("sii", $id, $map_id, $paper_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $i = 0;

            while ($row = mysqli_fetch_assoc($result)) {
                $data_array[$i] = array(
                    "content" => $row["content"],
                    "map_id" => $row["map_id"],
                    "id" => $row["node_id"],
                    "parent_id" => $row["parent_id"]
                );
                $i++;
            }
            $stmt->close();
        }

        echo json_encode($data_array);
        exit;

        $id = $_POST["id"];   
        $i = 0;
        $data_array = array(); // contentとmapidを格納する配列 
        $map_id = $_SESSION["MAPID"];
        $paper_id = $_SESSION["PAPERID"]; 
        $sql = "SELECT nl.*, ml.map_id
                    FROM node_latest nl
                    JOIN map_node_links ml ON nl.node_id = ml.node_id
                    WHERE nl.concept_id = '1643939439432000_n877' AND nl.type = 'predict' AND nl.content NOT LIKE '＊あなたの解釈' AND ml.map_id IN (SELECT m.map_id FROM maps m WHERE m.map_id NOT LIKE ".$map_id." AND m.paper_id = ".$paper_id.");";

        if ($result = $mysqli->query($sql)) {

            while ($row = mysqli_fetch_assoc($result)) {
                $data_array[$i] = array(
                    
                    "content" => $row["content"],
                    "map_id" => $row["map_id"],
                    "id" => $row["node_id"],
                    "parent_id"=> $row["parent_id"]
                );
                $i++;
            }
            echo json_encode($data_array);
            //echo json_encode($sql);
        }
    }

    else if ($_POST["val"] == "judge_annotation") {
        $start_char_id = $_POST["start_char_id"];
        $end_char_id = $_POST["end_char_id"];
        $data_array = array(); // contentとmapidを格納する配列
    
        // SQLクエリを構築
        $sql = "SELECT pa.*, nl.concept_id, nl.parent_id, ml.map_id, m.paper_id
                    FROM paper_annotations pa
                    JOIN node_latest nl ON pa.node_id = nl.node_id
                    JOIN map_node_links ml ON pa.node_id = ml.node_id
                    JOIN maps m ON ml.map_id = m.map_id
                    WHERE ((pa.start_char_id >= '$start_char_id' AND pa.end_char_id <= '$end_char_id')
                        OR (pa.start_char_id < '$start_char_id' AND pa.end_char_id > '$end_char_id'))
                        AND pa.deleted = 0
                        AND m.paper_id = '$paper_id'
                        AND ml.map_id NOT LIKE '$map_id';";

        if ($result = $mysqli->query($sql)) {
            $i = 0;
            while ($row = mysqli_fetch_assoc($result)) {
                if ($row["paper_id"] == $paper_id && $row["map_id"] != $map_id){
                    $data_array[$i] = array(
                        "content" => $row["content"],
                        "end_char_id"=> $row["end_char_id"],
                        "start_char_id"=> $row["start_char_id"],
                        "map_id"=> $row["map_id"],
                        "parent_id"=> $row["parent_id"]
                    );      
                    $i++;
                } 
            }
            
            echo json_encode($data_array);
        }

    }

    else if($_POST["val"] == "get_my_conceptid"){
        
        $s_id = $_SESSION["MAPID"];
        $i = 0;
        $node_id_array = array();
        $data_array = array();

        $sql = "SELECT * FROM node_latest WHERE (node_type_id = 1 OR node_type_id = 2 OR node_type_id = 3) AND node_id IN (SELECT node_id FROM map_node_links WHERE map_id = '".$s_id."')";

        if ($result = $mysqli->query($sql)) {
            while ($row = mysqli_fetch_assoc($result)) {
                $data_array[$i] = [
                    "content" => $row["content"],
                    "map_id" => $s_id,
                    "id" => $row["node_id"],
                    "concept_id" => $row["concept_id"]
                ];
                $i++;
            }
        }

        echo json_encode($data_array);

    }

    else if($_POST["val"] == "get_other_question"){
        $data_array = array();
        $i = 0;

        $sql = "SELECT DISTINCT nl.concept_id, nl.content, ml.map_id
                    FROM node_latest nl
                    JOIN map_node_links ml ON nl.node_id = ml.node_id
                    JOIN maps m ON ml.map_id = m.map_id
                    WHERE (nl.node_type_id = 1 OR nl.node_type_id = 2)
                        AND m.paper_id = ?
                        AND ml.map_id <> ?
                        AND (ml.disappeared_at IS NULL OR ml.disappeared_at = '')";

        if ($stmt = $mysqli->prepare($sql)) {
            $stmt->bind_param("ii", $paper_id, $map_id);
            $stmt->execute();
            $result = $stmt->get_result();

            while ($row = mysqli_fetch_assoc($result)) {
                $data_array[$i] = [
                    "content" => $row["content"],
                    "concept_id" => $row["concept_id"],
                    "map_id" => $row["map_id"]
                ];
                $i++;
            }
            $stmt->close();
        }

        echo json_encode($data_array);
    }
      


?>
