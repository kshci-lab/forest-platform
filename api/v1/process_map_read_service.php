<?php

declare(strict_types=1);

/** Read only the Forest map that produced a shared experience KF. */
function forest_api_process_map_rows(mysqli $db, string $sql, string $types = '', array $values = []): array
{
    $statement = $db->prepare($sql);
    if (!$statement) {
        throw new RuntimeException('Could not prepare process map query.');
    }
    if ($types !== '') {
        $statement->bind_param($types, ...$values);
    }
    if (!$statement->execute()) {
        $statement->close();
        throw new RuntimeException('Could not read process map.');
    }
    $result = $statement->get_result();
    $rows = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    if ($result) {
        $result->free();
    }
    $statement->close();
    return $rows;
}

function forest_api_process_map_node_id(mysqli $db, string $reference, string $type): string
{
    $type = strtolower(trim($type));
    $lookups = [];
    if (in_array($type, ['process', 'process_node'], true)) {
        $lookups[] = ['process_nodes', 'process_node_id', 'deleted = 0'];
    } elseif (in_array($type, ['versions', 'versionsbro', 'version', 'node_version'], true)) {
        $lookups[] = ['node_versions', 'node_version_id', '1 = 1'];
    } elseif (in_array($type, ['trigger', 'triggers'], true)) {
        $lookups[] = ['triggers', 'trigger_id', 'deleted = 0'];
    } else {
        $lookups = [
            ['process_nodes', 'process_node_id', 'deleted = 0'],
            ['node_versions', 'node_version_id', '1 = 1'],
            ['triggers', 'trigger_id', 'deleted = 0'],
        ];
    }

    foreach ($lookups as [$table, $idColumn, $condition]) {
        $rows = forest_api_process_map_rows(
            $db,
            "SELECT node_id FROM {$table} WHERE {$idColumn} = ? AND {$condition} LIMIT 1",
            's',
            [$reference]
        );
        $nodeId = trim((string)($rows[0]['node_id'] ?? ''));
        if ($nodeId !== '') {
            return $nodeId;
        }
        if ($table === 'triggers' && $rows) {
            $linked = forest_api_process_map_rows(
                $db,
                'SELECT nv.node_id FROM triggers t INNER JOIN node_versions nv
                   ON nv.node_version_id = t.`from` OR nv.node_version_id = t.`to`
                 WHERE t.trigger_id = ? AND t.deleted = 0 LIMIT 1',
                's',
                [$reference]
            );
            if ($linked) {
                return (string)$linked[0]['node_id'];
            }
        }
    }
    return '';
}

function forest_api_trigger_icon_id(string $activityType): string
{
    return match ($activityType) {
        '議論資料作成' => 'writing',
        '議論内省' => 'meeting',
        '論文読解' => 'reading',
        '論文執筆' => 'writing-scholar',
        default => 'thinking',
    };
}

function forest_api_trigger_icons(array $triggers): array
{
    $files = [
        'thinking' => 'thinking.png',
        'writing' => 'writing.png',
        'meeting' => 'meeting.png',
        'reading' => 'reading.png',
        'writing-scholar' => 'writing-scholar.png',
    ];
    $icons = [];
    foreach ($triggers as $trigger) {
        $id = (string)($trigger['icon_id'] ?? '');
        if ($id === '' || isset($icons[$id]) || !isset($files[$id])) {
            continue;
        }
        $path = dirname(__DIR__, 2) . '/image/triggers/' . $files[$id];
        $bytes = is_file($path) ? file_get_contents($path) : false;
        if ($bytes !== false) {
            $icons[$id] = 'data:image/png;base64,' . base64_encode($bytes);
        }
    }
    return $icons;
}

