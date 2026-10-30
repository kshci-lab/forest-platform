<?php
declare(strict_types=1);
require_once __DIR__ . '/../php/ok_core_api_client.php';
$config = ok_core_api_resolve_config(
    ['base_url' => 'https://app.example/OK-Core/api/v1/', 'token' => 'app-token'],
    ['OK_CORE_API_BASE_URL' => 'http://old-apache.example/api/v1', 'OK_CORE_API_TOKEN' => 'old-token',
     'OK_CORE_SOURCE_SYSTEM_CODE' => 'forest-platform', 'OK_CORE_API_TIMEOUT_SECONDS' => '15']
);
if ($config['base_url'] !== 'https://app.example/OK-Core/api/v1' || $config['token'] !== 'app-token' || $config['timeout_seconds'] !== 15.0) {
    throw new RuntimeException('Application configuration precedence failed.');
}
$fallback = ok_core_api_resolve_config([], ['OK_CORE_API_TOKEN' => 'environment-only']);
if ($fallback['token'] !== 'environment-only') throw new RuntimeException('Legacy environment fallback failed.');
$localOnly = ok_core_api_resolve_config(['base_url' => 'https://ok.example/api/v1', 'token' => 'file-only'], []);
if ($localOnly['token'] !== 'file-only') throw new RuntimeException('File-only configuration requires Apache environment.');
$clear = ok_core_api_resolve_config(['token' => ''], ['OK_CORE_API_TOKEN' => 'stale']);
if ($clear['token'] !== '') throw new RuntimeException('Explicit empty app value must not use stale env token.');
foreach (['ok_core_api_put_fragment', 'ok_core_api_delete_fragment'] as $name) {
    $types = (string)(new ReflectionFunction($name))->getParameters()[0]->getType();
    if (!str_contains($types, 'string') || !str_contains($types, 'int')) throw new RuntimeException('External string ID not accepted.');
}
echo "PASS: app-owned settings, environment fallback, explicit empty value, string-ID client.\n";
