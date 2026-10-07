<?php

declare(strict_types=1);

ob_start();
require_once dirname(__DIR__) . '/php/connect_db.php';
require_once dirname(__DIR__) . '/php/kf_sync_service.php';
ob_end_clean();

$limit = isset($argv[1]) ? (int)$argv[1] : 20;

try {
    $result = kf_sync_retry_due($mysqli, $limit);
    echo json_encode(
        ['status' => 'ok'] + $result,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT
    ) . PHP_EOL;
    exit(0);
} catch (Throwable $error) {
    fwrite(
        STDERR,
        json_encode(
            [
                'status' => 'error',
                'message' => $error->getMessage(),
            ],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT
        ) . PHP_EOL
    );
    exit(1);
}
