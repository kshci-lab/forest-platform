<?php
//指定した日時だけ取得・マッチングするバージョン
session_start();
require("connect_db.php");

// JSONレスポンス
header('Content-Type: application/json; charset=utf-8');

$sheet_id = $_SESSION["SHEETID"];

// 調査用: sheet_id上書き/デバッグフラグ
$override_sheet = isset($_REQUEST['sheet_id']) ? trim((string)$_REQUEST['sheet_id']) : null;
$debug = isset($_REQUEST['debug']) ? (int)$_REQUEST['debug'] : 0;
if ($override_sheet !== null && $override_sheet !== '') {
  $sheet_id = $override_sheet;
}

//タイムゾーンの設定
date_default_timezone_set('Asia/Tokyo');
$today_date = date("Y-m-d");

if (!$sheet_id) {
  http_response_code(400);
  echo json_encode(["status" => "error", "message" => "sheet_idが未設定です"]);
  exit;
}

// 並び順を保証しつつ安全に取得（deletedがNULLも未削除扱い）
$sql = "SELECT content_id, node_id, f_node_id, rank, content, slide_id, type, indent
          FROM slide_content_rank
         WHERE sheet_id = $sheet_id AND deleted = 0
         ORDER BY slide_id, rank ASC";

$reflections = [];

if ($stmt = $mysqli->prepare($sql)) {
  $stmt->bind_param('s', $sheet_id);
  if ($stmt->execute()) {
    $result = $stmt->get_result();
    if ($result) {
      while ($row = $result->fetch_assoc()) {
        $reflections[] = [
          'content_id' => $row["content_id"],
          'node_id'    => $row["node_id"],
          'f_node_id'  => $row["f_node_id"],
          'rank'       => $row["rank"],
          'content'    => $row["content"],
          'slide_id'   => $row["slide_id"],
          'type'       => $row["type"],
          'indent'     => $row["indent"],
        ];
      }
      $result->free();
    }
    $stmt->close();

    // debug=1 のときは件数情報も返す
    if ($debug) {
      $diag = [
        "sheet_id" => $sheet_id,
        "count" => [
          "all" => null,
          "by_sheet" => null,
          "by_sheet_not_deleted" => null,
        ],
        "sample_top" => null
      ];
      // 件数クエリ
      if ($cs = $mysqli->prepare("SELECT COUNT(*) AS cnt FROM slide_content_rank")) {
        $cs->execute();
        $r = $cs->get_result(); $diag["count"]["all"] = $r ? (int)$r->fetch_assoc()["cnt"] : null;
        if ($r) $r->free();
        $cs->close();
      }
      if ($cs = $mysqli->prepare("SELECT COUNT(*) AS cnt FROM slide_content_rank WHERE sheet_id = ?")) {
        $cs->bind_param('s', $sheet_id);
        $cs->execute();
        $r = $cs->get_result(); $diag["count"]["by_sheet"] = $r ? (int)$r->fetch_assoc()["cnt"] : null;
        if ($r) $r->free();
        $cs->close();
      }
      if ($cs = $mysqli->prepare("SELECT COUNT(*) AS cnt FROM slide_content_rank WHERE sheet_id = ? AND COALESCE(deleted,0) = 0")) {
        $cs->bind_param('s', $sheet_id);
        $cs->execute();
        $r = $cs->get_result(); $diag["count"]["by_sheet_not_deleted"] = $r ? (int)$r->fetch_assoc()["cnt"] : null;
        if ($r) $r->free();
        $cs->close();
      }
      // サンプル1件
      if (!empty($reflections)) {
        $diag["sample_top"] = $reflections[0];
      }
      echo json_encode(["debug" => $diag, "data" => $reflections], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
      exit;
    }

    echo json_encode($reflections, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
  } else {
    $err = $mysqli->error;
    $stmt->close();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "データ取得エラー: ".$err]);
    exit;
  }
} else {
  http_response_code(500);
  echo json_encode(["status" => "error", "message" => "ステートメント準備エラー: ".$mysqli->error]);
  exit;
}
?>