function forest_api_read_thinking_process_map(mysqli $db, int $externalKfId): ?array
{
    $fragments = forest_api_process_map_rows(
        $db,
        'SELECT ek.experience_knowledge_id, ek.thought_experience_node_id,
                ek.experience_type, ek.knowledge_fragment_content
           FROM experience_knowledges ek
          WHERE ek.experience_knowledge_id = ? AND ek.deleted = 0
            AND EXISTS (SELECT 1 FROM shared_nodes sn
                         WHERE sn.experience_knowledge_id = ek.experience_knowledge_id
                           AND sn.deleted = 0)
          LIMIT 1',
        'i',
        [$externalKfId]
    );
    if (!$fragments) {
        return null;
    }
    $fragment = $fragments[0];
    $reference = trim((string)($fragment['thought_experience_node_id'] ?? ''));
    if ($reference === '') {
        return null;
    }
    $nodeId = forest_api_process_map_node_id($db, $reference, (string)$fragment['experience_type']);
    if ($nodeId === '') {
        return null;
    }

    $processNodes = forest_api_process_map_rows(
        $db,
        'SELECT process_node_id, content, process_node_type, node_x, node_y
           FROM process_nodes WHERE node_id = ? AND deleted = 0
          ORDER BY created_at, process_node_id',
        's',
        [$nodeId]
    );
    $versions = forest_api_process_map_rows(
        $db,
        'SELECT node_version_id, parent_id, appeared_at, disappeared_at,
                content, x, y
           FROM node_versions WHERE node_id = ?
          ORDER BY appeared_at, node_version_id',
        's',
        [$nodeId]
    );
    $triggers = forest_api_process_map_rows(
        $db,
        'SELECT t.trigger_id, t.`from` AS edge_from, t.`to` AS edge_to,
                t.activity_type, t.activity_time, t.content, t.x, t.y
           FROM triggers t
          WHERE t.deleted = 0 AND (
                t.node_id = ?
                OR (t.node_id IS NULL AND (
                    t.`from` IN (SELECT node_version_id FROM node_versions WHERE node_id = ?)
                    OR t.`to` IN (SELECT node_version_id FROM node_versions WHERE node_id = ?)
                    OR t.`from` IN (SELECT process_node_id FROM process_nodes WHERE node_id = ? AND deleted = 0)
                    OR t.`to` IN (SELECT process_node_id FROM process_nodes WHERE node_id = ? AND deleted = 0)
                ))
          ) ORDER BY t.add_time, t.trigger_id',
        'sssss',
        [$nodeId, $nodeId, $nodeId, $nodeId, $nodeId]
    );
    foreach ($triggers as &$trigger) {
        $trigger['icon_id'] = forest_api_trigger_icon_id((string)$trigger['activity_type']);
    }
    unset($trigger);

    $ids = [];
    foreach ($processNodes as $row) $ids[(string)$row['process_node_id']] = true;
    foreach ($versions as $row) $ids[(string)$row['node_version_id']] = true;
    foreach ($triggers as $row) $ids[(string)$row['trigger_id']] = true;
    $edges = [];
    if ($ids) {
        $keys = array_keys($ids);
        $placeholders = implode(',', array_fill(0, count($keys), '?'));
        $edges = forest_api_process_map_rows(
            $db,
            "SELECT process_edge_id, edge_start, edge_end, label
               FROM process_edges WHERE deleted = 0
                AND edge_start IN ({$placeholders})
                AND edge_end IN ({$placeholders})
              ORDER BY created_at, process_edge_id",
            str_repeat('s', count($keys) * 2),
            array_merge($keys, $keys)
        );
    }

    return [
        'external_kf_id' => (string)$externalKfId,
        'source_reference' => $reference,
        'source_type' => (string)$fragment['experience_type'],
        'summary' => (string)$fragment['knowledge_fragment_content'],
        'focus_id' => $reference,
        'process_nodes' => $processNodes,
        'node_versions' => $versions,
        'triggers' => $triggers,
        'trigger_icons' => forest_api_trigger_icons($triggers),
        'process_edges' => $edges,
    ];
}
