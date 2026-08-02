# Forest-Core / OK-Core separation notes

This repository currently represents Forest-Core.

## Current local Forest-Core URL

When this repository is placed at `C:\MAMP\htdocs\forest-platform`, the Forest-Core local URL is:

```text
http://localhost:8888/forest-platform
```

The Forest-Core SSO redirect URI is:

```text
http://localhost:8888/forest-platform/auth/callback
```

This matches the current file layout, where `auth/callback.php` exists directly under this project root.

## Future OK-Core URL

OK-Core should be a separate project/repository. If it is placed next to this project as:

```text
C:\MAMP\htdocs\OK-Core
```

then the OK-Core local URL should be:

```text
http://localhost:8888/OK-Core
```

and the OK-Core SSO redirect URI should be:

```text
http://localhost:8888/OK-Core/auth/callback
```

## Separation rule

Forest-Core and OK-Core should not depend on each other's local files.

Each project should have its own:

- `php/sso_local.php`
- `php/connect_db.php`
- database
- URL / redirect URI

They share identity through HCIMLab SSO and exchange KF data only through authenticated HTTP APIs.

## Current milestone status

Functional separation is complete for the current local setup:

- Forest-Core login uses `http://localhost:8888/forest-platform/auth/callback`.
- OK-Core login uses `http://localhost:8888/OK-Core/auth/callback`.
- Forest-Core can produce an experience KF from "学びを入力".
- Sharing a KF stores its source record, context package, and Outbox event in the Forest DB.
- Forest sends the event to the authenticated OK-Core API instead of connecting to the OK-Core DB.
- OK-Core stores the normalized snapshot in `knowledge_fragments`, stage tables, and `kf_group_shares`.
- Failed network deliveries remain in `kf_sync_outbox` and can be retried.
- Forest provides the authenticated `/api/v1/kf-context-packages/{id}` endpoint.
- The dormant legacy organizational knowledge UI in `forest-mrn/index.php` is disabled and no longer executes its embedded KF list include.

## Remaining cleanup

The direct DB bridge and Outbox milestone is complete. Remaining work:

- Physically remove legacy organizational knowledge files from Forest-Core after one more regression check.
- Schedule `scripts/retry-ok-core-outbox.php` and add administrator notification for terminal failures.
- Add the OK-Core backend action that fetches the latest source context with its read token.
- Rotate local development tokens before deployment.
- Keep Forest-Core's local research activity DB and OK-Core's organizational knowledge DB backed up separately.

Implementation and debugging details are in `docs/forest_ok_core_api_sync.md`.
