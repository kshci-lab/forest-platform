<?php

session_start();
require("connect_db.php");
date_default_timezone_set('Asia/Tokyo');

header('Content-Type: application/json'); // JSON 形式でレスポンスを返す

if (!isset($_SESSION['USERID'])) {
    echo json_encode(["status" => "error", "message" => "ユーザーIDが設定されていません"]);
    exit;
}

$user_id = $_SESSION['USERID'];
$sheet_id = $_SESSION['SHEETID'];

$purpose = $_POST['purpose'] ?? null;

if ($purpose === 'record') {
    $record_thing = $_POST['record_thing'];
    if ($record_thing === 'triangle'){
        $triangle_id = $_POST["triangle_id"];
        $claim_id = $_POST["claim_id"];
        $reason_id = $_POST["reason_id"];
        $fact_id = $_POST["fact_id"];

        $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

        $sql = "INSERT INTO logic_triangle (triangle_id, claim_id, reason_id, fact_id, sheet_id, user_id) 
                VALUES ('$triangle_id', '$claim_id', '$reason_id', '$fact_id', '$sheet_id', '$user_id')";

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
        $p_node_id = $_POST["p_node_id"];
        $edited = $_POST["edited"];
        $level = $_POST["level"]; 

        $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

        $sql = "INSERT INTO logic_node (logic_node_id, label, f_node_id, p_node_id, edited, level, created_at, updated_at, sheet_id, user_id) 
                VALUES ('$node_id', '$label', '$f_node_id', '$p_node_id', '$edited', '$level', '$timestamp', '$timestamp', '$sheet_id', '$user_id')";

        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "ノードが記録されました", "node_id" => $node_id]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    }

    // --- added: handle chapter records so response is valid JSON ---
    if ($record_thing === 'chapter') {
        $chapter_id = $_POST['id'] ?? null;
        $rank = isset($_POST['rank']) ? $_POST['rank'] : null;
        $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

        // Try to insert into a plausible table; use prepared statement to avoid SQL errors.
        // If the table doesn't exist or prepare fails, return an informative JSON error.
        $sql = "INSERT INTO scenario_chapter (chapter_id, rank, created_at, updated_at) VALUES (?, ?, ?, ?)";
        $stmt = $mysqli->prepare($sql);

        if ($stmt) {
            // rank may be integer; bind as string to be safe if null
            $stmt->bind_param("siss", $chapter_id, $rank, $timestamp, $timestamp);
            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "章が記録されました", "chapter_id" => $chapter_id]);
            } else {
                echo json_encode(["status" => "error", "message" => "データベースエラー（execute）: " . $stmt->error]);
            }
            $stmt->close();
        } else {
            // prepare failed (table might not exist) -- return a valid JSON error so client won't get parsererror
            echo json_encode(["status" => "error", "message" => "データベースエラー（prepare）: " . $mysqli->error]);
        }
        // end chapter handling
    }

}
else if ($purpose === 'update') {
    $update_thing = $_POST['update_thing'] ?? null;
    $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);
    
    if ($update_thing === 'label') {
        // ノードのラベルのみ更新（必要なら f_node_id / p_node_id も）
        $node_id = $_POST["node_id"];
        $new_label = $_POST["new_label"];
        $edited = isset($_POST["edited"]) ? $_POST["edited"] : 1;

        // 動的にSET句を構築（f_node_id / p_node_id が来た時のみ更新）
        $set = "label = '".$mysqli->real_escape_string($new_label)."', edited = '".$mysqli->real_escape_string($edited)."', updated_at = '$timestamp'";
        if (isset($_POST["f_node_id"]) && $_POST["f_node_id"] !== '') {
            $f_node_id = $mysqli->real_escape_string($_POST["f_node_id"]);
            $set .= ", f_node_id = '$f_node_id'";
        }
        if (isset($_POST["p_node_id"]) && $_POST["p_node_id"] !== '') {
            $p_node_id = $mysqli->real_escape_string($_POST["p_node_id"]);
            $set .= ", p_node_id = '$p_node_id'";
        }

        $node_id_esc = $mysqli->real_escape_string($node_id);
        $sql = "UPDATE logic_node SET $set WHERE logic_node_id = '$node_id_esc' AND sheet_id = '$sheet_id' AND user_id = '$user_id'"; // 追加: 絞り込み

        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "ノードのラベルが更新されました", "node_id" => $node_id]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    } else if($update_thing === 'f_node_id') {
        //三角ロジックからforestに反映したときにf_node_idを更新
        $logic_node_id = $_POST["logic_node_id"];
        $f_node_id = $_POST["id"];
        $sql = "UPDATE logic_node SET f_node_id = '$f_node_id', updated_at = '$timestamp' WHERE logic_node_id = '$logic_node_id' AND sheet_id = '$sheet_id' AND user_id = '$user_id'";
        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "Forestノードからの更新が完了しました", "node_id" => $logic_node_id]); // 修正
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    } else if($update_thing === 'p_node_id') {
        //三角ロジックから論文シナリオに反映したときにp_node_idを更新
        $logic_node_id = $_POST["logic_node_id"];
        $p_node_id = $_POST["content_id"];
        $sql = "UPDATE logic_node SET p_node_id = '$p_node_id', updated_at = '$timestamp' WHERE logic_node_id = '$logic_node_id' AND sheet_id = '$sheet_id' AND user_id = '$user_id'";
        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "Presentationノードからの更新が完了しました", "node_id" => $logic_node_id]); // 修正
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    } else if ($update_thing === 'f_to_LogicNodelabel') {
        // ForestからLogicノードへの更新（update_f_to_LogicNodelabel用）
        $updatedNodeId = $_POST["updatedNodeId"];
        $newlabel = $_POST["label"];
        $f_node_id = $_POST["f_node_id"];
        $edited = isset($_POST["edited"]) ? $_POST["edited"] : 1; // edited パラメータを追加（デフォルト1）

        $sql = "UPDATE logic_node SET label = '$newlabel', f_node_id = '$f_node_id', edited = '$edited', updated_at = '$timestamp' WHERE logic_node_id = '$updatedNodeId' AND sheet_id = '$sheet_id' AND user_id = '$user_id'";

        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "Forestノードからの更新が完了しました", "node_id" => $updatedNodeId]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    } else if ($update_thing === 'p_to_LogicNodelabel') {
        // PresentationからLogicノードへの更新（update_p_to_LogicNodelabel用）
        $updatedNodeId = $_POST["updatedNodeId"];
        $newlabel = $_POST["label"];
        $p_node_id = $_POST["p_node_id"];
        $edited = isset($_POST["edited"]) ? $_POST["edited"] : 1; // edited パラメータを追加（デフォルト1）

        $sql = "UPDATE logic_node SET label = '$newlabel', p_node_id = '$p_node_id', edited = '$edited', updated_at = '$timestamp' WHERE logic_node_id = '$updatedNodeId' AND sheet_id = '$sheet_id' AND user_id = '$user_id'";

        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "Presentationノードからの更新が完了しました", "node_id" => $updatedNodeId]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    } else if ($update_thing === 'conflict') {
        // 三角形の葛藤を更新
        $triangle_id = $_POST['triangle_id'];
        $conflict = $_POST['conflict'];
        
        // SQLクエリを修正（プレースホルダーを使用）
        $sql = "UPDATE logic_triangle SET conflict = ?, updated_at = ? WHERE triangle_id = ? AND sheet_id = ? AND user_id = ?";
        $stmt = $mysqli->prepare($sql);
        
        if (!$stmt) {
            echo json_encode([
                "status" => "error", 
                "message" => "SQLプリペア失敗: " . $mysqli->error,
                "sql" => $sql
            ]);
            exit;
        }
        
        // パラメータを正しい順序でバインド
        $stmt->bind_param("sssss", $conflict, $timestamp, $triangle_id, $sheet_id, $user_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                "status" => "success", 
                "message" => "三角形の葛藤が更新されました", 
                "triangle_id" => $triangle_id
            ]);
        } else {
            echo json_encode([
                "status" => "error", 
                "message" => "データベースエラー: " . $stmt->error
            ]);
        }
        $stmt->close();
        
    } else if ($update_thing === 'claimReason') {
        // 三角形の説明を更新
        $triangle_id = $_POST['triangle_id'];
        $claimReason = $_POST['claimReason'];

        $sql = "UPDATE logic_triangle SET claimReason = ?, updated_at = ? WHERE triangle_id = ? AND sheet_id = ? AND user_id = ?";
        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param("sssss", $claimReason, $timestamp, $triangle_id, $sheet_id, $user_id);

        if ($stmt->execute()) {
            echo json_encode([
                "status" => "success", 
                "message" => "三角形の説明が更新されました", 
                "triangle_id" => $triangle_id
            ]);
        } else {
            echo json_encode([
                "status" => "error", 
                "message" => "データベースエラー: " . $stmt->error
            ]);
        }
        $stmt->close();
    }
}

