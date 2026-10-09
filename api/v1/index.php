<?php

declare(strict_types=1);

ob_start();
require_once dirname(__DIR__, 2) . '/php/connect_db.php';
require_once dirname(__DIR__, 2) . '/php/ok_core_api_client.php';
require_once dirname(__DIR__, 2) . '/php/kf_sync_service.php';
require_once __DIR__ . '/process_map_read_service.php';

function forest_api_header(string $name): string
{
    $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    if (isset($_SERVER[$serverKey])) {
        return trim((string)$_SERVER[$serverKey]);
    }
    if (strcasecmp($name, 'Authorization') === 0) {
        foreach (['REDIRECT_HTTP_AUTHORIZATION', 'AUTHORIZATION'] as $key) {
            if (isset($_SERVER[$key])) {
                return trim((string)$_SERVER[$key]);
            }
        }
    }
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $headerName => $value) {
            if (strcasecmp((string)$headerName, $name) === 0) {
                return trim((string)$value);
            }
        }
    }
    return '';
}

function forest_api_respond(array $body, int $status, string $requestId): never
{
    if (ob_get_length() !== false && ob_get_length() > 0) {
        ob_clean();
    }
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store');
    header('X-Request-Id: ' . $requestId);
    echo json_encode(
        $body,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT
    );
    exit;
}

$requestId = forest_api_header('X-Request-Id');
if ($requestId === '' || !preg_match('/^[A-Za-z0-9._:-]{1,100}$/', $requestId)) {
    $requestId = 'forest-context-' . bin2hex(random_bytes(8));
}

