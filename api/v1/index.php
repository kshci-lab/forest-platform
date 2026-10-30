<?php

declare(strict_types=1);

ob_start();
require_once dirname(__DIR__, 2) . '/php/connect_db.php';
require_once dirname(__DIR__, 2) . '/php/ok_core_api_client.php';
require_once dirname(__DIR__, 2) . '/php/kf_sync_service.php';
require_once __DIR__ . '/context_contract.php';
require_once __DIR__ . '/context_read_service.php';

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
    $body['meta']['request_id'] = $requestId;
    echo json_encode(
        $body,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT
    );
    exit;
}

$requestId = forest_api_header('X-Request-Id');
if ($requestId === '' || !preg_match('/^[A-Za-z0-9._:-]{1,80}$/D', $requestId)) {
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

    $legacyMap = preg_match('#^/knowledge-fragments/([1-9][0-9]*)/thinking-process-map/?$#', $requestPath, $matches);
    $packageId = null;
    if ($legacyMap) {
        $id = $matches[1];
        $format = 'forest.thinking-process-map.v1';
    } elseif (preg_match('#^/knowledge-fragments/([1-9][0-9]*)/context/?$#', $requestPath, $matches)) {
        $id = $matches[1];
        $format = (string)($_GET['format'] ?? 'context-package.v1');
    } elseif (preg_match('#^/kf-context-packages/([1-9][0-9]*)/?$#', $requestPath, $matches)) {
        $packageId = (int)$matches[1];
        $id = forest_api_header('X-External-KF-Id');
        $format = (string)($_GET['format'] ?? 'context-package.v1');
    } else {
        forest_api_respond(['error' => ['code' => 'ENDPOINT_NOT_FOUND', 'message' => '指定されたAPIは存在しません。']], 404, $requestId);
    }
    if (!in_array($format, ['context-package.v1', 'forest.thinking-process-map.v1'], true)) {
        forest_api_respond(['error' => ['code' => 'UNSUPPORTED_CONTEXT_FORMAT', 'message' => '対応していない文脈形式です。']], 422, $requestId);
    }
    $grant = forest_api_verify_context_grant([
        'actor' => forest_api_header('X-Acting-User-Sub'), 'group' => forest_api_header('X-Knowledge-Group-Id'),
        'external_kf_id' => $id, 'system' => forest_api_header('X-Source-System-Code'),
        'time' => forest_api_header('X-OK-Core-Proof-Time'), 'proof' => forest_api_header('X-OK-Core-Proof'),
        'version' => forest_api_header('X-OK-Core-Proof-Version'),
        'reference' => forest_api_header('X-KF-Source-Reference'), 'reference_type' => forest_api_header('X-KF-Source-Type'),
    ], rtrim($requestPath, '/'), $format, (string)($config['token'] ?? ''), time());
    // OK-Core has checked its own current membership and KF sharing before signing.
    // Forest never compares the two systems' local group IDs or requires a viewer account.
    $context = forest_api_read_context($mysqli, $grant['external_kf_id'], $format, $packageId,
        $grant['reference'], $grant['reference_type']);
    if ($context === null) {
        forest_api_respond(['error' => ['code' => $legacyMap ? 'PROCESS_MAP_NOT_FOUND' : 'CONTEXT_NOT_FOUND',
            'message' => '元KF・文脈パッケージまたは対応する記録が見つかりません。']], 404, $requestId);
    }
    forest_api_respond(['data' => $legacyMap ? $context['map'] : $context,
        'meta' => ['request_id' => $requestId]], 200, $requestId);
} catch (ForestContextAccessException $error) {
    forest_api_respond(['error' => ['code' => 'VIEWER_PROOF_INVALID', 'message' => 'OK-Coreの閲覧確認を検証できません。'],
        'meta' => ['request_id' => $requestId]], 403, $requestId);
} catch (Throwable $error) {
    forest_api_respond([
        'error' => [
            'code' => 'INTERNAL_ERROR',
            'message' => '文脈取得API内でエラーが発生しました。',
        ],
        'meta' => ['request_id' => $requestId],
    ], 500, $requestId);
}
