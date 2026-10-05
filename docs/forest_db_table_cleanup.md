# Forest DB table cleanup notes

This note classifies Forest-Core tables that were moved conceptually to OK-Core.

## Current result

Do not drop all moved OK-Core tables from the Forest-Core DB yet.

The current Forest-Core export path still writes a local copy to:

- `experience_knowledges`
- `shared_nodes`

These are source-owned data used to build the OK-Core API snapshot.

## Table-by-table status

| Table | Forest-Core DB cleanup status | Reason |
| --- | --- | --- |
| `discussion_history` | Drop candidate | Used by legacy OK-Core discussion endpoints under `forest-mrn/php`, but the legacy organizational UI is disabled in `forest-mrn/index.php`. |
| `experience_knowledges` | Keep | This is the Forest-owned KF source record. OK-Core stores a synchronized snapshot, not the source record. |
| `externalized_contents` | Drop candidate | Used by legacy OK-Core discussion/KF-list endpoints only. Not part of the current Forest-Core learning export path. |
| `knowledge_explorer` | Drop candidate | Used by legacy OK-Core organizational knowledge tree endpoints only. |
| `knowledge_explorer_fragment_links` | Drop candidate | Used by legacy OK-Core organizational knowledge tree endpoints only. |
| `knowledge_fragment_positions` | Drop candidate | Used by legacy OK-Core KF workspace layout endpoints only. |
| `shared_nodes` | Keep | Forest uses it to remember the selected share groups and build `share_group_ids` for the API. |
| `kf_context_packages` | Keep | Forest owns the context package referenced by OK-Core. |
| `kf_context_package_items` | Keep | Forest owns the source entity references and context snapshots. |
| `kf_sync_outbox` | Keep | Delivery status and retry history for the OK-Core API. |

## Safe cleanup sequence

1. Back up the Forest-Core DB.
2. Confirm the legacy organizational UI remains disabled in `forest-mrn/index.php`.
3. Rename candidate tables first instead of dropping them.
4. Test Forest-Core login, each mode, and "学びを入力 -> 共有".
5. Drop renamed tables only after the test passes.

## Rename-first SQL

```sql
RENAME TABLE
  forest_platform.discussion_history TO forest_platform._old_ok_discussion_history,
  forest_platform.externalized_contents TO forest_platform._old_ok_externalized_contents,
  forest_platform.knowledge_explorer TO forest_platform._old_ok_knowledge_explorer,
  forest_platform.knowledge_explorer_fragment_links TO forest_platform._old_ok_knowledge_explorer_fragment_links,
  forest_platform.knowledge_fragment_positions TO forest_platform._old_ok_knowledge_fragment_positions;
```

## Final drop SQL

Run only after regression testing passes.

```sql
DROP TABLE IF EXISTS
  forest_platform._old_ok_discussion_history,
  forest_platform._old_ok_externalized_contents,
  forest_platform._old_ok_knowledge_explorer,
  forest_platform._old_ok_knowledge_explorer_fragment_links,
  forest_platform._old_ok_knowledge_fragment_positions;
```

## API migration result

The temporary direct OK-Core DB bridge has been removed. Do not drop `experience_knowledges`, `shared_nodes`, or the `kf_*` source/synchronization tables: they now implement Forest's side of the agreed API boundary.
