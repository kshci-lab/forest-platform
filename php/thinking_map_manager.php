<?php
// 議論内省マップのデータを読み出すための処理群

session_start();
require("connect_db.php");

// POSTデータの受け取り
$user_id = $_SESSION['USERID'];      //ユーザID
$map_id = $_SESSION['MAPID'];    //マップID

//all...選択されたノードの変遷
//brother...選択されているノードの兄弟ノードの変遷を追加
$process_mode = $_POST['process_mode']; 
$selected_node_id = $_POST["selected_node_id"]; //マインドマップで選択されたノードIDまたはユーザID（whoのみ）
$selected_conID = null;

// POST 配列のキーが無い場合の警告を避けるため isset を使う
if (isset($_POST['selected_concept_id'])) {
    $selected_conID = $_POST['selected_concept_id']; //マインドマップで選択されたノードのconceptID
}

$return_data = []; // DBアクセスの結果として返すキー・バリューのペア

if($process_mode === "all" || $process_mode === "allRE" ){
    if (isset($_POST['concept_ids'])) {
        $conIDs_base = $_POST['concept_ids'];

        // 配列で渡されるので変換
        if (!empty($conIDs_base)) {
            $conIDs_base = array_map(function($id) use ($mysqli) {
                // 各IDをエスケープして安全に挿入
                return "'" . $mysqli->real_escape_string($id) . "'";
            }, $conIDs_base);
            
            // 配列をカンマ区切りの文字列に変換
            $conIDs = implode(',', $conIDs_base);
        } else {
            // $conIDsが空の場合は空の文字列を使用
            $conIDs = "''"; // 空配列の場合は、SQL文が正しく評価されるように
        }
    } else {
        // concept_idsが存在しない場合の処理
        $conIDs = "''"; // デフォルトで空の文字列を設定
    }
    

    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

    $xml_data = simplexml_load_file('../js/hozo.xml'); //法造データ取り出し

    // 選択されたノードのconcept_labelを取得
    if($selected_conID){
        $conLABEL = $xml_data->xpath('W_CONCEPTS/CONCEPT[@id="'.$selected_conID.'"]/LABEL/text()');
        $concept_name = !empty($conLABEL) ? (string)$conLABEL[0] : '';
        $return_data = array_merge($return_data, ['selected_concept' => $concept_name]);
    }

    /*
        * triggerの候補一覧
    */


    $result_t_candidate = $mysqli->query("SELECT DISTINCT activity_id, activity_type, concept_id, content, appeared_at, trigger_on FROM trigger_candidates
                                                        WHERE map_id = '$map_id' AND (concept_id IN ($conIDs) OR concept_id = '$selected_conID') ORDER BY appeared_at DESC");
    $t_candidate = [];
    $t_candidate_concept = [];

    if ($result_t_candidate) {
        // concept名を取り出し
        while ($row = $result_t_candidate->fetch_assoc()) {
            $conID = $row["concept_id"];
            $conLABEL = $xml_data->xpath('W_CONCEPTS/CONCEPT[@id="'.$conID.'"]/LABEL/text()');
            $row['concept_label'] = !empty($conLABEL) ? (string)$conLABEL[0] : '';
            array_push($t_candidate, $row);
        }
        $return_data = array_merge($return_data, ['trigger_candidate' => $t_candidate]);
    }

    /*
        * 思考過程表出化マップのノードデータの取得    	
    */
    $result_processmap_node = $mysqli->query("SELECT process_node_id, content, process_node_type, node_x, node_y FROM process_nodes
            WHERE node_id = '".$selected_node_id."' AND deleted = 0");
    $processmap_node = [];
    while ($row = $result_processmap_node->fetch_assoc()) {
        array_push($processmap_node, $row);
    }
    $return_data = array_merge($return_data, ['pnode' => $processmap_node]);

    /*
        * 思考過程表出化マップのエッジデータの取得
        */
    $result_processmap_edge = $mysqli->query("SELECT process_edge_id, edge_start, edge_end, label FROM process_edges
                WHERE (edge_start IN (SELECT process_node_id FROM process_nodes WHERE node_id = '".$selected_node_id."' AND deleted = 0) OR edge_end IN (SELECT process_node_id FROM process_nodes WHERE node_id = '".$selected_node_id."' AND deleted = 0))AND deleted = 0");
    $processmap_edge = [];
    while ($row = $result_processmap_edge->fetch_assoc()) {
        array_push($processmap_edge, $row);
    }
    $return_data = array_merge($return_data, ['pedge' => $processmap_edge]);

    // ノードのバージョン情報を取得
    $result_node_versions = $mysqli->query("SELECT node_version_id, parent_id, appeared_at, disappeared_at, content FROM node_versions WHERE node_id = '".$selected_node_id."'ORDER BY appeared_at ASC");
    $node_versions = [];
    while ($row = $result_node_versions->fetch_assoc()) {
        array_push($node_versions, $row);
    }
    $return_data = array_merge($return_data, ['node_versions' => $node_versions]);

    // triggerを取得
    $result_trigger = $mysqli->query("SELECT * FROM triggers
                            WHERE node_version_from IN (SELECT node_version_id FROM node_versions WHERE node_id = '".$selected_node_id."') AND deleted = 0");
    $trigger = [];
    while ($row = $result_trigger->fetch_assoc()) {
        array_push($trigger, $row);
    }
    $return_data = array_merge($return_data, ['trigger' => $trigger]);


    if (empty($return_data)) {
        echo json_encode(["error" => "not"]);
        return;
    } else {
        echo json_encode($return_data);
        return;
    }

}else if($process_mode === "AddBrother"){
    //兄弟ノードの数を取得
    $result_brother_num = $mysqli->query("SELECT process_node_id, content, process_node_type, node_x, node_y FROM process_nodes
            WHERE node_id = '".$selected_node_id."' AND deleted = 0");
    /*  
        * 思考過程表出化マップのノードデータの取得    	
    */
    $result_processmap_node = $mysqli->query("SELECT process_node_id, content, process_node_type, node_x, node_y FROM process_nodes
            WHERE node_id = '".$selected_node_id."' AND deleted = 0");
    $processmap_node = [];
    while ($row = $result_processmap_node->fetch_assoc()) {
        array_push($processmap_node, $row);
    }
    $return_data = array_merge($return_data, ['pnode' => $processmap_node]);

    /*
        * 思考過程表出化マップのエッジデータの取得
        */
    $result_processmap_edge = $mysqli->query("SELECT process_edge_id, edge_start, edge_end, label FROM process_edges
                WHERE (edge_start IN (SELECT process_node_id FROM process_nodes WHERE node_id = '".$selected_node_id."' AND deleted = 0) OR edge_end IN (SELECT process_node_id FROM process_nodes WHERE node_id = '".$selected_node_id."' AND deleted = 0))AND deleted = 0");
    $processmap_edge = [];
    while ($row = $result_processmap_edge->fetch_assoc()) {
        array_push($processmap_edge, $row);
    }
    $return_data = array_merge($return_data, ['pedge' => $processmap_edge]);

    // ノードのバージョン情報と対応するメインのバージョン情報を取得
    $result_node_versions = $mysqli->query("SELECT nv.node_version_id, nv.node_id, nv.parent_id, nv.appeared_at, nv.disappeared_at,nv.content, nv.x, nv.y, (
                                                            SELECT node_version_id FROM node_versions WHERE node_id = '".$selected_node_id."' AND appeared_at < nv.appeared_at ORDER BY appeared_at DESC LIMIT 1
                                                        ) AS broversion FROM node_versions nv
                                                        WHERE parent_id IN (SELECT parent_id FROM node_versions WHERE node_id = '".$selected_node_id."') AND node_id IN (SELECT node_id FROM nodes WHERE deleted = 0 AND node_id NOT LIKE '".$selected_node_id."') ORDER BY nv.appeared_at ASC");
    $node_versions = [];
    $brother_num = [];
    while ($row = $result_node_versions->fetch_assoc()) {
        array_push($node_versions, $row);
        // node_id を取得
        $node_id = $row['node_id'];
        
        // node_id がすでに存在するか確認する
        if (array_key_exists($node_id, $brother_num)) {
            // 既に存在する場合はカウントを増やす
            $brother_num[$node_id]++;
        } else {
            // まだ存在しない場合は初期カウントとして1を設定する
            $brother_num[$node_id] = 1;
        }
    }
    $return_data = array_merge($return_data, ['node_versions' => $node_versions]);
    $return_data = array_merge($return_data, ['brother_num' => $brother_num]);

    // triggerを取得
    $result_trigger = $mysqli->query("SELECT * FROM triggers
                            WHERE node_version_from IN (SELECT node_version_id FROM node_versions WHERE node_id = '".$selected_node_id."') AND deleted = 0");
    $trigger = [];
    while ($row = $result_trigger->fetch_assoc()) {
        array_push($trigger, $row);
    }
    $return_data = array_merge($return_data, ['trigger' => $trigger]);


    if (empty($return_data)) {
        echo json_encode(["error" => "not"]);
        return;
    } else {
        echo json_encode($return_data);
        return;
    }
}else if($process_mode === "who"){
    

    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

    /*
        * 思考過程表出化マップのノードデータの取得    	
    */
    $result_processmap_node = $mysqli->query("SELECT process_node_id, content, process_node_type, node_x, node_y FROM process_nodes
            WHERE process_node_id = '".$selected_node_id."' AND deleted = 0");
    $processmap_node = [];
    while ($row = $result_processmap_node->fetch_assoc()) {
        array_push($processmap_node, $row);
    }
    $return_data = array_merge($return_data, ['pnode' => $processmap_node]);

    /*
        * 思考過程表出化マップのエッジデータの取得
        */
    $result_processmap_edge = $mysqli->query("SELECT process_edge_id, edge_start, edge_end, label FROM process_edges
                WHERE ((edge_start = '".$selected_node_id."' AND deleted = 0) OR (edge_end = '".$selected_node_id."' AND deleted = 0)) AND deleted = 0");
    $processmap_edge = [];
    while ($row = $result_processmap_edge->fetch_assoc()) {
        array_push($processmap_edge, $row);
    }
    $return_data = array_merge($return_data, ['pedge' => $processmap_edge]);

    // ノードのバージョン情報を取得
    $result_node_versions = $mysqli->query("SELECT node_version_id, parent_id, appeared_at, disappeared_at, content FROM node_versions WHERE node_id IN( SELECT node_id FROM process_nodes WHERE process_node_id = '".$selected_node_id."') ORDER BY appeared_at ASC");
    $node_versions = [];
    while ($row = $result_node_versions->fetch_assoc()) {
        array_push($node_versions, $row);
    }
    $return_data = array_merge($return_data, ['node_versions' => $node_versions]);

    // triggerを取得
    $result_trigger = $mysqli->query("SELECT * FROM triggers
                            WHERE node_version_from IN (SELECT node_version_id FROM node_versions WHERE node_id IN (SELECT node_id FROM process_nodes WHERE process_node_id = '".$selected_node_id."') AND deleted = 0) AND deleted = 0");
    $trigger = [];
    while ($row = $result_trigger->fetch_assoc()) {
        array_push($trigger, $row);
    }
    $return_data = array_merge($return_data, ['trigger' => $trigger]);

    $xml_data = simplexml_load_file('../js/hozo.xml'); //法造データ取り出し

    // $selected_node_idのconcept_labelを取得する処理
    $result_concept = $mysqli->query("SELECT concept_id FROM node_versions 
                                        WHERE node_id = (
                                            SELECT node_id FROM process_nodes WHERE process_node_id = '".$selected_node_id."' AND deleted = 0 LIMIT 1
                                        ) AND disappeared_at IS NULL LIMIT 1");
    if ($result_concept && $row_concept = $result_concept->fetch_assoc()) {
        $selected_conID = $row_concept['concept_id'];
    }
    
    if($selected_conID){
        $conLABEL = $xml_data->xpath('W_CONCEPTS/CONCEPT[@id="'.$selected_conID.'"]/LABEL/text()');
        $concept_name = !empty($conLABEL) ? (string)$conLABEL[0] : '';
        $return_data = array_merge($return_data, ['selected_concept' => $concept_name]);
    }


    if (empty($return_data)) {
        echo json_encode(["error" => "not"]);
        return;
    } else {
        echo json_encode($return_data);
        return;
    }
}


?>