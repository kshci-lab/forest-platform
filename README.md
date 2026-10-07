## 起動方法（ローカル）
0. MAMPのインストール,新しいデータテーブルを作成し，エクスポートしたデータをインポートする．
1. このファイル群を MAMP/htdocs 以下に置く
2. MAMP起動(Start Servers)
3. localhost:8888/index.html　にアクセス
4. connect_db.php　でデータベースの名前を設定．

### ブランチ切り替え後のローカル準備
`vendor/` と `php/sso_local.php` はGit管理外です。ブランチ切り替えや作業環境の作り直し後にSSOログインでエラーが出る場合は、プロジェクト直下で以下を実行してください。

```sh
sh scripts/setup-local.sh
```

Windows では PowerShell で以下を実行してください。

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
```

Windows で `composer` コマンドが未導入でも、このスクリプトは必要に応じて `composer.phar` をプロジェクト直下に取得して続行します。

このスクリプトはComposer依存関係をインストールし、`certs/cacert.pem` を取得し、`php/sso_local.php` が存在しない場合だけ `php/sso_local.example.php` から作成します。作成後は `php/sso_local.php` に各自のSSO設定を入れてください。

`php/sso_local.php` は秘密情報を含むためGitHubには上げません。共有するのは `php/sso_local.example.php` だけにしてください。

Windows の MAMP 環境で `cURL error 60: SSL certificate problem: unable to get local issuer certificate` が出る主な原因は、PHP/cURL が信頼する CA 証明書バンドルを見つけられないことです。`scripts/setup-local.sh` と `scripts/setup-local.ps1` は `certs/cacert.pem` を取得し、SSO 通信はそれを自動利用します。Mac ではローカルの TLS 構成によってはこの問題が表に出ないことがありますが、システムまたは PHP が適切な CA ストアを使えない構成なら同様に発生しえます。

## OK-Core API同期

KF共有はOK-Core DBへの直接接続ではなく、認証付きAPIとOutboxを使用します。

初回は `docs/migrations/2026_07_31_ok_core_api_outbox.sql` をforest DBへ適用し、OK-Coreが発行したトークンを設定します。

```powershell
& powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\configure-ok-core-api-local.ps1 `
  -Token '<OK-Coreが発行したトークン>'
```

再送:

```powershell
& 'C:\MAMP\bin\php\php8.3.1\php.exe' `
  .\scripts\retry-ok-core-outbox.php 20
```

詳しいデータフローと工程別デバッグは `docs/forest_ok_core_api_sync.md` を参照してください。

## 起動方法（アプリケーションサーバ）
1.　https://ks.mi.s.osakafu-u.ac.jp/software/masakado
  にアクセス

- サーバ上のファイル群を確認したいとき
  - ターミナルでアプリケーションサーバに遠隔ログイン（コマンド：ssh）
- ローカルのファイルをアプリケーションサーバにアップロードしたいとき
  - ローカルにあるファイル群を/home/masakado/Public　以下の該当箇所にコピー（コマンド：scp）

## プログラム構成（本システムの動作に関わる主要なファイルについて説明）
- css
  - style.css：基本的にはこのファイルに書いている
  - Semantic-UI：CSSのライブラリ　いい感じのデザイン一式
  - jsmind.css：マインドマップのノードの色を定義
  - image：システム上で使う画像集
- js
  - jsmind.js：マインドマップ作成の基本ライブラリ
  - mindmap.js：マインドマップ上の挙動のスタート地点,ここからajax等で色んな所へ飛んで挙動が行われる
  - presentation.js：プレゼンシナリオ作成に関わる機能を記述
  - macrolevel_advice.js：目標設定の再検討を促す助言を提示
  - second_advice.js：プレゼンシナリオの再検討を促す助言の提示
  - record_presentation.js：プレゼンシナリオ設計情報をDBへ格納
  - ont_◯◯◯.js：法造のデータを探索する記述系
  - jquery-◯◯◯.js：jQuery系ライブラリ
  - hozo.xml：法造で定義したオントロジーのデータ
- php
  - connect_db.php：データベースへの接続　DB接続変更はここを変える
  - sheet.php：シート（マインドマップ）系の管理
  - create_account.php：アカウント作成画面
  - index.php：マインドマップが表示されている画面,ここにログアウト画面とかへの遷移も記述されている
  - select_sheet.php：ログイン後のシート選択画面
  - login.php：ログイン画面
  - logout.php：ログアウト画面

## データベース構成（本システムに関わる主要なテーブルについて説明）
- users：ユーザ情報を保存
- maps：シート情報（複数の思考表出マップ）を保存
- activities：マインドマップ上でのノード作成・編集・削除の情報が逐次保存されている
- nodes：マインドマップの状態を保存（システムを立ち上げたとき，このテーブルを参照してマインドマップを表示する）
- rationality_nodes：マインドマップ上で2つの答えノードを選択し，合理性の問いノードを作成した情報が保存される
- slide_activity：プレゼンシナリオのスライドの作成・編集・削除の情報が逐次保存されている
- slide_content_activity：プレゼンシナリオのノードの作成・編集・削除の情報が逐次保存されている
- slide_rank：スライドの状態を保存（システムを立ち上げたとき，このテーブルを参照してプレゼンシナリオを表示する）
- slide_content_rank：プレゼンシナリオのノードの状態を保存（システムを立ち上げたとき，このテーブルを参照してプレゼンシナリオを表示する）
- final_advice_log：振り返りの修正を促す課題（プレゼンシナリオ作成後に提示される3つ目の助言）の回答結果を保存
- test


 <div>
  <div></div>
  <div></div>
 </div >
