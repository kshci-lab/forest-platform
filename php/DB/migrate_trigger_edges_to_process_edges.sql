-- Copy trigger connections to process_edges during the transition period.
-- Edge IDs use the same deterministic rule as thinking_edit_processmap_maneger.php.
-- This script is idempotent and does not remove triggers.from or triggers.to.

START TRANSACTION;

INSERT INTO process_edges (
    process_edge_id,
    edge_start,
    edge_end,
    label,
    created_at,
    updated_at,
    deleted
)
SELECT
    CONCAT('tf_', LEFT(SHA2(t.trigger_id, 256), 42)),
    t.`from`,
    t.trigger_id,
    '',
    t.add_time,
    t.add_time,
    t.deleted
FROM triggers AS t
WHERE t.`from` IS NOT NULL
  AND TRIM(t.`from`) <> ''
  AND t.`from` <> '0'
ON DUPLICATE KEY UPDATE
    edge_start = VALUES(edge_start),
    edge_end = VALUES(edge_end),
    label = '',
    updated_at = VALUES(updated_at),
    deleted = VALUES(deleted);

INSERT INTO process_edges (
    process_edge_id,
    edge_start,
    edge_end,
    label,
    created_at,
    updated_at,
    deleted
)
SELECT
    CONCAT('tt_', LEFT(SHA2(t.trigger_id, 256), 42)),
    t.trigger_id,
    t.`to`,
    '',
    t.add_time,
    t.add_time,
    t.deleted
FROM triggers AS t
WHERE t.`to` IS NOT NULL
  AND TRIM(t.`to`) <> ''
ON DUPLICATE KEY UPDATE
    edge_start = VALUES(edge_start),
    edge_end = VALUES(edge_end),
    label = '',
    updated_at = VALUES(updated_at),
    deleted = VALUES(deleted);

COMMIT;
