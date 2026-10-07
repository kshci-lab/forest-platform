<?php
require 'password.php';
require '../php/connect_db.php';

// セッション開始
session_start();

$errorMessage = "";

//サインアップボタンが押された場合
if (isset($_POST["signUp"])) {

  // パスワードが間違っていたらエラー
  if($_POST["password"] != $_POST["confirm"]) {

      $errorMessage = 'パスワードに誤りがあります。';
  }

  // ユーザIDとパスワードが入力されていたら認証する
  else if(!empty($_POST["username"]) && !empty($_POST["password"]) && !empty($_POST["confirm"])) {

    if ($mysqli->connect_errno) {
      print('<p>データベースへの接続に失敗しました。</p>' . $mysqli->connect_error);
      exit();
    }

    $username = $_POST["username"];
    $password = $_POST["password"];

    //dsn = sprintf('mysql: host=%s; dbname=%s; charset=utf8', $db['host'], $db['dbname']);
    $dsn = sprintf('mysql: host=%s; dbname=%s; charset=utf8', $db_host, $db_dbname);

    // エラー処理
    // どのtry文のエラーであってもcatchの処理は一種類のみ
    try {

      $pdo = new PDO($dsn, $db_user, $db_password, array(PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION));

      $stmt = $pdo->prepare("INSERT INTO users(user_id, name, login_time, password) VALUES (?, ?, ?, ?)");

      $userid = $pdo->lastinsertid();

      //user_idをランダムに決定
      $user_id = rand();

      //login_timeを現在の時刻で設定
      date_default_timezone_set('Asia/Tokyo');
      $timestamp = time();
      $login_time = date("Y-m-d H:i:s", $timestamp);

       // パスワードのハッシュ化を行う（今回は文字列のみなのでbindValue(変数の内容が変わらない)を使用せず、直接excuteに渡しても問題ない）
      $stmt->execute(array($user_id, $username, $login_time, password_hash($password, PASSWORD_DEFAULT)));

      $_SESSION["USERNAME"] = $_POST["username"];
      $_SESSION["USERID"] = $user_id;
      header("Location: select_sheet.php");

    } catch (PDOException $e) {
        $errorMessage = 'データベースエラー';
      }

    // 上記に該当しない動作
    }
    else{
      echo('エラー');
    }

}
?>


<!doctype html>
<html>
  <head>
  <meta charset="UTF-8">
  <title>自己内対話活性化支援システム</title>

  <link rel="stylesheet" href="../css/Semantic-UI/semantic.css">
  <link rel="stylesheet" type="text/css" href="../css/signup.css">
  </head>
  <body>

  <div class="form-wrapper">
  <h1>SignUp</h1>
  <form id="loginForm" name="loginForm" action="" method="POST">
    <div class="form-item form-name" style="float:left">

      <label for="username"></label>
      <input type="text" id="username" name="username" required="required" placeholder="User ID" value="" minlength="4">
    </div>

    <div class="button-panel3">
      <div class="check">
        <input type="button" disabled="disabled" class="check_button ui button" value="check"></input>
      </div>
      <div class="form-item">
        <label for="password"></label>
        <input type="password" name="password" required="required" placeholder="Password" value="">
      </div>

      <div class="form-item">
        <label for="confirm"></label>
        <input type="password" name="confirm" required="required" placeholder="Confirm" value="">
      </div>

      <?php echo($errorMessage);?>

      <div class="button-panel2">
        <input type="submit" disabled="disabled" id="signUp" class="button-1 ui button primary " name="signUp" value="SignUp"></input>
      </div>

    </form>

    <!-- <div class="form-footer"> -->
    <div class="button-panel2">
      <!-- <p><a href="login.php">Login Page</a></p> -->
      <input type="button" class="footer-button ui button primary" value="Login Page" onClick="location.href='login.php'">
    </div>

  </div>
<script type="text/javascript" src='js/jquery-1.8.2.min.js'></script>
<script type="text/javascript" src="js/check_username.js"></script>
</body>
</html>
