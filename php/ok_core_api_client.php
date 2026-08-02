<?php

declare(strict_types=1);

final class OkCoreApiException extends RuntimeException
{
    private int $httpStatus;
    private string $errorCode;
    private ?array $responseBody;
    private string $requestId;
    private bool $retryable;

    public function __construct(
        string $message,
        int $httpStatus = 0,
        string $errorCode = 'OK_CORE_API_ERROR',
        ?array $responseBody = null,
        string $requestId = '',
        bool $retryable = false,
        ?Throwable $previous = null
    ) {
        parent::__construct($message, 0, $previous);
        $this->httpStatus = $httpStatus;
        $this->errorCode = $errorCode;
        $this->responseBody = $responseBody;
        $this->requestId = $requestId;
        $this->retryable = $retryable;
    }

    public function httpStatus(): int
    {
        return $this->httpStatus;
    }

    public function errorCode(): string
    {
        return $this->errorCode;
    }

    public function responseBody(): ?array
    {
        return $this->responseBody;
    }

    public function requestId(): string
    {
        return $this->requestId;
    }

    public function retryable(): bool
    {
        return $this->retryable;
    }
}

function ok_core_api_config(): array
{
    static $config = null;
    if (is_array($config)) {
        return $config;
    }

    $config = [
        'base_url' => 'http://localhost:8888/OK-Core/api/v1',
        'token' => '',
        'system_code' => 'forest-platform',
        'timeout_seconds' => 10.0,
        'context_api_token' => '',
    ];

    $localPath = __DIR__ . '/ok_core_api_local.php';
    if (is_file($localPath)) {
        $local = require $localPath;
        if (is_array($local)) {
            $config = array_replace($config, $local);
        }
    }

    $environment = [
        'base_url' => 'OK_CORE_API_BASE_URL',
        'token' => 'OK_CORE_API_TOKEN',
        'system_code' => 'OK_CORE_SOURCE_SYSTEM_CODE',
        'timeout_seconds' => 'OK_CORE_API_TIMEOUT_SECONDS',
        'context_api_token' => 'FOREST_CONTEXT_API_TOKEN',
    ];
    foreach ($environment as $key => $name) {
        $value = getenv($name);
        if ($value !== false && $value !== '') {
            $config[$key] = $key === 'timeout_seconds' ? (float)$value : (string)$value;
        }
    }

    $config['base_url'] = rtrim((string)$config['base_url'], '/');
    $config['timeout_seconds'] = max(1.0, (float)$config['timeout_seconds']);
    return $config;
}

