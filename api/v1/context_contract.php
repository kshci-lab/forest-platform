<?php
declare(strict_types=1);

final class ForestContextAccessException extends RuntimeException {}

/** Target-bound delegation: the OK-Core backend has checked membership and sharing. */
function forest_api_verify_context_grant(array $headers, string $resource, string $format, string $key, int $now): array
{
    $actor = (string)($headers['actor'] ?? '');
    $group = (string)($headers['group'] ?? '');
    $id = (string)($headers['external_kf_id'] ?? '');
    $reference = (string)($headers['reference'] ?? '');
    $type = (string)($headers['reference_type'] ?? '');
    $time = (string)($headers['time'] ?? '');
    $proof = (string)($headers['proof'] ?? '');
    $system = (string)($headers['system'] ?? '');
    if ($key === '' || $actor === '' || strlen($actor) > 191 || strlen($reference) > 191 || strlen($type) > 64 ||
        preg_match('/[\r\n]/', $actor . $group . $reference . $type . $id) ||
        !preg_match('/^[1-9][0-9]*$/D', $group) || !preg_match('/^[1-9][0-9]*$/D', $id) ||
        strlen($group) > 10 || strlen($id) > 10 ||
        (strlen($group) === 10 && strcmp($group, '2147483647') > 0) || (strlen($id) === 10 && strcmp($id, '2147483647') > 0) ||
        !ctype_digit($time) || abs($now - (int)$time) > 120 || !preg_match('/^[a-f0-9]{64}$/D', $proof)) {
        throw new ForestContextAccessException('VIEWER_PROOF_INVALID');
    }
    if (($headers['version'] ?? '') === 'context-v1') {
        if ($system !== 'forest-platform') throw new ForestContextAccessException('VIEWER_PROOF_INVALID');
        $payload = implode("\n", ['OK_CORE_CONTEXT_V1', $system, 'GET', $resource, $format,
            $id, $group, $actor, $time, $reference, $type]);
    } elseif ($format === 'forest.thinking-process-map.v1' &&
        $resource === '/knowledge-fragments/' . $id . '/thinking-process-map') {
        // Backward compatibility for the existing map-only client.
        $payload = "GET\n{$id}\n{$group}\n{$actor}\n{$time}";
        if ($reference !== '') $payload .= "\n{$reference}\n{$type}";
    } else {
        throw new ForestContextAccessException('VIEWER_PROOF_INVALID');
    }
    if (!hash_equals(hash_hmac('sha256', $payload, $key), $proof)) throw new ForestContextAccessException('VIEWER_PROOF_INVALID');
    return ['external_kf_id' => (int)$id, 'reference' => $reference, 'reference_type' => $type];
}
