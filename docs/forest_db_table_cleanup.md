# Forest DB table cleanup notes

This note classifies Forest-Core tables that were moved conceptually to OK-Core.

## Current result

Do not drop all moved OK-Core tables from the Forest-Core DB yet.

The current Forest-Core export path still writes a local copy to:

- `experience_knowledges`
- `shared_nodes`

These are used by `php/thinking_edit_processmap_maneger.php` before the OK-Core bridge import is called.

## Table-by-table status

| Table | Forest-Core DB cleanup status | Reason |
| --- | --- | --- |
| `discussion_history` | Drop candidate | Used by legacy OK-Core discussion endpoints under `forest-mrn/php`, but the legacy organizational UI is disabled in `forest-mrn/index.php`. |
| `experience_knowledges` | Keep for now | Active Forest-Core sharing code inserts into this table to create the local KF id before OK-Core import. |
| `externalized_contents` | Drop candidate | Used by legacy OK-Core discussion/KF-list endpoints only. Not part of the current Forest-Core learning export path. |
| `knowledge_explorer` | Drop candidate | Used by legacy OK-Core organizational knowledge tree endpoints only. |
| `knowledge_explorer_fragment_links` | Drop candidate | Used by legacy OK-Core organizational knowledge tree endpoints only. |
| `knowledge_fragment_positions` | Drop candidate | Used by legacy OK-Core KF workspace layout endpoints only. |
| `shared_nodes` | Keep for now | Active Forest-Core sharing code inserts into this table before OK-Core import. |

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

## Future cleanup

After the temporary direct DB bridge is replaced with an OK-Core import API, Forest-Core can stop writing local copies to `experience_knowledges` and `shared_nodes`. At that point those two tables can also become drop candidates.
