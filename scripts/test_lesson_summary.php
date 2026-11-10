<?php
require __DIR__ . '/../kagitani-system/php/admin_workbench_lib.php';
$p=new PDO('sqlite::memory:',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$tables=[
'node_versions(node_version_id INTEGER,content TEXT,node_type_id INTEGER)','node_types(node_type_id INTEGER,class TEXT)',
'users(user_id INTEGER, name TEXT)', 'maps(map_id INTEGER,user_id INTEGER,name TEXT)',
'nodes(node_id INTEGER,user_id INTEGER)','map_node_links(map_id INTEGER,node_id INTEGER)',
'object_nodes(object_node_id INTEGER,node_id INTEGER,content TEXT,deleted INTEGER,object_nodes_type TEXT,status TEXT,purpose TEXT,estimated_time TEXT,created_at TEXT,updated_at TEXT,evaluation_good TEXT,attribution TEXT,evaluation_bad TEXT,attribution_bad TEXT)',
'object_edges(edge_start INTEGER,edge_end INTEGER,deleted INTEGER,label TEXT)',
'`object_lesson-learneds`(object_le_id TEXT,object_node_id INTEGER,reflection_id TEXT,lesson_learned TEXT,why_important TEXT,opportunity TEXT,created_at TEXT,updated_at TEXT,deleted INTEGER)',
'`object_journal_lesson-learneds`(`object_journal_lesson-learned_id` TEXT,object_journal_reflection_id TEXT,lesson_learned TEXT,why_important TEXT,opportunity TEXT,created_at TEXT,updated_at TEXT,deleted INTEGER,map_id INTEGER)',
'object_journals(object_journal_id INTEGER,map_id INTEGER,`delete` INTEGER,appeared_at TEXT,update_at TEXT,start_date TEXT,finish_date TEXT)',
'object_journal_reflections(object_journal_reflection_id TEXT,object_journal_id INTEGER,deleted INTEGER,created_at TEXT,update_at TEXT,evaluation_good TEXT,attribution TEXT,evaluation_bad TEXT,attribution_bad TEXT)',
'object_reflection_records(reflection_id TEXT,object_node_id INTEGER,created_at TEXT,evaluation_good TEXT,attribution TEXT,evaluation_bad TEXT,attribution_bad TEXT)'];
foreach($tables as $t)$p->exec('CREATE TABLE '.$t);
$p->exec("INSERT INTO users VALUES(1,'A'),(2,'B'); INSERT INTO maps VALUES(1,1,'M'); INSERT INTO nodes VALUES(1,1); INSERT INTO map_node_links VALUES(1,1),(1,1);
INSERT INTO object_nodes(object_node_id,node_id,content,deleted,object_nodes_type,status,created_at,updated_at) VALUES(1,1,'node',0,'step','completed','2026-01-01','2026-01-01');
INSERT INTO object_journals(object_journal_id,map_id) VALUES(1,1);
INSERT INTO object_journal_reflections(object_journal_reflection_id,object_journal_id) VALUES('j1',1),('j2',1);
INSERT INTO object_reflection_records(reflection_id,object_node_id) VALUES('r1',1),('r2',1),('r3',1);");
$map=$p->prepare('INSERT INTO `object_lesson-learneds` VALUES(?,?,?, ?,NULL,NULL,?,?,?)');
foreach([
['a',1,'r1','old','2026-01-01','2026-01-01',0],
['b',1,'r1','second','2026-02-01','2026-02-01',0],
['c',1,'r1','latest','2026-03-01','2026-03-01',0],
['d',1,'r1','deleted','2026-04-01','2026-04-01',1],
['e',1,'r2','unchanged','2026-01-01','2026-01-01',0],
['f',1,'r3','old blank group','2026-01-01','2026-01-01',0],
['g',1,'r3',' ','2026-02-01','2026-02-01',0],
['h',1,null,'legacy','2026-01-01','2026-02-01',0]
] as $row)$map->execute($row);
$jour=$p->prepare('INSERT INTO `object_journal_lesson-learneds` VALUES(?,?,?,NULL,NULL,?,?,0,NULL)');
foreach([
['a','j1','old','2026-01-01','2026-01-01'],
['b','j1','second','2026-02-01','2026-02-01'],
['c','j1','latest','2026-03-01','2026-03-01'],
['d','j2','unchanged','2026-01-01','2026-01-01']
]as $row)$jour->execute($row);
function check($ok,$msg){if(!$ok)throw new Exception($msg);}
$l=new AdminWorkbenchLib($p,new SharePointMeetings());$f=['date_basis'=>'created_at','start_date'=>null,'end_date'=>null,'user_ids'=>[]];
$p->exec("INSERT INTO object_nodes(object_node_id,node_id,content,deleted,object_nodes_type,created_at,updated_at) VALUES(2,1,'Q',0,'topic-tag','2026-01-01','2026-01-01'),(3,1,'Q duplicate',0,'topic-tag','2026-01-02','2026-01-02'),(4,2,'Deleted',1,'topic-tag','2026-01-01','2026-01-01');");
$s=$l->getSummary($f);check($s['maps_total']===1,'one map per question despite duplicate tags and links');check(count($l->getAggregationData($f,'maps_total','month','user')['source_records'])===1,'exact map evidence');check(count($l->getAggregationData($f,'lessons_total','month','user')['source_records'])===5,'exact lesson evidence');check($s['statistics']['maps_total']['mean']===0.5 && $s['statistics']['maps_total']['variance']===0.25,'map population statistics include zero participants');check($s['lessons_total']===5,'latest total');check($s['lessons_updated']===3,'one updated count per group');
check($s['statistics']['lessons_total']['mean']==2.5,'mean');check($s['statistics']['lessons_total']['variance']==6.25,'variance');
foreach(['lessons_total','lessons_map','lessons_journal','lessons_updated']as $k){$agg=$l->getAggregationData($f,$k,'user','none');check($agg['grand_total']===$s[$k],'summary aggregation match '.$k);}
$rows=$l->getLessonsList($f);check(count($rows)===5,'list dedup');check(count(array_filter($rows,fn($x)=>$x['lesson_learned']==='latest'))===2,'latest content');
$f['end_date']='2026-02-28';$s=$l->getSummary($f);check($s['lessons_total']===3,'old versions not revived by filter');check($s['lessons_updated']===1,'filtered update');
$f['user_ids']=[2];$s=$l->getSummary($f);check($s['lessons_total']===0,'user filter');
echo "PASS: three versions count once for total/update; in-place update; unchanged lesson; blank/deleted latest; legacy node; duplicate links; missing journal map_id; period/user filters; summary/list/aggregation/statistics agree.\n";
