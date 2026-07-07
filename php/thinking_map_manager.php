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
    $selected_conID = normalize_concept_id($selected_conID);
    if ($selected_conID === 'undefined' || $selected_conID === 'null' || $selected_conID === '') {
        $selected_conID = null;
    }
}

$return_data = []; // DBアクセスの結果として返すキー・バリューのペア

function is_toi_related_node_type($type, $class) {
    $node_type = strtolower((string)$type);
    $node_class = strtolower((string)$class);
    return strpos($node_type, 'toi') !== false
        || strpos($node_class, 'toi') !== false
        || strpos($node_type, 'question') !== false
        || strpos($node_class, 'question') !== false;
}

function normalize_concept_id($concept_id) {
    if ($concept_id === null) {
        return '';
    }
    $parts = preg_split('/\s+/', trim((string)$concept_id));
    $normalized_concept_id = isset($parts[0]) ? $parts[0] : '';
    return preg_replace('/^topic-tag_/', '', $normalized_concept_id);
}

function get_question_thinking_label($mysqli, $node_id) {
    if ($node_id === null || $node_id === '') {
        return '';
    }

    $visited_node_ids = [];
    $current_node_id = (string)$node_id;
    $guard = 0;

    while ($current_node_id !== '' && $guard < 50) {
        $guard++;
        if (isset($visited_node_ids[$current_node_id])) {
            break;
        }
        $visited_node_ids[$current_node_id] = true;

        $safe_current_node_id = $mysqli->real_escape_string($current_node_id);
        $result_parent = $mysqli->query("SELECT parent_id FROM node_versions
                                            WHERE node_id = '".$safe_current_node_id."'
                                            ORDER BY appeared_at DESC LIMIT 1");
        if (!$result_parent || !($parent_row = $result_parent->fetch_assoc())) {
            break;
        }

        $parent_id = isset($parent_row['parent_id']) ? (string)$parent_row['parent_id'] : '';
        if ($parent_id === '' || $parent_id === $current_node_id || isset($visited_node_ids[$parent_id])) {
            break;
        }

        $safe_parent_id = $mysqli->real_escape_string($parent_id);
        $result_parent_node = $mysqli->query("SELECT nv.content, nt.type, nt.class FROM node_versions nv
                                                LEFT JOIN node_types nt ON nv.node_type_id = nt.node_type_id
                                               WHERE nv.node_id = '".$safe_parent_id."'
                                               ORDER BY nv.appeared_at DESC LIMIT 1");
        if ($result_parent_node && ($parent_node_row = $result_parent_node->fetch_assoc())) {
            if (is_toi_related_node_type($parent_node_row['type'] ?? '', $parent_node_row['class'] ?? '')) {
                $question_content = trim((string)($parent_node_row['content'] ?? ''));
                if ($question_content !== '') {
                    return '"' . $question_content . '"について考える';
                }
            }
        }

        $current_node_id = $parent_id;
    }

    return '';
}

function get_concept_label_or_question_label($xml_data, $mysqli, $concept_id, $node_id) {
    $normalized_concept_id = normalize_concept_id($concept_id);
    if ($normalized_concept_id !== '' && $normalized_concept_id !== 'undefined' && $normalized_concept_id !== 'null') {
        return get_ontology_concept_label($xml_data, $normalized_concept_id);
    }
    return get_question_thinking_label($mysqli, $node_id);
}

function get_ontology_concept_label($xml_data, $concept_id) {
    if ($concept_id === null) {
        return '';
    }

    $normalized_concept_id = normalize_concept_id($concept_id);
    if ($normalized_concept_id === '' || $normalized_concept_id === 'undefined' || $normalized_concept_id === 'null') {
        return '';
    }

    $candidate_ids = [$normalized_concept_id];

    foreach ($candidate_ids as $candidate_id) {
        $safe_candidate_id = str_replace("'", "&apos;", $candidate_id);
        $conLABEL = $xml_data->xpath('W_CONCEPTS/CONCEPT[@id="'.$safe_candidate_id.'"]/LABEL/text()');
        if (!empty($conLABEL)) {
            return (string)$conLABEL[0];
        }
    }

    return '';
}

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
        $concept_name = get_ontology_concept_label($xml_data, $selected_conID);
        $return_data = array_merge($return_data, ['selected_concept' => $concept_name]);
    } else {
        $concept_name = get_question_thinking_label($mysqli, $selected_node_id);
        $return_data = array_merge($return_data, ['selected_concept' => $concept_name]);
    }

    /*
        * triggerの候補一覧
    */


    $result_t_candidate = $mysqli->query("SELECT DISTINCT activity_id, activity_type, node_id, concept_id, content, appeared_at, trigger_on FROM trigger_candidates
                                                        WHERE map_id = '$map_id' AND (SUBSTRING_INDEX(TRIM(concept_id), ' ', 1) IN ($conIDs) OR SUBSTRING_INDEX(TRIM(concept_id), ' ', 1) = '$selected_conID') ORDER BY appeared_at DESC");
    $t_candidate = [];
    $t_candidate_concept = [];

    if ($result_t_candidate) {
        // concept名を取り出し
        while ($row = $result_t_candidate->fetch_assoc()) {
            $row['concept_label'] = get_concept_label_or_question_label($xml_data, $mysqli, $row["concept_id"] ?? '', $row["node_id"] ?? '');
            $row['candidate_category'] = 'related_concept';
            $row['candidate_category_label'] = '関連する観点';
            array_push($t_candidate, $row);
        }
    }

    /*
        * 選択ノードの上位ノードに紐づくversion情報もtrigger候補に含める
    */
    $ancestor_node_ids = [];
    $visited_node_ids = [];
    $current_node_id = $selected_node_id;
    $guard = 0;
    while ($current_node_id !== null && $current_node_id !== '' && $guard < 50) {
        $guard++;
        if (isset($visited_node_ids[$current_node_id])) {
            break;
        }
        $visited_node_ids[$current_node_id] = true;

        $safe_current_node_id = $mysqli->real_escape_string($current_node_id);
        $result_parent = $mysqli->query("SELECT parent_id FROM node_versions
                                            WHERE node_id = '".$safe_current_node_id."'
                                            ORDER BY appeared_at DESC LIMIT 1");
        if (!$result_parent || !($parent_row = $result_parent->fetch_assoc())) {
            break;
        }
        $parent_id = isset($parent_row['parent_id']) ? (string)$parent_row['parent_id'] : '';
        if ($parent_id === '' || $parent_id === $current_node_id || isset($visited_node_ids[$parent_id])) {
            break;
        }

        $safe_parent_id = $mysqli->real_escape_string($parent_id);
        $is_toi_related_parent = false;
        $result_parent_type = $mysqli->query("SELECT nt.type, nt.class FROM node_versions nv
                                                LEFT JOIN node_types nt ON nv.node_type_id = nt.node_type_id
                                               WHERE nv.node_id = '".$safe_parent_id."'
                                               ORDER BY nv.appeared_at DESC LIMIT 1");
        if ($result_parent_type && ($parent_type_row = $result_parent_type->fetch_assoc())) {
            $parent_type = strtolower((string)($parent_type_row['type'] ?? ''));
            $parent_class = strtolower((string)($parent_type_row['class'] ?? ''));
            $is_toi_related_parent = is_toi_related_node_type($parent_type, $parent_class);
        }

        if (!$is_toi_related_parent && !in_array($parent_id, $ancestor_node_ids, true)) {
            $ancestor_node_ids[] = $parent_id;
        }
        $current_node_id = $parent_id;
    }

    $existing_candidate_ids = [];
    foreach ($t_candidate as $candidate) {
        if (isset($candidate['activity_id'])) {
            $existing_candidate_ids[(string)$candidate['activity_id']] = true;
        }
    }

    if (!empty($ancestor_node_ids)) {
        $ancestor_sql_ids = array_map(function($id) use ($mysqli) {
            return "'" . $mysqli->real_escape_string($id) . "'";
        }, $ancestor_node_ids);
        $ancestor_sql_in = implode(',', $ancestor_sql_ids);
        $result_ancestor_versions = $mysqli->query("SELECT nv.node_version_id AS activity_id,
                                                           '自己内対話' AS activity_type,
                                                           nv.node_id,
                                                           nv.concept_id,
                                                           nv.content,
                                                           nv.appeared_at,
                                                           CASE WHEN EXISTS (
                                                               SELECT 1 FROM triggers t
                                                                WHERE t.activity_id = nv.node_version_id
                                                                  AND t.deleted = 0
                                                                LIMIT 1
                                                           ) THEN 1 ELSE 0 END AS trigger_on
                                                      FROM node_versions nv
                                                     WHERE nv.node_id IN ($ancestor_sql_in)
                                                     ORDER BY nv.appeared_at DESC");
        if ($result_ancestor_versions) {
            while ($row = $result_ancestor_versions->fetch_assoc()) {
                $activity_id = isset($row['activity_id']) ? (string)$row['activity_id'] : '';
                if ($activity_id === '' || isset($existing_candidate_ids[$activity_id])) {
                    continue;
                }
                $row['concept_label'] = get_concept_label_or_question_label($xml_data, $mysqli, $row["concept_id"] ?? '', $row["node_id"] ?? '');
                $row['candidate_category'] = 'parent_node';
                $row['candidate_category_label'] = '親ノード関連';
                $existing_candidate_ids[$activity_id] = true;
                array_push($t_candidate, $row);
            }
        }
    }

    $return_data = array_merge($return_data, ['trigger_candidate' => $t_candidate]);

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
    $selected_node_group = isset($_POST['selected_node_group']) ? $_POST['selected_node_group'] : 'process';
    if($selected_node_group === 'versions' || $selected_node_group === 'versionsBro'){
        $selected_node_group = 'version';
    }else if($selected_node_group === 'triggers'){
        $selected_node_group = 'trigger';
    }

    $node_id_for_query = null;
    if($selected_node_group === 'process'){
        $result_node_id = $mysqli->query("SELECT node_id FROM process_nodes WHERE process_node_id = '".$selected_node_id."' AND deleted = 0 LIMIT 1");
        if($result_node_id && $row_node_id = $result_node_id->fetch_assoc()){
            $node_id_for_query = $row_node_id['node_id'];
        }
    }else if($selected_node_group === 'version'){
        $result_node_id = $mysqli->query("SELECT node_id FROM node_versions WHERE node_version_id = '".$selected_node_id."' LIMIT 1");
        if($result_node_id && $row_node_id = $result_node_id->fetch_assoc()){
            $node_id_for_query = $row_node_id['node_id'];
        }
    }else if($selected_node_group === 'trigger'){
        $result_node_id = $mysqli->query("SELECT nv.node_id FROM triggers t INNER JOIN node_versions nv ON t.node_version_from = nv.node_version_id WHERE t.trigger_id = '".$selected_node_id."' AND t.deleted = 0 LIMIT 1");
        if($result_node_id && $row_node_id = $result_node_id->fetch_assoc()){
            $node_id_for_query = $row_node_id['node_id'];
        }
    }

    /*
        * 思考過程表出化マップのノードデータの取得    	
    */
    if($node_id_for_query !== null){
        $result_processmap_node = $mysqli->query("SELECT process_node_id, content, process_node_type, node_x, node_y FROM process_nodes
                WHERE node_id = '".$node_id_for_query."' AND deleted = 0");
    }else{
        $result_processmap_node = $mysqli->query("SELECT process_node_id, content, process_node_type, node_x, node_y FROM process_nodes
                WHERE process_node_id = '".$selected_node_id."' AND deleted = 0");
    }
    $processmap_node = [];
    while ($row = $result_processmap_node->fetch_assoc()) {
        array_push($processmap_node, $row);
    }
    $return_data = array_merge($return_data, ['pnode' => $processmap_node]);

    /*
        * 思考過程表出化マップのエッジデータの取得
        */
    if($node_id_for_query !== null){
        $result_processmap_edge = $mysqli->query("SELECT process_edge_id, edge_start, edge_end, label FROM process_edges
                    WHERE (edge_start IN (SELECT process_node_id FROM process_nodes WHERE node_id = '".$node_id_for_query."' AND deleted = 0) OR edge_end IN (SELECT process_node_id FROM process_nodes WHERE node_id = '".$node_id_for_query."' AND deleted = 0)) AND deleted = 0");
    }else{
        $result_processmap_edge = $mysqli->query("SELECT process_edge_id, edge_start, edge_end, label FROM process_edges
                    WHERE ((edge_start = '".$selected_node_id."' AND deleted = 0) OR (edge_end = '".$selected_node_id."' AND deleted = 0)) AND deleted = 0");
    }
    $processmap_edge = [];
    while ($row = $result_processmap_edge->fetch_assoc()) {
        array_push($processmap_edge, $row);
    }
    $return_data = array_merge($return_data, ['pedge' => $processmap_edge]);

    // ノードのバージョン情報を取得
    if($node_id_for_query !== null){
        $result_node_versions = $mysqli->query("SELECT node_version_id, parent_id, appeared_at, disappeared_at, content FROM node_versions WHERE node_id = '".$node_id_for_query."' ORDER BY appeared_at ASC");
    }else{
        $result_node_versions = $mysqli->query("SELECT node_version_id, parent_id, appeared_at, disappeared_at, content FROM node_versions WHERE node_id IN( SELECT node_id FROM process_nodes WHERE process_node_id = '".$selected_node_id."') ORDER BY appeared_at ASC");
    }
    $node_versions = [];
    while ($row = $result_node_versions->fetch_assoc()) {
        array_push($node_versions, $row);
    }
    $return_data = array_merge($return_data, ['node_versions' => $node_versions]);

    // triggerを取得
    if($node_id_for_query !== null){
        $result_trigger = $mysqli->query("SELECT * FROM triggers
                                WHERE node_version_from IN (SELECT node_version_id FROM node_versions WHERE node_id = '".$node_id_for_query."' AND deleted = 0) AND deleted = 0");
    }else{
        $result_trigger = $mysqli->query("SELECT * FROM triggers
                                WHERE node_version_from IN (SELECT node_version_id FROM node_versions WHERE node_id IN (SELECT node_id FROM process_nodes WHERE process_node_id = '".$selected_node_id."') AND deleted = 0) AND deleted = 0");
    }
    $trigger = [];
    while ($row = $result_trigger->fetch_assoc()) {
        array_push($trigger, $row);
    }
    $return_data = array_merge($return_data, ['trigger' => $trigger]);

    $xml_data = simplexml_load_file('../js/hozo.xml'); //法造データ取り出し

    // $selected_node_idのconcept_labelを取得する処理
    $target_node_id_for_label = $node_id_for_query;
    if ($target_node_id_for_label === null) {
        $result_label_node_id = $mysqli->query("SELECT node_id FROM process_nodes WHERE process_node_id = '".$selected_node_id."' AND deleted = 0 LIMIT 1");
        if ($result_label_node_id && $row_label_node_id = $result_label_node_id->fetch_assoc()) {
            $target_node_id_for_label = $row_label_node_id['node_id'];
        }
    }

    if($node_id_for_query !== null){
        $result_concept = $mysqli->query("SELECT concept_id FROM node_versions 
                                            WHERE node_id = '".$node_id_for_query."' AND disappeared_at IS NULL LIMIT 1");
    }else{
        $result_concept = $mysqli->query("SELECT concept_id FROM node_versions 
                                            WHERE node_id = (
                                                SELECT node_id FROM process_nodes WHERE process_node_id = '".$selected_node_id."' AND deleted = 0 LIMIT 1
                                            ) AND disappeared_at IS NULL LIMIT 1");
    }
    if ($result_concept && $row_concept = $result_concept->fetch_assoc()) {
        $selected_conID = $row_concept['concept_id'];
    }
    
    if($selected_conID){
        $concept_name = get_ontology_concept_label($xml_data, $selected_conID);
        $return_data = array_merge($return_data, ['selected_concept' => $concept_name]);
    } else {
        $concept_name = get_question_thinking_label($mysqli, $target_node_id_for_label);
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
