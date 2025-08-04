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
    $triangle_id = $_POST["triangle_id"];
    $claim_id = $_POST["claim_id"];
    $reason_id = $_POST["reason_id"];
    $fact_id = $_POST["fact_id"];
    $f_claim_id = $_POST["f_claim_id"];
    $f_reason_id = $_POST["f_reason_id"];
    $f_fact_id = $_POST["f_fact_id"];
    $claim_content = $_POST["claim_content"];
    $reason_content = $_POST["reason_content"];
    $fact_content = $_POST["fact_content"];
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

    $sql = "INSERT INTO logic_triangle (triangle_id, claim_id, reason_id, fact_id, f_claim_id, f_reason_id, f_fact_id, claim_content, reason_content, fact_content, claim_created_at, claim_updated_at, reason_created_at, reason_updated_at, fact_created_at, fact_updated_at) 
            VALUES ('$triangle_id', '$claim_id', '$reason_id', '$fact_id', '$f_claim_id', '$f_reason_id', '$f_fact_id', '$claim_content', '$reason_content', '$fact_content', '$timestamp', '$timestamp', '$timestamp', '$timestamp', '$timestamp', '$timestamp')";

    if ($mysqli->query($sql)) {
        echo json_encode(["status" => "success", "message" => "ノードが記録されました", "node_id" => $logic_node_id]);
    } else {
        echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
    }
    
}

else if ($purpose === 'update') {
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
    $updatedNodeId = $_POST["updatedNodeId"];
    $newlabel = $_POST["label"];
    $f_node_id = $_POST["f_node_id"];

    $sql = "UPDATE logic_triangle SET label = '$newlabel', f_concept_id = '$f_node_id', updated_at = '$timestamp' WHERE logic_node_id = '$updatedNodeId'";

    if ($mysqli->query($sql)) {
        echo json_encode(["status" => "success", "message" => "ノードが更新されました", "node_id" => $updatedNodeId]);
    } else {
        echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
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
    else if ($delete_thing === 'edge') {
        $edge_start = $_POST["edge_start"];
        $edge_end = $_POST["edge_end"];
        if($edge_start === ""){
            $sql = "DELETE FROM object_edges WHERE edge_end = '$edge_end'";
        //$edge_end のみが空の場合：
        }else if($edge_end === ""){
            $sql = "DELETE FROM logic_edge WHERE edge_start = '$edge_start'";
        //$edge_start と $edge_end が両方指定されている場合
        }else{
            $sql = "DELETE FROM logic_edge  WHERE edge_start = '$edge_start' AND edge_end = '$edge_end'";
        }

        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "エッジが削除されました", "edge_start" => $edge_start]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    }

}
else if ($purpose === 'load') {
    $load_thing = $_POST['load_thing'];
    
    if ($load_thing === 'all') {
        try {
            // ノードを取得
            $node_sql = "SELECT logic_node_id as node_id, label, f_concept_id as concept_id, x, y 
                        FROM logic_node 
                        ORDER BY logic_node_id";
            $node_result = $mysqli->query($node_sql);
            
            $nodes = [];
            if ($node_result && $node_result->num_rows > 0) {
                while ($row = $node_result->fetch_assoc()) {
                    $nodes[] = [
                        'node_id' => $row['node_id'],
                        'label' => $row['label'],
                        'concept_id' => $row['concept_id'],
                        'x' => floatval($row['x']),
                        'y' => floatval($row['y'])
                    ];
                }
            }

            // エッジを取得
            $edge_sql = "SELECT edge_start, edge_end 
                        FROM logic_edge 
                        ORDER BY logic_edge_id";
            $edge_result = $mysqli->query($edge_sql);
            
            $edges = [];
            if ($edge_result && $edge_result->num_rows > 0) {
                while ($row = $edge_result->fetch_assoc()) {
                    $edges[] = [
                        'edge_start' => $row['edge_start'],
                        'edge_end' => $row['edge_end']
                    ];
                }
            }

            // 成功レスポンス
            echo json_encode([
                "status" => "success", 
                "message" => "データを取得しました",
                "nodes" => $nodes,
                "edges" => $edges
            ]);

        } catch (Exception $e) {
            echo json_encode([
                "status" => "error", 
                "message" => "データベースエラー: " . $e->getMessage()
            ]);
        }
    }
    else if ($load_thing === 'nodes') {
        // ノードのみを取得
        try {
            $sql = "SELECT logic_node_id as node_id, label, f_concept_id as concept_id, x, y 
                   FROM logic_node 
                   ORDER BY logic_node_id";
            $result = $mysqli->query($sql);
            
            $nodes = [];
            if ($result && $result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    $nodes[] = [
                        'node_id' => $row['node_id'],
                        'label' => $row['label'],
                        'concept_id' => $row['concept_id'],
                        'x' => floatval($row['x']),
                        'y' => floatval($row['y'])
                    ];
                }
            }

            echo json_encode([
                "status" => "success", 
                "message" => "ノードデータを取得しました",
                "nodes" => $nodes
            ]);

        } catch (Exception $e) {
            echo json_encode([
                "status" => "error", 
                "message" => "データベースエラー: " . $e->getMessage()
            ]);
        }
    }
    else if ($load_thing === 'edges') {
        // エッジのみを取得
        try {
            $sql = "SELECT edge_start, edge_end 
                   FROM logic_edge 
                   ORDER BY logic_edge_id";
            $result = $mysqli->query($sql);
            
            $edges = [];
            if ($result && $result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    $edges[] = [
                        'edge_start' => $row['edge_start'],
                        'edge_end' => $row['edge_end']
                    ];
                }
            }

            echo json_encode([
                "status" => "success", 
                "message" => "エッジデータを取得しました",
                "edges" => $edges
            ]);

        } catch (Exception $e) {
            echo json_encode([
                "status" => "error", 
                "message" => "データベースエラー: " . $e->getMessage()
            ]);
        }
    }
}
?>
