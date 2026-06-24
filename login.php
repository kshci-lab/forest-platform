<?php
require ("password.php");
require_once("php/connect_db.php");

// セッション開始
session_start();

// エラーメッセージの初期化
$errorMessage = "";

// ログインボタンが押された場合
if (isset($_POST["login"])) {
  // １．ユーザIDの入力チェック
  if (empty($_POST["username"])) {
    $errorMessage = "ユーザIDが未入力です。";
  } else if (empty($_POST["password"])) {
    $errorMessage = "パスワードが未入力です。";
  }
  
  // ２．ユーザIDとパスワードが入力されていたら認証する
  if (!empty($_POST["username"]) && !empty($_POST["password"])) {

    if ($mysqli->connect_errno) {
      print('<p>データベースへの接続に失敗しました。</p>' . $mysqli->connect_error);
      exit();
    }

    // データベースの選択
    //$mysqli->select_db($db['dbname']);

    // 入力値のサニタイズ
    $username = $mysqli->real_escape_string($_POST["username"]);

    // クエリの実行
    $query = "SELECT * FROM users WHERE name = '" . $username . "'";
    $result = $mysqli->query($query);
    if (!$result) {
      print('クエリーが失敗しました。' . $mysqli->error);
      $mysqli->close();
      exit();
    }

    while ($row = $result->fetch_assoc()) {
      // パスワード(暗号化済み）の取り出し
      $db_hashed_pwd = $row['password'];
      $user_id = $row['user_id'];

    }

    //login_timeの更新
    date_default_timezone_set('Asia/Tokyo');
    $timestamp = time();
    $updated_at = date("Y-m-d H:i:s", $timestamp);

    $l_query = "UPDATE users SET login_time = '".$updated_at."' WHERE user_id = ".$user_id."";
    $l_result = $mysqli->query($l_query);

    // データベースの切断
    $mysqli->close();

    // ３．画面から入力されたパスワードとデータベースから取得したパスワードのハッシュを比較します。
    if (password_verify($_POST["password"], $db_hashed_pwd)) {
      // ４．認証成功なら、セッションIDを新規に発行する
      session_regenerate_id(true);
      $_SESSION["USERNAME"] = $_POST["username"];
      $_SESSION["USERID"] = $user_id;
      header("Location: select_mode.php");
      exit;
    }
    else {
      // 認証失敗
      $errorMessage = "ユーザIDあるいはパスワードに誤りがあります。";
    }
  } else {
    // 未入力なら何もしない
  }



}

?>
<!doctype html>
<html>
  <head>
  <meta charset="UTF-8">
  <title>自己内対話活性化支援システム</title>
  <link rel="stylesheet" type="text/css" href="css/login.css">
  </head>
  <body>

  <div class="form-wrapper">
  <h1>Login</h1>
  <form id="loginForm" name="loginForm" action="" method="POST">
    <div class="form-item">
      <label for="username"></label>
      <input type="text" name="username" required="required" placeholder="User Name" value="<?php if (!empty($_POST["username"])) {echo htmlspecialchars($_POST["username"], ENT_QUOTES);} ?>">
    </div>
    <div class="form-item">
      <label for="password"></label>
      <input type="password" name="password" required="required" placeholder="Password" value="">
    </div>
    <div class="button-panel">
      <input type="submit" id="login" class="button" name="login" value="Login"></input>
    </div>
  </form>
  <div class="form-footer">
    <p><a href="create_account.php">Create an account</a></p>
  </div>
</div>
</html>
