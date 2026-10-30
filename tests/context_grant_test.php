<?php
declare(strict_types=1);
require __DIR__ . '/../api/v1/context_contract.php';
$key = 'fixture-proof-key'; $now = 1793322000;
$resource = '/kf-context-packages/9'; $format = 'context-package.v1';
$headers = ['version' => 'context-v1', 'system' => 'forest-platform', 'external_kf_id' => '7',
    'group' => '100', 'actor' => 'viewer-without-forest-account', 'time' => (string)$now,
    'reference' => '', 'reference_type' => ''];
$payload = implode("\n", ['OK_CORE_CONTEXT_V1', 'forest-platform', 'GET', $resource, $format,
    '7', '100', 'viewer-without-forest-account', (string)$now, '', '']);
$headers['proof'] = hash_hmac('sha256', $payload, $key);
$grant = forest_api_verify_context_grant($headers, $resource, $format, $key, $now);
if ($grant['external_kf_id'] !== 7) throw new RuntimeException('Valid grant rejected');
$checks = 1;
foreach (['external_kf_id' => '8', 'group' => '1', 'actor' => 'other', 'system' => 'another-system',
    'reference' => 'different-node', 'reference_type' => 'trigger', 'time' => (string)($now - 121),
    'proof' => str_repeat('0', 64), 'version' => 'unknown'] as $field => $value) {
    $tampered = $headers; $tampered[$field] = $value;
    try { forest_api_verify_context_grant($tampered, $resource, $format, $key, $now); throw new RuntimeException('Tampered grant accepted: ' . $field); }
    catch (ForestContextAccessException $expected) { $checks++; }
}
foreach ([['/kf-context-packages/10', $format], [$resource, 'forest.thinking-process-map.v1']] as [$path, $kind]) {
    try { forest_api_verify_context_grant($headers, $path, $kind, $key, $now); throw new RuntimeException('Target/format substitution accepted'); }
    catch (ForestContextAccessException $expected) { $checks++; }
}
$legacy = ['version' => '', 'external_kf_id' => '7', 'group' => '100', 'actor' => 'viewer',
    'time' => (string)$now, 'reference' => 'p1', 'reference_type' => 'process'];
$legacy['proof'] = hash_hmac('sha256', "GET\n7\n100\nviewer\n{$now}\np1\nprocess", $key);
forest_api_verify_context_grant($legacy, '/knowledge-fragments/7/thinking-process-map', 'forest.thinking-process-map.v1', $key, $now);
$checks++;
echo 'PASS: ' . $checks . ' grant checks: target, format, actor, group, reference, expiry and legacy compatibility.' . PHP_EOL;