else if ($purpose === 'delete') {
    $delete_thing = $_POST['delete_thing'];
    if ($delete_thing === 'node') {
        $node_id = $_POST["node_id"];
        $edited = isset($_POST["edited"]) ? $_POST["edited"] : 0;
        $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

        // ノードを削除する代わりに、node_id以外の項目をNULLに更新
        $sql = "UPDATE logic_node SET 
                label = NULL, 
                f_node_id = NULL, 
                x = NULL, 
                y = NULL, 
                created_at = NULL,
                updated_at = '$timestamp',
                edited = '$edited'
                WHERE logic_node_id = '$node_id' AND sheet_id = '$sheet_id' AND user_id = '$user_id'";

        if ($mysqli->query($sql)) {
            echo json_encode(["status" => "success", "message" => "ノードの内容がクリアされました", "node_id" => $node_id]);
        } else {
            echo json_encode(["status" => "error", "message" => "データベースエラー: " . $mysqli->error]);
        }
    }
}

else if ($purpose === 'load') {
    $load_thing = $_POST['load_thing'];
    
    if ($load_thing === 'all') {
        // ノードデータを取得（x,yは保持しない）
        $nodesSql = "SELECT logic_node_id as node_id, label, f_node_id, p_node_id, edited, level FROM logic_node WHERE sheet_id = ? AND user_id = ? ORDER BY created_at";
        $stmtNodes = $mysqli->prepare($nodesSql);
        $stmtNodes->bind_param("ss", $sheet_id, $user_id);
        $stmtNodes->execute();
        $nodesResult = $stmtNodes->get_result();
        $nodes = [];
        if ($nodesResult) {
            while ($row = $nodesResult->fetch_assoc()) {
                $nodes[] = $row;
            }
        }
        $stmtNodes->close();

        // 三角データを取得しつつ、従来通りedgesも生成
        $trianglesSql = "SELECT triangle_id, claim_id, reason_id, fact_id, claimReason, conflict FROM logic_triangle WHERE sheet_id = ? AND user_id = ?";
        $stmtTri = $mysqli->prepare($trianglesSql);
        $stmtTri->bind_param("ss", $sheet_id, $user_id);
        $stmtTri->execute();
        $trianglesResult = $stmtTri->get_result();
        $edges = [];
        $triangles = [];
        if ($trianglesResult) {
            while ($row = $trianglesResult->fetch_assoc()) {
                // triangles配列（JS側で復元に利用）
                $triangles[] = [
                    'triangle_id' => $row['triangle_id'],
                    'claim_id'    => $row['claim_id'],
                    'reason_id'   => $row['reason_id'],
                    'fact_id'     => $row['fact_id'],
                    'claimReason' => $row['claimReason'],
                    'conflict'    => $row['conflict'],
                ];
                // 従来のedgesも維持（後方互換）
                $edges[] = ['edge_start' => $row['claim_id'],  'edge_end' => $row['reason_id']];
                $edges[] = ['edge_start' => $row['reason_id'], 'edge_end' => $row['fact_id']];
                $edges[] = ['edge_start' => $row['fact_id'],   'edge_end' => $row['claim_id']];
            }
        }
        $stmtTri->close();
        
        echo json_encode([
            "status"    => "success",
            "message"   => "データロード完了",
            "nodes"     => $nodes,
            "edges"     => $edges,
            "triangles" => $triangles
        ]);
    }
}
else if ($purpose === 'get') {
    $get_thing = $_POST['get_thing'] ?? null;
    
    if ($get_thing === 'triangle_by_claim') {
        $claim_id = $_POST['claim_id'] ?? '';

        // プレースホルダを使用し、claim/reason/fact のいずれか一致で取得
        $sql = "SELECT triangle_id
                  FROM logic_triangle
                 WHERE (claim_id = ? OR reason_id = ? OR fact_id = ?)
                   AND sheet_id = ?
                   AND user_id = ?
                 LIMIT 1";
        $stmt = $mysqli->prepare($sql);
        if (!$stmt) {
            echo json_encode([
                "status" => "error",
                "message" => "SQLプリペア失敗: " . $mysqli->error
            ]);
            exit;
        }

        // すべて文字列としてバインド
        $stmt->bind_param("sssss", $claim_id, $claim_id, $claim_id, $sheet_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            echo json_encode([
                "status" => "success",
                "triangle_id" => $row['triangle_id']
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "該当する三角形が見つかりません"
            ]);
        }
        $stmt->close();
    }
}

?>
