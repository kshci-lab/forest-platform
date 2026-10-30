<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$userId = null;
foreach (array_slice($argv, 1) as $argument) {
    if (!preg_match('/^--user-id=([1-9][0-9]*)$/D', $argument, $match)) { fwrite(STDERR, "Usage: php check-ok-core-connection.php [--user-id=1]\n"); exit(2); }
    $userId = (int)$match[1];
}
ob_start(); require_once dirname(__DIR__) . '/php/connect_db.php'; require_once dirname(__DIR__) . '/php/kf_sync_service.php'; ob_end_clean();
try {
    if (!isset($mysqli) || !($mysqli instanceof mysqli)) throw new RuntimeException('Forest DB unavailable');
    $required = [
        'experience_knowledges' => ['experience_knowledge_id', 'context_package_id', 'stage_payload_json', 'source_revision'],
        'shared_nodes' => ['knowledge_fragment_id', 'knowledge_group_id'],
        'kf_context_packages' => ['context_package_id', 'activity_type_code', 'external_activity_id'],
        'kf_context_package_items' => ['context_package_id', 'entity_type_code', 'entity_id', 'snapshot_json'],
        'kf_sync_outbox' => ['outbox_id', 'status', 'next_retry_at', 'source_revision', 'payload_json'],
    ];
    $missing = [];
    foreach ($required as $table => $columns) {
        $result = $mysqli->query('SHOW COLUMNS FROM `' . $table . '`');
        $actual = []; while ($row = $result->fetch_assoc()) $actual[] = $row['Field'];
        foreach (array_diff($columns, $actual) as $column) $missing[] = $table . '.' . $column;
    }
    if ($missing !== []) { echo json_encode(['status' => 'error', 'schema_ready' => false, 'missing_columns' => $missing]) . PHP_EOL; exit(1); }
    $config = ok_core_api_config(); $url = parse_url($config['base_url']);
    $health = ok_core_api_health(); $capabilities = ok_core_api_capabilities();
    $supported = false;
    foreach ($capabilities['body']['data']['supported_protocols'] ?? [] as $protocol) {
        if (($protocol['protocol_code'] ?? '') === 'OK_CORE_KF' && ($protocol['protocol_version'] ?? '') === '1.0') $supported = true;
    }
    $report = ['status' => $supported ? 'ok' : 'error', 'schema_ready' => true,
        'api_target' => ['scheme' => $url['scheme'] ?? '', 'host' => $url['host'] ?? '', 'port' => $url['port'] ?? null, 'path' => $url['path'] ?? ''],
        'health_http_status' => $health['http_status'], 'protocol_supported' => $supported];
    if ($userId !== null) {
        $sub = kf_sync_resolve_sso_sub($mysqli, $userId);
        $report['groups_count'] = count(ok_core_api_get_groups($sub));
    }
    echo json_encode($report, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
    exit($supported ? 0 : 1);
} catch (OkCoreApiException $error) {
    echo json_encode(['status' => 'error', 'error_code' => $error->errorCode(), 'http_status' => $error->httpStatus(),
        'request_id' => $error->requestId()], JSON_UNESCAPED_UNICODE) . PHP_EOL; exit(1);
} catch (Throwable $error) {
    echo json_encode(['status' => 'error', 'error_code' => 'FOREST_SCHEMA_OR_USER_UNAVAILABLE'], JSON_UNESCAPED_UNICODE) . PHP_EOL; exit(1);
}
