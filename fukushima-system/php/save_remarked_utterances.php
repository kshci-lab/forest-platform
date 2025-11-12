<?php
// ラベルXMLから抽出した発言ID・送信者・タイプを remarked_utterances に保存するAPI
// 期待入力: POST entries (JSON配列) [{utterance_id:number|string, user_id:string, type:number|string}]
// 出力: {status:'ok', inserted:int, updated:int} or {status:'error', error:'...'}

session_start();
header('Content-Type: application/json; charset=utf-8');

require_once(__DIR__ . '/connect_db.php');

function map_type_enum($v){
    // 1→SELF, 2→OTHER, 3→ORGANIZETION, 4→UNKNOWN  ※DBのENUM表記に合わせる（ORGANIZETION）
    $n = null;
    if (is_numeric($v)) { $n = intval($v, 10); }
    else if (is_string($v)) {
        // 文字列でも "1" 等で来る想定
        if (ctype_digit($v)) { $n = intval($v, 10); }
    }
    switch ($n) {
        case 1: return 'SELF';
        case 2: return 'OTHER';
        case 3: return 'ORGANIZETION';
        case 4: return 'UNKNOWN';
        default: return 'UNKNOWN';
    }
}

try {
    if (!isset($_POST['entries'])) {
        echo json_encode(["status" => "error", "error" => "entries がありません"]);
        return;
    }
    $raw = $_POST['entries'];
    if (is_string($raw)) {
        $entries = json_decode($raw, true);
    } else {
        $entries = $raw; // 直接配列で来た場合
    }
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(["status" => "error", "error" => "entries のJSONデコードに失敗: " . json_last_error_msg()]);
        return;
    }
    if (!is_array($entries)) {
        echo json_encode(["status" => "error", "error" => "entries は配列である必要があります"]);
        return;
    }

    // プリペアドステートメント（重複時は更新）
    $sql = "INSERT INTO remarked_utterances (utterance_id, user_id, type, deleted) VALUES (?, ?, ?, 0)
            ON DUPLICATE KEY UPDATE user_id=VALUES(user_id), type=VALUES(type), deleted=0, updated_at=CURRENT_TIMESTAMP()";
    $stmt = $mysqli->prepare($sql);
    if(!$stmt){
        error_log('save_remarked_utterances prepare error: ' . $mysqli->error);
        echo json_encode(["status" => "error", "error" => $mysqli->error]);
        return;
    }

    $inserted = 0; $updated = 0; $skipped = 0; $errs = [];
    foreach ($entries as $i => $e) {
        // バリデーションとマッピング
        $uid = isset($e['utterance_id']) ? $e['utterance_id'] : null;
        $usr = isset($e['user_id']) ? (string)$e['user_id'] : '';
        $tp  = isset($e['type']) ? $e['type'] : null;
        if ($uid === null || $uid === '') { $skipped++; continue; }
        if (!is_numeric($uid)) { $skipped++; continue; }
        $utterance_id = intval($uid, 10);
        $type_enum = map_type_enum($tp);

        // bind: i s s
        $stmt->bind_param('iss', $utterance_id, $usr, $type_enum);
        $ok = $stmt->execute();
        if (!$ok) {
            $errs[] = $stmt->error;
            error_log('save_remarked_utterances execute error: ' . $stmt->error);
            continue;
        }
        // 影響行数で挿入/更新の概算（INSERT=1, UPDATE=2になることが多い）
        $aff = $stmt->affected_rows;
        if ($aff === 1) { $inserted++; }
        else if ($aff === 2) { $updated++; }
        else { /* no-op */ }
    }
    $stmt->close();

    if (!empty($errs)) {
        echo json_encode(["status" => "partial", "inserted" => $inserted, "updated" => $updated, "skipped" => $skipped, "errors" => $errs]);
    } else {
        echo json_encode(["status" => "ok", "inserted" => $inserted, "updated" => $updated, "skipped" => $skipped]);
    }
    return;
} catch (Exception $ex) {
    echo json_encode(["status" => "error", "error" => $ex->getMessage()]);
    return;
}

?>