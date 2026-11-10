<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../php/deployment_urls.php';
$checks = 0;
function url_check(bool $condition, string $message): void {
    global $checks;
    if (!$condition) throw new RuntimeException($message);
    $checks++;
}
$production = ['HTTP_HOST'=>'archive.kshci-lab.net', 'SCRIPT_NAME'=>'/software/forest-platform/php/ok_core_groups.php'];
$local = ['HTTP_HOST'=>'localhost:8888', 'SCRIPT_NAME'=>'/forest-platform/php/ok_core_groups.php'];
foreach (['forest-platform','OK-Core'] as $app) foreach (['','/api/v1','/auth/callback','/login.php'] as $suffix) {
    $dev = 'http://localhost:8888/' . $app . $suffix;
    $prod = 'https://archive.kshci-lab.net/software/' . $app . $suffix;
    url_check(kf_deployment_url($dev,$app,$suffix,$production,[]) === $prod, 'Copied local URL must switch to canonical production');
    url_check(kf_deployment_url($prod,$app,$suffix,$local,[]) === $dev, 'Copied production URL must switch to local');
    url_check(kf_deployment_url($dev,$app,$suffix,[],['APP_ENV'=>'production']) === $prod, 'Production CLI profile');
    url_check(kf_deployment_url($dev,$app,$suffix,$production,[],false) === $dev, 'Explicit opt-out must pin a URL');
}
url_check(kf_deployment_url('http://localhost:8888/OK-Core/api/v1','OK-Core','/api/v1',['HTTP_HOST'=>'localhost:9999','SCRIPT_NAME'=>'/software/forest-platform/php/test.php'],[]) === 'http://localhost:9999/software/OK-Core/api/v1','Local port and path prefix');
url_check(kf_deployment_url('auto','OK-Core','/api/v1',['HTTP_HOST'=>'[::1]:8888','SCRIPT_NAME'=>'/forest-platform/index.php'],[]) === 'http://[::1]:8888/OK-Core/api/v1','IPv6 loopback');
url_check(kf_deployment_url('http://localhost:8888/OK-Core/api/v1','OK-Core','/api/v1',['HTTP_HOST'=>'attacker.example'],[]) === 'http://localhost:8888/OK-Core/api/v1','Unrecognized Host must not select an outgoing origin');
url_check(kf_deployment_url('http://127.0.0.1:12345/api/v1','OK-Core','/api/v1',$production,[]) === 'http://127.0.0.1:12345/api/v1','Custom test/independent endpoint must remain unchanged');
url_check(kf_deployment_url('https://separate.example/custom/api','forest-platform','/api/v1',$local,[]) === 'https://separate.example/custom/api','Independent server stays explicit');

// Real config modules, copied private settings, and synthetic requests in isolated PHP processes.
$fixture = sys_get_temp_dir() . '/deployment-urls-' . bin2hex(random_bytes(8));
mkdir($fixture);
$projects = ['forest-platform'=>dirname(__DIR__), 'OK-Core'=>dirname(dirname(__DIR__)) . '/OK-Core'];
$projects['OK-Core'] = is_file($projects['OK-Core'].'/php/source_context_client.php') ? $projects['OK-Core'] : (getenv('OK_CORE_PROJECT_ROOT') ?: 'C:/MAMP/htdocs/OK-Core');
$files = ['forest-platform'=>['php/deployment_urls.php','php/sso_config.php','php/ok_core_api_client.php'],
    'OK-Core'=>['php/deployment_urls.php','php/sso_config.php','php/source_context_client.php','php/forest_process_map_client.php','api/v1/service.php','api/v1/contract.php']];
