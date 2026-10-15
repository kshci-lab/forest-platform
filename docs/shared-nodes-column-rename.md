# shared_nodesのKF参照列の改名（2026-10-15）

`shared_nodes.experience_knowledge_id`を`shared_nodes.knowledge_fragment_id`へ変更しました。

既存環境へコードを反映する際は、同時に`sql/2026-10-15_rename_shared_nodes_knowledge_fragment_id.sql`をForestのDBで実行してください。SQLの`USE forest_platform`が対象DB名と一致していることを確認してください。MySQL 5.7とMariaDB 10.6に対応し、元の型・NULL可否・デフォルト値と全行の値を維持します。再実行時は改名済みとして処理します。インデックスの列参照はDBが追従し、既存のインデックス名は維持します。

変更箇所は`php/kf_sync_service.php`の共有登録・同期payload生成、`api/v1/index.php`と`api/v1/process_map_read_service.php`の思考過程マップの権限確認・取得、および旧UIのKF読み込みです。KF本体の主キー名やOK-Coreへ送信するpayloadの形式は従来のままです。

ローカルMAMPの8889番の`forest_platform`には適用済みで、37行すべての値が維持されていることを確認しました。改名前のバックアップは`C:/MAMP/htdocs/OK-Core/backups/shared_nodes_rename_20261015_052611/forest_platform_shared_nodes.sql`です。確認時の`php/connect_db.php`は3306番へ接続する設定で、この接続先には到達できませんでした。別のDBで実行する場合にはそちらにもSQLを適用してください。

`php/DB`内の構造ダンプは過去の記録として維持しています。過去のダンプからDBを構築する場合は、構築後に今回の改名SQLを適用してください。

この変更は共有参照列の改名です。今後、experienceとdiscussionなど別テーブルのKFを同じ共有テーブルへ格納する場合は、数値IDの重複を避けるため、種別カラムの併用か共通KF IDの導入が必要です。
