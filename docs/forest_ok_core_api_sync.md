# Forest-platform / OK-Core API同期（段階2）

2026-10-30更新。共通仕様・設定・署名・配備手順は、OK-Coreリポジトリの`api/v1/README.md`へ集約しています。機械向け仕様は同じフォルダの`openapi.yaml`。初学者向けには`docs/common-api-beginners-guide.md`があります。

## Forestが担当する処理

1. 共有先をOK-Coreの所属グループAPIから取得する。旧組織知マップのgroup_selectを使用しない。
2. 自分が所有する元ノードからKFと文脈を確定する。
3. KF正本・文脈・送信予定JSONを同じトランザクションで保存する。
4. コミット後にOK-Coreへ送信し、保存済み／送信待ち／送信済みを区別して表示する。
5. 通信失敗では、確定したJSONをOutboxから再送する。新しい版に置き換わった旧送信を復活させない。
6. 文脈GETでは、読み取り用トークンと対象を限定したOK-Coreの署名を検証して、自分のDBだけを読み取る。

## 主なファイル

| ファイル | 役割 |
| --- | --- |
| `js/ok-core-sharing.js` | 共有先の取得と選択、保存・送信状態の表示と照会 |
| `php/ok_core_groups.php` / `ok_core_bridge.php` | ログイン中の利用者のSSO subでOK-CoreのグループAPIを呼ぶ |
| `php/kf_sync_service.php` | 原子保存・文脈・Outbox・版・排他・再送 |
| `php/ok_core_api_client.php` | HTTP通信。実接続設定はGit対象外のok_core_api_local.php |
| `php/get_kf_sync_status.php` | 本人のOutbox状態だけを取得する |
| `api/v1/context_contract.php` | 対象・形式・グループ・利用者・期限・旧参照の署名検証 |
| `api/v1/context_read_service.php` | KFに紐づく文脈パッケージ、マップの読取 |
| `scripts/check-ok-core-connection.php` | 構造とAPI疎通の読み取り専用確認 |
| `scripts/retry-ok-core-outbox.php` | CLI専用のdry-run、自動期限判定、対象を指定した再送 |

## DB

現行DBのexperience_knowledges、shared_nodes、kf_context_packages、kf_context_package_items、kf_sync_outboxを使用します。段階2としてテーブル・カラムを追加していません。旧列experience_knowledge_idを参照していた共有処理はknowledge_fragment_idへ揃えました。

過去の共有列改名が未適用の環境だけに、`sql/2026-10-15_rename_shared_nodes_knowledge_fragment_id.sql`を同梱しています。対象はForestのshared_nodesの列改名です。バックアップとDB名の確認後、利用者が適用します。改名済みなら不要で、今回は自動実行していません。

文脈・Outboxそのものの過去の構造追加例は`docs/migrations/2026_07_31_ok_core_api_outbox.sql`にありますが、既存環境へ一括実行せず、現在の構造に合わせて不足箇所を確定してください。

## 運用

アプリ設定ファイル ＞ 環境変数 ＞ 既定値の順に使います。Apacheの環境変数を必須にしません。既存の秘密設定は今回書き換えていません。

```bash
php scripts/check-ok-core-connection.php
php scripts/check-ok-core-connection.php --user-id=<Forestの利用者ID>
php scripts/retry-ok-core-outbox.php --dry-run
php scripts/retry-ok-core-outbox.php --limit=20
php scripts/retry-ok-core-outbox.php --outbox-id=7 --force
```

上から3つはGET・SELECTのみです。下の2つは送信状態を更新し、OK-Coreへ実際に送信します。既存FAILED行を検証目的で自動再送しないでください。

cronの雛形は`scripts/ok-core-outbox.cron.example`。絶対パスとログ書込権限を設定し、PHP実行ユーザーで確認してから登録します。AWSの定期実行は今回未登録です。停止行はterminal_failuresと終了コードで確認できます。

再送日時は日本時間で統一し、同じアプリ時刻で期限判定します。DBのタイムゾーンには依存しません。

## 検証

- `node tests/ok_core_phase2_flow_test.cjs`：一時SQLite・一時PHPサーバーで保存、停止、自動/明示再送、重複、ロールバック、委任閲覧、更新、削除等を検証。実DB・本番設定は使用しません。
- `php tests/context_grant_test.php`：署名の改変・期限・旧マップ互換。
- `node tests/ok_core_sharing_test.cjs`：旧DOMに依存しない組織選択と状態通知。
- `php tests/ok_core_api_config_test.php`：設定優先順位と文字列ID。

Windowsの隔離フローテストではPHP_BINARYとPHP_EXTENSION_DIRで実行環境を指定できます。PHPのcURL・PDO SQLiteと、Forestのvendor/autoload.phpが必要です。別配置ならFOREST_PROJECT_ROOTとOK_CORE_PROJECT_ROOTを指定します。
