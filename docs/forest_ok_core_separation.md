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

They should share identity only through HCIMLab SSO and exchange KF data through a bridge/API boundary.

## Current milestone status

Functional separation is complete for the current local setup:

- Forest-Core login uses `http://localhost:8888/forest-platform/auth/callback`.
- OK-Core login uses `http://localhost:8888/OK-Core/auth/callback`.
- Forest-Core can produce an experience KF from "学びを入力".
- Sharing the KF from Forest-Core imports it into the OK-Core `experience_knowledges` table.
- OK-Core displays the imported KF in its KF list.
- The dormant legacy organizational knowledge UI in `forest-mrn/index.php` is disabled and no longer executes its embedded KF list include.

## Remaining cleanup

The remaining work is cleanup/hardening rather than the core separation path:

- Physically remove legacy organizational knowledge files from Forest-Core after one more regression check.
- Replace the temporary direct DB bridge with an authenticated OK-Core import API when Forest-Core and OK-Core move to separate deployment environments.
- Add an export/import audit table so each Forest-Core KF can record its OK-Core import result and retry status.
- Keep Forest-Core's local research activity DB and OK-Core's organizational knowledge DB backed up separately.
