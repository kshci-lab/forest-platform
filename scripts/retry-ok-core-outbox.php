<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$limit = 20; $id = null; $force = false; $dryRun = false;
foreach (array_slice($argv, 1) as $arg) {
    if ($arg === '--force') $force = true;
    elseif ($arg === '--dry-run') $dryRun = true;
    elseif (preg_match('/^--outbox-id=([1-9][0-9]*)$/D', $arg, $m)) $id = (int)$m[1];
    elseif (preg_match('/^(?:--limit=)?([1-9][0-9]*)$/D', $arg, $m)) $limit = min(100, (int)$m[1]);
    else { fwrite(STDERR, "Usage: php retry-ok-core-outbox.php [--limit=20] [--dry-run] [--outbox-id=7 --force]\n"); exit(2); }
}
if ($force && $id === null) { fwrite(STDERR, "--force requires a specific --outbox-id.\n"); exit(2); }
ob_start(); require_once dirname(__DIR__) . '/php/connect_db.php'; require_once dirname(__DIR__) . '/php/kf_sync_service.php'; ob_end_clean();
try {
    if (!isset($mysqli) || !($mysqli instanceof mysqli)) throw new RuntimeException('Forest DB unavailable');
    if ($dryRun) {
        $where = $id !== null ? 'outbox_id = ?' : '(status = "PENDING" OR (status = "FAILED" AND next_retry_at IS NOT NULL AND next_retry_at <= ?))';
        $statement = $mysqli->prepare('SELECT outbox_id, experience_knowledge_id, source_revision, operation, status,
            attempt_count, next_retry_at, last_http_status, last_request_id FROM kf_sync_outbox WHERE ' . $where . ' ORDER BY outbox_id LIMIT ' . $limit);
        $value = $id ?? kf_sync_now(); $type = $id !== null ? 'i' : 's';
        $statement->bind_param($type, $value); $statement->execute();
        $rows = $statement->get_result()->fetch_all(MYSQLI_ASSOC); $statement->close();
        $result = ['dry_run' => true, 'candidates' => $rows];
    } elseif ($id !== null) {
        $result = ['processed' => 1, 'results' => [kf_sync_attempt_outbox($mysqli, $id, $force)]];
    } else $result = kf_sync_retry_due($mysqli, $limit);
    $terminal = (int)$mysqli->query('SELECT COUNT(*) FROM kf_sync_outbox WHERE status = "FAILED" AND next_retry_at IS NULL')->fetch_row()[0];
    echo json_encode(['status' => 'ok', 'terminal_failures' => $terminal] + $result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
    exit($terminal > 0 && !$dryRun ? 1 : 0);
} catch (Throwable $error) {
    fwrite(STDERR, json_encode(['status' => 'error', 'message' => $error->getMessage()], JSON_UNESCAPED_UNICODE) . PHP_EOL);
    exit(1);
}
