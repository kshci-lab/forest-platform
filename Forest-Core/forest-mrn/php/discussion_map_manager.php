<?php
// 議論内省マップのデータを読み出すための処理群

session_start();
require("connect_db.php");

// POSTデータの受け取り
$user_id = $_SESSION['USERID'];      //ユーザID
$map_id = $_SESSION['MAPID'];    //シートID

$purpose = $_POST["purpose"]; // どんなデータを取得したり保存したりするのか（内容．例：発話ノードのXMLからの保存orマップノードの取得）

$target_map_created_start_times = null;  // リフレクションの開始時間
$first_load_flag = isset($_POST["first_load_flag"]) ? $_POST["first_load_flag"] : null;// どんなデータがほしいというリクエストなのかを判定

$return_data = []; // DBアクセスの結果として返すキー・バリューのペア

/*
 * すべてのマップ履歴について，開始と終了（リフレクションの開始＿過去のリフレクションの終了）時刻を取得
 */
$result_map_create_start_and_end = $mysqli->query("SELECT * FROM network_maps WHERE map_id = '$map_id' ORDER BY start_time DESC");

$map_create_start_and_end = [];
$latest_map_created_time = null; // 最初にヒットしたもの（現在の最新状態のもの）を履歴情報から除外するためのフラグ
while ($row = $result_map_create_start_and_end->fetch_assoc()) {
    $latest_map_created_time === null ? $latest_map_created_time = $row['start_time'] : array_push($map_create_start_and_end, $row); // 最新のやつは除外してそれ以外はPUSH
}

if(!empty($first_load_flag)) {
    // 最初の読み込みの処理のときだけ，最新のマップ作成時間を取得
    $target_map_created_start_times = $latest_map_created_time;
} else {
    // 過去のマップを読み出そうとするとき
    $target_map_created_start_times = isset($_POST["first_load_flag"]) ? $_POST["first_load_flag"] : null;
}

$return_data = array_merge($return_data, ["map_create_start_and_end" => $map_create_start_and_end]);


