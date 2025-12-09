<?php
// 議論内省マップのデータを読み出すための処理群

session_start();
require("connect_db.php");

// POSTデータの受け取り
$user_id = $_SESSION['USERID'];      //ユーザID
$map_id = $_SESSION['MAPID'];    //マップID

//all...初期読み込み
// group...選択されたグループへ再表示
$mode = $_POST['mode']; 
$group_id_latest =  $_POST['group_id'];

$return_data = []; // DBアクセスの結果として返すキー・バリューのペア

// ユーザーが所属するグループ情報を取得
$groups = [];
$group_ids = [];

if($mode === "all" || $mode === "allRE" ){
    // kgroup_user_linkからgroup_idを取得
    $sql = "SELECT group_id, created_at FROM kgroup_user_link WHERE user_id = ? ORDER BY created_at DESC";
    if ($stmt = $mysqli->prepare($sql)) {
        $stmt->bind_param('s', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $group_ids[] = $row['group_id'];
            if (empty($group_id_latest)) {
                $group_id_latest = $row['group_id']; // created_atが最新のgroup_id
            }
        }
        $stmt->close();

        if (!empty($group_ids)) {
            // knowledge_groupsからgroup_idに合致する情報を取得
            $in = implode(',', array_fill(0, count($group_ids), '?'));
            $sql2 = "SELECT * FROM knowledge_groups WHERE group_id IN ($in) ORDER BY created_at DESC";
            if ($stmt2 = $mysqli->prepare($sql2)) {
                $types = str_repeat('s', count($group_ids));
                $stmt2->bind_param($types, ...$group_ids);
                $stmt2->execute();
                $result2 = $stmt2->get_result();
                while ($row2 = $result2->fetch_assoc()) {
                    $groups[] = $row2;
                }
                $stmt2->close();
            }
        }
    }
    $return_data['groups'] = $groups;
    
    
}else if($mode === "group"){
    
}

// 最新のgroup_idに所属するuser_id一覧を取得
$user_ids_in_latest_group = [];
if (!empty($group_id_latest)) {
    $sql3 = "SELECT user_id FROM kgroup_user_link WHERE group_id = ? ORDER BY created_at DESC";
    if ($stmt3 = $mysqli->prepare($sql3)) {
        $stmt3->bind_param('s', $group_id_latest);
        $stmt3->execute();
        $result3 = $stmt3->get_result();
        while ($row3 = $result3->fetch_assoc()) {
            $user_ids_in_latest_group[] = $row3['user_id'];
        }
        $stmt3->close();
    }
}
$return_data['user_ids_in_latest_group'] = $user_ids_in_latest_group;


if (!empty($user_ids_in_latest_group)) {
    // ユーザーの情報を取得
    $users = [];
    if (!empty($user_ids_in_latest_group)) {
        // プレースホルダを作成
        $in = implode(',', array_fill(0, count($user_ids_in_latest_group), '?'));
        $sql_users = "SELECT user_id, name FROM users WHERE user_id IN ($in)";
        if ($stmt_users = $mysqli->prepare($sql_users)) {
            $types = str_repeat('s', count($user_ids_in_latest_group));
            $stmt_users->bind_param($types, ...$user_ids_in_latest_group);
            $stmt_users->execute();
            $result_users = $stmt_users->get_result();
            while ($row = $result_users->fetch_assoc()) {
                $users[] = $row;
            }
            $stmt_users->close();
        }
    }
    $return_data['users'] = $users;

    // ユーザーごとに共有したprocessノードの取得（user_idも含める）
    $user_ids_escaped = array_map(function($id) use ($mysqli) {
        return $mysqli->real_escape_string($id);
    }, $user_ids_in_latest_group);
    $user_ids_in_sql = implode(",", $user_ids_escaped);
    $sql_nodes = "SELECT sn.*, pn.content, pn.node_id, pn.process_node_type, m.user_id
        FROM shared_nodes sn
        INNER JOIN process_nodes pn ON sn.process_node_id = pn.process_node_id
        INNER JOIN map_node_links mn ON pn.node_id = mn.node_id
        INNER JOIN maps m ON mn.map_id = m.map_id
        WHERE m.user_id IN ($user_ids_in_sql)
            AND sn.knowledge_group_id IN ($group_id_latest) 
            AND sn.deleted = 0  ORDER BY sn.created_at DESC;";
    
    $result_organi_map_node = $mysqli->query($sql_nodes);
    $organi_map_node = [];
    if ($result_organi_map_node) {
        while ($row = $result_organi_map_node->fetch_assoc()) {
            $organi_map_node[] = $row;
        }
    }
    $return_data = array_merge($return_data, ['pnode' => $organi_map_node]);
}

if (empty($return_data)) {
    echo json_encode(["error" => "not"]);
    return;
} else {
    echo json_encode($return_data);
    return;
}

?>