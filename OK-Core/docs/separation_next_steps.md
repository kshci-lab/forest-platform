# Forest-Core / OK-Core separation plan

## Step 1 completed in this workspace

- Create `OK-Core` as an independent PHP web application.
- Keep HCIMLab SSO as the shared identity layer.
- Point OK-Core DB settings to `ok_core` through `OK-Core/php/connect_db.php`.
- Move the organizational knowledge map foundation into OK-Core:
  - organizational map
  - KF list workspace
  - discussion history
  - organizational knowledge registration tree
- Remove the organizational knowledge tab entry and JS/CSS loading from `Forest-Core/forest-mrn/index.php`.

## Step 2: create OK-Core DB

Run `OK-Core/docs/ok_core_schema.sql` in phpMyAdmin.

At minimum, prepare:

- `users`
- `knowledge_groups`
- `kgroup_user_link`
- `experience_knowledges`
- `externalized_contents`
- `shared_nodes`
- `knowledge_explorer`
- `knowledge_explorer_fragment_links`
- `discussion_history`
- `knowledge_fragment_positions`

## Step 3: migrate seed data

For initial verification, copy from `forest_platform` to `ok_core`:

```sql
INSERT INTO ok_core.users
SELECT * FROM forest_platform.users;

INSERT INTO ok_core.knowledge_groups
SELECT * FROM forest_platform.knowledge_groups;

INSERT INTO ok_core.kgroup_user_link
SELECT * FROM forest_platform.kgroup_user_link;

INSERT INTO ok_core.experience_knowledges
SELECT * FROM forest_platform.experience_knowledges;

INSERT INTO ok_core.externalized_contents
SELECT * FROM forest_platform.externalized_contents;

INSERT INTO ok_core.shared_nodes
SELECT * FROM forest_platform.shared_nodes;

INSERT INTO ok_core.knowledge_explorer
SELECT * FROM forest_platform.knowledge_explorer;

INSERT INTO ok_core.knowledge_explorer_fragment_links
SELECT * FROM forest_platform.knowledge_explorer_fragment_links;

INSERT INTO ok_core.discussion_history
SELECT * FROM forest_platform.discussion_history;

INSERT INTO ok_core.knowledge_fragment_positions
SELECT * FROM forest_platform.knowledge_fragment_positions;
```

If table definitions differ, replace `SELECT *` with explicit column lists.

## Step 4: build the KF export boundary

Forest-Core should stop writing organizational knowledge directly. Instead:

1. Forest-Core keeps its own research activity DB.
2. When a user finalizes a learning/KF, Forest-Core sends a normalized KF payload to OK-Core.
3. OK-Core stores that payload in its KF pool and links it to the selected organization.

Recommended payload:

```json
{
  "source_system": "Forest-Core",
  "source_type": "experience",
  "source_id": "Forest-Core local id",
  "user_sso_sub": "stable SSO subject",
  "user_id": 123,
  "group_id": 1,
  "selected_contents": "...",
  "knowledge_fragment_content": "...",
  "stage1": "...",
  "stage2": "...",
  "stage3": "..."
}
```

## Step 5: physically remove legacy OK files from Forest-Core

After OK-Core is verified:

- remove unused organizational map APIs from `Forest-Core/php`
- remove unused organizational map JS/CSS from `Forest-Core/js` and `Forest-Core/css`
- remove the dormant `tab05` HTML block from `Forest-Core/forest-mrn/index.php`
- keep only the Forest-Core KF production UI and export client
