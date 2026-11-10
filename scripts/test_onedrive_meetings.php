<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/../kagitani-system/php/sharepoint_meetings.php';
function assertLocal($ok, $message) { if (!$ok) throw new RuntimeException($message); }
$base = sys_get_temp_dir() . '/forest-onedrive-' . bin2hex(random_bytes(8));
mkdir($base, 0700); mkdir($base . '/research', 0700); mkdir($base . '/general', 0700); mkdir($base . '/cache', 0700);
mkdir($base . '/research/2026-04-20'); mkdir($base . '/research/2026-05-01'); mkdir($base . '/general/2026-06-22_全体MT');
foreach (['A.pdf','A.pptx','A.docx','B.pdf','A_修正版.pdf','~$A.docx'] as $name) touch($base . '/research/2026-04-20/' . $name);
foreach (['A.pdf','A.pptx'] as $name) touch($base . '/general/2026-06-22_全体MT/' . $name);
mkdir($base . '/research/2026-04-20/nested'); touch($base . '/research/2026-04-20/nested/ignore.pdf');
symlink($base . '/research/2026-04-20/B.pdf', $base . '/research/2026-04-20/alias.pdf');
$config = ['source_mode' => 'onedrive', 'cache_dir' => $base . '/cache', 'roots' => [
    'research' => ['path' => $base . '/research'], 'general' => ['path' => $base . '/general']],
    'participants' => ['stems' => ['A' => '1']]];
$users = [['user_id' => 1, 'name' => 'Test A']];
$filter = ['user_ids' => [], 'date_basis' => 'created_at'];
function matureCandidate($base) {
    $path = $base . '/cache/local_candidate.json';
    $data = json_decode(file_get_contents($path), true); $data['observed_at'] -= 31;
    file_put_contents($path, json_encode($data));
}
try {
    $service = new SharePointMeetings($config, function () { throw new RuntimeException('Local mode must not call Graph'); });
    $first = $service->sync();
    assertLocal($first['result'] === 'pending' && !$first['available'], 'first scan is pending, not zero counts');
    assertLocal($service->sync()['result'] === 'pending', 'cannot skip 30-second stability guard');
    matureCandidate($base); $service->sync();
    $summary = $service->summary($filter, $users);
    assertLocal($summary['research_mt_total'] === 3 && $summary['research_mt_files'] === 5, 'dedup and excluded/symlink rules');
    assertLocal($summary['research_mt_days'] === 2 && $summary['shared_lessons_total'] === 2, 'empty dates and general files');
    assertLocal($summary['sync']['source_mode'] === 'onedrive', 'report actual source');
    $selected = array_merge($filter, ['user_ids' => [1]]);
    $selectedSummary = $service->summary($selected, $users);
    assertLocal($selectedSummary['excluded_unmatched']['research_mt'] === 2, 'report excluded unknown groups separately');
    $included = $service->summary(array_merge($selected, ['include_unmatched' => true]), $users);
    assertLocal($included['research_mt_total'] === 3 && $included['excluded_unmatched']['research_mt'] === 0, 'explicit unknown inclusion restores counts');
    $outside = $service->summary(array_merge($selected, ['start_date' => '2027-01-01']), $users);
    assertLocal($outside['excluded_unmatched']['research_mt'] === 0, 'excluded counts respect date filter');
    $records = $service->records('research_mt_total', $filter, $users);
    assertLocal($records[0]['files'][0]['web_url'] === '' && isset($records[0]['files'][0]['local_path']), 'local path without guessed URL');
    $before = file_get_contents($base . '/cache/snapshot.json');
    unlink($base . '/research/2026-04-20/B.pdf');
    touch($base . '/research/2026-05-01/B.pdf');
    assertLocal($service->sync()['result'] === 'pending', 'file move waits for stable scan');
    assertLocal(file_get_contents($base . '/cache/snapshot.json') === $before, 'pending keeps last complete snapshot');
    matureCandidate($base); $service->sync();
    assertLocal($service->summary($filter, $users)['research_mt_total'] === 3, 'moved file not double counted');
    $repeat = $service->sync(); assertLocal($repeat['result'] === 'success', 'idempotent stable scan');
    rename($base . '/general', $base . '/general-offline');
    try { $service->sync(); throw new RuntimeException('Expected missing root error'); }
    catch (RuntimeException $e) { assertLocal($e->getMessage() !== 'Expected missing root error', 'must reject missing root'); }
    assertLocal($service->status()['available'] && $service->status()['result'] === 'failed', 'missing root retains data with failure');
    rename($base . '/general-offline', $base . '/general');
    $withUrl = $config; $withUrl['roots']['general']['web_url'] = 'https://example.sharepoint.com/sites/lab/Shared%20Documents/0011-MT';
    $scan = (new OneDriveMeetingsInventory($withUrl))->scan();
    $generalFile = array_values(array_filter($scan['files'], function ($f) { return strpos($f['local_path'], '/general/') !== false; }))[0];
    assertLocal(strpos($generalFile['web_url'], 'https://example.sharepoint.com/') === 0, 'explicit direct web path only');
    $withUrl['roots']['general']['web_url'] = 'https://example.sharepoint.com/:f:/s/shared?e=secret';
    try { (new OneDriveMeetingsInventory($withUrl))->scan(); throw new RuntimeException('Expected shared URL rejection'); }
    catch (RuntimeException $e) { assertLocal($e->getMessage() !== 'Expected shared URL rejection', 'do not guess URLs from share tokens'); }
    echo "PASS: OneDrive metadata only; no Graph/body requests; same counting rules; stable two-scan publication; move/deletion/idempotency; unavailable roots preserve cache; no symlink traversal; local evidence paths and explicit web URLs.\n";
} finally {
    $remove = function ($dir) use (&$remove) {
        foreach (scandir($dir) as $name) {
            if ($name === '.' || $name === '..') continue;
            $path = $dir . '/' . $name;
            if (!is_link($path) && is_dir($path)) $remove($path); else unlink($path);
        }
        rmdir($dir);
    };
    $remove($base);
}
