<?php
declare(strict_types=1);
require_once __DIR__ . '/process_map_read_service.php';

function forest_api_read_context(mysqli $db, int $id, string $format, ?int $packageId, string $reference = '', string $type = ''): ?array
{
    $rows = forest_api_process_map_rows($db, 'SELECT * FROM experience_knowledges WHERE experience_knowledge_id = ? LIMIT 1', 'i', [$id]);
    $fragment = $rows[0] ?? null;
    if ($reference === '' && (!$fragment || (int)$fragment['deleted'] !== 0)) return null;
    $actualPackageId = (int)($fragment['context_package_id'] ?? 0);
    if ($packageId !== null && ($actualPackageId !== $packageId || !$fragment || (int)$fragment['deleted'] !== 0)) return null;
    if ($format === 'forest.thinking-process-map.v1') {
        $map = forest_api_read_thinking_process_map($db, $id, $reference, $type);
        return $map === null ? null : ['format' => $format, 'external_kf_id' => (string)$id, 'map' => $map];
    }
    if ($format !== 'context-package.v1') throw new InvalidArgumentException('UNSUPPORTED_CONTEXT_FORMAT');
    if ($reference === '' && $actualPackageId > 0) {
        $packages = forest_api_process_map_rows($db, 'SELECT * FROM kf_context_packages WHERE context_package_id = ?', 'i', [$actualPackageId]);
        if (!$packages) return null;
        $items = forest_api_process_map_rows($db, 'SELECT entity_type_code, entity_id, display_order, snapshot_json
            FROM kf_context_package_items WHERE context_package_id = ? ORDER BY display_order, context_package_item_id', 'i', [$actualPackageId]);
        $package = [
            'external_context_package_id' => (string)$actualPackageId,
            'activity' => ['type_code' => $packages[0]['activity_type_code'], 'external_activity_id' => $packages[0]['external_activity_id']],
            'items' => array_map(static fn($item) => [
                'entity_type_code' => $item['entity_type_code'], 'entity_id' => $item['entity_id'],
                'display_order' => (int)$item['display_order'], 'snapshot' => json_decode($item['snapshot_json'], true, 512, JSON_THROW_ON_ERROR),
            ], $items),
            'created_at' => kf_sync_to_iso_timestamp($packages[0]['created_at']),
        ];
    } else {
        // Legacy imports can still be traced by their signed original-node reference.
        $map = forest_api_read_thinking_process_map($db, $id, $reference, $type);
        if ($map === null) return null;
        $focus = null;
        foreach (['process_nodes' => 'process_node_id', 'node_versions' => 'node_version_id', 'triggers' => 'trigger_id'] as $list => $key) {
            foreach ($map[$list] as $row) if ((string)$row[$key] === $map['source_reference']) $focus = $row;
        }
        if ($focus === null) return null;
        $package = ['external_context_package_id' => 'legacy-' . $map['source_reference'],
            'activity' => ['type_code' => 'thinking_process_map', 'external_activity_id' => 'legacy-node-' . $map['source_reference']],
            'items' => [['entity_type_code' => kf_sync_entity_type_code($map['source_type']),
                'entity_id' => $map['source_reference'], 'display_order' => 0, 'snapshot' => $focus]]];
    }
    return ['format' => $format, 'external_kf_id' => (string)$id, 'context_package' => $package];
}
