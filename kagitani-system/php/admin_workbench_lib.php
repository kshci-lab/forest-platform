<?php
/**
 * admin_workbench_lib.php
 * 研究データ分析ワークベンチのロジック・クエリライブラリ
 */

require_once __DIR__ . '/sharepoint_meetings.php';
require_once __DIR__ . '/research_curation.php';

class AdminWorkbenchLib {
    private $pdo;
    private $meetings;
    private $curation;
    public function setCuration(array $state): void {$this->curation=$state;}
    public function curationRows(array $rows):array {
        $excluded=ResearchCuration::exclusions($this->curation??[]);$out=[];foreach($rows as$r){$key=ResearchCuration::key($r);$r['source_key']=$key;$r['curation_revision']=$this->curation['revision']??0;$r['curation_state']=isset($excluded[$key])?'excluded':'included';$r['curation_representative']=$excluded[$key]['representative']??'';if(!isset($excluded[$key])||!empty($this->curation['include_excluded']))$out[]=$r;}return $out;
    }

    public function __construct(PDO $pdo, SharePointMeetings $meetings = null) {
        $this->pdo = $pdo;
        $this->meetings = $meetings ?: SharePointMeetings::fromEnvironment();
    }

    public function checkAdminAuth($userId) {
        if (empty($userId)) return false;
        $stmt = $this->pdo->prepare("SELECT role FROM users WHERE user_id = :uid LIMIT 1");
        $stmt->execute([':uid' => $userId]);
        $role = $stmt->fetchColumn();
        return ($role === 'admin');
    }

    public function getFilterOptions() {
        $users=$this->pdo->query('SELECT user_id,name,display_name,role FROM users ORDER BY user_id')->fetchAll();
        $all=['date_basis'=>'created_at','start_date'=>null,'end_date'=>null,'user_ids'=>[]];$lc=[];$nc=[];
        foreach($this->getLessonsList($all)as$r)$lc[$r['user_id']]=($lc[$r['user_id']]??0)+1;
        foreach($this->getNodesList($all)as$r)$nc[$r['user_id']]=($nc[$r['user_id']]??0)+1;
        foreach($users as &$u){$u['lesson_count']=$lc[$u['user_id']]??0;$u['node_count']=$nc[$u['user_id']]??0;}unset($u);

        $minDates = [];
        $maxDates = [];
        $res = $this->pdo->query("SELECT MIN(created_at) as min_d, MAX(created_at) as max_d FROM `object_lesson-learneds` WHERE deleted = 0")->fetch();
        if (!empty($res['min_d'])) $minDates[] = $res['min_d'];
        if (!empty($res['max_d'])) $maxDates[] = $res['max_d'];

        $res = $this->pdo->query("SELECT MIN(created_at) as min_d, MAX(created_at) as max_d FROM `object_journal_lesson-learneds` WHERE (deleted IS NULL OR deleted = 0)")->fetch();
        if (!empty($res['min_d'])) $minDates[] = $res['min_d'];
        if (!empty($res['max_d'])) $maxDates[] = $res['max_d'];

        foreach (['research_mt_days', 'general_mt_sessions'] as $metric) {
            foreach ($this->meetings->records($metric, ['user_ids' => []], $users) as $meeting) {
                $minDates[] = $meeting['meeting_date'];
                $maxDates[] = $meeting['meeting_date'];
            }
        }

        $minDate = !empty($minDates) ? min($minDates) : '2024-01-01 00:00:00';
        $maxDate = !empty($maxDates) ? max($maxDates) : date('Y-m-d 23:59:59');

        return [
            'users' => $users,
            'min_date' => substr($minDate, 0, 10),
            'max_date' => substr($maxDate, 0, 10),
        ];
    }