try {
    if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'GET') {
        header('Allow: GET');
        forest_api_respond([
            'error' => [
                'code' => 'METHOD_NOT_ALLOWED',
                'message' => 'このAPIではGETだけを使用できます。',
            ],
            'meta' => ['request_id' => $requestId],
        ], 405, $requestId);
    }

    $config = ok_core_api_config();
    $expectedToken = (string)($config['context_api_token'] ?? '');
    if ($expectedToken === '') {
        forest_api_respond([
            'error' => [
                'code' => 'CONTEXT_API_AUTH_NOT_CONFIGURED',
                'message' => '文脈取得APIのトークンが設定されていません。',
            ],
            'meta' => ['request_id' => $requestId],
        ], 503, $requestId);
    }

    $authorization = forest_api_header('Authorization');
    if (!preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)
        || !hash_equals($expectedToken, trim($matches[1]))) {
        forest_api_respond([
            'error' => [
                'code' => 'INVALID_ACCESS_TOKEN',
                'message' => '文脈取得APIのトークンが正しくありません。',
            ],
            'meta' => ['request_id' => $requestId],
        ], 401, $requestId);
    }

    $requestPath = parse_url((string)($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
    $requestPath = is_string($requestPath) ? $requestPath : '/';
    $position = strpos($requestPath, '/api/v1');
    if ($position !== false) {
        $requestPath = substr($requestPath, $position + strlen('/api/v1'));
    }
    $requestPath = preg_replace('#^/index\.php#', '', $requestPath) ?? $requestPath;
    $requestPath = '/' . ltrim($requestPath, '/');

    if (preg_match('#^/knowledge-fragments/([1-9][0-9]*)/thinking-process-map/?$#', $requestPath, $matches)) {
        // OK-Core checks the signed-in viewer's group membership and KF sharing
        // before signing this request. Forest verifies the signature and source
        // KF sharing; the viewer does not need a Forest account.
        $externalKfId = (int)$matches[1];
        $actorSub = forest_api_header('X-Acting-User-Sub');
        $groupId = forest_api_header('X-Knowledge-Group-Id');
        if ($actorSub === '' || !ctype_digit($groupId) || (int)$groupId <= 0) {
            forest_api_respond([
                'error' => ['code' => 'ACTOR_AND_GROUP_REQUIRED', 'message' => 'ユーザーと共有グループが必要です。'],
                'meta' => ['request_id' => $requestId],
            ], 403, $requestId);
        }
        $proofKey = (string)($config['token'] ?? '');
        if ($proofKey === '') {
            forest_api_respond([
                'error' => ['code' => 'VIEWER_PROOF_NOT_CONFIGURED', 'message' => '閲覧確認の設定がありません。'],
                'meta' => ['request_id' => $requestId],
            ], 503, $requestId);
        }
        $proofTimeRaw = forest_api_header('X-OK-Core-Proof-Time');
        $proof = forest_api_header('X-OK-Core-Proof');
        $proofTime = ctype_digit($proofTimeRaw) ? (int)$proofTimeRaw : 0;
        $proofPayload = "GET\n{$externalKfId}\n{$groupId}\n{$actorSub}\n{$proofTimeRaw}";
        if ($proofTime <= 0 || abs(time() - $proofTime) > 120
            || !preg_match('/^[a-f0-9]{64}$/', $proof)
            || !hash_equals(hash_hmac('sha256', $proofPayload, $proofKey), $proof)) {
            forest_api_respond([
                'error' => ['code' => 'VIEWER_PROOF_INVALID', 'message' => 'OK-Coreの閲覧確認を検証できません。'],
                'meta' => ['request_id' => $requestId],
            ], 403, $requestId);
        }
        $allowed = forest_api_process_map_rows(
            $mysqli,
            'SELECT 1 FROM shared_nodes sn
               INNER JOIN knowledge_groups kg ON kg.group_id = sn.knowledge_group_id AND kg.deleted = 0
               INNER JOIN experience_knowledges ek ON ek.experience_knowledge_id = sn.experience_knowledge_id AND ek.deleted = 0
              WHERE sn.knowledge_group_id = ? AND sn.experience_knowledge_id = ?
                AND sn.deleted = 0 LIMIT 1',
            'ii',
            [(int)$groupId, $externalKfId]
        );
        if (!$allowed) {
            forest_api_respond([
                'error' => ['code' => 'PROCESS_MAP_FORBIDDEN', 'message' => 'このマップを閲覧できません。'],
                'meta' => ['request_id' => $requestId],
            ], 403, $requestId);
        }
        $map = forest_api_read_thinking_process_map($mysqli, $externalKfId);
        if ($map === null) {
            forest_api_respond([
                'error' => ['code' => 'PROCESS_MAP_NOT_FOUND', 'message' => '共有KFに対応する思考過程表出化マップが見つかりません。'],
                'meta' => ['request_id' => $requestId],
            ], 404, $requestId);
        }
        forest_api_respond(['data' => $map, 'meta' => ['request_id' => $requestId]], 200, $requestId);
    }

    if (!preg_match('#^/kf-context-packages/([1-9][0-9]*)/?$#', $requestPath, $matches)) {
        forest_api_respond([
            'error' => [
                'code' => 'ENDPOINT_NOT_FOUND',
                'message' => '指定されたAPIは存在しません。',
            ],
            'meta' => ['request_id' => $requestId],
        ], 404, $requestId);
    }
    $contextPackageId = (int)$matches[1];

    $statement = $mysqli->prepare(
        'SELECT
            context_package_id,
            activity_type_code,
            external_activity_id,
            created_at
         FROM kf_context_packages
         WHERE context_package_id = ?
         LIMIT 1'
    );
    if (!$statement) {
        throw new RuntimeException('文脈パッケージ読込の準備に失敗しました。');
    }
    $statement->bind_param('i', $contextPackageId);
    $statement->execute();
    $result = $statement->get_result();
    $package = $result ? $result->fetch_assoc() : null;
    if ($result) {
        $result->free();
    }
    $statement->close();
    if (!$package) {
        forest_api_respond([
            'error' => [
                'code' => 'CONTEXT_PACKAGE_NOT_FOUND',
                'message' => '文脈パッケージが見つかりません。',
            ],
            'meta' => ['request_id' => $requestId],
        ], 404, $requestId);
    }

    $items = [];
    $statement = $mysqli->prepare(
        'SELECT entity_type_code, entity_id, display_order, snapshot_json
         FROM kf_context_package_items
         WHERE context_package_id = ?
         ORDER BY display_order, context_package_item_id'
    );
    if (!$statement) {
        throw new RuntimeException('文脈項目読込の準備に失敗しました。');
    }
    $statement->bind_param('i', $contextPackageId);
    $statement->execute();
    $result = $statement->get_result();
    while ($result && ($row = $result->fetch_assoc())) {
        $snapshot = json_decode((string)$row['snapshot_json'], true);
        $items[] = [
            'entity_type_code' => (string)$row['entity_type_code'],
            'entity_id' => (string)$row['entity_id'],
            'display_order' => (int)$row['display_order'],
            'snapshot' => is_array($snapshot) ? $snapshot : [],
        ];
    }
    if ($result) {
        $result->free();
    }
    $statement->close();

    forest_api_respond([
        'data' => [
            'external_context_package_id' => (string)$package['context_package_id'],
            'activity' => [
                'type_code' => (string)$package['activity_type_code'],
                'external_activity_id' => (string)$package['external_activity_id'],
            ],
            'items' => $items,
            'created_at' => kf_sync_to_iso_timestamp((string)$package['created_at']),
        ],
        'meta' => ['request_id' => $requestId],
    ], 200, $requestId);
} catch (Throwable $error) {
    forest_api_respond([
        'error' => [
            'code' => 'INTERNAL_ERROR',
            'message' => '文脈取得API内でエラーが発生しました。',
        ],
        'meta' => ['request_id' => $requestId],
    ], 500, $requestId);
}