if($purpose === "record_meeting_utterance") {
    // ミーティングの発話をノードごとに保存する処理

    /*
     * マップ作成開始時間の記録・直前までのMapの終了時刻のアップデート
     *   手続きは，まず過去の最新のマップの終了時刻を更新，次に，その更新した時刻TIMESTAMPをSELECT取得，最後にそのタイムスタンプと同じ時刻の新規マップデータを挿入
     */
    
    $et_update_query = "UPDATE network_maps SET end_time = CURRENT_TIMESTAMP(), situation = 'end'
                                                       WHERE map_id = '$map_id' AND start_time in
                                                             ( SELECT * FROM (SELECT MAX(start_time) FROM network_maps WHERE map_id = '$map_id') AS MAX_START_TIME)";
    $mysqli->query($et_update_query);
    $map_renewal_time_query = "SELECT MAX(end_time) FROM network_maps WHERE map_id = '$map_id' ORDER BY end_time DESC"; // XMLからのデータを引き渡された時間（マップを新しく作り始めた時間＝リフレクションが次のフェーズにうつったとき）
    $result_map_renewal_time_tmp = $mysqli->query($map_renewal_time_query);
    $row = $result_map_renewal_time_tmp->fetch_assoc();
    $map_renewal_time_tmp = $row['MAX(end_time)'];
    $map_renewal_time = $map_renewal_time_tmp === null ? "CURRENT_TIMESTAMP" : "'$map_renewal_time_tmp'"; // 過去に作ったマップが１つもないときは現在時刻指定
    $network_map_id = uniqid(); //新しいマップのID

    $st_record_query = "INSERT INTO network_maps (network_map_id, map_id, start_time, end_time, situation) VALUES
                                              ('$network_map_id', '$map_id', $map_renewal_time, $map_renewal_time, 'start')";
    $res = $mysqli->query($st_record_query);

        /*
    * 発話ノードの記録（network_textsへのデータ挿入）
    */
    $jsonDataArray = json_decode($_POST['utters'], true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        die('JSON Decode Error: ' . json_last_error_msg());
    }

    if (!empty($jsonDataArray)) {
 
        $nt_record_query = "INSERT INTO network_texts (network_text_id, network_map_id, sender, content, network_on, time, JPNtime, ST_Time) VALUES ";
        foreach ($jsonDataArray as $jsonData) {
            $id = $mysqli->real_escape_string($jsonData['message_id'] ?? uniqid());
            $content = $mysqli->real_escape_string($jsonData['content']);
            $sender = $mysqli->real_escape_string($jsonData['sender'] ?? $jsonData['user_name']);
            $time = $mysqli->real_escape_string($jsonData['time']);
            $JPNtime = $mysqli->real_escape_string($jsonData['JPNtime'] ?? $jsonData['time']);
            
            $nt_record_query .= "('$id', '$network_map_id', '$sender', '$content', 0, '$time', '$JPNtime', $map_renewal_time), ";
            
        }
        $nt_record_query = rtrim($nt_record_query,", ");
        echo $nt_record_query;
        $mysqli->query($nt_record_query);
        if($mysqli->error){
            echo "Error network_text insert: ".$mysqli->error;
        }

    } else {
        echo "No valid data in utters.";
    }
    
    // $document_record_query = "INSERT INTO document_content_organize (id, time, content, user_id, map_id, slide_id) VALUES ";
    // while ($row = $result_document->fetch_assoc()) {
    //     $id = $mysqli->real_escape_string($row['content_id']);
    //     $content = $mysqli->real_escape_string($row['content']);
    //     $slide_id = $mysqli->real_escape_string($row['slide_id']);
    //     $document_record_query .= "('$id', $map_renewal_time, '$content', $user_id, $map_id, '$slide_id'), ";
    // }
    // $document_record_query = rtrim($document_record_query,", ");
    // $mysqli->query($document_record_query);
    // /*
    // * 未完成?，資料の構造を取ってくる（今残ってる資料を取ってきてるから過去の資料を見たいならまだできない）
    // あと，もともとのDBのdocument_content_relationにuseridがないから重複しないか清水さんに聞く
    // */
    // $result_document_relation = $mysqli->query("SELECT id, node1_id, doc_con1_id, doc_con1_label, ont1_id, ont2_id, node2_id, doc_con2_id, doc_con2_label  FROM item_content_relations
    // WHERE map_id = '$map_id' AND deleted = 0 ORDER BY created_at ASC");
    // while ($row = $result_document_relation->fetch_assoc()) {
        
    //     $doc_con1_id = $mysqli->real_escape_string($row['doc_con1_id']);
    //     $doc_con1_label = $mysqli->real_escape_string($row['doc_con1_label']);
    //     $doc_con2_id = $mysqli->real_escape_string($row['doc_con2_id']);
    //     $doc_con2_label = $mysqli->real_escape_string($row['doc_con2_label']);
    //     if($doc_con1_label == "提案" || $doc_con1_label == "主張" || $doc_con1_label == "疑問"){
    //         $argmentnode = $mysqli->query("SELECT argument FROM document_content_organize
    //                        WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con1_id' AND time = $map_renewal_time");
    //         $result_argmentnode = $argmentnode->fetch_assoc()['argument'];
    //         if($result_argmentnode == 1){
    //             $mysqli->query("UPDATE document_content_organize SET claim = 1, argument = 2
    //                        WHERE user_id = '$user_id' AND map_1id = '$map_id' AND id = '$doc_con1_id' AND time = $map_renewal_time");
    //         }else{
    //             $mysqli->query("UPDATE document_content_organize SET claim = 1, argument = 3
    //                        WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con1_id' AND time = $map_renewal_time");
    //         } 
    //     }else if($doc_con1_label == "推測[自身]" || $doc_con1_label == "推測[世の中]" || $doc_con1_label == "仮説[自身]" || $doc_con1_label == "仮説[世の中]" || $doc_con1_label == "判断"){
    //         $argmentnode = $mysqli->query("SELECT argument FROM document_content_organize
    //                        WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con1_id' AND time = $map_renewal_time");
    //         $result_argmentnode = $argmentnode->fetch_assoc()['argument'];
    //         if($result_argmentnode == 1){
    //             $mysqli->query("UPDATE document_content_organize SET argument_node2 = '$doc_con2_id'
    //                           WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con1_id' AND time = $map_renewal_time");
    //         }else{
                
    //             $mysqli->query("UPDATE document_content_organize SET argument = 1, argument_node = '$doc_con2_id'
    //                           WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con1_id' AND time = $map_renewal_time");
    //         }
    //     }else if($doc_con1_label == "事実[自身]" || $doc_con1_label == "事実[世の中]"){
    //         if($doc_con2_label == "提案" || $doc_con2_label == "主張" || $doc_con2_label == "疑問"){
    //             $mysqli->query("UPDATE document_content_organize SET basis = 1, basis_node = '$doc_con2_id'
    //                            WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con1_id' AND time = $map_renewal_time");
    //         }else if($doc_con2_label == "推測[自身]" || $doc_con2_label == "推測[世の中]" || $doc_con2_label == "仮説[自身]" || $doc_con2_label == "仮説[世の中]" || $doc_con2_label == "判断"){
    //             $mysqli->query("UPDATE document_content_organize SET basis = 1
    //                            WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con1_id' AND time = $map_renewal_time");
    //         }
    //     }
    //     if($doc_con2_label == "提案" || $doc_con2_label == "主張" || $doc_con2_label == "疑問"){
    //         $argmentnode2 = $mysqli->query("SELECT argument FROM document_content_organize
    //                        WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con2_id' AND time = $map_renewal_time");
    //         $result_argmentnode2 = $argmentnode2->fetch_assoc()['argument'];
    //         if($result_argmentnode2 == 1){
    //             $mysqli->query("UPDATE document_content_organize SET claim = 1, argument = 2
    //                        WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con2_id' AND time = $map_renewal_time");
    //         }else{
    //             $mysqli->query("UPDATE document_content_organize SET claim = 1, argument = 3
    //                        WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con2_id' AND time = $map_renewal_time");
    //         }
    //     }else if($doc_con2_label == "推測[自身]" || $doc_con2_label == "推測[世の中]" || $doc_con2_label == "仮説[自身]" || $doc_con2_label == "仮説[世の中]" || $doc_con2_label == "判断"){
    //         $argmentnode2 = $mysqli->query("SELECT argument FROM document_content_organize
    //                        WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con2_id' AND time = $map_renewal_time");
    //         $result_argmentnode2 = $argmentnode2->fetch_assoc()['argument'];
    //         if($result_argmentnode2 == 1){
    //             $mysqli->query("UPDATE document_content_organize SET argument_node2 = '$doc_con1_id'
    //                           WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con2_id' AND time = $map_renewal_time");
    //         }else{
    //             $mysqli->query("UPDATE document_content_organize SET argument = 1, argument_node = '$doc_con1_id'
    //                           WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con2_id' AND time = $map_renewal_time");
    //         }
    //     }else if($doc_con2_label == "事実[自身]" || $doc_con2_label == "事実[世の中]"){
    //         if($doc_con1_label == "提案" || $doc_con1_label == "主張" || $doc_con1_label == "疑問"){
    //             $mysqli->query("UPDATE document_content_organize SET basis = 1, basis_node = '$doc_con1_id'
    //                            WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con2_id' AND time = $map_renewal_time");
    //         }else if($doc_con1_label == "推測[自身]" || $doc_con1_label == "推測[世の中]" || $doc_con1_label == "仮説[自身]" || $doc_con1_label == "仮説[世の中]" || $doc_con1_label == "判断"){
    //             $mysqli->query("UPDATE document_content_organize SET basis = 1
    //                            WHERE user_id = '$user_id' AND map_id = '$map_id' AND id = '$doc_con2_id' AND time = $map_renewal_time");
    //         }
    //     }
    // }

    return;
}



