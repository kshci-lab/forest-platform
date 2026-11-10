<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../kagitani-system/php/sharepoint_meetings.php';
function verify($condition, $message) { if (!$condition) throw new RuntimeException('FAIL: ' . $message); }
function folderItem($id, $name) { return ['id' => $id, 'name' => $name, 'folder' => [], 'webUrl' => 'https://example.sharepoint.com/folder/' . $id]; }
function fileItem($id, $name) { return ['id' => $id, 'name' => $name, 'file' => ['mimeType' => 'application/pdf'], 'webUrl' => 'https://example.sharepoint.com/file/' . $id]; }
function pageResponse($items, $next = null) {
    $page = ['value' => $items];
    if ($next !== null) $page['@odata.nextLink'] = $next;
    return ['status' => 200, 'body' => json_encode($page, JSON_UNESCAPED_UNICODE)];
}
$dir = sys_get_temp_dir() . '/forest-mt-test-' . bin2hex(random_bytes(8));
mkdir($dir, 0700);
$config = ['tenant_id' => 'test-tenant', 'client_id' => 'test-client', 'cache_dir' => $dir,
    'roots' => ['research' => ['drive_id' => 'd', 'folder_id' => 'research'], 'general' => ['drive_id' => 'd', 'folder_id' => 'general']],
    'participants' => ['stems' => ['A' => '1', 'B' => '2'], 'file_ids' => []]];
