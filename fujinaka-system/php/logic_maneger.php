<?php

session_start();
require("connect_db.php");
date_default_timezone_set('Asia/Tokyo');

header('Content-Type: application/json'); // JSON 形式でレスポンスを返す

if (!isset($_SESSION['USERID'])) {
    echo json_encode(["status" => "error", "message" => "ユーザーIDが設定されていません"]);
    exit;
}

$user_id = $_SESSION['USERID']; // ユーザーID
$purpose =$_POST['purpose'];

if ($purpose === 'record') {
    $record_thing = $_POST['record_thing'];
    if ($record_thing === 'triangle'){
        $triangle_id = $_POST["triangle_id"];
        $claim_id = $_POST["claim_id"];
        $reason_id = $_POST["reason_id"];
        $fact_id = $_POST["fact_id"];

        $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

        $sql = "INSERT INTO logic_triangle (triangle_id, claim_id, reason_id, fact_id) 
                VALUES ('$triangle_id', '$claim_id', '$reason_id', '$fact_id')";

        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "三角ロジックが記録されました", "triangle_id" => $triangle_id]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    }
    if ($record_thing === 'node') {
        $node_id = $_POST["node_id"];
        $label = $_POST["label"];
        $f_node_id = $_POST["f_node_id"];
        $x = $_POST["x"];
        $y = $_POST["y"];

        $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

        $sql = "INSERT INTO logic_node (logic_node_id, label, f_node_id, x, y, created_at, updated_at) 
                VALUES ('$node_id', '$label', '$f_node_id', '$x', '$y', '$timestamp', '$timestamp')";

        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "ノードが記録されました", "node_id" => $node_id]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    }
}

else if ($purpose === 'update') {
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
    $updatedNodeId = $_POST["updatedNodeId"];
    $newlabel = $_POST["label"];
    $f_node_id = $_POST["f_node_id"];

    $sql = "UPDATE logic_node SET label = '$newlabel', f_node_id = '$f_node_id', updated_at = '$timestamp' WHERE logic_node_id = '$updatedNodeId'";

    if ($mysqli->query($sql)) {
        echo json_encode(["status" => "success", "message" => "ノードが更新されました", "node_id" => $updatedNodeId]);
    } else {
        echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
    }
}

else if ($purpose === 'load') {
    $load_thing = $_POST['load_thing'];
    
    if ($load_thing === 'all') {
        // ノードデータを取得
        $nodesSql = "SELECT logic_node_id as node_id, label, f_node_id, x, y FROM logic_node ORDER BY created_at";
        $nodesResult = $mysqli->query($nodesSql);
        $nodes = [];
        if ($nodesResult) {
            while ($row = $nodesResult->fetch_assoc()) {
                $nodes[] = $row;
            }
        }
        
        // エッジデータを取得（logic_triangleテーブルから三角形の辺を生成）
        $trianglesSql = "SELECT claim_id, reason_id, fact_id FROM logic_triangle";
        $trianglesResult = $mysqli->query($trianglesSql);
        $edges = [];
        if ($trianglesResult) {
            while ($row = $trianglesResult->fetch_assoc()) {
                // 三角形の3つの辺を追加
                $edges[] = ['edge_start' => $row['claim_id'], 'edge_end' => $row['reason_id']];
                $edges[] = ['edge_start' => $row['reason_id'], 'edge_end' => $row['fact_id']];
                $edges[] = ['edge_start' => $row['fact_id'], 'edge_end' => $row['claim_id']];
            }
        }
        
        echo json_encode([
            "status" => "success", 
            "message" => "データロード完了",
            "nodes" => $nodes,
            "edges" => $edges
        ]);
    }
}

else if ($purpose === 'delete') {
    $delete_thing = $_POST['delete_thing'];
    if ($delete_thing === 'node') {
        $node_id = $_POST["node_id"];

        $sql = "DELETE FROM logic_node  WHERE logic_node_id = '$node_id'";

        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "ノードが削除されました", "node_id" => $node_id]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    }

}
?>