try {
    foreach ($files as $project=>$names) foreach ($names as $name) {
        $target = $fixture . '/' . $project . '/' . $name;
        if (!is_dir(dirname($target))) mkdir(dirname($target),0777,true);
        $source = $projects[$project] . '/' . $name;
        if (!is_file($source)) $source = (getenv($project==='OK-Core'?'OK_CORE_PROJECT_ROOT':'FOREST_PROJECT_ROOT') ?: 'C:/MAMP/htdocs/'.$project) . '/' . $name;
        copy($source,$target);
    }
    file_put_contents($fixture.'/forest-platform/php/ok_core_api_local.php', "<?php return ['base_url'=>'http://localhost:8888/OK-Core/api/v1','token'=>'fixture-write','context_api_token'=>'fixture-read'];");
    file_put_contents($fixture.'/OK-Core/api/v1/config.local.php', "<?php return ['source_systems'=>['forest-platform'=>['token'=>'fixture-write','context_base_url'=>'http://localhost:8888/forest-platform/api/v1','context_token'=>'fixture-read']]];");
    foreach (array_keys($projects) as $app) file_put_contents($fixture.'/'.$app.'/php/sso_local.php', '<?php return '.var_export([
        'base_url'=>'http://localhost:8888/'.$app, 'redirect_uri'=>'http://localhost:8888/'.$app.'/auth/callback',
        'client_id'=>'fixture-id','client_secret'=>'fixture-secret'],true).';');
    $runner = <<<'PHP'
<?php
putenv('APP_ENV');
foreach (['HCIMLAB_SSO_BASE_URL','HCIMLAB_SSO_REDIRECT_URI','HCIMLAB_SSO_CLIENT_ID','HCIMLAB_SSO_CLIENT_SECRET'] as $key) putenv($key);
$app=$argv[1]; $mode=$argv[2];
$_SERVER=['HTTP_HOST'=>$mode==='production'?'archive.kshci-lab.net':'localhost:8888', 'SCRIPT_NAME'=>($mode==='production'?'/software':'').'/'.$app.'/auth/login.php'];
$root=__DIR__.'/'.$app;
$sso=require $root.'/php/sso_config.php';
if ($sso['client_id']!=='fixture-id' || $sso['client_secret']!=='fixture-secret') exit(7);
if ($app==='forest-platform') { require $root.'/php/ok_core_api_client.php'; $cfg=ok_core_api_config(); if($cfg['token']!=='fixture-write') exit(8); $api=$cfg['base_url']; }
else { require $root.'/php/source_context_client.php'; $cfg=source_context_settings('forest-platform'); if($cfg['read_token']!=='fixture-read'||$cfg['proof_key']!=='fixture-write') exit(9); $api=$cfg['base_url']; }
echo json_encode(['base'=>$sso['base_url'],'callback'=>$sso['redirect_uri'],'api'=>$api]);
PHP;
    file_put_contents($fixture.'/run.php',$runner);
    file_put_contents($fixture.'/OK-Core/php/forest_process_map_local.php', "<?php return ['base_url'=>'https://archive.kshci-lab.net/software/forest-platform/api/v1','token'=>'fixture-read'];");
    foreach (['registry','legacy'] as $contextMode) {
    if ($contextMode==='legacy') file_put_contents($fixture.'/OK-Core/api/v1/config.local.php', "<?php return ['source_systems'=>['forest-platform'=>['token'=>'fixture-write']]];");
    foreach (array_keys($projects) as $app) foreach (['production','local'] as $mode) {
        $process=proc_open([PHP_BINARY,'-n',$fixture.'/run.php',$app,$mode],[1=>['pipe','w'],2=>['pipe','w']],$pipes,null,null,['bypass_shell'=>true]);
        $stdout=stream_get_contents($pipes[1]); $stderr=stream_get_contents($pipes[2]); fclose($pipes[1]); fclose($pipes[2]);
        url_check(proc_close($process)===0,'Config integration failed: '.$stderr.$stdout);
        $result=json_decode($stdout,true,512,JSON_THROW_ON_ERROR);
        $origin=$mode==='production'?'https://archive.kshci-lab.net/software':'http://localhost:8888';
        $peer=$app==='forest-platform'?'OK-Core':'forest-platform';
        url_check($result===['base'=>$origin.'/'.$app,'callback'=>$origin.'/'.$app.'/auth/callback','api'=>$origin.'/'.$peer.'/api/v1'],'SSO/API must use one deployment profile');
    }
    }
} finally {
    $actual=realpath($fixture); $temp=realpath(sys_get_temp_dir());
    if ($actual!==false && dirname($actual)===$temp && str_starts_with(basename($actual),'deployment-urls-')) {
        $walk=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($actual,FilesystemIterator::SKIP_DOTS),RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($walk as $item) { if($item->isDir()) rmdir($item->getPathname()); else unlink($item->getPathname()); }
        rmdir($actual);
    }
}
echo "PASS $checks URL checks: local/production, CLI, SSO/API integration, copied settings, credentials retained and custom destinations preserved.\n";
