<?php
declare(strict_types=1);
require __DIR__ . '/sqlite_mysqli.php';
$root = dirname(__DIR__);
if (($argv[1] ?? '') !== 'init') {
    require $root . '/forest/php/kf_sync_service.php';
    require $root . '/core/php/source_context_service.php';
}
function demand(bool $value, string $label): void { if (!$value) throw new RuntimeException($label); }
$f = new \Phase2Fixture\SqliteMysqli($root . '/forest.sqlite');
$c = new \Phase2Fixture\SqliteMysqli($root . '/core.sqlite');
$action = $argv[1] ?? '';
$id = (int)($argv[2] ?? 1);
$input = ['user_id' => 1, 'sso_sub' => 'owner-sub', 'group_id' => 1, 'map_id' => 42,
    'thought_experience_node_id' => 'p1', 'experience_type' => 'process', 'selected_contents' => 'original',
    'knowledge_fragment_content' => '目的に合う具体例を選ぶ', 'stage1' => '場面', 'stage2' => '検討', 'stage3' => '気づき'];
try {
    if ($action === 'init') {
        $shared = 'CREATE TABLE users(user_id INTEGER PRIMARY KEY,sso_sub TEXT UNIQUE,is_active INTEGER);';
        $shared .= 'CREATE TABLE knowledge_groups(group_id INTEGER PRIMARY KEY,name TEXT,deleted INTEGER DEFAULT 0);';
        $shared .= 'CREATE TABLE kgroup_user_link(id INTEGER PRIMARY KEY,group_id INTEGER,user_id INTEGER,role TEXT DEFAULT "member",created_at TEXT DEFAULT CURRENT_TIMESTAMP,deleted INTEGER DEFAULT 0);';
        $ek = 'CREATE TABLE experience_knowledges(experience_knowledge_id INTEGER PRIMARY KEY AUTOINCREMENT,
            remarked_utterance_id TEXT,thought_experience_node_id TEXT,experience_type TEXT,used_remarked_utterance INTEGER DEFAULT 0,
            selected_contents TEXT,knowledge_fragment_content TEXT,user_id INTEGER,stage1 TEXT,stage2 TEXT,stage3 TEXT,
            context_package_id INTEGER,stage_payload_json TEXT,source_revision INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,deleted INTEGER DEFAULT 0,discussed TEXT DEFAULT "YET");';
        foreach ([$f,$c] as $db) $db->pdo->exec($shared . $ek);
        $f->pdo->exec('CREATE TABLE nodes(node_id TEXT PRIMARY KEY,user_id INTEGER,deleted INTEGER DEFAULT 0);
          CREATE TABLE process_nodes(process_node_id TEXT PRIMARY KEY,node_id TEXT,content TEXT,process_node_type TEXT,node_x REAL,node_y REAL,created_at TEXT,updated_at TEXT,deleted INTEGER DEFAULT 0);
          CREATE TABLE node_versions(node_version_id TEXT PRIMARY KEY,node_id TEXT,parent_id TEXT,node_type_id TEXT,appeared_at TEXT,disappeared_at TEXT,content TEXT,concept_id TEXT,x REAL,y REAL);
          CREATE TABLE triggers(trigger_id TEXT PRIMARY KEY,activity_id TEXT,node_id TEXT,`from` TEXT,`to` TEXT,activity_time TEXT,activity_type TEXT,content TEXT,add_time TEXT,x REAL,y REAL,deleted INTEGER);
          CREATE TABLE process_edges(process_edge_id TEXT PRIMARY KEY,edge_start TEXT,edge_end TEXT,label TEXT,created_at TEXT,deleted INTEGER);
          CREATE TABLE shared_nodes(id INTEGER PRIMARY KEY,knowledge_fragment_id INTEGER,knowledge_group_id INTEGER,created_at TEXT,updated_at TEXT,deleted INTEGER);
          CREATE TABLE kf_context_packages(context_package_id INTEGER PRIMARY KEY AUTOINCREMENT,activity_type_code TEXT,external_activity_id TEXT,created_at TEXT);
          CREATE TABLE kf_context_package_items(context_package_item_id INTEGER PRIMARY KEY AUTOINCREMENT,context_package_id INTEGER REFERENCES kf_context_packages,entity_type_code TEXT,entity_id TEXT,display_order INTEGER,snapshot_json TEXT);
          CREATE TABLE kf_sync_outbox(outbox_id INTEGER PRIMARY KEY AUTOINCREMENT,experience_knowledge_id INTEGER REFERENCES experience_knowledges,source_revision INTEGER,operation TEXT,acting_user_sso_sub TEXT,payload_json TEXT,status TEXT,attempt_count INTEGER DEFAULT 0,next_retry_at TEXT,last_http_status INTEGER,last_request_id TEXT,last_error TEXT,response_json TEXT,created_at TEXT,updated_at TEXT,sent_at TEXT,UNIQUE(experience_knowledge_id,source_revision));
          INSERT INTO users VALUES(1,"owner-sub",1);
          INSERT INTO nodes VALUES("n1",1,0);
          INSERT INTO process_nodes VALUES("p1","n1","original","thought",10,20,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,0);');
        $c->pdo->exec('CREATE TABLE shared_nodes(id INTEGER PRIMARY KEY AUTOINCREMENT,fragment_source_type TEXT,knowledge_fragment_id INTEGER,knowledge_group_id INTEGER,deleted INTEGER DEFAULT 0,UNIQUE(fragment_source_type,knowledge_fragment_id,knowledge_group_id));
          CREATE TABLE kf_source_mappings(id INTEGER PRIMARY KEY AUTOINCREMENT,source_system TEXT,external_kf_id TEXT,experience_knowledge_id INTEGER UNIQUE,source_revision INTEGER DEFAULT 0,source_deleted_at TEXT,snapshot_json TEXT,UNIQUE(source_system,external_kf_id));
          INSERT INTO users VALUES(1,"owner-sub",1),(2,"viewer-sub",1);
          INSERT INTO knowledge_groups VALUES(1,"OK group",0),(2,"Other group",0);
          INSERT INTO kgroup_user_link(group_id,user_id) VALUES(1,1),(1,2);');
    } elseif ($action === 'create') {
        $result = \ForestTest\kf_sync_create_fragment($f, $input);
        demand($result['ok_core']['status'] === 'QUEUED', 'Offline save must remain queued');
        demand((int)$f->pdo->query('SELECT COUNT(*) FROM experience_knowledges')->fetchColumn() === 1, 'Source KF not committed');
        demand((int)$c->pdo->query('SELECT COUNT(*) FROM experience_knowledges')->fetchColumn() === 0, 'Offline destination was written');
    } elseif ($action === 'retry') {
        demand(\ForestTest\kf_sync_retry_due($f)['processed'] === 0, 'Future retry ran early');
        $f->pdo->exec('UPDATE kf_sync_outbox SET next_retry_at="2000-01-01 00:00:00" WHERE outbox_id=1');
        $batch = \ForestTest\kf_sync_retry_due($f);
        $result = $batch['results'][0];
        demand($result['status'] === 'SENT', 'Retry did not send');
        demand((int)$c->pdo->query('SELECT COUNT(*) FROM experience_knowledges')->fetchColumn() === 1, 'Retry duplicated KF');
    } elseif ($action === 'duplicate') {
        $payload = json_decode($f->pdo->query('SELECT payload_json FROM kf_sync_outbox WHERE outbox_id=1')->fetchColumn(), true);
        $payload = array_reverse($payload, true);
        $response = \ForestTest\ok_core_api_put_fragment(1, 'owner-sub', $payload);
        demand(($response['body']['data']['duplicate'] ?? false) === true, 'Identical retry not idempotent');
    } elseif ($action === 'rollback') {
        $before = (int)$f->pdo->query('SELECT COUNT(*) FROM kf_context_packages')->fetchColumn();
        $f->pdo->exec('CREATE TEMP TRIGGER fail_outbox BEFORE INSERT ON kf_sync_outbox BEGIN SELECT RAISE(ABORT,"fixture failure"); END');
        try { \ForestTest\kf_sync_create_fragment($f, $input); throw new RuntimeException('Expected rollback'); }
        catch (PDOException $expected) {}
        demand((int)$f->pdo->query('SELECT COUNT(*) FROM kf_context_packages')->fetchColumn() === $before, 'Context survived rollback');
        demand((int)$f->pdo->query('SELECT COUNT(*) FROM experience_knowledges')->fetchColumn() === 1, 'KF survived rollback');
    } elseif ($action === 'view') {
        $fragment = \CoreTest\source_context_fragment($c, 2, 1, 1);
        $context = \CoreTest\source_context_result($fragment, 'viewer-sub', 1, 'context-package.v1', 'latest');
        demand($context['provenance'] === 'source_api' && $context['data']['context_package']['items'][0]['entity_id'] === 'p1', 'Delegated viewer failed');
        $map = \CoreTest\source_context_result($fragment, 'viewer-sub', 1, 'forest.thinking-process-map.v1', 'latest');
        demand(count($map['data']['map']['process_nodes']) === 1, 'Rich map unavailable');
        try { \CoreTest\source_context_fragment($c,2,2,1); throw new RuntimeException('Group authorization bypassed'); }
        catch (\CoreTest\SourceContextException $expected) { demand($expected->httpStatus === 403, 'Wrong group error'); }
        try { \CoreTest\source_context_fetch('forest-platform','1','viewer-sub',1,'context-package.v1','999'); throw new RuntimeException('Package binding bypassed'); }
        catch (\CoreTest\SourceContextException $expected) { demand($expected->httpStatus === 404, 'Wrong package error'); }
        $legacy = \CoreTest\source_context_fetch('forest-platform','2147483000','viewer-sub',1,'forest.thinking-process-map.v1','','p1','process');
        demand($legacy['map']['source_reference'] === 'p1', 'Legacy signed reference failed');
    } elseif ($action === 'fallback') {
        $fragment = \CoreTest\source_context_fragment($c,2,1,1);
        $context = \CoreTest\source_context_result($fragment,'viewer-sub',1,'context-package.v1','latest');
        demand($context['provenance'] === 'snapshot' && isset($context['warning']), 'Offline snapshot fallback missing');
    } elseif ($action === 'update') {
        $result = \ForestTest\kf_sync_update_fragment($f,1,1,'改訂した知','a','b','c',\ForestTest\kf_sync_now(),'owner-sub');
        demand($result['source_revision'] === 2 && $result['ok_core']['status'] === 'SENT', 'Update not synchronized');
        try { \ForestTest\kf_sync_update_fragment($f,1,2,'foreign','a','b','c',\ForestTest\kf_sync_now(),'viewer-sub'); throw new RuntimeException('Foreign update accepted'); }
        catch (RuntimeException $expected) { demand($expected->getMessage() !== 'Foreign update accepted', 'Foreign update accepted'); }
    } elseif ($action === 'busy') {
        $name = \ForestTest\kf_sync_lock($f,'delivery');
        $other = new \Phase2Fixture\SqliteMysqli($root . '/forest.sqlite');
        $result = \ForestTest\kf_sync_attempt_outbox($other,1);
        \ForestTest\kf_sync_unlock($f,$name);
        demand($result['status'] === 'BUSY','Parallel delivery was not excluded');
    } elseif ($action === 'delete') {
        $result = \ForestTest\kf_sync_delete_fragment($f,1,1,\ForestTest\kf_sync_now(),'owner-sub');
        demand($result['source_revision'] === 3 && $result['ok_core']['status'] === 'SENT','Delete not delivered');
        demand((int)$c->pdo->query('SELECT deleted FROM experience_knowledges WHERE experience_knowledge_id=1')->fetchColumn() === 1,'Destination not deleted');
        try { \CoreTest\source_context_fragment($c,2,1,1); throw new RuntimeException('Deleted KF visible'); }
        catch (\CoreTest\SourceContextException $expected) { demand($expected->httpStatus === 404,'Deleted KF must be hidden'); }
    } elseif ($action === 'forbidden_share') {
        $input['group_id'] = 2;
        $result = \ForestTest\kf_sync_create_fragment($f, $input);
        demand($result['ok_core']['status'] === 'FAILED' && $result['ok_core']['http_status'] === 403 &&
            $result['ok_core']['next_retry_at'] === null, 'Forbidden share must stop automatic retries');
    } elseif ($action === 'bad_ack') {
        $result = \ForestTest\kf_sync_create_fragment($f, $input);
        demand($result['ok_core']['status'] === 'QUEUED' && $result['ok_core']['error_code'] === 'ACK_IDENTITY_MISMATCH', 'Mismatched receipt marked SENT');
    } elseif ($action === 'force_latest') {
        $latest = (int)$f->pdo->query('SELECT MAX(outbox_id) FROM kf_sync_outbox')->fetchColumn();
        demand(\ForestTest\kf_sync_attempt_outbox($f,$latest,true)['status'] === 'SENT','Explicit retry failed');
    } else throw new RuntimeException('Unknown fixture action');
    echo 'PASS: ' . $action . PHP_EOL;
} catch (Throwable $error) { fwrite(STDERR, get_class($error) . ': ' . $error->getMessage() . PHP_EOL); exit(1); }