function ok_core_api_request(
    string $method,
    string $path,
    string $actingUserSub = '',
    ?array $body = null,
    array $additionalHeaders = [],
    bool $requiresAuthentication = true
): array {
    $autoload = dirname(__DIR__) . '/vendor/autoload.php';
    if (!class_exists(\GuzzleHttp\Client::class)) {
        if (!is_file($autoload)) {
            throw new OkCoreApiException(
                'Composer依存関係が見つかりません。scripts/setup-local.ps1を実行してください。',
                0,
                'HTTP_CLIENT_NOT_AVAILABLE'
            );
        }
        require_once $autoload;
    }

    $config = ok_core_api_config();
    $token = (string)$config['token'];
    if ($requiresAuthentication && $token === '') {
        throw new OkCoreApiException(
            'OK_CORE_API_TOKENが設定されていません。',
            0,
            'API_TOKEN_NOT_CONFIGURED'
        );
    }

    $requestId = 'forest-' . bin2hex(random_bytes(8));
    $headers = [
        'Accept' => 'application/json',
        'X-Request-Id' => $requestId,
    ];
    if ($requiresAuthentication) {
        $headers['Authorization'] = 'Bearer ' . $token;
    }
    if ($actingUserSub !== '') {
        $headers['X-Acting-User-Sub'] = $actingUserSub;
    }
    foreach ($additionalHeaders as $name => $value) {
        $headers[(string)$name] = (string)$value;
    }

    $options = [
        'headers' => $headers,
        'http_errors' => false,
        'timeout' => (float)$config['timeout_seconds'],
        'connect_timeout' => min(5.0, (float)$config['timeout_seconds']),
    ];
    if ($body !== null) {
        $options['json'] = $body;
    }

    $caPath = dirname(__DIR__) . '/certs/cacert.pem';
    if (str_starts_with((string)$config['base_url'], 'https://') && is_file($caPath)) {
        $options['verify'] = $caPath;
    }

    $client = new \GuzzleHttp\Client();
    $url = (string)$config['base_url'] . '/' . ltrim($path, '/');
    try {
        $response = $client->request(strtoupper($method), $url, $options);
    } catch (\GuzzleHttp\Exception\GuzzleException $error) {
        throw new OkCoreApiException(
            'OK-Core APIへ接続できません: ' . $error->getMessage(),
            0,
            'OK_CORE_API_UNAVAILABLE',
            null,
            $requestId,
            true,
            $error
        );
    }

    $status = $response->getStatusCode();
    $rawBody = (string)$response->getBody();
    $decoded = null;
    if ($rawBody !== '') {
        $candidate = json_decode($rawBody, true);
        if (is_array($candidate)) {
            $decoded = $candidate;
        }
    }
    $responseRequestId = $response->getHeaderLine('X-Request-Id');
    if ($responseRequestId === '' && is_array($decoded)) {
        $responseRequestId = (string)($decoded['meta']['request_id'] ?? '');
    }
    if ($responseRequestId === '') {
        $responseRequestId = $requestId;
    }

    if ($status >= 200 && $status < 300) {
        if (!is_array($decoded)) {
            throw new OkCoreApiException(
                'OK-Core APIからJSONではないレスポンスが返されました。',
                $status,
                'INVALID_API_RESPONSE',
                null,
                $responseRequestId,
                true
            );
        }
        return [
            'http_status' => $status,
            'request_id' => $responseRequestId,
            'body' => $decoded,
        ];
    }

    $errorCode = is_array($decoded)
        ? (string)($decoded['error']['code'] ?? 'OK_CORE_API_ERROR')
        : 'OK_CORE_API_ERROR';
    $message = is_array($decoded)
        ? (string)($decoded['error']['message'] ?? "OK-Core API returned HTTP {$status}.")
        : "OK-Core API returned HTTP {$status}.";
    $retryable = $status === 408 || $status === 429 || $status >= 500;
    throw new OkCoreApiException(
        $message,
        $status,
        $errorCode,
        $decoded,
        $responseRequestId,
        $retryable
    );
}

function ok_core_api_health(): array
{
    return ok_core_api_request('GET', '/health', '', null, [], false);
}

function ok_core_api_capabilities(): array
{
    return ok_core_api_request('GET', '/capabilities', '', null, [], false);
}

function ok_core_api_get_groups(string $ssoSub): array
{
    $response = ok_core_api_request('GET', '/users/me/knowledge-groups', $ssoSub);
    return is_array($response['body']['data'] ?? null) ? $response['body']['data'] : [];
}

function ok_core_api_put_fragment(
    int $experienceKnowledgeId,
    string $ssoSub,
    array $payload
): array {
    $config = ok_core_api_config();
    $path = '/source-systems/'
        . rawurlencode((string)$config['system_code'])
        . '/knowledge-fragments/'
        . rawurlencode((string)$experienceKnowledgeId);
    return ok_core_api_request('PUT', $path, $ssoSub, $payload);
}

function ok_core_api_delete_fragment(
    int $experienceKnowledgeId,
    string $ssoSub,
    int $sourceRevision,
    string $sourceDeletedAt
): array {
    $config = ok_core_api_config();
    $path = '/source-systems/'
        . rawurlencode((string)$config['system_code'])
        . '/knowledge-fragments/'
        . rawurlencode((string)$experienceKnowledgeId);
    return ok_core_api_request(
        'DELETE',
        $path,
        $ssoSub,
        null,
        [
            'X-Source-Revision' => (string)$sourceRevision,
            'X-Source-Deleted-At' => $sourceDeletedAt,
        ]
    );
}
