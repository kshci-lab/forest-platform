<?php
// save_positions.php
// Save positions for fragment nodes. POST positions: JSON array of {externalized_contents_id,x,y}
@header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/connect_db.php';
if (session_status() !== PHP_SESSION_ACTIVE) { @session_start(); }

$response = ['status' => 'error'];
try {
        // early debug log: entry
        try{
            file_put_contents(__DIR__ . '/debug_save_positions.log', "[".date('Y-m-d H:i:s')."] ENTER positions=".substr((isset($raw)?$raw:''),0,10000)."\n", FILE_APPEND);
        }catch(_){ }
    if (!isset($mysqli) || !($mysqli instanceof mysqli)) { throw new Exception('DB接続が無効です'); }
    $raw = isset($_POST['positions']) ? $_POST['positions'] : null;
    if (!$raw) { throw new Exception('positions が指定されていません'); }
    $positions = json_decode($raw, true);
    if (!is_array($positions)) { throw new Exception('positions JSON の解析に失敗しました'); }
    // create table if not exists according to spec: knowledge_fragment_positions
    $createSql = "CREATE TABLE IF NOT EXISTS knowledge_fragment_positions (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        externalized_contents_id INT NOT NULL,
        pos_x FLOAT NOT NULL DEFAULT 0,
        pos_y FLOAT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY ux_externalized (externalized_contents_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci";
    if (!$mysqli->query($createSql)) { throw new Exception('テーブル作成失敗: ' . $mysqli->error); }

    // If the table existed previously without AUTO_INCREMENT on `id`, try to repair it.
    // Check COLUMN EXTRA for id
    try {
        $res = $mysqli->query("SHOW COLUMNS FROM knowledge_fragment_positions LIKE 'id'");
        if ($res && $res->num_rows > 0) {
            $row = $res->fetch_assoc();
            $extra = isset($row['Extra']) ? $row['Extra'] : '';
            if (stripos($extra, 'auto_increment') === false) {
                // attempt to modify column to AUTO_INCREMENT PRIMARY KEY
                $alterSql = "ALTER TABLE knowledge_fragment_positions MODIFY id INT NOT NULL AUTO_INCREMENT PRIMARY KEY";
                $mysqli->query($alterSql);
                // ignore failure here; we'll detect later
            }
            $res->free();
        }
    } catch (Exception $_) { /* continue */ }

    // We'll perform UPDATE-first, then INSERT fallback per-row to avoid relying on INSERT ... ON DUPLICATE
    $count = 0;
    $updStmt = $mysqli->prepare("UPDATE knowledge_fragment_positions SET pos_x = ?, pos_y = ? WHERE externalized_contents_id = ?");
    $insStmt = $mysqli->prepare("INSERT INTO knowledge_fragment_positions (externalized_contents_id, pos_x, pos_y) VALUES (?, ?, ?)");
    $insWithIdStmt = $mysqli->prepare("INSERT INTO knowledge_fragment_positions (id, externalized_contents_id, pos_x, pos_y) VALUES (?, ?, ?, ?)");

    foreach ($positions as $p) {
        $ext = isset($p['externalized_contents_id']) ? intval($p['externalized_contents_id'], 10) : 0;
        $x = isset($p['x']) ? floatval($p['x']) : 0.0;
        $y = isset($p['y']) ? floatval($p['y']) : 0.0;
        if ($ext <= 0) continue;

        // Try update first
        $didUpdate = false;
        if ($updStmt) {
            $updStmt->bind_param('ddi', $x, $y, $ext);
            if ($updStmt->execute()) {
                if ($updStmt->affected_rows > 0) { $count++; $didUpdate = true; }
            }
            else {
                try{ file_put_contents(__DIR__ . '/debug_save_positions.log', "[".date('Y-m-d H:i:s')."] UPDATE failed ext={$ext} errno={$mysqli->errno} err=".str_replace("\n"," ", $mysqli->error)."\n", FILE_APPEND); }catch(_){ }
            }
            // do not close here; reuse
        }
        if ($didUpdate) continue;

        // Try simple insert (may fail if id has no default)
        $didInsert = false;
        if ($insStmt) {
            $insStmt->bind_param('idd', $ext, $x, $y);
            if ($insStmt->execute()) { $count++; $didInsert = true; }
            else {
                try{ file_put_contents(__DIR__ . '/debug_save_positions.log', "[".date('Y-m-d H:i:s')."] INSERT simple failed ext={$ext} errno={$mysqli->errno} err=".str_replace("\n"," ", $mysqli->error)."\n", FILE_APPEND); }catch(_){ }
            }
        }
        if ($didInsert) continue;

        // Insert failed (likely due to id default). Try to insert with explicit id.
        $newId = null;
        if ($r = $mysqli->query("SELECT COALESCE(MAX(id),0)+1 AS nextid FROM knowledge_fragment_positions LIMIT 1")) {
            if ($row = $r->fetch_assoc()) { $newId = intval($row['nextid'], 10); }
            $r->free();
        }
        if ($newId === null || $newId <= 0) { $newId = 1; }
        if ($insWithIdStmt) {
            $insWithIdStmt->bind_param('iidd', $newId, $ext, $x, $y);
            if ($insWithIdStmt->execute()) { $count++; }
            else {
                try{ file_put_contents(__DIR__ . '/debug_save_positions.log', "[".date('Y-m-d H:i:s')."] INSERT-with-id failed id={$newId} ext={$ext} errno={$mysqli->errno} err=".str_replace("\n"," ", $mysqli->error)."\n", FILE_APPEND); }catch(_){ }
            }
        }
    }
    if ($updStmt) $updStmt->close();
    if ($insStmt) $insStmt->close();
    if ($insWithIdStmt) $insWithIdStmt->close();

    $response = ['status' => 'ok', 'items_saved' => $count];
} catch (Exception $ex) {
    $response['error'] = $ex->getMessage();
}

echo json_encode($response);

// simple debug logging to file for troubleshooting (do not expose in production)
try{
    $log = fopen(__DIR__ . '/debug_save_positions.log', 'a');
    if($log){
        fwrite($log, "[" . date('Y-m-d H:i:s') . "] REQUEST_POSITIONS=" . (isset($raw) ? $raw : '') . " RESPONSE=" . json_encode($response) . "\n");
        fclose($log);
    }
}catch(_){ }
