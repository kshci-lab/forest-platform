<?php
// 目標手段階層マップのデータを読み出すための処理群

session_start();
require("connect_db.php");

// POSTデータの受け取り
$user_id = $_SESSION['USERID'];      //ユーザID
$map_id = $_SESSION['MAPID'];    //マップID

//all...選択されたノードの変遷
//brother...選択されているノードの兄弟ノードの変遷を追加
$process_mode = $_POST['process_mode']; 

// PassDataモード以外でのみこれらの変数を取得
$selected_conID = null;
$selected_node_id = null;

if ($process_mode !== "PassData") {
    $selected_conID = $_POST["selected_concept_id"] ?? null; //マインドマップで選択されたノードのconceptID
    $selected_node_id = $_POST["selected_node_id"] ?? null; //マインドマップで選択されたノードID
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
    

    // 子孫ノードIDリストの構築（JSから渡された場合はIN句で使用）
    $descendantNodeIds = [];
    if (isset($_POST['descendant_node_ids']) && is_array($_POST['descendant_node_ids'])) {
        $descendantNodeIds = array_map(function($id) use ($mysqli) {
            return "'" . $mysqli->real_escape_string($id) . "'";
        }, $_POST['descendant_node_ids']);
    }
    // 子孫リストが空の場合は selected_node_id のみを対象にする（後方互換性）
    if (empty($descendantNodeIds) && $selected_node_id) {
        $descendantNodeIds = ["'" . $mysqli->real_escape_string($selected_node_id) . "'"];
    }
    $nodeIdInClause = implode(',', $descendantNodeIds);
    error_log("子孫ノードID IN句: " . $nodeIdInClause);

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
        * 目標手段階層マップのノードデータの取得    	
    */
        // Select node columns; include attribution_bad and application when present in schema
        $availableCols = array();
        $cr = $mysqli->query("SHOW COLUMNS FROM object_nodes");
        if ($cr) {
            while ($r = $cr->fetch_assoc()) { $availableCols[] = $r['Field']; }
            $cr->free();
        }

        $selectParts = [
            'object_node_id', 'content', 'object_nodes_type', 'node_x', 'node_y', 'status', 'purpose',
            "evaluation_good AS evaluation_good",
            "attribution AS attribution"
        ];
        if (in_array('evaluation_bad', $availableCols)) $selectParts[] = 'evaluation_bad';
        else $selectParts[] = "'' AS evaluation_bad";
        if (in_array('attribution_bad', $availableCols)) $selectParts[] = 'attribution_bad';
        if (in_array('application', $availableCols)) $selectParts[] = 'application';
        else $selectParts[] = "'' AS application";
        $selectParts[] = 'estimated_time';

        $sqlObjectNode = 'SELECT ' . implode(', ', $selectParts) . " FROM object_nodes WHERE node_id IN (".$nodeIdInClause.") AND deleted = 0";
        $result_object_node = $mysqli->query($sqlObjectNode);
    $object_node = [];
    $node_map = []; // object_node_id をキーにして取得済みか判定
    while ($row = $result_object_node->fetch_assoc()) {
        $object_node[] = $row;
        $node_map[$row['object_node_id']] = true;
    }

    /*
     * 目標手段階層マップのエッジデータの取得
     */
    $base_nodes_sql = "SELECT object_node_id FROM object_nodes WHERE node_id IN (".$nodeIdInClause.") AND deleted = 0";
    $base_versions_sql = "SELECT node_version_id FROM node_versions WHERE node_id IN (".$nodeIdInClause.")";
    
    // エッジの始点または終点が、現在のマップに属しているノード群（object_nodes または node_versions、およびマップノード自体）であるエッジを取得
    $edge_condition = "
        (edge_start IN ($base_nodes_sql) 
      OR edge_start IN (".$nodeIdInClause.")
      OR edge_start IN ($base_versions_sql)
      OR edge_end IN ($base_nodes_sql)
      OR edge_end IN (".$nodeIdInClause.")
      OR edge_end IN ($base_versions_sql))
    ";
    
    $edge_query = "SELECT object_edge_id, edge_start, edge_end, label FROM object_edges WHERE $edge_condition AND deleted = 0";
    $result_processmap_edge = $mysqli->query($edge_query);
    
    if (!$result_processmap_edge) {
        error_log("SQLエラー: " . $mysqli->error);
        $return_data = array_merge($return_data, [
            'pedge' => [],
            'pedge_error' => $mysqli->error,
            'pedge_query' => $edge_query
        ]);
    } else {
        $processmap_edge = [];
        $missing_node_ids = [];
        while ($row = $result_processmap_edge->fetch_assoc()) {
            $processmap_edge[] = $row;
            
            // 接続先/元ノードが未取得ならIDを記録
            if (!isset($node_map[$row['edge_start']])) {
                $missing_node_ids[] = "'" . $mysqli->real_escape_string($row['edge_start']) . "'";
            }
            if (!isset($node_map[$row['edge_end']])) {
                $missing_node_ids[] = "'" . $mysqli->real_escape_string($row['edge_end']) . "'";
            }
        }
        $return_data = array_merge($return_data, ['pedge' => $processmap_edge]);
        
        // 追加取得（1ホップ先の共有ノードなど）
        if (!empty($missing_node_ids)) {
            $missingIdsStr = implode(',', array_unique($missing_node_ids));
            $sqlMissingNode = 'SELECT ' . implode(', ', $selectParts) . " FROM object_nodes WHERE object_node_id IN ($missingIdsStr) AND deleted = 0";
            $result_missing = $mysqli->query($sqlMissingNode);
            if ($result_missing) {
                while ($row = $result_missing->fetch_assoc()) {
                    if (!isset($node_map[$row['object_node_id']])) {
                        $object_node[] = $row;
                        $node_map[$row['object_node_id']] = true;
                    }
                }
            }
        }
    }
    
    $return_data = array_merge($return_data, ['onode' => $object_node]);

    /*
    * 目標手段階層マップの日付データの取得（選択されたノードに紐づくobject_nodesから関連するobject_nodes_historiesの日付を取得）
    */
    $escaped_node_keys = array_map(function($id) use ($mysqli) { return "'" . $mysqli->real_escape_string($id) . "'"; }, array_keys($node_map));
    $allNodeIdsStr = implode(',', $escaped_node_keys);
    // 開いたマップごとの活動量にするため、関連ノード(allNodeIdsStr)は含めず、現在のマップのノード(nodeIdInClause)のみを対象とする
    $date_condition = "o_nodes.node_id IN (".$nodeIdInClause.")";

    $date_sql = "
        SELECT DATE(onh.appeared_at) AS appeared_date, COUNT(*) as activity_count
        FROM object_nodes_histories onh
        INNER JOIN object_nodes o_nodes ON onh.object_node_id = o_nodes.object_node_id
        WHERE $date_condition
        AND o_nodes.deleted = 0
        AND onh.appeared_at IS NOT NULL
        GROUP BY appeared_date
        ORDER BY appeared_date ASC
    ";
    
    $result = $mysqli->query($date_sql);
    
    $activity_map = [];
    $start_date = null;
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $activity_map[$row['appeared_date']] = (int)$row['activity_count'];
            if ($start_date === null) {
                $start_date = $row['appeared_date'];
            }
        }
    } else {
        echo "SQL Error: " . $mysqli->error;
    }
    
    // シート全体の作成日（最も古い履歴）を取得する（マップ間で統一）
    $global_start_sql = "SELECT MIN(DATE(appeared_at)) as global_start_date FROM trigger_candidates WHERE map_id = '$map_id'";
    $global_start_result = $mysqli->query($global_start_sql);
    $global_start_date = null;
    if ($global_start_result && $global_row = $global_start_result->fetch_assoc()) {
        $global_start_date = $global_row['global_start_date'];
    }
    
    // グローバル開始日がない場合（まだトリガーがない場合など）は、現在のマップの開始日か今日にフォールバック
    if (!$global_start_date) {
        $global_start_date = $start_date ? $start_date : date('Y-m-d');
    }
    // ただし、現在のマップの活動日がそれより前にある場合は早い方を優先
    if ($start_date && strtotime($start_date) < strtotime($global_start_date)) {
        $global_start_date = $start_date;
    }

    // シート作成日（最も古い履歴）から今日までの全ての日付を配列にする
    $date_list = [];
    $activity_counts = [];
    if ($global_start_date) {
        $current_date = new DateTime($global_start_date);
        $end_date = new DateTime(); // 今日
        
        while ($current_date <= $end_date) {
            $date_str = $current_date->format('Y-m-d');
            $date_list[] = $date_str;
            $activity_counts[] = isset($activity_map[$date_str]) ? $activity_map[$date_str] : 0;
            $current_date->modify('+1 day');
        }
    } else {
        $date_str = date('Y-m-d');
        $date_list[] = $date_str;
        $activity_counts[] = 0;
    }
    
    // 返却データに含める
    $return_data = $return_data ?? [];
    $return_data['dates'] = $date_list;
    $return_data['activity_counts'] = $activity_counts;
    
    // デバッグ用ログ
    error_log("日付データ生成: SQL = " . $date_sql);
    error_log("日付データ件数: " . count($date_list));
    error_log("日付データ内容: " . json_encode($date_list));
    error_log("対象node_id: " . $selected_node_id);
    

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
}else if ($process_mode === "getNodeCount") {
    // ノード数を取得するエンドポイント
    $selected_node_id = $_POST["selected_node_id"] ?? null;
    
    try {
        // 削除されていないノードの総数を取得
        $total_count_sql = "SELECT COUNT(*) as total_count FROM object_nodes WHERE deleted = 0";
        $total_result = $mysqli->query($total_count_sql);
        $total_count = 0;
        
        if ($total_result) {
            $total_row = $total_result->fetch_assoc();
            $total_count = (int)$total_row['total_count'];
        }
        
        // 特定のnode_idに関連するノード数を取得（選択されている場合）
        $related_count = 0;
        if ($selected_node_id) {
            $related_count_sql = "SELECT COUNT(*) as related_count FROM object_nodes WHERE node_id = ? AND deleted = 0";
            $stmt = $mysqli->prepare($related_count_sql);
            $stmt->bind_param("s", $selected_node_id);
            $stmt->execute();
            $related_result = $stmt->get_result();
            
            if ($related_result) {
                $related_row = $related_result->fetch_assoc();
                $related_count = (int)$related_row['related_count'];
            }
            $stmt->close();
        }
        
        // ノードタイプ別の統計も取得
        $type_stats_sql = "SELECT object_nodes_type, COUNT(*) as count FROM object_nodes WHERE deleted = 0 GROUP BY object_nodes_type";
        $type_result = $mysqli->query($type_stats_sql);
        $type_stats = [];
        
        if ($type_result) {
            while ($type_row = $type_result->fetch_assoc()) {
                $type_stats[$type_row['object_nodes_type']] = (int)$type_row['count'];
            }
        }
        
        // ステータス別のノード数を取得
        $status_stats_sql = "SELECT status, COUNT(*) as count FROM object_nodes WHERE deleted = 0 GROUP BY status";
        $status_result = $mysqli->query($status_stats_sql);
        $status_stats = [
            'completed' => 0,      // 完了ノード数
            'paused' => 0,         // 中断ノード数
            'inProgress' => 0,     // 実行中ノード数
            'not_started' => 0     // 未着手ノード数
        ];
        
        if ($status_result) {
            while ($status_row = $status_result->fetch_assoc()) {
                $status = $status_row['status'];
                $count = (int)$status_row['count'];
                
                switch ($status) {
                    case 'completed':
                        $status_stats['completed'] = $count;
                        break;
                    case 'paused':
                        $status_stats['paused'] = $count;
                        break;
                    case 'inProgress':
                        $status_stats['inProgress'] = $count;
                        break;
                    default:
                        // それ以外のステータス（null, '', 'not_started', その他）は未着手として扱う
                        $status_stats['not_started'] += $count;
                        break;
                }
            }
        }
        
        // ステータス別の詳細情報も取得（デバッグ用）
        $detailed_status_sql = "SELECT 
            CASE 
                WHEN status = 'completed' THEN '完了'
                WHEN status = 'paused' THEN '中断'
                WHEN status = 'inProgress' THEN '実行中'
                ELSE '未着手'
            END as status_category,
            status as original_status,
            COUNT(*) as count 
            FROM object_nodes 
            WHERE deleted = 0 
            GROUP BY status 
            ORDER BY count DESC";
        
        $detailed_status_result = $mysqli->query($detailed_status_sql);
        $detailed_status_stats = [];
        
        if ($detailed_status_result) {
            while ($detail_row = $detailed_status_result->fetch_assoc()) {
                $detailed_status_stats[] = [
                    'category' => $detail_row['status_category'],
                    'original_status' => $detail_row['original_status'],
                    'count' => (int)$detail_row['count']
                ];
            }
        }
        
        echo json_encode([
            'status' => 'success',
            'total_count' => $total_count,
            'related_count' => $related_count,
            'type_stats' => $type_stats,
            'status_stats' => $status_stats,
            'detailed_status_stats' => $detailed_status_stats,
            'timestamp' => date('Y-m-d H:i:s'),
            'selected_node_id' => $selected_node_id
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'ノード数取得エラー: ' . $e->getMessage(),
            'total_count' => 0,
            'related_count' => 0,
            'type_stats' => []
        ]);
    }
    exit;
    
}else if ($process_mode === "PassData") {

    $selectedDate = $_POST['selected_date'] ?? null;
    $selected_node_id = $_POST['selected_node_id'] ?? null; // ノードIDを取得

    if (!$selectedDate) {
        echo json_encode([
            'status' => 'invalid_input',
            'message' => 'selected_date が不足しています',
            'hnode' => []
        ]);
        exit;
    }

    $datetime = $selectedDate . ' 23:59:59';

    // 指定された日付とnode_idに存在していたノードの履歴を取得
    // ドラッグ操作（drag=1）の履歴から最新の座標を取得し、それ以外の情報は非ドラッグ履歴から取得
    // サブクエリで各ノードの指定日時時点での最新座標を取得
    $sql_histories = "
        SELECT 
            onh.object_node_id, 
            onh.content, 
            onh.object_node_type, 
            COALESCE(
                (SELECT h2.x FROM object_nodes_histories h2 
                 WHERE h2.object_node_id = onh.object_node_id 
                 AND h2.appeared_at <= '".$mysqli->real_escape_string($datetime)."'
                 ORDER BY h2.appeared_at DESC LIMIT 1), 
                onh.x
            ) AS x,
            COALESCE(
                (SELECT h2.y FROM object_nodes_histories h2 
                 WHERE h2.object_node_id = onh.object_node_id 
                 AND h2.appeared_at <= '".$mysqli->real_escape_string($datetime)."'
                 ORDER BY h2.appeared_at DESC LIMIT 1), 
                onh.y
            ) AS y,
            onh.status, 
            onh.appeared_at, 
            onh.disappeared_at, 
            onh.purpose, 
            NULL AS evaluation_good, 
            NULL AS attribution, 
            NULL AS attribution_bad,
            NULL AS application, 
            NULL AS estimated_time
        FROM 
            object_nodes_histories onh
        INNER JOIN 
            object_nodes o_nodes ON onh.object_node_id = o_nodes.object_node_id
        WHERE 
            onh.appeared_at <= '".$mysqli->real_escape_string($datetime)."'
            AND (onh.disappeared_at IS NULL OR onh.disappeared_at > '".$mysqli->real_escape_string($datetime)."')
            AND (onh.drag = 0 OR onh.drag IS NULL)";
    
    // selected_node_idが指定されている場合はそのノードに関連するデータのみ取得
    // ただし、topic-tag（問いノード）は常に取得する
    if ($selected_node_id) {
        $sql_histories .= " AND (o_nodes.node_id = '".$mysqli->real_escape_string($selected_node_id)."' OR onh.object_node_type = 'topic-tag')";
    }
    
    $sql_histories .= " AND o_nodes.deleted = 0
        ORDER BY 
            onh.object_node_id, onh.appeared_at DESC
    ";
    error_log("SQL histories: $sql_histories");

    $result_histories = $mysqli->query($sql_histories);

    if (!$result_histories) {
        echo json_encode([
            'status' => 'sql_error',
            'message' => 'object_nodes_histories の SQL 実行に失敗: ' . $mysqli->error,
            'hnode' => [],
            'debug' => ['sql_histories' => $sql_histories]
        ]);
        exit;
    }

    // 各ノードの最新履歴だけ取得
    $object_node_h = [];
    $seen_ids = [];
    $node_object_ids = []; // 取得したノードのobject_node_idを保存

    while ($row = $result_histories->fetch_assoc()) {
        $oid = $row['object_node_id'];
        if (!in_array($oid, $seen_ids)) {
            $object_node_h[] = $row;
            $seen_ids[] = $oid;
            $node_object_ids[] = $oid;
        }
    }

    // object_edgesテーブルから、取得したノードに関連するエッジを取得
    $object_edge_h = [];
    if (count($node_object_ids) > 0) {
        $ids_list = "'" . implode("','", array_map(function($id) use ($mysqli) {
            return $mysqli->real_escape_string($id);
        }, $node_object_ids)) . "'";
        
        $sql_edges = "
            SELECT 
                object_edge_id, edge_start, edge_end, label
            FROM 
                object_edges
            WHERE 
                edge_start IN ($ids_list) 
                AND deleted = 0
        ";
        error_log("SQL edges: $sql_edges");

        $result_edges = $mysqli->query($sql_edges);

        if ($result_edges) {
            while ($row = $result_edges->fetch_assoc()) {
                $object_edge_h[] = $row;
            }
        } else {
            error_log("エッジ取得エラー: " . $mysqli->error);
        }
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'データ取得成功',
        'hnode' => $object_node_h,
        'hedge' => $object_edge_h,
        'debug' => [
            'histories_found' => count($object_node_h),
            'edges_found' => count($object_edge_h),
            'sql_histories' => $sql_histories,
            'sql_edges' => isset($sql_edges) ? $sql_edges : 'no edges query',
            'datetime' => $datetime
        ]
    ]);
}




?>