README: cacert.pem を配置して OpenAI の SSL エラーを解消する手順

1) 推奨方法（PowerShell, 管理者権限不要）
PowerShell を開いて次を実行してください（ワンライナー）:

Invoke-WebRequest -Uri "https://curl.se/ca/cacert.pem" -OutFile "c:\MAMP\htdocs\forest-platform\cert\cacert.pem"

2) 代替: curl が使える場合

curl -o "cert/cacert.pem" https://curl.se/ca/cacert.pem

3) php.ini の更新（MAMP を使用している場合は MAMP の PHP の php.ini を編集）

php.ini に以下を追加または編集してください（パスは環境に合わせて変更）:

curl.cainfo = "C:\\MAMP\\htdocs\\forest-platform\\cert\\cacert.pem"
openssl.cafile = "C:\\MAMP\\htdocs\\forest-platform\\cert\\cacert.pem"

編集後は Apache / MAMP を再起動してください。

4) 環境変数による方法（オプション）

Windows の場合、システム環境変数 `CURL_CA_BUNDLE` を作成し、値を
C:\MAMP\htdocs\forest-platform\cert\cacert.pem
に設定してから Apache を再起動します。

5) 補足
- `cert/cacert.pem` は curl の公式 CA 抽出 (https://curl.se/docs/caextract.html) から取得してください。
- 私の側では著作権や配布の都合上 cacert.pem 本体をここに配置しません。上記コマンドを実行して実ファイルを取得してください。
- 実ファイルをここに置いて欲しい場合は、そのファイルをアップロードしてください（ファイル提供が可能なら私が配置します）。

6) 動作確認用の簡易 PHP スクリプト（テスト用）

<?php
$ch = curl_init('https://api.openai.com/v1');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CAINFO, __DIR__ . '/cacert.pem');
$res = curl_exec($ch);
if ($res === false) {
    echo 'curl error: ' . curl_error($ch);
} else {
    echo 'OK';
}
curl_close($ch);
?>