$previousSecret = getenv('FOREST_SP_CLIENT_SECRET');
putenv('FOREST_SP_CLIENT_SECRET=fake-test-secret');
$mode = 'normal';
$requests = [];
$throttled = false;
$mock = function ($method, $url, $headers, $body) use (&$mode, &$requests, &$throttled) {
    $requests[] = [$method, $url];
    verify(strpos($url, '/content') === false, 'no document body requests');
    if ($method === 'POST') {
        verify(strpos($url, 'https://login.microsoftonline.com/') === 0, 'POST only for authentication');
        return ['status' => 200, 'body' => '{"access_token":"fake-test-token"}'];
    }
    verify($method === 'GET' && parse_url($url, PHP_URL_HOST) === 'graph.microsoft.com', 'Graph GET only');
    $path = parse_url($url, PHP_URL_PATH);
    $id = urldecode(explode('/items/', $path)[1]);
    if (substr($id, -9) !== '/children') {
        $rootName = $id === 'research' ? '0010-研究MT' : '0011-全体MT';
        if ($mode === 'wrong-root') $rootName = 'wrong root';
        return ['status' => 200, 'body' => json_encode(folderItem($id, $rootName), JSON_UNESCAPED_UNICODE)];
    }
    $id = substr($id, 0, -9);
    if ($id === 'research') {
        if ($mode === 'malformed') return ['status' => 200, 'body' => '{"value":null}'];
        if (strpos($url, 'page=2') !== false) return pageResponse([folderItem('r2', '2026-04-21'), folderItem('r3', '2026-05-01')]);
        $next = 'https://graph.microsoft.com/v1.0/drives/d/items/research/children?page=2';
        if ($mode === 'evil-page') $next = 'https://untrusted.example/?token=steal';
        if ($mode === 'loop-page') $next = $url;
        return pageResponse([folderItem('r1', '2026-04-20'), folderItem('bad', '2026-02-30'),
            folderItem('non-date', 'other'), fileItem('root-file', 'outside.pdf')], $next);
    }
    if ($id === 'general') {
        if ($mode === 'fail-second-root') return ['status' => 403, 'body' => '{"error":"do not expose raw errors or tokens"}'];
        if ($mode === 'throttle' && !$throttled) { $throttled = true; return ['status' => 429, 'body' => '{}', 'retry_after' => 1]; }
        return pageResponse([folderItem('g1', '2026-06-22_全体MT'), folderItem('g2', '2026-07-01')]);
    }
    if ($id === 'r1') {
        $files = [fileItem('a-pdf', 'A.pdf'), fileItem('a-ppt', 'A.pptx'), fileItem('a-doc', 'A.docx'),
            fileItem('b-pdf', 'B.pdf'), fileItem('revised', 'A_修正版.pdf'), fileItem('lock', '~$A.pptx'),
            fileItem('temp', 'work.tmp'), fileItem('os', '.DS_Store'), folderItem('nested', 'nested'),
            array_merge(fileItem('shortcut', 'shortcut.pdf'), ['remoteItem' => ['id' => 'other']])];
        if ($mode === 'changed') $files = [fileItem('new', 'New.pdf')];
        return pageResponse($files);
    }
    if ($id === 'r2') {
        return pageResponse($mode === 'changed' ? [fileItem('a-pdf', 'A.pdf'), fileItem('a-ppt', 'A.pptx')] : [fileItem('day2', 'A.pdf')]);
    }
    if ($id === 'r3') return pageResponse([]);
    if ($id === 'g1') return pageResponse([fileItem('ga', 'A.pdf'), fileItem('gb', 'A.pptx'), fileItem('gc', 'B.docx'), fileItem('temp2', 'work.temp')]);
    if ($id === 'g2') return pageResponse([fileItem('gu', 'Unknown.pdf')]);
    throw new RuntimeException('Unexpected metadata path');
};
$users = [['user_id' => 1, 'name' => 'Test A'], ['user_id' => 2, 'name' => 'Test B']];
$filter = ['start_date' => null, 'end_date' => null, 'date_basis' => 'created_at', 'user_ids' => []];
try {
    verify(SharePointMeetings::meetingDate('2026-06-22_全体MT') === '2026-06-22', 'date prefix');
    verify(SharePointMeetings::meetingDate('2024-02-29') === '2024-02-29', 'leap day');
    verify(SharePointMeetings::meetingDate('2026-02-29') === null, 'invalid date');
    foreach (['~$file.docx','a.tmp','a.TEMP','Thumbs.db','desktop.ini','file~'] as $name) verify(SharePointMeetings::excluded($name), 'explicit exclusion ' . $name);
    verify(!SharePointMeetings::excluded('A_最終版.pptx'), 'do not infer versions');
    verify(SharePointMeetings::stem('A.v2.pdf') === 'A.v2', 'last extension only');
    $service = new SharePointMeetings($config, $mock);
    verify(!$service->status()['available'], 'unsynced is unavailable');
    verify($service->summary($filter, $users)['research_mt_total'] === null, 'unsynced is not zero');
    $service->sync();
    $s = $service->summary($filter, $users);
    verify($s['research_mt_total'] === 4 && $s['research_mt_files'] === 6, 'research dedup separate from files');
    verify($s['research_mt_days'] === 3 && $s['general_mt_sessions'] === 2, 'empty folders and sessions');
    verify($s['shared_lessons_total'] === 4, 'general no filename dedup');
    verify($s['research_mt_unmatched'] === 1 && $s['shared_lessons_unmatched'] === 1, 'unknown mapping');
    verify($s['sync']['inventory']['excluded_files'] === 4, 'excluded counts');
    verify($s['sync']['result'] === 'success', 'successful status');
    $people=array_merge($users,[['user_id'=>3,'name'=>'Zero participant']]);
    $counts=$service->participantCounts($filter,$people);
    verify($counts['per_user'][1]['mt_research_presentations']===2 && $counts['per_user'][1]['mt_research_sessions']===2,'person research files and distinct sessions');
    verify($counts['per_user'][2]['mt_research_presentations']===1 && $counts['per_user'][2]['mt_research_sessions']===1,'second participant session count');
    verify($counts['per_user'][1]['mt_shared_files']===2 && $counts['per_user'][1]['mt_general_sessions']===1,'two formats shared count as two files but one session');
    verify($counts['per_user'][3]['mt_general_sessions']===0 && $counts['totals']['mt_shared_files']===3,'zeros retained, unknown owners excluded');
    $june=array_merge($filter,['start_date'=>'2026-06-01','end_date'=>'2026-06-30']);
    verify($service->participantCounts($june,$people)['totals']['mt_general_sessions']===2 && count($service->records('general_mt_sessions',$june,$people))===1,'person-session total distinct from global hosting count');
    $unavailable=(new SharePointMeetings())->participantCounts($filter,$people);
    verify($unavailable['per_user'][1]['mt_research_sessions']===null,'unsynced remains unavailable rather than zero');

    $service->sync();
    $repeat = $service->summary($filter, $users);
    foreach (SharePointMeetings::METRICS as $metric) verify($repeat[$metric] === $s[$metric], 'idempotent ' . $metric);
    $selected = array_merge($filter, ['user_ids' => [1]]);
    verify(count($service->records('research_mt_total', $selected, $users)) === 2, 'confirmed participants');
    verify(count($service->records('research_mt_days', $selected, $users)) === 2, 'participant session filter counts once');
    verify(count($service->records('general_mt_sessions', $selected, $users)) === 1, 'general sessions selected');
    $selected['include_unmatched'] = true;
    verify(count($service->records('research_mt_total', $selected, $users)) === 3, 'explicit unknown inclusion');
    $period = array_merge($filter, ['start_date' => '2026-04-21 00:00:00', 'end_date' => '2026-04-21 23:59:59', 'date_basis' => 'updated_at']);
    verify(count($service->records('research_mt_total', $period, $users)) === 1, 'period uses folder date');
    $conflicting = $config;
    $conflicting['participants']['file_ids']['d:a-ppt'] = '2';
    $conflictService = new SharePointMeetings($conflicting, $mock);
    $conflicts = array_filter($conflictService->records('research_mt_total', $filter, $users), function ($r) { return $r['participant_conflict']; });
    verify(count($conflicts) === 1 && array_values($conflicts)[0]['user_id'] === null, 'contradictory participants unresolved');
    $goodSnapshot = file_get_contents($dir . '/snapshot.json');
    foreach (['fail-second-root','evil-page','loop-page','malformed','wrong-root'] as $failure) {
        $mode = $failure;
        try { $service->sync(); throw new RuntimeException('Expected sync failure'); }
        catch (RuntimeException $e) { verify($e->getMessage() !== 'Expected sync failure', 'must fail ' . $failure); }
        verify(file_get_contents($dir . '/snapshot.json') === $goodSnapshot, 'failed sync keeps exact prior snapshot');
        verify($service->status()['result'] === 'failed' && $service->status()['available'], 'failure status with prior data');
        verify($service->summary($filter, $users)['research_mt_total'] === 4, 'prior counts retained');
    }
    $mode = 'throttle';
    $service->sync();
    verify($throttled && $service->status()['result'] === 'success', 'rate-limit retry');
    $lock = fopen($dir . '/sync.lock', 'c');
    flock($lock, LOCK_EX);
    try { $service->sync(); throw new RuntimeException('Expected busy lock'); }
    catch (RuntimeException $e) { verify($e->getMessage() !== 'Expected busy lock', 'concurrent sync rejected'); }
    flock($lock, LOCK_UN); fclose($lock);
    $mode = 'changed';
    $service->sync();
    $changed = $service->summary($filter, $users);
    verify($changed['research_mt_total'] === 2 && $changed['research_mt_files'] === 3, 'add delete move reflected without accumulation');
    $records = $service->records('research_mt_total', $filter, $users);
    verify($records[1]['folder']['id'] === 'r2' && $records[1]['file_count'] === 2, 'moved stable IDs grouped at new folder');
    $changedRoot = $config; $changedRoot['roots']['research']['folder_id'] = 'different';
    verify(!(new SharePointMeetings($changedRoot, $mock))->status()['available'], 'do not reuse cache for different roots');
    verify((fileperms($dir . '/snapshot.json') & 0777) === 0600, 'private snapshot permissions');
    // Reuse the existing regression fixture to test real integration without a MySQL connection.
    require __DIR__ . '/test_lesson_summary.php';
    $integrated = new AdminWorkbenchLib($p, $service);
    foreach (SharePointMeetings::METRICS as $metric) {
        foreach (['year','month','day','week','user','origin','all'] as $axis) {
            $agg = $integrated->getAggregationData($filter, $metric, $axis, 'user');
            $expected = count($service->records($metric, $filter, $users));
            verify($agg['grand_total'] === $expected && count($agg['source_records']) === $expected, 'aggregation and source totals ' . $metric);
            foreach ($agg['matrix'] as $row) foreach ($row['cells'] as $ck => $value) {
                $evidence = array_filter($agg['source_records'], function ($r) use ($row, $ck) { return $r['row_key'] === $row['row_key'] && $r['col_key'] === $ck; });
                verify(count($evidence) === $value, 'exact evidence per pivot cell');
            }
        }
    }
    $summary = $integrated->getSummary($filter);
    verify($summary['meetings']['research_mt_total'] === 2 && $summary['lessons_total'] === 5, 'MT plus unchanged lesson totals');
    verify($summary['per_user'][0]['mt_research_sessions']===1 && $summary['per_user'][1]['mt_research_sessions']===0,'participant columns integrated');
    verify($summary['statistics']['mt_research_sessions']['mean']==0.5 && $summary['statistics']['mt_research_sessions']['variance']==0.25,'MT mean and population variance include zeros');
    foreach(SharePointMeetings::PARTICIPANT_METRICS as $key) verify(array_sum(array_column($summary['per_user'],$key))===$summary[$key],'MT participant totals consistent');

    $plain = new SharePointMeetings();
    verify(!$plain->status()['configured'] && $plain->summary($filter, $users)['shared_lessons_total'] === null, 'unconfigured defaults');
    echo "PASS: SharePoint metadata pagination, explicit rules, dedup, unknown/conflicting participants, date/user filters, idempotent sync, add/delete/move, failure retention, malicious pagination rejection, locking, retry, private cache, dashboard aggregation and exact evidence.\n";
} finally {
    if ($previousSecret === false) putenv('FOREST_SP_CLIENT_SECRET'); else putenv('FOREST_SP_CLIENT_SECRET=' . $previousSecret);
    foreach (glob($dir . '/*') as $file) unlink($file);
    rmdir($dir);
}
