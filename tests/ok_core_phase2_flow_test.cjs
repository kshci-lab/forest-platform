// End-to-end protocol tests using temporary SQLite stores, never application DBs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');
const php = process.env.PHP_BINARY || 'C:/MAMP/bin/php/php8.2.14/php.exe';
const extensionDir = process.env.PHP_EXTENSION_DIR || 'C:/MAMP/bin/php/php8.2.14/ext';
const stagedForest = path.resolve(__dirname, '..');
const stagedCore = path.resolve(stagedForest, '../OK-Core');
const forestRoot = process.env.FOREST_PROJECT_ROOT || stagedForest;
const coreRoot = process.env.OK_CORE_PROJECT_ROOT || path.resolve(forestRoot, '../OK-Core');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ok-core-phase2-'));
const servers = [];
const flags = ['-n', '-d', 'display_errors=0', '-d', `extension_dir=${extensionDir}`,
    '-d', 'extension=php_pdo_sqlite.dll', '-d', 'extension=php_curl.dll'];
const quote = value => "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

function put(relative, text) {
    const target = path.join(root, relative); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, text);
}
function copyCode(project, relative, namespace) {
    const staged = path.join(project === 'forest' ? stagedForest : stagedCore, relative);
    const live = path.join(project === 'forest' ? forestRoot : coreRoot, relative);
    let source = fs.readFileSync(fs.existsSync(staged) ? staged : live, 'utf8');
    source = source.replace(/<\?php\s*(?:declare\(strict_types=1\);\s*)?/, `<?php\ndeclare(strict_types=1);\nnamespace ${namespace};
use Phase2Fixture\\SqliteMysqli as mysqli;
use \\RuntimeException; use \\InvalidArgumentException; use \\Throwable; use \\DateTimeImmutable; use \\DateTimeZone; use \\JsonException; use \\stdClass;
`);
    if (namespace === 'CoreTest') source = source.replaceAll("'ok_core_api_canonical_value'", "'CoreTest\\\\ok_core_api_canonical_value'");
    put(project + '/' + relative, source);
}
async function port() {
    const socket = net.createServer(); await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
    const value = socket.address().port; await new Promise(resolve => socket.close(resolve)); return value;
}
function run(action) {
    const result = spawnSync(php, [...flags, path.join(root, 'support/phase2_fixture.php'), action], { encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, action + ':\n' + result.stdout + result.stderr);
    process.stdout.write(result.stdout);
}
async function serve(project, number) {
    const child = spawn(php, [...flags, '-S', `127.0.0.1:${number}`, path.join(root, project + '/router.php')],
        { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
    servers.push(child); let log = '';
    child.stderr.on('data', data => { log = (log + data).slice(-6000); });
    let last;
    for (let n = 0; n < 50; n++) {
        try {
            const response = await fetch(`http://127.0.0.1:${number}/api/v1/${project === 'core' ? 'capabilities' : 'unknown'}`);
            await response.json(); return;
        } catch (error) { last = error; await new Promise(resolve => setTimeout(resolve, 50)); }
    }
    throw new Error('Fixture server failed: ' + last + '\n' + log);
}

(async () => {
    for (const file of ['sqlite_mysqli.php', 'phase2_fixture.php']) put('support/' + file, fs.readFileSync(path.join(__dirname, 'support', file)));
    for (const file of ['php/ok_core_api_client.php', 'php/kf_sync_service.php', 'api/v1/index.php',
        'api/v1/process_map_read_service.php', 'api/v1/context_contract.php', 'api/v1/context_read_service.php',
        'scripts/retry-ok-core-outbox.php']) copyCode('forest', file, 'ForestTest');
    for (const file of ['api/v1/index.php', 'api/v1/service.php', 'api/v1/contract.php',
        'php/source_context_client.php', 'php/source_context_service.php', 'php/knowledge_group_access.php']) copyCode('core', file, 'CoreTest');
    for (const project of ['forest', 'core']) {
        put(project + '/php/connect_db.php', '<?php require_once ' + quote(path.join(root, 'support/sqlite_mysqli.php'))
            + '; $mysqli=new \\Phase2Fixture\\SqliteMysqli(' + quote(path.join(root, project + '.sqlite')) + ');');
        put(project + '/router.php', '<?php if(file_exists(' + quote(path.join(root, 'bad-ack-' + project))
            + ')){header("Content-Type: application/json");echo \'{"data":{"external_kf_id":"wrong","accepted_revision":1,"knowledge_fragment_id":"999"}}\';exit;} if(file_exists(' + quote(path.join(root, 'offline-' + project))
            + ')){http_response_code(503);header("Content-Type: application/json");echo \'{"error":{"code":"MAINTENANCE","message":"test offline"}}\';exit;} require '
            + quote(path.join(root, project + '/api/v1/index.php')) + ';');
    }
    put('forest/vendor/autoload.php', '<?php require ' + quote(path.join(forestRoot, 'vendor/autoload.php')) + ';');
    const corePort = await port(), forestPort = await port();
    put('forest/php/ok_core_api_local.php', `<?php return ['base_url'=>'http://127.0.0.1:${corePort}/api/v1','token'=>'fixture-write-token','system_code'=>'forest-platform','timeout_seconds'=>2,'context_api_token'=>'fixture-read-token'];`);
    put('core/api/v1/config.local.php', `<?php return ['source_systems'=>['forest-platform'=>['token'=>'fixture-write-token','share_policy'=>'replace','context_base_url'=>'http://127.0.0.1:${forestPort}/api/v1','context_token'=>'fixture-read-token']]];`);
    run('init');
    await serve('core', corePort); await serve('forest', forestPort);
    fs.writeFileSync(path.join(root, 'offline-core'), '1');
    run('create'); // Source commits even when destination is offline.
    fs.unlinkSync(path.join(root, 'offline-core'));
    for (const action of ['retry', 'duplicate', 'rollback', 'view', 'busy', 'update']) run(action);
    fs.writeFileSync(path.join(root, 'offline-forest'), '1'); run('fallback');
    fs.unlinkSync(path.join(root, 'offline-forest'));
    run('delete');
    run('forbidden_share');
    fs.writeFileSync(path.join(root, 'bad-ack-core'), '1'); run('bad_ack'); fs.unlinkSync(path.join(root, 'bad-ack-core'));
    run('force_latest');
    const dry = spawnSync(php, [...flags, path.join(root, 'forest/scripts/retry-ok-core-outbox.php'), '--dry-run'], { encoding: 'utf8', windowsHide: true });
    assert.equal(dry.status, 0, dry.stdout + dry.stderr);
    assert.equal(JSON.parse(dry.stdout).dry_run, true);
    console.log('PASS: isolated source-save/outbox/offline/retry/idempotency/rollback/delegated-context/map/ownership/update/delete flow.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
    await Promise.all(servers.map(child => new Promise(resolve => {
        if (child.exitCode !== null) return resolve(); child.once('exit', resolve); child.kill();
    })));
    const actual = fs.realpathSync(root), parent = fs.realpathSync(os.tmpdir());
    assert(path.dirname(actual).toLowerCase() === parent.toLowerCase() && path.basename(actual).startsWith('ok-core-phase2-'));
    fs.rmSync(actual, { recursive: true, force: true });
});
