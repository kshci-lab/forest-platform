# OK-Core

OK-Core is the organizational knowledge application separated from Forest-Core.

## Local setup

1. Create the database from `docs/ok_core_schema.sql` in phpMyAdmin.
2. Copy `php/sso_local.example.php` to `php/sso_local.php` and set the OK-Core SSO client values.
3. Confirm `php/connect_db.php` points to the OK-Core database. By default it uses:
   - host: `localhost`
   - port: `8889`
   - user: `root`
   - password: `root`
   - database: `ok_core`
4. Open `/OK-Core/login.php`.

The DB connection can also be overridden with:

- `OK_CORE_DB_HOST`
- `OK_CORE_DB_PORT`
- `OK_CORE_DB_USER`
- `OK_CORE_DB_PASSWORD`
- `OK_CORE_DB_NAME`

## Current scope

This first separation step provides the OK-Core web application shell, SSO login, organizational map, KF discussion workspace, and organizational knowledge registration tree.

The current API keeps compatibility with the existing table names (`experience_knowledges`, `externalized_contents`, `knowledge_explorer`) so the UI can be split before the full Forest-Core to OK-Core KF export pipeline is redesigned.

## Next DB/data step

After the schema is created, migrate or import:

- users matched by SSO (`users`)
- organizations (`knowledge_groups`, `kgroup_user_link`)
- pooled KFs (`experience_knowledges`, `externalized_contents`)
- group sharing links for experience KFs (`shared_nodes`)

Forest-Core should eventually write produced KFs to OK-Core through a small import API instead of sharing one database.
