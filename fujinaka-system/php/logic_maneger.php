<?php

session_start();
require("connect_db.php");
date_default_timezone_set('Asia/Tokyo');

header('Content-Type: application/json'); // JSON 形式でレスポンスを返す

// 追加: true/false, "true"/"false", 1/0 を 1/0 へ正規化
function ln_bool_to_int($v) {
    if (is_bool($v)) return $v ? 1 : 0;
    if ($v === null) return 0;
    $s = strtolower(trim((string)$v));
    return in_array($s, ['1', 'true', 'on', 'yes'], true) ? 1 : 0;
}

if (!isset($_SESSION['USERID'])) {
    echo json_encode(["status" => "error", "message" => "ユーザーIDが設定されていません"]);
    exit;
}

$user_id = $_SESSION['USERID'];
$sheet_id = $_SESSION['SHEETID'];
// 追加: map_id（シナリオ側テーブル参照時に使用）
$map_id = $_SESSION['MAPID'] ?? null;

$purpose = $_POST['purpose'] ?? null;

if ($purpose === 'record') {
    $record_thing = $_POST['record_thing'];
    if ($record_thing === 'triangle'){
        $triangle_id = $_POST["triangle_id"];
        $claim_id = $_POST["claim_id"];
        $fact_id = $_POST["fact_id"];
        $reason_id = $_POST["reason_id"];

        $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

        $sql = "INSERT INTO logic_triangle (triangle_id, claim_id, fact_id, reason_id, sheet_id, user_id) 
                VALUES ('$triangle_id', '$claim_id', '$fact_id', '$reason_id', '$sheet_id', '$user_id')";

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
        // 変更: true/false も受けて 1/0 に正規化し、SQLでは TRUE/FALSE を使用
        $edited = ln_bool_to_int($_POST["edited"] ?? 0);
        $edited_sql = $edited ? "TRUE" : "FALSE";
        $level = isset($_POST["level"]) ? (int)$_POST["level"] : null;

        $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

        $sql = "INSERT INTO logic_node (logic_node_id, label, f_node_id, p_node_id, edited, level, created_at, updated_at, sheet_id, user_id) 
                VALUES ('$node_id', '$label', '$f_node_id', '$p_node_id', $edited_sql, '$level', '$timestamp', '$timestamp', '$sheet_id', '$user_id')";

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
        // 変更: edited を 1/0 に正規化
        $edited = ln_bool_to_int($_POST["edited"] ?? 1);
        $edited_sql = $edited ? "TRUE" : "FALSE";

        // 動的にSET句を構築（f_node_id / p_node_id が来た時のみ更新）
        $set = "label = '".$mysqli->real_escape_string($new_label)."', edited = $edited_sql, updated_at = '$timestamp'";
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
        // 変更: edited を 1/0 に正規化
        $edited = ln_bool_to_int($_POST["edited"] ?? 1);
        $edited_sql = $edited ? "TRUE" : "FALSE";

        $sql = "UPDATE logic_node SET label = '$newlabel', f_node_id = '$f_node_id', edited = $edited_sql, updated_at = '$timestamp' WHERE logic_node_id = '$updatedNodeId' AND sheet_id = '$sheet_id' AND user_id = '$user_id'";

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
        // 変更: edited を 1/0 に正規化
        $edited = ln_bool_to_int($_POST["edited"] ?? 1);
        $edited_sql = $edited ? "TRUE" : "FALSE";

        $sql = "UPDATE logic_node SET label = '$newlabel', p_node_id = '$p_node_id', edited = $edited_sql, updated_at = '$timestamp' WHERE logic_node_id = '$updatedNodeId' AND sheet_id = '$sheet_id' AND user_id = '$user_id'";

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
        // 変更: edited を 1/0 に正規化（削除時に edited=0/1 を受ける想定）
        $edited = ln_bool_to_int($_POST["edited"] ?? 0);
        $edited_sql = $edited ? "TRUE" : "FALSE";
        $timestamp = date("Y-m-d H:i:s") . "." . substr(explode(".", (microtime(true) . ""))[1], 0, 3);

        $sql = "UPDATE logic_node SET 
                label = NULL, 
                f_node_id = NULL, 
                x = NULL, 
                y = NULL, 
                created_at = NULL,
                updated_at = '$timestamp',
                edited = $edited_sql
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
                // edited: 1/0 -> true/false に変換して返す
                $row['edited'] = isset($row['edited']) ? (bool)$row['edited'] : false;
                // level は数値として返す（念のため）
                $row['level'] = isset($row['level']) ? (int)$row['level'] : 0;
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
    // 追加: Forestの nodes テーブルから type を取得
    else if ($get_thing === 'node_type') {
        $node_id = $_POST['node_id'] ?? '';
        if ($node_id === '') {
            echo json_encode([
                "status" => "error",
                "message" => "node_id が指定されていません"
            ]);
            exit;
        }

        // nodes テーブル(id 指定)から type を取得
        $sql = "SELECT type FROM nodes WHERE id = ? LIMIT 1";
        $stmt = $mysqli->prepare($sql);
        if (!$stmt) {
            echo json_encode([
                "status" => "error",
                "message" => "SQLプリペア失敗: " . $mysqli->error
            ]);
            exit;
        }

        $stmt->bind_param("s", $node_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            echo json_encode([
                "status" => "success",
                "type" => $row['type']
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "該当ノードが見つかりません"
            ]);
        }
        $stmt->close();
    }
    // 追加: Presentation側のノードIDから Forest 概念ID（= f_node_id）を取得
    else if ($get_thing === 'pnode_to_fid') {
        $p_node_id = $_POST['p_node_id'] ?? '';
        if ($p_node_id === '') {
            echo json_encode([
                "status" => "error",
                "message" => "p_node_id が指定されていません"
            ]);
            exit;
        }

        // document_content_rank を優先して検索（id / content_id / node_id のいずれか一致）
        $concept_id = null;

        // ヘルパー: 単一値クエリ実行
        $fetch_one = function($sql, $types, $params) use ($mysqli) {
            $stmt = $mysqli->prepare($sql);
            if (!$stmt) return [false, "SQLプリペア失敗: " . $mysqli->error];
            $stmt->bind_param($types, ...$params);
            if (!$stmt->execute()) {
                $err = $stmt->error;
                $stmt->close();
                return [false, "SQL実行失敗: " . $err];
            }
            $res = $stmt->get_result();
            $row = $res ? $res->fetch_assoc() : null;
            $stmt->close();
            return [true, $row];
        };

        // map_id があれば絞り込む（無くても動作するように左右対応）
        $mapWhere = ($map_id !== null) ? " AND map_id = ?" : "";
        $mapParam = ($map_id !== null) ? [$map_id] : [];

        // 1) document_content_rank.id
        $sql1 = "SELECT concept_id FROM document_content_rank WHERE id = ?" . $mapWhere . " LIMIT 1";
        list($ok1, $row1) = $fetch_one($sql1, ($map_id !== null ? "ss" : "s"), array_merge([$p_node_id], $mapParam));
        if ($ok1 && $row1 && isset($row1['concept_id']) && $row1['concept_id'] !== '') {
            $concept_id = $row1['concept_id'];
        }

        // 2) content_id
        if ($concept_id === null) {
            $sql2 = "SELECT concept_id FROM document_content_rank WHERE content_id = ?" . $mapWhere . " LIMIT 1";
            list($ok2, $row2) = $fetch_one($sql2, ($map_id !== null ? "ss" : "s"), array_merge([$p_node_id], $mapParam));
            if ($ok2 && $row2 && isset($row2['concept_id']) && $row2['concept_id'] !== '') {
                $concept_id = $row2['concept_id'];
            }
        }

        // 3) node_id
        if ($concept_id === null) {
            $sql3 = "SELECT concept_id FROM document_content_rank WHERE node_id = ?" . $mapWhere . " LIMIT 1";
            list($ok3, $row3) = $fetch_one($sql3, ($map_id !== null ? "ss" : "s"), array_merge([$p_node_id], $mapParam));
            if ($ok3 && $row3 && isset($row3['concept_id']) && $row3['concept_id'] !== '') {
                $concept_id = $row3['concept_id'];
            }
        }

        // 4) document_rank（章・節タイトル等）: id / node_id
        if ($concept_id === null) {
            $sql4 = "SELECT concept_id FROM document_rank WHERE id = ?" . $mapWhere . " LIMIT 1";
            list($ok4, $row4) = $fetch_one($sql4, ($map_id !== null ? "ss" : "s"), array_merge([$p_node_id], $mapParam));
            if ($ok4 && $row4 && isset($row4['concept_id']) && $row4['concept_id'] !== '') {
                $concept_id = $row4['concept_id'];
            }
        }
        if ($concept_id === null) {
            $sql5 = "SELECT concept_id FROM document_rank WHERE node_id = ?" . $mapWhere . " LIMIT 1";
            list($ok5, $row5) = $fetch_one($sql5, ($map_id !== null ? "ss" : "s"), array_merge([$p_node_id], $mapParam));
            if ($ok5 && $row5 && isset($row5['concept_id']) && $row5['concept_id'] !== '') {
                $concept_id = $row5['concept_id'];
            }
        }

        if ($concept_id !== null && $concept_id !== '') {
            echo json_encode([
                "status" => "success",
                "f_node_id" => $concept_id
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "対応する概念IDが見つかりません",
                "f_node_id" => null
            ]);
        }
    }
}

?>