if($purpose === "select_meeting_utterance") {
    /***
     *** ここから議論内省マップデータの取得（SELECT）処理
     ***/

    $return_data = array_merge($return_data, ['start_time' => $target_map_created_start_times]);

    /*
     * 議論内省マップのノードデータと思考整理マップのノードの対応関係データを取得する処理
     */
    
    $result_forest_node_and_discussionmap_node_relation = $mysqli->query("SELECT network_node_id, mindmap_node_id FROM network_mindmap_connects
              WHERE mindmap_node_id IN (SELECT node_id FROM map_node_links WHERE map_id = '$map_id') AND time > '$target_map_created_start_times'
              ORDER BY time DESC ");
    
    $forest_node_and_discussionmap_node_relation = [];
    while ($row = $result_forest_node_and_discussionmap_node_relation->fetch_assoc()) {
        array_push($forest_node_and_discussionmap_node_relation, $row);
    }
    $return_data = array_merge($return_data, ['fnode_dnode_rel' => $forest_node_and_discussionmap_node_relation]);
    
    
    /* 
     * オントロジーとの対応データの読み込み
     */
    $result_discussionmap_node_and_ontology_relation = $mysqli->query("SELECT ontology_id, network_node_id FROM network_ontology_connects
              WHERE network_node_id IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id' AND situation = 'start')) 
              AND time > '$target_map_created_start_times' ORDER BY time DESC ");
    $discussionmap_node_and_ontology_relation = [];
    while ($row = $result_discussionmap_node_and_ontology_relation->fetch_assoc()) {
        array_push($discussionmap_node_and_ontology_relation, $row);
    }
    $return_data = array_merge($return_data, ['dnode_ontology_rel' => $discussionmap_node_and_ontology_relation]);    
    
    /*
     * 議論内省マップのノードデータの取得
     */
    $result_discussionmap_node = $mysqli->query("SELECT network_node_id, label, node_x, node_y, node_type FROM network_nodes
            WHERE network_map_id IN (SELECT network_map_id FROm network_maps WHERE map_id = '$map_id' AND situation = 'start') AND deleted = 0 AND updated_at >= '$target_map_created_start_times'
            ORDER BY updated_at DESC ");
    $discussionmap_node = [];
    while ($row = $result_discussionmap_node->fetch_assoc()) {
        array_push($discussionmap_node, $row);
    }
    $return_data = array_merge($return_data, ['dnode' => $discussionmap_node]);

    /*
     * 議論内省マップのエッジデータの取得
     */
    $result_discussionmap_edge = $mysqli->query("SELECT edge_start, edge_end, edge_label FROM network_edges
              WHERE (edge_start IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id' AND situation = 'start')) 
              OR edge_end IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id' AND situation = 'start'))) 
              AND deleted = 0 AND time >= '$target_map_created_start_times' ORDER BY time DESC ");
    $discussionmap_edge = [];
    while ($row = $result_discussionmap_edge->fetch_assoc()) {
        array_push($discussionmap_edge, $row);
    }
    $return_data = array_merge($return_data, ['dedge' => $discussionmap_edge]);

    /*
     * 採用のデータの取得
     */
    $result_recruit = $mysqli->query("SELECT network_node_id, result_recruit, ontology_id, reason FROM network_recruits
              WHERE network_node_id IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id' AND situation = 'start')) 
              AND time > '$target_map_created_start_times' ORDER BY time DESC ");
    $recruit = [];
    while ($row = $result_recruit->fetch_assoc()) {
        array_push($recruit, $row);
    }
    $return_data = array_merge($return_data, ['recruit' => $recruit]);


    /*
    * 未完成?，資料のタイトルを取ってくる（今残ってる資料を取ってきてるから過去の資料を見たいならまだできない）
    */
    $result_document_title = $mysqli->query("SELECT node_id, title, item_id, concept_id FROM item_latest
                            WHERE map_id = '$map_id' ");
    $document_title = [];
    while ($row = $result_document_title->fetch_assoc()) {
        array_push($document_title, $row);
    }
    $return_data = array_merge($return_data, ['document_title' => $document_title]);


    $result_document = $mysqli->query("SELECT item_content_id, node_id, title, item_id, concept_id FROM item_content_latest
                        WHERE map_id = '$map_id' ");
    $document = [];
    while ($row = $result_document->fetch_assoc()) {
    array_push($document, $row);
    }
    $return_data = array_merge($return_data, ['document' => $document]);

    // userIDがないから一意に特定できるかわからん．清水さんに確認
    $result_item_content_relation = $mysqli->query("SELECT node1_id, item_content1_id, item_content1_label, node2_id, item_content2_id, item_content2_label FROM item_content_relations
        WHERE item_content1_id IN (SELECT item_content_id FROM item_contents WHERE item_id IN (SELECT item_id FROM items WHERE map_id = '$map_id')) AND deleted = 0");
    $item_content_relation = [];
    while ($row = $result_item_content_relation->fetch_assoc()) {
        array_push($item_content_relation, $row);
    }
    $return_data = array_merge($return_data, ['item_content_relation' => $item_content_relation]);
    
    /*
     * 議論における発話パーツ一覧
     */
    $result_utterance = $mysqli->query("SELECT * FROM network_texts
              WHERE  network_map_id IN (SELECT network_map_id FROm network_maps WHERE map_id = '$map_id' AND situation = 'start') AND ST_Time = '$target_map_created_start_times'
              ORDER BY time ASC");
    $utterance = [];
    while ($row = $result_utterance->fetch_assoc()) {
        array_push($utterance, $row);
    }
    $return_data = array_merge($return_data, ['utterance' => $utterance]);
    
    
    if (empty($return_data)) {
        echo json_encode(["error" => "not"]);
        return;
    } else {
        echo json_encode($return_data);
        return;
    }


}else if($purpose === "select_version_discussionmap"){
    $result_discussionmap_create_start_time = $mysqli->query("SELECT start_time FROM network_maps 
                WHERE  network_map_id IN (SELECT network_map_id FROm network_maps WHERE map_id = '$map_id')
                AND start_time < '$first_load_flag' AND end_time > '$first_load_flag'");
    if (empty($result_discussionmap_create_start_time) ||
        $result_discussionmap_create_start_time->num_rows === 0 ||
        $result_discussionmap_create_start_time->num_rows === null) {
        // エンドタイムが今の最新時刻を含むものが存在しない（まだ最新のリフレクションを閉じていない）場合，現状最新の時刻のマップを取得する
        $res = $mysqli->query("SELECT MAX(start_time) FROM network_maps 
                WHERE map_id = '$map_id'"); // 一番最新のマップの時間
        $result_discussionmap_create_start_time = $res->fetch_assoc()['MAX(start_time)'];
    }else{
        $result_discussionmap_create_start_time = $result_discussionmap_create_start_time->fetch_assoc()['start_time'];
    }
    $return_data = array_merge($return_data, ['result_discussionmap_create_start_time' => $result_discussionmap_create_start_time]);

     /*
     * 議論内省マップのノードデータと思考整理マップのノードの対応関係データを取得する処理
     */
    $result_forest_node_and_discussionmap_node_relation = $mysqli->query("SELECT network_node_id, mindmap_node_id FROM network_mindmap_connect
              WHERE network_node_id IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id')) 
              AND time > '$result_discussionmap_create_start_time' AND time < '$first_load_flag' ORDER BY time DESC ");
    
    $forest_node_and_discussionmap_node_relation = [];
    while ($row = $result_forest_node_and_discussionmap_node_relation->fetch_assoc()) {
        array_push($forest_node_and_discussionmap_node_relation, $row);
    }
    $return_data = array_merge($return_data, ['fnode_dnode_rel' => $forest_node_and_discussionmap_node_relation]);
    
    
    /* 
     * オントロジーとの対応データの読み込み
     */
    $result_discussionmap_node_and_ontology_relation = $mysqli->query("SELECT ontology_id, network_node_id FROM network_ontology_connects
              WHERE network_node_id IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id')) 
              AND time > '$result_discussionmap_create_start_time' AND time < '$first_load_flag' ORDER BY time DESC ");
    $discussionmap_node_and_ontology_relation = [];
    while ($row = $result_discussionmap_node_and_ontology_relation->fetch_assoc()) {
        array_push($discussionmap_node_and_ontology_relation, $row);
    }
    $return_data = array_merge($return_data, ['dnode_ontology_rel' => $discussionmap_node_and_ontology_relation]);    
    
    /*
     * 議論内省マップのノードデータの取得
     */
    $result_discussionmap_node = $mysqli->query("SELECT network_node_id, label, node_x, node_y, node_type FROM network_nodes
            WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id') AND deleted = 0 AND updated_at >= '$result_discussionmap_create_start_time' 
            AND updated_at < '$first_load_flag' ORDER BY updated_at DESC ");
    $discussionmap_node = [];
    while ($row = $result_discussionmap_node->fetch_assoc()) {
        array_push($discussionmap_node, $row);
    }
    $return_data = array_merge($return_data, ['dnode' => $discussionmap_node]);

    /*
     * 議論内省マップのエッジデータの取得
     */
    $result_discussionmap_edge = $mysqli->query("SELECT edge_start, edge_end, edge_label FROM network_edges
              WHERE (edge_start IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id')) 
                OR edge_end IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id' AND situation = 'start')))  
                AND deleted = 0 AND time >= '$result_discussionmap_create_start_time' AND time < '$first_load_flag' ORDER BY time DESC ");
    $discussionmap_edge = [];
    while ($row = $result_discussionmap_edge->fetch_assoc()) {
        array_push($discussionmap_edge, $row);
    }
    $return_data = array_merge($return_data, ['dedge' => $discussionmap_edge]);

    /*
     * 採用の取得
     */
    $result_recruit = $mysqli->query("SELECT network_node_id, ontology_id, result_recruit FROM network_recruits
              WHERE network_node_id IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id')) 
              AND time > '$result_discussionmap_create_start_time' AND time < '$first_load_flag' ORDER BY time DESC ");
    $recruit = [];
    while ($row = $result_recruit->fetch_assoc()) {
        array_push($recruit, $row);
    }
    $return_data = array_merge($return_data, ['recruit' => $recruit]);

    if (empty($return_data)) {
        echo json_encode(["error" => "not"]);
        return;
    } else {
        echo json_encode($return_data);
        return;
    }
}else if($purpose === "select_past_discussionmap"){
    
    $discussion_start_time = $_POST["discussion_start_time"];
    $discussion_end_time = $_POST["discussion_end_time"];
     /*
     * 議論内省マップのノードデータと思考整理マップのノードの対応関係データを取得する処理
     */
    $result_forest_node_and_discussionmap_node_relation = $mysqli->query("SELECT network_node_id, mindmap_node_id FROM network_mindmap_connect
              WHERE network_node_id IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id')) 
              AND time > '$discussion_start_time' AND time < '$discussion_end_time' ORDER BY time DESC ");
    
    $forest_node_and_discussionmap_node_relation = [];
    while ($row = $result_forest_node_and_discussionmap_node_relation->fetch_assoc()) {
        array_push($forest_node_and_discussionmap_node_relation, $row);
    }
    $return_data = array_merge($return_data, ['fnode_dnode_rel' => $forest_node_and_discussionmap_node_relation]);
    
    
    /* 
     * オントロジーとの対応データの読み込み
     */
    $result_discussionmap_node_and_ontology_relation = $mysqli->query("SELECT ontology_id, network_node_id FROM network_ontology
              WHERE network_node_id IN (SELECT network_node_id FROM network_nodes WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id'))
              AND time > '$discussion_start_time' AND time < '$discussion_end_time' ORDER BY time DESC ");
    $discussionmap_node_and_ontology_relation = [];
    while ($row = $result_discussionmap_node_and_ontology_relation->fetch_assoc()) {
        array_push($discussionmap_node_and_ontology_relation, $row);
    }
    $return_data = array_merge($return_data, ['dnode_ontology_rel' => $discussionmap_node_and_ontology_relation]);    
    
    /*
     * 議論内省マップのノードデータの取得
     */
    $result_discussionmap_node = $mysqli->query("SELECT node_id, label, node_x, node_y, node_type FROM network_nodes
            WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id') 
            AND updated_at >= '$discussion_start_time' AND updated_at < '$discussion_end_time' ORDER BY updated_at DESC ");
    $discussionmap_node = [];
    while ($row = $result_discussionmap_node->fetch_assoc()) {
        array_push($discussionmap_node, $row);
    }
    $return_data = array_merge($return_data, ['dnode' => $discussionmap_node]);

    /*
     * 議論内省マップのエッジデータの取得
     */
    $result_discussionmap_edge = $mysqli->query("SELECT edge_start, edge_end, edge_label FROM network_edges
              WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id') 
              AND time >= '$discussion_start_time' AND time < '$discussion_end_time'
              ORDER BY time DESC ");
    $discussionmap_edge = [];
    while ($row = $result_discussionmap_edge->fetch_assoc()) {
        array_push($discussionmap_edge, $row);
    }
    $return_data = array_merge($return_data, ['dedge' => $discussionmap_edge]);

    /*
     * 採用の取得
     */
    $result_recruit = $mysqli->query("SELECT node_id, ontology_id, result_recruit FROM network_recruits
              WHERE network_map_id IN (SELECT network_map_id FROM network_maps WHERE map_id = '$map_id') 
              AND time > '$discussion_start_time' AND time < '$discussion_end_time'
              ORDER BY time DESC ");
    $recruit = [];
    while ($row = $result_recruit->fetch_assoc()) {
        array_push($recruit, $row);
    }
    $return_data = array_merge($return_data, ['recruit' => $recruit]);

    if (empty($return_data)) {
        echo json_encode(["error" => "not"]);
        return;
    } else {
        echo json_encode($return_data);
        return;
    }
}
