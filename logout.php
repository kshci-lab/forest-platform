<?php
session_start();

if (isset($_SESSION["USERID"])) {
  $errorMessage = "ログアウトしました。";
}
else {
  $errorMessage = "セッションがタイムアウトしました。";
}
// セッション変数のクリア
$_SESSION = array();

// セッションクリア
session_destroy();
?>

<!doctype html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>自己内対話活性化支援システム</title>
  </head>
  <body>
  <h1>ログアウト画面</h1>
  <div><?php echo $errorMessage; ?></div>
  <ul>
  <li><a href="login.php">ログイン画面に戻る</a></li>
  </ul>
  </body>
</html>