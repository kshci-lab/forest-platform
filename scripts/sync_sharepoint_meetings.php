<?php
/** Scheduled or manual CLI sync; never include database credentials. */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../kagitani-system/php/sharepoint_meetings.php';
date_default_timezone_set('Asia/Tokyo');
$options = getopt('', ['config:', 'due', 'help']);
if (isset($options['help'])) {
    echo "Usage: php scripts/sync_sharepoint_meetings.php [--config=/private/config.json] [--due]\n";
    exit(0);
}
if (isset($options['config'])) putenv('FOREST_SP_CONFIG=' . $options['config']);
$service = SharePointMeetings::fromEnvironment();
try {
    $status = $service->status();
    if (!$status['configured']) throw new RuntimeException($status['message']);
    if (($status['source_mode'] ?? '') !== 'onedrive' && isset($options['due']) && ($status['result'] ?? '') === 'success' && !empty($status['last_success_at']) &&
        time() - strtotime($status['last_success_at']) < 3600) {
        echo "Not due: last successful sync is less than one hour old.\n";
        exit(0);
    }
    $status = $service->sync();
    if (($status['source_mode'] ?? '') === 'onedrive' && $status['result'] === 'success') {
        try { $service->startAudioAnalysis(); } catch (Throwable $ignored) {}
        try { if(!empty($status['inventory_changed']) || in_array($service->analysisStatus()['state'],['never','failed','interrupted'],true)) $service->startAnalysis(); } catch (Throwable $ignored) { /* Manual analysis shows setup failures in the dashboard. */ }
    }
    echo json_encode(['result' => $status['result'], 'last_success_at' => $status['last_success_at'],
        'inventory' => $status['inventory']], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
} catch (Throwable $e) {
    // Errors contain neither access tokens nor raw Graph/authentication responses.
    fwrite(STDERR, 'Sync failed: ' . $e->getMessage() . "\n");
    exit(1);
}
