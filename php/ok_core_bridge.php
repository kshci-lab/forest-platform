<?php

declare(strict_types=1);

require_once __DIR__ . '/ok_core_api_client.php';
require_once __DIR__ . '/kf_sync_service.php';

function ok_core_get_user_groups(mysqli $forest, int $userId): array
{
    try {
        $sessionSub = isset($_SESSION['HCIMLAB_SSO_SUB'])
            ? (string)$_SESSION['HCIMLAB_SSO_SUB']
            : '';
        $ssoSub = kf_sync_resolve_sso_sub($forest, $userId, $sessionSub);
        $groups = ok_core_api_get_groups($ssoSub);
        return [
            'status' => 'ok',
            'groups' => array_map(
                static function (array $group): array {
                    return [
                        'group_id' => (int)($group['group_id'] ?? 0),
                        'name' => (string)($group['name'] ?? ''),
                        'role' => (string)($group['role'] ?? ''),
                    ];
                },
                $groups
            ),
        ];
    } catch (Throwable $error) {
        return [
            'status' => 'error',
            'message' => $error->getMessage(),
            'groups' => [],
        ];
    }
}
