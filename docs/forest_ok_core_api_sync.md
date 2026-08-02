# forest-platform / OK-Core API同期

## 1. 現在の構成

forest-platformはOK-Core DBを直接操作しません。KF共有時は次の順序で処理します。

```text
1. forest DBへKF正本を保存
2. forest DBへ形成文脈を保存
3. forest DBへグループ共有を保存
4. forest DBのOutboxへ送信JSONを保存
5. 1〜4をまとめてコミット
6. OK-Core APIへHTTP送信
7. 成功ならOutboxをSENTへ更新
8. 失敗ならOutboxをFAILEDとして再送対象にする
```

1〜4は同じDBトランザクションです。トランザクションとは、複数のDB更新を「全部成功」または「全部取消」のどちらかにする仕組みです。

OK-Coreが停止していてもforest側のKFは保存されます。送信失敗を理由に、ユーザーが作ったKFを消しません。

## 2. 主なファイル

| ファイル | 役割 |
| --- | --- |
| `php/ok_core_api_client.php` | OK-Core APIとのHTTP通信 |
| `php/kf_sync_service.php` | KF・文脈・Outboxの保存、revision、再送 |
| `php/ok_core_bridge.php` | 既存画面からグループAPIを呼ぶ互換窓口 |
| `php/thinking_edit_processmap_maneger.php` | 新規KF共有の入口 |
| `php/update_experience_knowledge.php` | KF更新とrevision追加 |
| `php/delete_experience_knowledge.php` | KF論理削除と削除通知 |
| `api/v1/index.php` | forestが提供する文脈パッケージ取得API |
| `scripts/retry-ok-core-outbox.php` | 送信失敗Outboxの再送 |

## 3. DBマイグレーション

SQL:

```text
docs/migrations/2026_07_31_ok_core_api_outbox.sql
```

実行:

```powershell
& 'C:\MAMP\bin\mysql\bin\mysql.exe' `
  -h localhost -P 8889 -u root -proot `
  --default-character-set=utf8mb4 forest_platform `
  -e "SOURCE C:/MAMP/htdocs/forest-platform/docs/migrations/2026_07_31_ok_core_api_outbox.sql"
```

追加内容:

- `kf_context_packages`
- `kf_context_package_items`
- `kf_sync_outbox`
- `experience_knowledges.context_package_id`
- `experience_knowledges.stage_payload_json`
- `experience_knowledges.source_revision`

既存のKF本文やstage列は削除しません。

## 4. ローカルAPI設定

OK-Coreが発行したforest-platform用トークンを設定します。

```powershell
& powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\configure-ok-core-api-local.ps1 `
  -Token '<OK-Coreが発行したトークン>'
```

生成先:

```text
php/ok_core_api_local.php
```

このファイルはGit管理対象外です。

環境変数を使う場合:

| 環境変数 | 用途 |
| --- | --- |
| `OK_CORE_API_BASE_URL` | OK-Core API v1の基点URL |
| `OK_CORE_API_TOKEN` | forest-platform用Bearerトークン |
| `OK_CORE_SOURCE_SYSTEM_CODE` | 通常は `forest-platform` |
| `OK_CORE_API_TIMEOUT_SECONDS` | HTTPタイムアウト秒数 |
| `FOREST_CONTEXT_API_TOKEN` | OK-Coreから文脈を読むためのトークン |

環境変数はローカル設定ファイルより優先されます。

## 5. データの対応

### KF

| forest-platform | OK-Core API |
| --- | --- |
| `experience_knowledge_id` | URLの `external_kf_id` |
| `knowledge_fragment_content` | `summary` |
| `stage_payload_json` | `stages` |
| `source_revision` | `source_revision` |
| `users.sso_sub` | `expresser_sso_sub` |
| `shared_nodes.knowledge_group_id` | `share_group_ids` |

### 形成文脈

| `experience_type` | `entity_type_code` |
| --- | --- |
| `process` | `process_node` |
| `trigger` / `triggers` | `trigger` |
| `versions` / `versionsBro` | `node_version` |
| その他 | `source_entity` |

`entity_id`は、対応するforest側テーブルの主キーです。たとえば:

```text
entity_type_code = process_node
entity_id = 1785133092019493822

参照先:
process_nodes.process_node_id = 1785133092019493822
```

`activity_type_code`は現在 `thinking_process_map`、`external_activity_id`は `map-{MAPID}` です。項目のIDではなく、KFが形成された思考活動全体を表します。

## 6. 工程別デバッグ

### 工程1: OK-Coreの稼働

```powershell
& 'C:\MAMP\bin\php\php8.3.1\php.exe' -r `
  "require 'php/ok_core_api_client.php'; print_r(ok_core_api_health());"
```

`http_status => 200`、`schema_ready => true`なら正常です。

### 工程2: API認証とグループ

```powershell
& 'C:\MAMP\bin\php\php8.3.1\php.exe' -r `
  "require 'php/ok_core_api_client.php'; print_r(ok_core_api_get_groups('3'));"
```

`3`はSSOの `sub` の例です。forestのローカル `user_id`ではありません。

### 工程3: forest DBのOutbox

```sql
SELECT
    outbox_id,
    experience_knowledge_id,
    source_revision,
    operation,
    status,
    attempt_count,
    next_retry_at,
    last_http_status,
    last_request_id,
    last_error
FROM kf_sync_outbox
ORDER BY outbox_id DESC
LIMIT 20;
```

状態:

| status | 意味 |
| --- | --- |
| `PENDING` | まだ送信していない |
| `SENT` | OK-Coreが受け付けた |
| `FAILED` | 送信に失敗した |
| `SUPERSEDED` | より新しいrevisionが作られたため再送不要 |

HTTP 500・503、通信断、429は再送対象です。入力不正、権限エラー、revision競合などは自動で直らないため、`next_retry_at`を空にして確認待ちにします。

### 工程4: 手動再送

```powershell
& 'C:\MAMP\bin\php\php8.3.1\php.exe' `
  .\scripts\retry-ok-core-outbox.php 20
```

最大20件を処理します。1回目は1分後、2回目は5分後、3回目は30分後に再送し、4回失敗したら管理者確認待ちにします。

自動再送にする場合は、このコマンドをWindowsタスクスケジューラやcronから1分間隔で実行します。スケジュール未設定の場合は手動再送です。

### 工程5: request_idの照合

forest:

```sql
SELECT last_request_id, last_error
FROM kf_sync_outbox
WHERE outbox_id = 123;
```

OK-Core:

```powershell
Select-String `
  -Path C:\MAMP\htdocs\OK-Core\var\log\api-v1.log `
  -Pattern '<last_request_id>'
```

同じrequest_idで、送信側と受付側の処理を追跡できます。

### 工程6: 文脈パッケージAPI

```http
GET /forest-platform/api/v1/kf-context-packages/{context_package_id}
Authorization: Bearer <FOREST_CONTEXT_API_TOKEN>
```

PowerShell例:

```powershell
$headers = @{ Authorization = 'Bearer <FOREST_CONTEXT_API_TOKEN>' }
Invoke-WebRequest `
  -UseBasicParsing `
  -Uri 'http://localhost:8888/forest-platform/api/v1/kf-context-packages/1' `
  -Headers $headers
```

認証なし・トークン不一致はHTTP 401、存在しない文脈IDは404です。

## 7. 更新と削除

- 新規KF: revision 1
- 編集: 現在値に1加算してPUT
- 削除: 現在値に1加算してDELETE

送信済みrevision 2の後にrevision 3が通信失敗しても、OutboxのJSONは作成時の内容のまま残ります。再送時に日時や本文を組み立て直さないため、同じrevisionで内容が変わることはありません。

## 8. 本番前の確認

- HTTPSを使用する
- 開発用トークンを本番へ持ち込まない
- forest-platformと他システムでトークンを共用しない
- `php/ok_core_api_local.php`をGitへ登録しない
- 再送スクリプトの定期実行と失敗通知を設定する
- `FAILED`かつ`next_retry_at IS NULL`の行を管理者が確認する
- forest側からOK-Core DBへ接続できない状態でもAPI同期できることを確認する