    public function getSummary(array $filter) {
        $metricKeys = ['maps_total', 'lessons_total', 'lessons_map', 'lessons_journal', 'nodes_total',
            'nodes_completed', 'nodes_with_reason', 'journals_total', 'reflections_total', 'lessons_updated'];
        $metricKeys=array_merge($metricKeys,SharePointMeetings::PARTICIPANT_METRICS);
        $users = $this->pdo->query("SELECT user_id, name AS user_name FROM users m WHERE 1=1" .
            $this->buildUserCondition('m', $filter['user_ids']) . " ORDER BY user_id")->fetchAll();
        $perUser = [];
        foreach ($users as $user) {
            $perUser[$user['user_id']] = array_merge($user, array_fill_keys($metricKeys, 0));
        }
        // Aggregate by owner in each query so zero-count participants remain in the population.
        $count = function ($sql, array $keys) use (&$perUser) {
            $sql = preg_replace('/SELECT/', 'SELECT m.user_id,', $sql, 1) . ' GROUP BY m.user_id';
            $totals = array_fill(0, count($keys), 0);
            foreach ($this->pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $uid = $row['user_id'];
                unset($row['user_id']);
                foreach (array_values($row) as $i => $value) {
                    $value = (int)$value;
                    $totals[$i] += $value;
                    if (isset($perUser[$uid])) $perUser[$uid][$keys[$i]] += $value;
                }
            }
            return $totals;
        };
        $basis = $filter['date_basis'];
        $dateCondMap = $this->buildDateCondition('ol', $basis, $filter['start_date'], $filter['end_date']);
        $dateCondJour = $this->buildDateCondition('ojl', $basis, $filter['start_date'], $filter['end_date']);
        $dateCondNode = $this->buildDateCondition('o', $basis, $filter['start_date'], $filter['end_date']);
        $dateCondJourActivity = $this->buildDateCondition('oj', ($basis === 'created_at' ? 'appeared_at' : 'update_at'), $filter['start_date'], $filter['end_date']);
        
        $userCondMap = $this->buildUserCondition('m', $filter['user_ids']);
        $userCondJour = $this->buildUserCondition('m', $filter['user_ids']);
        $userCondNode = $this->buildUserCondition('m', $filter['user_ids']);
        $userCondJourActivity = $this->buildUserCondition('m', $filter['user_ids']);

        // Summary, lists, aggregation and exports all use the same current lessons.
        $mapLessons = 0;
        $jourLessons = 0;
        $updatedLessons = 0;
        foreach ($this->getLessonsList($filter) as $lesson) {
            $key = $lesson['origin_type'] === 'map' ? 'lessons_map' : 'lessons_journal';
            if ($key === 'lessons_map') $mapLessons++; else $jourLessons++;
            $uid = $lesson['user_id'];
            if (isset($perUser[$uid])) $perUser[$uid][$key]++;
            if ((int)$lesson['was_updated']) {
                $updatedLessons++;
                if (isset($perUser[$uid])) $perUser[$uid]['lessons_updated']++;
            }
        }

        // 3. 手段ノード総数 & 完了手段数
        $totalNodes=$completedNodes=$nodesWithReason=0;
        foreach($this->getNodesList($filter) as $record){
            $uid=$record['user_id'];$totalNodes++;$completed=(int)($record['status']==='completed');$reason=(int)($record['reason_text']!=='');$completedNodes+=$completed;$nodesWithReason+=$reason;
            if(isset($perUser[$uid])){$perUser[$uid]['nodes_total']++;$perUser[$uid]['nodes_completed']+=$completed;$perUser[$uid]['nodes_with_reason']+=$reason;}
        }

        // One thinking map per originating question; duplicate topic tags/links do not add maps.
        $mapDate = $this->buildDateCondition('q', $basis, $filter['start_date'], $filter['end_date']);
        $totalMaps = $count("SELECT COUNT(DISTINCT q.node_id)
            FROM (SELECT node_id, MIN(created_at) AS created_at, MAX(updated_at) AS updated_at
                  FROM object_nodes WHERE deleted = 0 AND object_nodes_type = 'topic-tag' GROUP BY node_id) q
            JOIN nodes m ON q.node_id = m.node_id
            WHERE 1=1 $mapDate $userCondNode", ['maps_total'])[0];

        // 4. ジャーナル数
        $sql4 = "
            SELECT COUNT(DISTINCT oj.object_journal_id)
            FROM object_journals oj
            JOIN maps m ON oj.map_id = m.map_id
            WHERE (oj.`delete` IS NULL OR oj.`delete` = 0)
              $dateCondJourActivity $userCondJourActivity
        ";
        $totalJournals = $count($sql4, ['journals_total'])[0];

        // 5. 内省記録数 (ジャーナル内省 + 手段ノード内省)
        $ojrTimeCol = ($basis === 'created_at') ? 'created_at' : 'update_at';
        $dateCondOjr = $this->buildDateCondition('ojr', $ojrTimeCol, $filter['start_date'], $filter['end_date']);
        $dateCondOrr = $this->buildDateCondition('orr', 'created_at', $filter['start_date'], $filter['end_date']);
        $sql5a = "
            SELECT COUNT(DISTINCT ojr.object_journal_reflection_id)
            FROM object_journal_reflections ojr
            JOIN object_journals oj ON ojr.object_journal_id = oj.object_journal_id
            JOIN maps m ON oj.map_id = m.map_id
            WHERE (ojr.deleted IS NULL OR ojr.deleted = 0)
              $dateCondOjr $userCondJourActivity
        ";
        $jourReflections = $count($sql5a, ['reflections_total'])[0];

        $sql5b = "
            SELECT COUNT(DISTINCT orr.reflection_id)
            FROM object_reflection_records orr
            JOIN object_nodes o ON orr.object_node_id = o.object_node_id
            JOIN map_node_links mnl ON o.node_id = mnl.node_id
            JOIN maps m ON mnl.map_id = m.map_id
            WHERE 1=1 $dateCondOrr $userCondNode
        ";
        $nodeReflections = $count($sql5b, ['reflections_total'])[0];

        $meetingUsers=$this->meetingUsers();
        $meetingParticipant=$this->meetings->participantCounts($filter,$meetingUsers);
        foreach ($perUser as $uid=>&$user) {
            $user=array_merge($user,$meetingParticipant['per_user'][$uid] ?? array_fill_keys(SharePointMeetings::PARTICIPANT_METRICS,null));
            $user['lessons_total'] = $user['lessons_map'] + $user['lessons_journal'];
        }
        unset($user);
        $statistics = [];
        $n = count($perUser);
        foreach ($metricKeys as $key) {
            $values = array_column(array_values($perUser), $key);
            $hasValues=$n && !in_array(null,$values,true);
            $mean = $hasValues ? array_sum($values) / $n : null;
            $variance = null;
            if ($hasValues) {
                $sumSquares = 0.0;
                foreach ($values as $value) $sumSquares += ($value - $mean) ** 2;
                $variance = $sumSquares / $n;
            }
            $statistics[$key] = ['mean' => $mean, 'variance' => $variance];
        }
        $meetingSummary = $this->meetings->summary($filter, $meetingUsers);
        return array_merge($meetingParticipant['totals'], ['meetings' => $meetingSummary, 'participant_count' => $n, 'per_user' => array_values($perUser), 'statistics' => $statistics,

            'curation_revision'=>$this->curation['revision']??0,'curation_mode'=>!empty($this->curation['include_excluded'])?'raw':'curated',
            'lessons_total' => $mapLessons + $jourLessons,
            'lessons_map' => $mapLessons,
            'lessons_journal' => $jourLessons,
            'maps_total' => $totalMaps,
            'nodes_total' => $totalNodes,
            'nodes_completed' => $completedNodes,
            'nodes_with_reason' => $nodesWithReason,
            'journals_total' => $totalJournals,
            'reflections_total' => $jourReflections + $nodeReflections,
            'lessons_updated' => $updatedLessons
        ]);
    }

    public function getLessonsList(array $filter) {
        $basis = $filter['date_basis'];
        $dateCondMap = $this->buildDateCondition('ol', $basis, $filter['start_date'], $filter['end_date']);
        $dateCondJour = $this->buildDateCondition('ojl', $basis, $filter['start_date'], $filter['end_date']);
        $userCondMap = $this->buildUserCondition('u', $filter['user_ids']);
        $userCondJour = $this->buildUserCondition('u', $filter['user_ids']);

        $mapSource = $this->latestLessonSource('map');
        $journalSource = $this->latestLessonSource('journal');

        // 1. マップ起因教訓
        $sqlMap = "
            SELECT DISTINCT
                ol.was_updated,
                ol.object_le_id AS lesson_id,
                ol.reflection_id AS reflection_group_id,
                'map' AS origin_type,
                'SRL整理マップ' AS origin_name,
                u.user_id,
                u.name AS user_name,
                m.map_id,
                m.name AS map_name,
                ol.lesson_learned,
                ol.why_important,
                ol.opportunity,
                ol.created_at,
                ol.updated_at,
                ol.object_node_id,
                o.content AS node_content,
                (SELECT t.content FROM object_nodes t WHERE t.node_id = o.node_id AND t.object_nodes_type = 'topic-tag' AND t.deleted = 0 LIMIT 1) AS question_content,
                COALESCE(rr.evaluation_good, o.evaluation_good, '') AS eval_good,
                COALESCE(rr.attribution, o.attribution, '') AS eval_good_reason,
                COALESCE(rr.evaluation_bad, o.evaluation_bad, '') AS eval_bad,
                COALESCE(rr.attribution_bad, o.attribution_bad, '') AS eval_bad_reason,
                NULL AS journal_id,
                NULL AS journal_start_date,
                NULL AS journal_finish_date
            FROM {$mapSource} ol
            JOIN object_nodes o ON ol.object_node_id = o.object_node_id
            JOIN nodes n ON o.node_id = n.node_id
            JOIN users u ON n.user_id = u.user_id
            LEFT JOIN maps m ON m.map_id = (
                SELECT MIN(ml.map_id) FROM map_node_links link
                JOIN maps ml ON link.map_id = ml.map_id
                WHERE link.node_id = o.node_id AND ml.user_id = u.user_id
            )
            LEFT JOIN object_reflection_records rr ON ol.reflection_id = rr.reflection_id
            WHERE ol.deleted = 0
              AND ol.lesson_learned IS NOT NULL AND TRIM(ol.lesson_learned) <> ''
              $dateCondMap $userCondMap
            ORDER BY ol.{$basis} DESC
        ";
        $mapRows = $this->pdo->query($sqlMap)->fetchAll();

        // 2. ジャーナル起因教訓
        $sqlJour = "
            SELECT DISTINCT
                ojl.was_updated,
                ojl.`object_journal_lesson-learned_id` AS lesson_id,
                ojl.object_journal_reflection_id AS reflection_group_id,
                'journal' AS origin_type,
                'SRLジャーナル' AS origin_name,
                u.user_id,
                u.name AS user_name,
                m.map_id,
                m.name AS map_name,
                ojl.lesson_learned,
                ojl.why_important,
                ojl.opportunity,
                ojl.created_at,
                ojl.updated_at,
                NULL AS object_node_id,
                NULL AS node_content,
                '（SRLジャーナル目標）' AS question_content,
                COALESCE(ojr.evaluation_good, '') AS eval_good,
                COALESCE(ojr.attribution, '') AS eval_good_reason,
                COALESCE(ojr.evaluation_bad, '') AS eval_bad,
                COALESCE(ojr.attribution_bad, '') AS eval_bad_reason,
                oj.object_journal_id AS journal_id,
                oj.start_date AS journal_start_date,
                oj.finish_date AS journal_finish_date
            FROM {$journalSource} ojl
            JOIN object_journal_reflections ojr ON ojl.object_journal_reflection_id = ojr.object_journal_reflection_id
            JOIN object_journals oj ON ojr.object_journal_id = oj.object_journal_id
            JOIN maps m ON oj.map_id = m.map_id
            JOIN users u ON m.user_id = u.user_id
            WHERE (ojl.deleted IS NULL OR ojl.deleted = 0)
              AND ojl.lesson_learned IS NOT NULL AND TRIM(ojl.lesson_learned) <> ''
              $dateCondJour $userCondJour
            ORDER BY ojl.{$basis} DESC
        ";
        $jourRows = $this->pdo->query($sqlJour)->fetchAll();

        $merged = array_merge($mapRows, $jourRows);
        usort($merged, function($a, $b) use ($basis) {
            return strcmp($b[$basis], $a[$basis]);
        });

        return $this->curationRows($merged);
    }

    public function getNodesList(array $filter) {
        $basis = $filter['date_basis'];
        $dateCond = $this->buildDateCondition('o', $basis, $filter['start_date'], $filter['end_date']);
        $userCond = $this->buildUserCondition('m', $filter['user_ids']);

        $sql = "
            SELECT 
                o.object_node_id,
                o.node_id,
                o.content,
                o.object_nodes_type,
                o.status,
                o.purpose,
                o.estimated_time,
                o.created_at,
                o.updated_at,
                o.evaluation_good,
                o.evaluation_bad,
                o.attribution,
                o.attribution_bad,
                u.user_id,
                u.name AS user_name,
                m.map_id,
                m.name AS map_name,
                (SELECT t.content FROM object_nodes t WHERE t.node_id = o.node_id AND t.object_nodes_type = 'topic-tag' AND t.deleted = 0 LIMIT 1) AS topic_content
            FROM object_nodes o
            JOIN nodes owner_node ON owner_node.node_id=o.node_id
            JOIN map_node_links mnl ON o.node_id = mnl.node_id
            JOIN maps m ON mnl.map_id = m.map_id AND m.user_id=owner_node.user_id
            JOIN users u ON m.user_id = u.user_id
            WHERE o.deleted = 0
              AND o.object_nodes_type IN ('step', 'action')
              $dateCond $userCond
            ORDER BY o.{$basis} DESC, m.map_id ASC
        ";
        $nodes = $this->pdo->query($sql)->fetchAll();
        if (empty($nodes)) {
            return [];
        }

        // Fetch all edge reasons together, avoiding one query per row.
        $ids = array_values(array_unique(array_column($nodes, 'object_node_id')));
        $reasonQuery = $this->pdo->prepare("SELECT edge_end, label FROM object_edges WHERE deleted = 0 AND TRIM(COALESCE(label, '')) <> '' AND edge_end IN (" . implode(',', array_fill(0, count($ids), '?')) . ') ORDER BY label');
        $reasonQuery->execute($ids);
        $edgeReasons = [];
        foreach ($reasonQuery->fetchAll() as $edge) $edgeReasons[$edge['edge_end']][] = trim($edge['label']);
        foreach ($nodes as &$item) {
            $item['reason_entries'] = [];
            if (trim($item['purpose'] ?? '') !== '') $item['reason_entries'][] = ['source'=>'直接記入','text'=>trim($item['purpose'])];
            foreach (array_unique($edgeReasons[$item['object_node_id']] ?? []) as $reason) $item['reason_entries'][] = ['source'=>'つながり','text'=>$reason];
            $item['reason_text'] = implode("\n", array_values(array_unique(array_filter(array_merge(
                [trim($item['purpose'] ?? '')], $edgeReasons[$item['object_node_id']] ?? []
            ), static fn($text) => $text !== ''))));
        }
        unset($item);
        $mapIds = array_unique(array_column($nodes, 'map_id'));
        $hierarchyInfo = $this->calculateHierarchyAndQuestions($mapIds);

        foreach ($nodes as &$node) {
            $oid = $node['object_node_id'];
            if (isset($hierarchyInfo[$oid])) {
                $node['depth'] = $hierarchyInfo[$oid]['depth'];
                if (!empty($hierarchyInfo[$oid]['question'])) {
                    $node['question_content'] = $hierarchyInfo[$oid]['question'];
                } else {
                    $node['question_content'] = $node['topic_content'] ?: '（親の問いなし）';
                }
            } else {
                $node['depth'] = 1;
                $node['question_content'] = $node['topic_content'] ?: '（親の問いなし）';
            }
        }
        unset($node);

        $unique=[];foreach($nodes as $r){$k=$r['user_id'].':'.$r['object_node_id'];if(!isset($unique[$k])){$unique[$k]=$r;$unique[$k]['map_references']=[];}$unique[$k]['map_references'][(string)$r['map_id']]=['map_id'=>$r['map_id'],'name'=>$r['map_name'],'question'=>$r['question_content'],'depth'=>$r['depth']];}
        foreach($unique as &$r)$r['map_references']=array_values($r['map_references']);unset($r);
        return $this->curationRows(array_values($unique));
    }

    private function calculateHierarchyAndQuestions(array $mapIds) {
        if (empty($mapIds)) return [];

        $sqlEdges = "
            SELECT e.edge_start, e.edge_end
            FROM object_edges e
            WHERE e.deleted = 0
        ";
        $edges = $this->pdo->query($sqlEdges)->fetchAll();

        $sqlQuestions = "
            SELECT nv.node_version_id as q_id, nv.content, 'nv' as src
            FROM node_versions nv
            JOIN node_types nt ON nv.node_type_id = nt.node_type_id
            WHERE nt.class = 'question'
            UNION
            SELECT o.object_node_id as q_id, o.content, 'obj' as src
            FROM object_nodes o
            WHERE o.object_nodes_type = 'topic-tag' AND o.deleted = 0
        ";
        $questions = $this->pdo->query($sqlQuestions)->fetchAll();
        $qMap = [];
        foreach ($questions as $q) {
            $qMap[$q['q_id']] = $q['content'];
        }

        $childrenOf = [];
        foreach ($edges as $e) {
            $start = $e['edge_start'];
            $end = $e['edge_end'];
            $childrenOf[$start][] = $end;
        }

        $result = [];
        $visited = [];
        $queue = [];

        foreach ($qMap as $qId => $qContent) {
            if (isset($childrenOf[$qId])) {
                foreach ($childrenOf[$qId] as $child) {
                    $queue[] = [$child, 1, $qContent];
                    $visited[$child] = 1;
                    $result[$child] = ['depth' => 1, 'question' => $qContent];
                }
            }
        }

        while (!empty($queue)) {
            list($curr, $depth, $qContent) = array_shift($queue);
            if (isset($childrenOf[$curr])) {
                foreach ($childrenOf[$curr] as $nextChild) {
                    if (!isset($visited[$nextChild])) {
                        $visited[$nextChild] = $depth + 1;
                        $result[$nextChild] = ['depth' => $depth + 1, 'question' => $qContent];
                        $queue[] = [$nextChild, $depth + 1, $qContent];
                    }
                }
            }
        }

        return $result;
    }

    public function getAggregationData(array $filter, $metric, $rowAxis, $colAxis) {
        $records = [];
        $isMeeting = in_array($metric, SharePointMeetings::METRICS, true);
        if ($isMeeting) {
            $records = $this->meetings->records($metric, $filter, $this->meetingUsers());
        } elseif ($metric === 'maps_total') {
            $dateCond = $this->buildDateCondition('q', $filter['date_basis'], $filter['start_date'], $filter['end_date']);
            $userCond = $this->buildUserCondition('m', $filter['user_ids']);
            $records = $this->pdo->query("SELECT q.node_id, q.created_at, q.updated_at, m.user_id, u.name AS user_name,
                (SELECT t.content FROM object_nodes t WHERE t.node_id=q.node_id AND t.deleted=0 AND t.object_nodes_type='topic-tag' ORDER BY t.created_at LIMIT 1) AS content
                FROM (SELECT node_id, MIN(created_at) AS created_at, MAX(updated_at) AS updated_at FROM object_nodes WHERE deleted=0 AND object_nodes_type='topic-tag' GROUP BY node_id) q
                JOIN nodes m ON m.node_id=q.node_id JOIN users u ON u.user_id=m.user_id WHERE 1=1 $dateCond $userCond")->fetchAll();
        } elseif (strpos($metric, 'lessons') !== false) {
            $records = $this->getLessonsList($filter);
        } elseif (strpos($metric, 'nodes') !== false) {
            $dedup = [];
            foreach ($this->getNodesList($filter) as $record) $dedup[$record['user_id'].':'.$record['object_node_id']] = $record;
            $records = array_values($dedup);
        } elseif ($metric === 'journals_total') {
            $basis = $filter['date_basis'];
            $dateCond = $this->buildDateCondition('oj', ($basis === 'created_at' ? 'appeared_at' : 'update_at'), $filter['start_date'], $filter['end_date']);
            $userCond = $this->buildUserCondition('m', $filter['user_ids']);
            $sql = "
                SELECT oj.object_journal_id, oj.appeared_at as created_at, oj.update_at as updated_at,
                       oj.start_date, oj.finish_date, u.user_id, u.name as user_name
                FROM object_journals oj
                JOIN maps m ON oj.map_id = m.map_id
                JOIN users u ON m.user_id = u.user_id
                WHERE (oj.`delete` IS NULL OR oj.`delete` = 0)
                  $dateCond $userCond
            ";
            $records = $this->pdo->query($sql)->fetchAll();
        } elseif ($metric === 'reflections_total') {
            $basis = $filter['date_basis'];
            $userCond = $this->buildUserCondition('m', $filter['user_ids']);
            $ojrTimeCol = ($basis === 'created_at') ? 'created_at' : 'update_at';
            $dateCondOjr = $this->buildDateCondition('ojr', $ojrTimeCol, $filter['start_date'], $filter['end_date']);
            $sqlA = "
                SELECT ojr.object_journal_reflection_id as ref_id, ojr.created_at, ojr.update_at as updated_at,
                       u.user_id, u.name as user_name, 'journal' as origin_type
                FROM object_journal_reflections ojr
                JOIN object_journals oj ON ojr.object_journal_id = oj.object_journal_id
                JOIN maps m ON oj.map_id = m.map_id
                JOIN users u ON m.user_id = u.user_id
                WHERE (ojr.deleted IS NULL OR ojr.deleted = 0) $dateCondOjr $userCond
            ";
            $records = $this->pdo->query($sqlA)->fetchAll();
            $nodeDate = $this->buildDateCondition('orr', 'created_at', $filter['start_date'], $filter['end_date']);
            $nodeRows = $this->pdo->query("SELECT DISTINCT orr.reflection_id AS ref_id, orr.created_at, orr.created_at AS updated_at,
                u.user_id, u.name AS user_name, 'map' AS origin_type FROM object_reflection_records orr
                JOIN object_nodes o ON o.object_node_id=orr.object_node_id JOIN map_node_links ml ON ml.node_id=o.node_id
                JOIN maps m ON m.map_id=ml.map_id JOIN users u ON u.user_id=m.user_id WHERE 1=1 $nodeDate $userCond")->fetchAll();
            $records = array_merge($records, $nodeRows);

        }

        if ($metric === 'lessons_map') {
            $records = array_values(array_filter($records, fn($r) => ($r['origin_type'] ?? '') === 'map'));
        } elseif ($metric === 'lessons_journal') {
            $records = array_values(array_filter($records, fn($r) => ($r['origin_type'] ?? '') === 'journal'));
        } elseif ($metric === 'lessons_updated') {
            $records = array_values(array_filter($records, fn($r) => (int)($r['was_updated'] ?? 0) === 1));
        } elseif ($metric === 'nodes_with_reason') {
            $records = array_values(array_filter($records, fn($r) => trim($r['reason_text'] ?? '') !== ''));
        } elseif ($metric === 'nodes_completed') {
            $records = array_values(array_filter($records, fn($r) => ($r['status'] ?? '') === 'completed'));
        }

        $basis = $filter['date_basis'];

        $getKey = function($rec, $axis) use ($basis, $isMeeting) {
            if ($isMeeting) return SharePointMeetings::axisKey($rec, $axis);
            if ($axis === 'all') return '全体';
            if ($axis === 'user') return ($rec['user_name'] ?? '不明') . ' (ID:' . ($rec['user_id'] ?? '') . ')';
            if ($axis === 'origin') return ($rec['origin_type'] === 'map' ? 'SRL整理マップ' : 'SRLジャーナル');
            if ($axis === 'status') {
                $st = $rec['status'] ?? '';
                if ($st === 'completed') return '完了 (completed)';
                if ($st === 'inProgress') return '進行中 (inProgress)';
                if ($st === 'paused') return '一時中断 (paused)';
                if ($st === 'todo') return '未着手 (todo)';
                return '未設定・未着手';
            }
            $dateStr = $rec[$basis] ?? $rec['created_at'] ?? '';
            if (!$dateStr) return '日付なし';
            $time = strtotime($dateStr);
            if ($axis === 'year') return date('Y年', $time);
            if ($axis === 'month') return date('Y年m月', $time);
            if ($axis === 'week') return date('Y年 W週', $time);
            if ($axis === 'day') return date('Y/m/d', $time);
            return '全体';
        };

        $table = [];
        $colKeysMap = [];
        $rowKeysMap = [];

        $sourceRecords = [];
        foreach ($records as $r) {
            $rk = $getKey($r, $rowAxis);
            $ck = (!empty($colAxis) && $colAxis !== 'none') ? $getKey($r, $colAxis) : '__TOTAL__';

            $sourceRecords[] = array_merge($r, ['row_key' => $rk, 'col_key' => $ck]);
            $rowKeysMap[$rk] = true;
            $colKeysMap[$ck] = true;

            if (!isset($table[$rk])) $table[$rk] = [];
            if (!isset($table[$rk][$ck])) $table[$rk][$ck] = 0;
            $table[$rk][$ck]++;
        }

        $rowKeys = array_keys($rowKeysMap);
        sort($rowKeys);
        $colKeys = array_keys($colKeysMap);
        sort($colKeys);

        $matrix = [];
        $colTotals = [];
        $grandTotal = 0;

        foreach ($rowKeys as $rk) {
            $rowObj = ['row_key' => $rk, 'cells' => [], 'row_total' => 0];
            foreach ($colKeys as $ck) {
                $val = $table[$rk][$ck] ?? 0;
                $rowObj['cells'][$ck] = $val;
                $rowObj['row_total'] += $val;
                if (!isset($colTotals[$ck])) $colTotals[$ck] = 0;
                $colTotals[$ck] += $val;
                $grandTotal += $val;
            }
            $matrix[] = $rowObj;
        }

        return [
            'curation_revision'=>$this->curation['revision']??0,'curation_mode'=>!empty($this->curation['include_excluded'])?'raw':'curated',
            'source_records' => $sourceRecords,
            'meeting_sync' => $isMeeting ? $this->meetings->status() : null,
            'metric' => $metric,
            'row_axis' => $rowAxis,
            'col_axis' => $colAxis,
            'row_keys' => $rowKeys,
            'col_keys' => $colKeys,
            'matrix' => $matrix,
            'col_totals' => $colTotals,
            'grand_total' => $grandTotal,
            'record_count' => count($records)
        ];
    }

    private function meetingUsers() {
        return $this->pdo->query('SELECT user_id, name FROM users ORDER BY user_id')->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * One current, non-deleted lesson per reflection (legacy node lessons: per node).
     * Rank BEFORE period/content filtering: an old version must never reappear.
     * Keep node/reflection namespaces separate and break timestamp ties by row ID.
     * was_updated is a boolean for the whole lesson, never the number of versions.
     * In-place updates have no old content; their only evidence is updated_at.
     */
    private function latestLessonSource($origin) {
        if ($origin === 'map') {
            $table = '`object_lesson-learneds`';
            $id = '`object_le_id`';
            $partition = "CASE WHEN reflection_id IS NULL THEN 0 ELSE 1 END, COALESCE(reflection_id, object_node_id)";
        } else {
            $table = '`object_journal_lesson-learneds`';
            $id = '`object_journal_lesson-learned_id`';
            // Orphan legacy rows must not all collapse into the same NULL group.
            $partition = "CASE WHEN object_journal_reflection_id IS NULL THEN 0 ELSE 1 END, COALESCE(object_journal_reflection_id, {$id})";
        }
        return "(
            SELECT ranked.* FROM (
                SELECT source.*,
                    ROW_NUMBER() OVER (PARTITION BY {$partition}
                        ORDER BY updated_at DESC, created_at DESC, {$id} DESC) AS lesson_rank,
                    CASE WHEN
                        MAX(CASE WHEN updated_at > created_at THEN 1 ELSE 0 END)
                            OVER (PARTITION BY {$partition}) = 1
                        OR MIN(COALESCE(lesson_learned, '')) OVER (PARTITION BY {$partition})
                            <> MAX(COALESCE(lesson_learned, '')) OVER (PARTITION BY {$partition})
                    THEN 1 ELSE 0 END AS was_updated
                FROM {$table} source
                WHERE (deleted IS NULL OR deleted = 0)
            ) ranked WHERE lesson_rank = 1
        )";
    }

    private function buildDateCondition($alias, $column, $startDate, $endDate) {
        $cond = "";
        if ($startDate) {
            $cond .= " AND {$alias}.`{$column}` >= " . $this->quoteSql($startDate);
        }
        if ($endDate) {
            $cond .= " AND {$alias}.`{$column}` <= " . $this->quoteSql($endDate);
        }
        return $cond;
    }

    private function buildUserCondition($alias, $userIds) {
        if (empty($userIds)) return "";
        $clean = implode(',', array_map('intval', $userIds));
        return " AND {$alias}.user_id IN ($clean)";
    }

    private function quoteSql($val) {
        return "'" . addslashes($val) . "'";
    }
}
