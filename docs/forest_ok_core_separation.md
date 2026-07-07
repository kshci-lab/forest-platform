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
