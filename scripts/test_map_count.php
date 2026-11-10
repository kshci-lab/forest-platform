<?php
require __DIR__.'/test_lesson_summary.php';
$f=['date_basis'=>'created_at','start_date'=>null,'end_date'=>null,'user_ids'=>[]];
$p->exec("DELETE FROM object_nodes WHERE object_nodes_type='topic-tag'");
check(count($l->getMapsList($f))===1,'display-only question tag must not hide saved map');
$p->exec("INSERT INTO nodes VALUES(3,2),(4,2);INSERT INTO map_node_links VALUES(1,3),(1,3),(1,4);
INSERT INTO object_nodes(object_node_id,node_id,content,deleted,object_nodes_type,created_at,updated_at) VALUES
(30,3,'old activity',1,'step','2025-12-01','2026-05-01'),
(31,3,'current activity',0,'step','2026-05-01','2026-05-02'),
(40,4,'step A',0,'step','2026-05-03','2026-05-04'),
(41,4,'step B',0,'step','2026-05-05','2026-05-06');
INSERT INTO node_versions VALUES(300,'old question',1,3,'2025-12-01'),(301,'current question',1,3,'2026-01-01');");
$maps=$l->getMapsList($f);check(count($maps)===3,'one map per question regardless of steps/links');check(array_values(array_filter($maps,fn($x)=>$x['node_id']==3))[0]['content']==='current question','question text from node version');
$s=$l->getSummary($f);check($s['maps_total']===3,'summary includes maps without tags');check($l->getAggregationData($f,'maps_total','month','user')['grand_total']===3,'same root evidence and chart total');check($s['statistics']['maps_total']['mean']===1.5&&$s['statistics']['maps_total']['variance']===.25,'population stats');
$f['start_date']='2026-04-20';$s=$l->getSummary($f);check($s['maps_total']===1,'old map not recounted because old nodes were deleted');check($s['statistics']['maps_total']['mean']===.5&&$s['statistics']['maps_total']['variance']===.25,'zero participant included');check(count($l->getAggregationData($f,'maps_total','month','user')['source_records'])===1,'filtered exact root evidence');
$f['date_basis']='updated_at';check($l->getSummary($f)['maps_total']===2,'updated basis uses map latest activity');
$f['user_ids']=[1];check($l->getSummary($f)['maps_total']===0,'participant filter');
$f['user_ids']=[];$p->exec('UPDATE object_nodes SET deleted=1 WHERE node_id=4');check($l->getSummary($f)['maps_total']===1,'map with only deleted records not counted');
echo "PASS: map counting without persisted tags, unique question identity, earliest history, latest update, owner/date filters, zero-inclusive statistics, matching evidence and deleted-only exclusion.\n";
